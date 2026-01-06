import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { RulesService } from './rules.service';

@Module({
  providers: [AnalysisService, RulesService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
