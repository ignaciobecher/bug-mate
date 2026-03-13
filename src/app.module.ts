import { Module } from '@nestjs/common';
import { AppConfigModule } from './modules/config/config.module';
import { CoreModule } from './modules/core/core.module';
import { AiModule } from './modules/ai/ai.module';
import { SessionModule } from './modules/session/session.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { BotModule } from './modules/bot/bot.module';
import { MessagingModule } from './modules/messaging/messaging.module';

@Module({
  imports: [
    AppConfigModule,   // env + BotConfigService + ConfigLoaderService
    CoreModule,        // OllamaProcessService (skipped if OLLAMA_AUTO_START=false)
    AiModule,          // GeminiProvider
    SessionModule,     // in-memory conversation state
    KnowledgeModule,   // FAQ + RAG with SQLite
    BotModule,         // BotService
    MessagingModule,   // WhatsAppAdapter
  ],
})
export class AppModule {}
