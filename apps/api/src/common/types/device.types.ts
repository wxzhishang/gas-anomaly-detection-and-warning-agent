/**
 * 设备状态枚举
 */
export enum DeviceStatus {
  ACTIVE = 'active',
  WARNING = 'warning',
  CRITICAL = 'critical',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

/**
 * 设备接口
 */
export interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 设备创建DTO
 */
export interface CreateDeviceDto {
  id: string;
  name: string;
  status?: DeviceStatus;
}

/**
 * 设备更新DTO
 */
export interface UpdateDeviceDto {
  name?: string;
  status?: DeviceStatus;
}
