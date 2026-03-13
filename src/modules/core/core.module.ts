import { Module } from '@nestjs/common';
import { OllamaProcessService } from './services/ollama-process.service';
import { AppConfigModule } from '../config/config.module';

/**
 * CoreModule provides shared infrastructure: interfaces, constants, utilities,
 * and lifecycle services like the Ollama process manager.
 */
@Module({
  imports: [AppConfigModule],
  providers: [OllamaProcessService],
})
export class CoreModule {}
