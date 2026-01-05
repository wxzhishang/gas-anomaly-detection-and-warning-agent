import { Module } from '@nestjs/common';
import { DetectionService } from './detection.service';
import { DetectionScheduler } from './detection.scheduler';

/**
 * 异常检测模块
 * 负责基线统计计算和异常检测
 */
@Module({
  providers: [DetectionService, DetectionScheduler],
  exports: [DetectionService],
})
export class DetectionModule {}
