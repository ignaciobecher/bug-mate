import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { ConfigLoaderService } from '../config/config-loader.service';
import { GeminiProvider } from '../ai/providers/gemini.provider';
import type { KnowledgeEntry } from '../config/types/bot-config.types';

interface VectorRow {
  id: string;
  content: string;
  source: string;
  embedding: Buffer;
}

export interface KnowledgeSearchResult {
  content: string;
  score: number;
  source: string;
}

@Injectable()
export class KnowledgeService implements OnModuleInit {
  private readonly logger = new Logger(KnowledgeService.name);
  private db: Database.Database;

  constructor(
    private readonly configLoader: ConfigLoaderService,
    private readonly gemini: GeminiProvider,
  ) {}

  async onModuleInit(): Promise<void> {
    this.initDb();
    await this.indexKnowledge();
  }

  /**
   * Searches for relevant knowledge using:
   * 1. FAQ keyword matching (fast, no embedding cost)
   * 2. Semantic vector search in SQLite
   */
  async search(query: string): Promise<KnowledgeSearchResult | null> {
    const minScore = this.configLoader.botConfig.ai.ragMinScore;
    const topK = this.configLoader.botConfig.ai.ragTopK;

    // 1. Try FAQ keyword match first (free, instant)
    const faqResult = this.searchFaq(query);
    if (faqResult) return faqResult;

    // 2. Semantic search via embeddings
    const queryEmbedding = await this.gemini.embed(query);
    const results = this.vectorSearch(queryEmbedding, topK);

    const best = results[0];
    if (best && best.score >= minScore) {
      this.logger.debug(`Vector match: score=${best.score.toFixed(3)} source="${best.source}"`);
      return best;
    }

    this.logger.debug(`No knowledge match found for: "${query.slice(0, 50)}"`);
    return null;
  }

  private searchFaq(query: string): KnowledgeSearchResult | null {
    const normalized = query.toLowerCase();
    const entries = this.configLoader.knowledge;

    for (const entry of entries) {
      const matchesTag = entry.tags.some((tag) => normalized.includes(tag.toLowerCase()));
      const matchesQuestion = normalized.includes(entry.question.toLowerCase().slice(0, 20));

      if (matchesTag || matchesQuestion) {
        const content = this.formatFaqEntry(entry);
        this.logger.debug(`FAQ match: "${entry.id}"`);
        return { content, score: 1.0, source: `faq:${entry.id}` };
      }
    }
    return null;
  }

  private formatFaqEntry(entry: KnowledgeEntry): string {
    let text = entry.answer;
    if (entry.steps?.length) {
      text += '\n\n' + entry.steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    }
    return text;
  }

  private initDb(): void {
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

    this.db = new Database(join(dataDir, 'knowledge.sqlite'));
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS vectors (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        source TEXT NOT NULL,
        embedding BLOB NOT NULL
      )
    `);
    this.logger.log('Knowledge SQLite database initialized');
  }

  private async indexKnowledge(): Promise<void> {
    const docs = this.configLoader.knowledgeDocs;
    if (!docs.length) {
      this.logger.log('No knowledge docs found — skipping vector indexing');
      return;
    }

    const existing = this.getIndexedIds();
    const toIndex: Array<{ id: string; content: string; source: string }> = [];

    for (const doc of docs) {
      const chunks = this.chunkText(doc.content, 500);
      chunks.forEach((chunk, i) => {
        const id = `${doc.filename}::${i}`;
        if (!existing.has(id)) {
          toIndex.push({ id, content: chunk, source: doc.filename });
        }
      });
    }

    if (!toIndex.length) {
      this.logger.log('All knowledge docs already indexed');
      return;
    }

    this.logger.log(`Indexing ${toIndex.length} new chunks...`);
    const insert = this.db.prepare(
      'INSERT OR REPLACE INTO vectors (id, content, source, embedding) VALUES (?, ?, ?, ?)',
    );

    for (const item of toIndex) {
      const embedding = await this.gemini.embed(item.content);
      const blob = Buffer.from(new Float32Array(embedding).buffer);
      insert.run(item.id, item.content, item.source, blob);
    }

    this.logger.log(`Indexed ${toIndex.length} chunks into knowledge base`);
  }

  private vectorSearch(queryEmbedding: number[], topK: number): KnowledgeSearchResult[] {
    const rows = this.db.prepare('SELECT id, content, source, embedding FROM vectors').all() as VectorRow[];

    return rows
      .map((row) => {
        const stored = new Float32Array(row.embedding.buffer);
        const score = this.cosineSimilarity(queryEmbedding, Array.from(stored));
        return { content: row.content, score, source: row.source };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * (b[i] ?? 0), 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  }

  private chunkText(text: string, maxWords: number): string[] {
    const paragraphs = text.split(/\n{2,}/);
    const chunks: string[] = [];
    let current = '';

    for (const para of paragraphs) {
      const words = para.trim().split(/\s+/);
      if (current.split(/\s+/).length + words.length > maxWords) {
        if (current.trim()) chunks.push(current.trim());
        current = para;
      } else {
        current += (current ? '\n\n' : '') + para;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks;
  }

  private getIndexedIds(): Set<string> {
    const rows = this.db.prepare('SELECT id FROM vectors').all() as { id: string }[];
    return new Set(rows.map((r) => r.id));
  }
}
