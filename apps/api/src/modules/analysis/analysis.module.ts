import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AnalysisService } from './analysis.service';
import { RulesService } from './rules.service';

@Module({
  imports: [ConfigModule],
  providers: [
    RulesService,
    {
      provide: AnalysisService,
      useFactory: (rulesService: RulesService, configService: ConfigService) => {
        return new AnalysisService(rulesService, configService);
      },
      inject: [RulesService, ConfigService],
    },
  ],
  exports: [AnalysisService],
})
export class AnalysisModule {}
