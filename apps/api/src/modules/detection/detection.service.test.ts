import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createDatabasePool } from '../../common/database/database.config';
import { createRedisClient } from '../../common/redis/redis.config';
import { Pool } from 'pg';
import { RedisClientType } from 'redis';
import { DetectionService } from './detection.service';
import { DataService } from '../data/data.service';
import { SensorDataDto } from '../../common/types/sensor-data.types';

describe('DetectionService', () => {
  let detectionService: DetectionService;
  let dataService: DataService;
  let pool: Pool;
  let redis: RedisClientType;

  beforeAll(async () => {
    pool = createDatabasePool();
    redis = await createRedisClient();
    
    detectionService = new DetectionService(pool, redis);
    dataService = new DataService(pool);
    
    console.log('Detection service test setup complete');
  });

  afterAll(async () => {
    await redis.disconnect();
    await pool.end();
  });

  describe('calculateStats', () => {
    it('should calculate correct mean and standard deviation', () => {
      // Access private method through type assertion for testing
      const service = detectionService as any;
      const values = [1, 2, 3, 4, 5];
      const stats = service.calculateStats(values);
      
      expect(stats.mean).toBe(3);
      expect(stats.std).toBeCloseTo(1.414, 2);
    });

    it('should handle empty array', () => {
      const service = detectionService as any;
      const values: number[] = [];
      const stats = service.calculateStats(values);
      
      expect(stats.mean).toBe(0);
      expect(stats.std).toBe(0);
    });
  });

  describe('calculateZScore', () => {
    it('should calculate correct Z-Score', () => {
      const zScore = detectionService.calculateZScore(10, 5, 2);
      expect(zScore).toBe(2.5);
    });

    it('should handle zero standard deviation', () => {
      const zScore = detectionService.calculateZScore(5, 5, 0);
      expect(zScore).toBe(0);
    });

    it('should return absolute value', () => {
      const zScore = detectionService.calculateZScore(2, 5, 2);
      expect(zScore).toBe(1.5);
    });
  });

  describe('calculateBaseline', () => {
    it('should calculate baseline from historical data', async () => {
      const deviceId = `test-device-baseline-${Date.now()}`;
      
      // Insert test data
      for (let i = 0; i < 50; i++) {
        const data: SensorDataDto = {
          deviceId,
          inletPressure: 0.3 + Math.random() * 0.1,
          outletPressure: 2.5 + Math.random() * 0.2,
          temperature: 25 + Math.random() * 5,
          flowRate: 500 + Math.random() * 50,
        };
        await dataService.receiveSensorData(data);
      }

      // Calculate baseline
      const baseline = await detectionService.calculateBaseline(deviceId);

      expect(baseline.deviceId).toBe(deviceId);
      expect(baseline.sampleSize).toBe(50);
      expect(baseline.inletPressure.mean).toBeGreaterThan(0.3);
      expect(baseline.inletPressure.mean).toBeLessThan(0.4);
      expect(baseline.inletPressure.std).toBeGreaterThan(0);
      expect(baseline.outletPressure.mean).toBeGreaterThan(2.5);
      expect(baseline.outletPressure.mean).toBeLessThan(2.7);
      expect(baseline.temperature.mean).toBeGreaterThan(25);
      expect(baseline.temperature.mean).toBeLessThan(30);
      expect(baseline.flowRate.mean).toBeGreaterThan(500);
      expect(baseline.flowRate.mean).toBeLessThan(550);
    });

    it('should throw error when no data exists', async () => {
      const deviceId = 'non-existent-device';
      
      await expect(detectionService.calculateBaseline(deviceId)).rejects.toThrow(
        'No historical data found'
      );
    });
  });

  describe('getBaseline', () => {
    it('should cache baseline in Redis', async () => {
      const deviceId = `test-device-cache-${Date.now()}`;
      
      // Insert test data
      for (let i = 0; i < 20; i++) {
        const data: SensorDataDto = {
          deviceId,
          inletPressure: 0.35,
          outletPressure: 2.6,
          temperature: 27,
          flowRate: 520,
        };
        await dataService.receiveSensorData(data);
      }

      // First call should calculate and cache
      const baseline1 = await detectionService.getBaseline(deviceId);
      
      // Second call should retrieve from cache
      const baseline2 = await detectionService.getBaseline(deviceId);

      expect(baseline1.deviceId).toBe(deviceId);
      expect(baseline2.deviceId).toBe(deviceId);
      expect(baseline1.sampleSize).toBe(baseline2.sampleSize);
    });
  });

  describe('detectAnomaly', () => {
    it('should detect no anomaly for normal data', async () => {
      const deviceId = `test-device-normal-${Date.now()}`;
      
      // Insert baseline data with some variance
      for (let i = 0; i < 30; i++) {
        const data: SensorDataDto = {
          deviceId,
          inletPressure: 0.3 + (Math.random() * 0.02 - 0.01), // 0.29-0.31
          outletPressure: 2.5 + (Math.random() * 0.1 - 0.05), // 2.45-2.55
          temperature: 25 + (Math.random() * 2 - 1), // 24-26
          flowRate: 500 + (Math.random() * 20 - 10), // 490-510
        };
        await dataService.receiveSensorData(data);
      }

      // Test with normal data within the baseline range
      const testData = await dataService.receiveSensorData({
        deviceId,
        inletPressure: 0.3,
        outletPressure: 2.5,
        temperature: 25,
        flowRate: 500,
      });

      const result = await detectionService.detectAnomaly(deviceId, testData);

      expect(result.isAnomaly).toBe(false);
      expect(result.anomalies).toHaveLength(0);
      expect(result.deviceId).toBe(deviceId);
    });

    it('should detect anomaly for abnormal data', async () => {
      const deviceId = `test-device-anomaly-${Date.now()}`;
      
      // Insert baseline data
      for (let i = 0; i < 30; i++) {
        const data: SensorDataDto = {
          deviceId,
          inletPressure: 0.3,
          outletPressure: 2.5,
          temperature: 25,
          flowRate: 500,
        };
        await dataService.receiveSensorData(data);
      }

      // Test with abnormal data (very high outlet pressure)
      const testData = await dataService.receiveSensorData({
        deviceId,
        inletPressure: 0.3,
        outletPressure: 4.5, // Significantly higher
        temperature: 25,
        flowRate: 500,
      });

      const result = await detectionService.detectAnomaly(deviceId, testData);

      expect(result.isAnomaly).toBe(true);
      expect(result.anomalies.length).toBeGreaterThan(0);
      
      const outletAnomaly = result.anomalies.find(a => a.metric === 'outletPressure');
      expect(outletAnomaly).toBeDefined();
      expect(outletAnomaly!.zScore).toBeGreaterThan(3);
    });

    it('should set correct alert level for critical anomaly', async () => {
      const deviceId = `test-device-critical-${Date.now()}`;
      
      // Insert baseline data
      for (let i = 0; i < 30; i++) {
        const data: SensorDataDto = {
          deviceId,
          inletPressure: 0.3,
          outletPressure: 2.5,
          temperature: 25,
          flowRate: 500,
        };
        await dataService.receiveSensorData(data);
      }

      // Test with multiple anomalies
      const testData = await dataService.receiveSensorData({
        deviceId,
        inletPressure: 0.8, // Very high
        outletPressure: 4.5, // Very high
        temperature: 60, // Very high
        flowRate: 500,
      });

      const result = await detectionService.detectAnomaly(deviceId, testData);

      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.anomalies.length).toBeGreaterThan(2);
    });
  });

  describe('detectAllDevices', () => {
    it('should detect anomalies for all active devices', async () => {
      const deviceId1 = `test-device-all-1-${Date.now()}`;
      const deviceId2 = `test-device-all-2-${Date.now()}`;
      
      // Insert data for device 1
      for (let i = 0; i < 20; i++) {
        await dataService.receiveSensorData({
          deviceId: deviceId1,
          inletPressure: 0.3,
          outletPressure: 2.5,
          temperature: 25,
          flowRate: 500,
        });
      }

      // Insert data for device 2
      for (let i = 0; i < 20; i++) {
        await dataService.receiveSensorData({
          deviceId: deviceId2,
          inletPressure: 0.35,
          outletPressure: 2.6,
          temperature: 27,
          flowRate: 520,
        });
      }

      // This should process all devices without throwing errors
      await expect(detectionService.detectAllDevices()).resolves.not.toThrow();
    });
  });

  describe('updateAllBaselines', () => {
    it('should update baselines for all devices', async () => {
      const deviceId = `test-device-update-${Date.now()}`;
      
      // Insert data
      for (let i = 0; i < 20; i++) {
        await dataService.receiveSensorData({
          deviceId,
          inletPressure: 0.3,
          outletPressure: 2.5,
          temperature: 25,
          flowRate: 500,
        });
      }

      // This should process all devices without throwing errors
      await expect(detectionService.updateAllBaselines()).resolves.not.toThrow();
      
      // Verify baseline is cached
      const cacheKey = `baseline:${deviceId}`;
      const cached = await redis.get(cacheKey);
      expect(cached).toBeDefined();
    });
  });
});
