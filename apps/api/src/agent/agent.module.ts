import { Module, forwardRef } from '@nestjs/common';
import { AgentService } from './agent.service';
import { DetectionModule } from '../modules/detection/detection.module';
import { AnalysisModule } from '../modules/analysis/analysis.module';
import { AlertModule } from '../modules/alert/alert.module';

/**
 * Agent模块
 * 提供LangGraph工作流编排功能
 */
@Module({
  imports: [forwardRef(() => DetectionModule), AnalysisModule, AlertModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
