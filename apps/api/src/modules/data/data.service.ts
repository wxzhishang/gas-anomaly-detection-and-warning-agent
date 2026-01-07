import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../common/database/database.module';
import {
  SensorData,
  SensorDataDto,
  ValidationResult,
  ValidationError,
  VALIDATION_RULES,
} from '../../common/types/sensor-data.types';
import { Device, DeviceStatus } from '../../common/types/device.types';

/**
 * 数据采集服务
 * 负责传感器数据的接收、验证、存储和查询
 */
@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {
    this.logger.log('DataService initialized');
  }

  /**
   * 验证传感器数据
   * 检查所有指标是否在有效范围内
   * 
   * @param data 传感器数据DTO
   * @returns 验证结果
   */
  validateSensorData(data: SensorDataDto): ValidationResult {
    const errors: ValidationError[] = [];

    // 验证进口压力
    if (
      data.inletPressure < VALIDATION_RULES.inletPressure.min ||
      data.inletPressure > VALIDATION_RULES.inletPressure.max
    ) {
      errors.push({
        field: 'inletPressure',
        value: data.inletPressure,
        message: `Value must be between ${VALIDATION_RULES.inletPressure.min} and ${VALIDATION_RULES.inletPressure.max} ${VALIDATION_RULES.inletPressure.unit}`,
      });
    }

    // 验证出口压力
    if (
      data.outletPressure < VALIDATION_RULES.outletPressure.min ||
      data.outletPressure > VALIDATION_RULES.outletPressure.max
    ) {
      errors.push({
        field: 'outletPressure',
        value: data.outletPressure,
        message: `Value must be between ${VALIDATION_RULES.outletPressure.min} and ${VALIDATION_RULES.outletPressure.max} ${VALIDATION_RULES.outletPressure.unit}`,
      });
    }

    // 验证温度
    if (
      data.temperature < VALIDATION_RULES.temperature.min ||
      data.temperature > VALIDATION_RULES.temperature.max
    ) {
      errors.push({
        field: 'temperature',
        value: data.temperature,
        message: `Value must be between ${VALIDATION_RULES.temperature.min} and ${VALIDATION_RULES.temperature.max} ${VALIDATION_RULES.temperature.unit}`,
      });
    }

    // 验证流量
    if (
      data.flowRate < VALIDATION_RULES.flowRate.min ||
      data.flowRate > VALIDATION_RULES.flowRate.max
    ) {
      errors.push({
        field: 'flowRate',
        value: data.flowRate,
        message: `Value must be between ${VALIDATION_RULES.flowRate.min} and ${VALIDATION_RULES.flowRate.max} ${VALIDATION_RULES.flowRate.unit}`,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 接收并存储传感器数据
   * 包含数据验证和设备自动注册
   * 
   * @param data 传感器数据DTO
   * @returns 存储的传感器数据
   * @throws BadRequestException 如果数据验证失败
   */
  async receiveSensorData(data: SensorDataDto): Promise<SensorData> {
    // 验证数据
    const validation = this.validateSensorData(data);
    if (!validation.isValid) {
      throw new Error(
        `Validation failed: ${validation.errors.map(e => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    // 确保设备存在（自动注册）
    await this.ensureDeviceExists(data.deviceId);

    // 解析时间戳
    const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();

    // 存储数据到TimescaleDB
    const query = `
      INSERT INTO sensor_data (time, device_id, inlet_pressure, outlet_pressure, temperature, flow_rate)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      timestamp,
      data.deviceId,
      data.inletPressure,
      data.outletPressure,
      data.temperature,
      data.flowRate,
    ];

    try {
      const result = await this.pool.query(query, values);
      const row = result.rows[0];

      this.logger.log(`Sensor data stored for device ${data.deviceId}`);

      return {
        time: row.time,
        deviceId: row.device_id,
        inletPressure: row.inlet_pressure,
        outletPressure: row.outlet_pressure,
        temperature: row.temperature,
        flowRate: row.flow_rate,
      };
    } catch (error: any) {
      this.logger.error(`Failed to store sensor data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 查询历史数据
   * 按时间范围查询指定设备的传感器数据
   * 
   * @param deviceId 设备ID
   * @param startTime 开始时间
   * @param endTime 结束时间
   * @returns 传感器数据数组
   */
  async queryHistoricalData(
    deviceId: string,
    startTime: Date,
    endTime: Date,
  ): Promise<SensorData[]> {
    const query = `
      SELECT time, device_id, inlet_pressure, outlet_pressure, temperature, flow_rate
      FROM sensor_data
      WHERE device_id = $1 AND time >= $2 AND time <= $3
      ORDER BY time DESC
    `;

    const values = [deviceId, startTime, endTime];

    try {
      const result = await this.pool.query(query, values);
      
      return result.rows.map(row => ({
        time: row.time,
        deviceId: row.device_id,
        inletPressure: row.inlet_pressure,
        outletPressure: row.outlet_pressure,
        temperature: row.temperature,
        flowRate: row.flow_rate,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to query historical data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取最近N条数据
   * 用于基线统计计算
   * 
   * @param deviceId 设备ID
   * @param limit 数据条数
   * @returns 传感器数据数组
   */
  async getRecentData(deviceId: string, limit: number): Promise<SensorData[]> {
    const query = `
      SELECT time, device_id, inlet_pressure, outlet_pressure, temperature, flow_rate
      FROM sensor_data
      WHERE device_id = $1
      ORDER BY time DESC
      LIMIT $2
    `;

    const values = [deviceId, limit];

    try {
      const result = await this.pool.query(query, values);
      
      return result.rows.map(row => ({
        time: row.time,
        deviceId: row.device_id,
        inletPressure: row.inlet_pressure,
        outletPressure: row.outlet_pressure,
        temperature: row.temperature,
        flowRate: row.flow_rate,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get recent data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 确保设备存在，如果不存在则自动创建
   * 
   * @param deviceId 设备ID
   */
  private async ensureDeviceExists(deviceId: string): Promise<void> {
    // 检查设备是否存在
    const checkQuery = 'SELECT id FROM devices WHERE id = $1';
    const checkResult = await this.pool.query(checkQuery, [deviceId]);

    if (checkResult.rows.length === 0) {
      // 设备不存在，自动创建
      const insertQuery = `
        INSERT INTO devices (id, name, status)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `;
      
      const deviceName = `Device ${deviceId}`;
      await this.pool.query(insertQuery, [deviceId, deviceName, DeviceStatus.ACTIVE]);
      
      this.logger.log(`Auto-registered new device: ${deviceId}`);
    }
  }

  /**
   * 获取所有设备列表
   * 
   * @returns 设备数组
   */
  async getAllDevices(): Promise<Device[]> {
    const query = `
      SELECT d.id, d.name, d.status, d.created_at, d.updated_at,
             MAX(sd.time) as last_data_time
      FROM devices d
      LEFT JOIN sensor_data sd ON d.id = sd.device_id
      GROUP BY d.id, d.name, d.status, d.created_at, d.updated_at
      ORDER BY last_data_time DESC NULLS LAST, d.id ASC
    `;

    try {
      const result = await this.pool.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error: any) {
      this.logger.error(`Failed to get all devices: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取设备详情（包含最新数据时间）
   * 
   * @param deviceId 设备ID
   * @returns 设备信息
   */
  async getDeviceById(deviceId: string): Promise<Device | null> {
    const query = `
      SELECT d.id, d.name, d.status, d.created_at, d.updated_at,
             MAX(sd.time) as last_data_time
      FROM devices d
      LEFT JOIN sensor_data sd ON d.id = sd.device_id
      WHERE d.id = $1
      GROUP BY d.id, d.name, d.status, d.created_at, d.updated_at
    `;

    try {
      const result = await this.pool.query(query, [deviceId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get device by id: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 更新设备状态
   * 
   * @param deviceId 设备ID
   * @param status 新状态
   */
  async updateDeviceStatus(deviceId: string, status: DeviceStatus): Promise<void> {
    const query = `
      UPDATE devices 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;

    try {
      await this.pool.query(query, [status, deviceId]);
      this.logger.log(`Updated device ${deviceId} status to ${status}`);
    } catch (error: any) {
      this.logger.error(`Failed to update device status: ${error.message}`, error.stack);
      throw error;
    }
  }
}
