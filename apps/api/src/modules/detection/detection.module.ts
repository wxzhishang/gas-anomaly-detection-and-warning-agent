import { Module } from '@nestjs/common';
import { DetectionService } from './detection.service';
import { DetectionScheduler } from './detection.scheduler';
import { DataModule } from '../data/data.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { AlertModule } from '../alert/alert.module';

/**
 * 异常检测模块
 * 负责基线统计计算和异常检测
 */
@Module({
  imports: [DataModule, AnalysisModule, AlertModule],
  providers: [DetectionService, DetectionScheduler],
  exports: [DetectionService],
})
export class DetectionModule {}
