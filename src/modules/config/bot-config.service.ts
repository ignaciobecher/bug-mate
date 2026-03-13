import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed access to .env secrets and infrastructure config.
 * Bot behavior config (prompts, menus, flows, etc.) lives in ConfigLoaderService.
 */
@Injectable()
export class BotConfigService {
  constructor(private readonly config: ConfigService) {}

  get port(): number {
    return this.config.get<number>('PORT', 3000);
  }

  get geminiApiKey(): string {
    return this.config.getOrThrow<string>('GEMINI_API_KEY');
  }

  get ollamaUrl(): string {
    return this.config.get<string>('OLLAMA_URL', 'http://localhost:11434');
  }

  get ollamaModel(): string {
    return this.config.get<string>('OLLAMA_MODEL', 'qwen3:8b');
  }

  get ollamaAutoStart(): boolean {
    return this.config.get<string>('OLLAMA_AUTO_START', 'false') === 'true';
  }

  get developerName(): string {
    return this.config.getOrThrow<string>('DEVELOPER_NAME');
  }

  get developerWhatsAppId(): string {
    const phone = this.config.getOrThrow<string>('DEVELOPER_PHONE');
    return `${phone}@c.us`;
  }
}
