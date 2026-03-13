import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import type { BotConfig, ClientConfig, KnowledgeEntry } from './types/bot-config.types';

/**
 * Loads and validates all JSON configuration files at startup.
 * All other services should inject this instead of reading files directly.
 */
@Injectable()
export class ConfigLoaderService implements OnModuleInit {
  private readonly logger = new Logger(ConfigLoaderService.name);
  private readonly configDir = join(process.cwd(), 'config');

  private _botConfig: BotConfig;
  private _clients: ClientConfig[];
  private _knowledge: KnowledgeEntry[];
  private _knowledgeDocs: Array<{ filename: string; content: string }>;

  onModuleInit(): void {
    this.logger.log('Loading JSON configuration files...');
    this._botConfig = this.loadJson<BotConfig>('bot.config.json');
    this._clients = this.loadJson<ClientConfig[]>('clients.json');
    this._knowledge = this.loadJson<KnowledgeEntry[]>('knowledge.json');
    this._knowledgeDocs = this.loadKnowledgeDocs();
    this.logger.log(
      `Config loaded — ${this._clients.length} clients, ` +
        `${this._knowledge.length} FAQ entries, ` +
        `${this._knowledgeDocs.length} knowledge docs`,
    );
  }

  get botConfig(): BotConfig {
    return this._botConfig;
  }

  get clients(): ClientConfig[] {
    return this._clients;
  }

  get knowledge(): KnowledgeEntry[] {
    return this._knowledge;
  }

  get knowledgeDocs(): Array<{ filename: string; content: string }> {
    return this._knowledgeDocs;
  }

  /**
   * Finds a client by phone number. Strips non-digit characters before comparing.
   */
  findClient(phone: string): ClientConfig | undefined {
    const normalized = phone.replace(/\D/g, '').replace(/^549/, '54');
    return this._clients.find((c) => {
      const clientNorm = c.phone.replace(/\D/g, '').replace(/^549/, '54');
      return clientNorm === normalized || c.phone === phone;
    });
  }

  /**
   * Interpolates {placeholders} in a template string with the given values.
   */
  interpolate(template: string, vars: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? `{${key}}`);
  }

  private loadJson<T>(filename: string): T {
    const path = join(this.configDir, filename);
    if (!existsSync(path)) {
      throw new Error(`Config file not found: ${path}. Make sure it exists.`);
    }
    try {
      const raw = readFileSync(path, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err) {
      throw new Error(`Failed to parse ${filename}: ${(err as Error).message}`);
    }
  }

  private loadKnowledgeDocs(): Array<{ filename: string; content: string }> {
    const docsDir = join(this.configDir, 'knowledge-docs');
    if (!existsSync(docsDir)) return [];

    return readdirSync(docsDir)
      .filter((f) => f.endsWith('.md') || f.endsWith('.txt'))
      .map((filename) => ({
        filename,
        content: readFileSync(join(docsDir, filename), 'utf-8'),
      }));
  }
}
