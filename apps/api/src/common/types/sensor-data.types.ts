/**
 * 传感器数据接口
 */
export interface SensorData {
  id?: number;
  time: Date;
  deviceId: string;
  inletPressure: number;    // 进口压力 (MPa)
  outletPressure: number;   // 出口压力 (MPa)
  temperature: number;      // 温度 (°C)
  flowRate: number;         // 流量 (m³/h)
}

/**
 * 传感器数据DTO（数据传输对象）
 */
export interface SensorDataDto {
  deviceId: string;
  timestamp?: string;       // ISO 8601格式，可选
  inletPressure: number;
  outletPressure: number;
  temperature: number;
  flowRate: number;
}

/**
 * 数据验证结果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * 验证错误
 */
export interface ValidationError {
  field: string;
  value: number;
  message: string;
}

/**
 * 数据验证规则
 */
export const VALIDATION_RULES = {
  inletPressure: { min: 0.1, max: 1.0, unit: 'MPa' },
  outletPressure: { min: 0.5, max: 5.0, unit: 'MPa' },
  temperature: { min: -20, max: 80, unit: '°C' },
  flowRate: { min: 0, max: 2000, unit: 'm³/h' },
} as const;
