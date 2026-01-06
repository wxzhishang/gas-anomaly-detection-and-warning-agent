import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [AlertService],
  exports: [AlertService],
})
export class AlertModule {}
