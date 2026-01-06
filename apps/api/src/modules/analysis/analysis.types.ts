import { Anomaly } from '../../common/types/anomaly.types';

export enum AnalysisMethod {
  RULE_BASED = 'rule-based',
  LLM_ENHANCED = 'llm-enhanced',
}

export interface RootCauseResult {
  cause: string;
  recommendation: string;
  confidence: number;
  method: AnalysisMethod;
  ruleId?: string;
}

export interface Rule {
  id: string;
  priority: number;
  condition: (anomalies: Anomaly[]) => boolean;
  cause: string;
  recommendation: string;
}

export interface RuleMatchResult {
  ruleId: string;
  cause: string;
  recommendation: string;
}
