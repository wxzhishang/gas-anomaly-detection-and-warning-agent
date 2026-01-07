import { Module, forwardRef } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { DevicesController } from './devices.controller';
import { AlertModule } from '../alert/alert.module';

/**
 * 数据采集模块
 * 负责传感器数据的接收、验证、存储和查询
 */
@Module({
  imports: [
    EventEmitterModule,
    forwardRef(() => AlertModule),
  ],
  controllers: [DataController, DevicesController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
