import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  GoogleGenerativeAI,
  type GenerativeModel,
  type Part,
} from '@google/generative-ai';
import type { AIProvider, AIGenerateRequest, AIGenerateResponse } from '../../core/interfaces/ai-provider.interface';
import { BotConfigService } from '../../config/bot-config.service';
import { ConfigLoaderService } from '../../config/config-loader.service';

@Injectable()
export class GeminiProvider implements AIProvider, OnModuleInit {
  readonly providerName = 'Gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private embeddingModel: GenerativeModel;

  constructor(
    private readonly botConfig: BotConfigService,
    private readonly configLoader: ConfigLoaderService,
  ) {
    // Only initialize the client here — config JSON is not ready yet
    this.genAI = new GoogleGenerativeAI(this.botConfig.geminiApiKey);
  }

  onModuleInit(): void {
    // JSON config is loaded by ConfigLoaderService.onModuleInit() before this runs
    const modelName = this.configLoader.botConfig.ai.model;
    const embeddingModelName = this.configLoader.botConfig.ai.embeddingModel;
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    this.embeddingModel = this.genAI.getGenerativeModel({ model: embeddingModelName });
    this.logger.log(`Gemini initialized — model: ${modelName}`);
  }

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const { ai, identity } = this.configLoader.botConfig;

    const systemPrompt =
      request.systemPrompt ??
      this.configLoader.interpolate(ai.systemPrompt, {
        company: identity.company,
        developerName: identity.developerName,
        botName: identity.name,
        tone: identity.tone,
      });

    const parts: Part[] = [];

    if (request.imageBase64 && request.imageMimeType) {
      parts.push({
        inlineData: {
          data: request.imageBase64,
          mimeType: request.imageMimeType,
        },
      });
    }

    parts.push({ text: `${systemPrompt}\n\nUsuario: ${request.prompt}` });

    this.logger.debug(`Generating response${request.imageBase64 ? ' (with image)' : ''}`);

    try {
      const result = await this.model.generateContent(parts);
      return {
        text: result.response.text(),
        metadata: { model: ai.model },
      };
    } catch (error) {
      this.logger.error(`Gemini generation failed: ${(error as Error).message}`);
      throw new Error(`AI provider error: ${(error as Error).message}`);
    }
  }

  async embed(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      this.logger.error(`Gemini embedding failed: ${(error as Error).message}`);
      throw new Error(`Embedding error: ${(error as Error).message}`);
    }
  }
}
