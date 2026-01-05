/**
 * 预警等级枚举
 */
export enum AlertLevel {
  WARNING = 'warning',      // 警告
  CRITICAL = 'critical',    // 严重
}

/**
 * 异常信息
 */
export interface Anomaly {
  metric: string;           // 指标名称
  value: number;            // 实际值
  baseline: number;         // 基线均值
  zScore: number;           // Z-Score值
  deviation: number;        // 偏离百分比
}

/**
 * 异常检测结果
 */
export interface AnomalyResult {
  deviceId: string;
  timestamp: Date;
  isAnomaly: boolean;
  anomalies: Anomaly[];
  severity: AlertLevel;
}

/**
 * 基线统计指标
 */
export interface MetricStats {
  mean: number;
  std: number;
}

/**
 * 基线统计数据
 */
export interface BaselineStats {
  deviceId: string;
  inletPressure: MetricStats;
  outletPressure: MetricStats;
  temperature: MetricStats;
  flowRate: MetricStats;
  updatedAt: Date;
  sampleSize: number;
}
