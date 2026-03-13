import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeminiProvider } from './providers/gemini.provider';
import { AI_PROVIDER } from '../core/tokens/injection-tokens';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [HttpModule, AppConfigModule],
  providers: [
    GeminiProvider,
    {
      provide: AI_PROVIDER,
      useExisting: GeminiProvider,
    },
  ],
  exports: [AI_PROVIDER, GeminiProvider],
})
export class AiModule {}
