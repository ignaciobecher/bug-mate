import { Module } from '@nestjs/common';
import { WhatsAppAdapter } from './adapters/whatsapp.adapter';
import { MESSAGE_ADAPTER } from '../core/tokens/injection-tokens';
import { BotModule } from '../bot/bot.module';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [BotModule, AppConfigModule],
  providers: [
    WhatsAppAdapter,
    {
      provide: MESSAGE_ADAPTER,
      useExisting: WhatsAppAdapter,
    },
  ],
  exports: [MESSAGE_ADAPTER, WhatsAppAdapter],
})
export class MessagingModule {}
