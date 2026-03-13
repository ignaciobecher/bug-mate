import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import type { AIProvider, AIGenerateRequest, AIGenerateResponse } from '../../core/interfaces/ai-provider.interface';
import { BotConfigService } from '../../config/bot-config.service';

interface OllamaGenerateResponse {
  model: string;
  response: string;
  done: boolean;
}

@Injectable()
export class OllamaProvider implements AIProvider {
  readonly providerName = 'Ollama';
  private readonly logger = new Logger(OllamaProvider.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly botConfig: BotConfigService,
  ) {}

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const url = `${this.botConfig.ollamaUrl}/api/generate`;
    const model = this.botConfig.ollamaModel;

    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\nUsuario: ${request.prompt}`
      : request.prompt;

    this.logger.debug(`Sending prompt to Ollama model "${model}"`);

    try {
      const { data } = await firstValueFrom(
        this.httpService.post<OllamaGenerateResponse>(url, {
          model,
          prompt: fullPrompt,
          stream: false,
        }),
      );

      this.logger.debug('Received response from Ollama');

      return {
        text: data.response,
        metadata: { model: data.model, done: data.done },
      };
    } catch (error) {
      this.logger.error(`Failed to communicate with Ollama: ${(error as Error).message}`);
      throw new Error(`AI provider error: ${(error as Error).message}`);
    }
  }
}
