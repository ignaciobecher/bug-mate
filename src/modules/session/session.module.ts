import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { AppConfigModule } from '../config/config.module';

@Module({
  imports: [AppConfigModule],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
