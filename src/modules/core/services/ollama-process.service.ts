import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ChildProcess, spawn } from 'child_process';
import { BotConfigService } from '../../config/bot-config.service';

@Injectable()
export class OllamaProcessService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(OllamaProcessService.name);
  private process: ChildProcess | null = null;

  constructor(private readonly botConfig: BotConfigService) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!this.botConfig.ollamaAutoStart) {
      this.logger.log('OLLAMA_AUTO_START=false — skipping Ollama startup');
      return;
    }

    const isRunning = await this.isOllamaRunning();
    if (isRunning) {
      this.logger.log('Ollama is already running — skipping spawn');
      return;
    }

    this.startOllama();
    await this.waitUntilReady();
  }

  onApplicationShutdown(): void {
    if (this.process) {
      this.logger.log('Shutting down Ollama process...');
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  private startOllama(): void {
    this.logger.log('Starting Ollama process...');

    this.process = spawn('ollama', ['serve'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    this.process.stdout?.on('data', (data: Buffer) => {
      this.logger.debug(`[ollama] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      // Ollama writes normal startup logs to stderr
      this.logger.debug(`[ollama] ${data.toString().trim()}`);
    });

    this.process.on('error', (err) => {
      this.logger.error(
        `Failed to start Ollama process: ${err.message}. ` +
          `Make sure Ollama is installed: https://ollama.com`,
      );
    });

    this.process.on('exit', (code, signal) => {
      if (code !== null) {
        this.logger.warn(`Ollama process exited with code ${code}`);
      } else if (signal) {
        this.logger.log(`Ollama process terminated by signal ${signal}`);
      }
      this.process = null;
    });
  }

  private async waitUntilReady(
    timeoutMs = 30_000,
    intervalMs = 500,
  ): Promise<void> {
    const start = Date.now();
    this.logger.log('Waiting for Ollama to be ready...');

    while (Date.now() - start < timeoutMs) {
      if (await this.isOllamaRunning()) {
        this.logger.log('Ollama is ready!');
        return;
      }
      await this.sleep(intervalMs);
    }

    this.logger.error(
      `Ollama did not become ready within ${timeoutMs / 1000}s. ` +
        `Check that it is installed and accessible.`,
    );
  }

  private async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.botConfig.ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
