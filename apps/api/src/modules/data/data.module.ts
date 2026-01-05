import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { DevicesController } from './devices.controller';

/**
 * 数据采集模块
 * 负责传感器数据的接收、验证、存储和查询
 */
@Module({
  controllers: [DataController, DevicesController],
  providers: [DataService],
  exports: [DataService],
})
export class DataModule {}
