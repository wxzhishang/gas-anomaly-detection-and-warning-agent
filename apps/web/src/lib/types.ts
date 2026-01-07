/**
 * 传感器数据类型
 */
export interface SensorData {
  time: string;
  deviceId: string;
  inletPressure: number;
  outletPressure: number;
  temperature: number;
  flowRate: number;
}

/**
 * 异常详情
 */
export interface AnomalyDetail {
  metric: string;
  value: number;
  zScore: number;
  baseline: number;
  deviation: number;
}

/**
 * 根因分析结果
 */
export interface RootCause {
  cause: string;
  method: string;
  ruleId?: string;
  confidence: number;
  recommendation: string;
}

/**
 * 预警等级
 */
export enum AlertLevel {
  WARNING = 'warning',
  CRITICAL = 'critical',
}

/**
 * 预警数据类型
 */
export interface Alert {
  id: number;
  deviceId: string;
  level: string;
  message: string;
  anomalies?: AnomalyDetail[];
  rootCause?: RootCause;
  createdAt: string;
}

/**
 * 设备信息类型
 */
export interface Device {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 设备状态更新数据
 */
export interface DeviceStatusUpdate {
  deviceId: string;
  status: string;
  updatedAt: string;
}

/**
 * WebSocket消息类型
 */
export type WebSocketMessage =
  | { type: 'connection'; message: string }
  | { type: 'sensor_data'; data: SensorData }
  | { type: 'alert'; data: Alert }
  | { type: 'device_status'; data: DeviceStatusUpdate };
