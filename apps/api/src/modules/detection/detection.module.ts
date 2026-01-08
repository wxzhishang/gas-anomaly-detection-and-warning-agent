import { Module, forwardRef } from '@nestjs/common';
import { DetectionService } from './detection.service';
import { DetectionScheduler } from './detection.scheduler';
import { DataModule } from '../data/data.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { AlertModule } from '../alert/alert.module';
import { AgentModule } from '../../agent/agent.module';

/**
 * 异常检测模块
 * 负责基线统计计算和异常检测
 */
@Module({
  imports: [DataModule, AnalysisModule, AlertModule, forwardRef(() => AgentModule)],
  providers: [DetectionService, DetectionScheduler],
  exports: [DetectionService],
})
export class DetectionModule {}
