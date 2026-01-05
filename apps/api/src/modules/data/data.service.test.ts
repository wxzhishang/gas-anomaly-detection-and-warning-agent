import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { DataService } from './data.service';
import { createDatabasePool } from '../../common/database/database.config';
import { SensorDataDto } from '../../common/types/sensor-data.types';

describe('DataService', () => {
  let dataService: DataService;
  let pool: Pool;

  beforeAll(async () => {
    pool = createDatabasePool();
    dataService = new DataService(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('validateSensorData', () => {
    it('should accept valid sensor data', () => {
      const validData: SensorDataDto = {
        deviceId: 'test-device-001',
        inletPressure: 0.5,
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      };

      const result = dataService.validateSensorData(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject data with out-of-range inlet pressure', () => {
      const invalidData: SensorDataDto = {
        deviceId: 'test-device-001',
        inletPressure: 1.5, // 超出范围
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      };

      const result = dataService.validateSensorData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('inletPressure');
      expect(result.errors[0].message).toContain('0.1');
      expect(result.errors[0].message).toContain('1');
    });

    it('should reject data with out-of-range outlet pressure', () => {
      const invalidData: SensorDataDto = {
        deviceId: 'test-device-001',
        inletPressure: 0.5,
        outletPressure: 6.0, // 超出范围
        temperature: 25,
        flowRate: 500,
      };

      const result = dataService.validateSensorData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('outletPressure');
    });

    it('should reject data with out-of-range temperature', () => {
      const invalidData: SensorDataDto = {
        deviceId: 'test-device-001',
        inletPressure: 0.5,
        outletPressure: 2.5,
        temperature: 100, // 超出范围
        flowRate: 500,
      };

      const result = dataService.validateSensorData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('temperature');
    });

    it('should reject data with out-of-range flow rate', () => {
      const invalidData: SensorDataDto = {
        deviceId: 'test-device-001',
        inletPressure: 0.5,
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 3000, // 超出范围
      };

      const result = dataService.validateSensorData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('flowRate');
    });

    it('should reject data with multiple out-of-range values', () => {
      const invalidData: SensorDataDto = {
        deviceId: 'test-device-001',
        inletPressure: 2.0, // 超出范围
        outletPressure: 6.0, // 超出范围
        temperature: 25,
        flowRate: 500,
      };

      const result = dataService.validateSensorData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('receiveSensorData', () => {
    it('should store valid sensor data', async () => {
      const validData: SensorDataDto = {
        deviceId: 'test-device-receive-001',
        inletPressure: 0.5,
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      };

      const result = await dataService.receiveSensorData(validData);
      
      expect(result).toBeDefined();
      expect(result.deviceId).toBe(validData.deviceId);
      expect(result.inletPressure).toBe(validData.inletPressure);
      expect(result.outletPressure).toBe(validData.outletPressure);
      expect(result.temperature).toBe(validData.temperature);
      expect(result.flowRate).toBe(validData.flowRate);
      expect(result.time).toBeInstanceOf(Date);
    });

    it('should reject invalid sensor data', async () => {
      const invalidData: SensorDataDto = {
        deviceId: 'test-device-receive-002',
        inletPressure: 2.0, // 超出范围
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      };

      await expect(dataService.receiveSensorData(invalidData)).rejects.toThrow('Validation failed');
    });

    it('should auto-register new device', async () => {
      const newDeviceId = `test-device-auto-${Date.now()}`;
      const validData: SensorDataDto = {
        deviceId: newDeviceId,
        inletPressure: 0.5,
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      };

      await dataService.receiveSensorData(validData);
      
      const device = await dataService.getDeviceById(newDeviceId);
      expect(device).toBeDefined();
      expect(device?.id).toBe(newDeviceId);
      expect(device?.status).toBe('active');
    });
  });

  describe('queryHistoricalData', () => {
    it('should query historical data by time range', async () => {
      const deviceId = `test-device-history-${Date.now()}`;
      
      // 插入测试数据
      await dataService.receiveSensorData({
        deviceId,
        inletPressure: 0.5,
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      });

      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 60000); // 1分钟前

      const data = await dataService.queryHistoricalData(deviceId, startTime, endTime);
      
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('getRecentData', () => {
    it('should get recent N data points', async () => {
      const deviceId = `test-device-recent-${Date.now()}`;
      
      // 插入多条测试数据
      for (let i = 0; i < 5; i++) {
        await dataService.receiveSensorData({
          deviceId,
          inletPressure: 0.5 + i * 0.01,
          outletPressure: 2.5,
          temperature: 25,
          flowRate: 500,
        });
      }

      const data = await dataService.getRecentData(deviceId, 3);
      
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('getAllDevices', () => {
    it('should get all devices', async () => {
      const devices = await dataService.getAllDevices();
      
      expect(devices).toBeDefined();
      expect(Array.isArray(devices)).toBe(true);
    });
  });
});
