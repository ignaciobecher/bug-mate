import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BotConfigService } from './bot-config.service';
import { ConfigLoaderService } from './config-loader.service';
import { botConfigSchema } from './bot-config.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: botConfigSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
  providers: [BotConfigService, ConfigLoaderService],
  exports: [BotConfigService, ConfigLoaderService],
})
export class AppConfigModule {}
