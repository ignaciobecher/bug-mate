import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { AiModule } from '../ai/ai.module';
import { AppConfigModule } from '../config/config.module';
import { SessionModule } from '../session/session.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';

@Module({
  imports: [AiModule, AppConfigModule, SessionModule, KnowledgeModule],
  providers: [BotService],
  exports: [BotService],
})
export class BotModule {}
