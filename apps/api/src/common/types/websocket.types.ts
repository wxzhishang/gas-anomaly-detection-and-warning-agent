import { SensorData } from './sensor-data.types';
import { Alert } from './alert.types';

/**
 * WebSocket消息类型
 */
export enum WebSocketMessageType {
  SENSOR_DATA = 'sensor-data',
  ALERT = 'alert',
  CONNECTION = 'connection',
  DEVICE_STATUS = 'device-status',
}

/**
 * 传感器数据消息
 */
export interface SensorDataMessage {
  type: WebSocketMessageType.SENSOR_DATA;
  data: SensorData;
}

/**
 * 预警消息
 */
export interface AlertMessage {
  type: WebSocketMessageType.ALERT;
  data: Alert;
}

/**
 * 连接确认消息
 */
export interface ConnectionMessage {
  type: WebSocketMessageType.CONNECTION;
  data: {
    clientId: string;
    connectedAt: Date;
  };
}

/**
 * 设备状态更新消息
 */
export interface DeviceStatusMessage {
  type: WebSocketMessageType.DEVICE_STATUS;
  data: {
    deviceId: string;
    status: string;
    updatedAt: Date;
  };
}

/**
 * WebSocket消息联合类型
 */
export type WebSocketMessage = SensorDataMessage | AlertMessage | ConnectionMessage | DeviceStatusMessage;
