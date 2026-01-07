import { Module } from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertGateway } from './alert.gateway';
import { AlertController } from './alert.controller';
import { DatabaseModule } from '../../common/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AlertController],
  providers: [AlertService, AlertGateway],
  exports: [AlertService, AlertGateway],
})
export class AlertModule {}
