import { AlertLevel } from './anomaly.types';
import { Anomaly } from './anomaly.types';
import { RootCauseResult } from './analysis.types';

/**
 * 异常接口
 */
export interface Alert {
  id?: number;
  deviceId: string;
  level: AlertLevel;
  message: string;
  anomalies: Anomaly[];
  rootCause: RootCauseResult;
  createdAt: Date;
}

/**
 * 异常创建DTO
 */
export interface CreateAlertDto {
  deviceId: string;
  level: AlertLevel;
  message: string;
  anomalies: Anomaly[];
  rootCause: RootCauseResult;
}

/**
 * 异常查询参数
 */
export interface AlertQueryParams {
  deviceId?: string;
  level?: AlertLevel;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}
