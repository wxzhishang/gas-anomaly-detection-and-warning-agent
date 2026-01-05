/**
 * 分析方法枚举
 */
export enum AnalysisMethod {
  RULE_BASED = 'rule-based',
  LLM_ENHANCED = 'llm-enhanced',
}

/**
 * 根因分析结果
 */
export interface RootCauseResult {
  cause: string;            // 故障原因
  recommendation: string;   // 处理建议
  confidence: number;       // 置信度 (0-1)
  method: AnalysisMethod;   // 分析方法
  ruleId?: string;          // 匹配的规则ID（如果是规则匹配）
}

/**
 * 规则接口
 */
export interface Rule {
  id: string;
  priority: number;
  condition: (anomalies: any[]) => boolean;
  cause: string;
  recommendation: string;
}

/**
 * 规则匹配结果
 */
export interface RuleMatchResult {
  ruleId: string;
  cause: string;
  recommendation: string;
}
