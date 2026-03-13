import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { AppConfigModule } from '../config/config.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AppConfigModule, AiModule],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
