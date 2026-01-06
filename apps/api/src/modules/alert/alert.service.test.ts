import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { AlertService } from './alert.service';
import { createDatabasePool } from '../../common/database/database.config';
import { AlertLevel, Anomaly } from '../../common/types/anomaly.types';
import { AnalysisMethod } from '../../common/types/analysis.types';

describe('AlertService', () => {
  let alertService: AlertService;
  let pool: Pool;

  beforeAll(async () => {
    pool = createDatabasePool();
    alertService = new AlertService(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('determineAlertLevel', () => {
    it('应该返回CRITICAL当异常指标数量大于2', () => {
      const anomalies: Anomaly[] = [
        { metric: 'inletPressure', value: 0.8, baseline: 0.5, zScore: 3.5, deviation: 60 },
        { metric: 'outletPressure', value: 1.5, baseline: 2.5, zScore: 3.2, deviation: -40 },
        { metric: 'temperature', value: 50, baseline: 25, zScore: 3.8, deviation: 100 },
      ];

      const level = alertService.determineAlertLevel(anomalies);
      expect(level).toBe(AlertLevel.CRITICAL);
    });

    it('应该返回CRITICAL当最大Z-Score大于5', () => {
      const anomalies: Anomaly[] = [
        { metric: 'outletPressure', value: 1.0, baseline: 2.5, zScore: 5.5, deviation: -60 },
      ];

      const level = alertService.determineAlertLevel(anomalies);
      expect(level).toBe(AlertLevel.CRITICAL);
    });

    it('应该返回WARNING当异常指标数量小于等于2且Z-Score小于等于5', () => {
      const anomalies: Anomaly[] = [
        { metric: 'temperature', value: 35, baseline: 25, zScore: 3.2, deviation: 40 },
      ];

      const level = alertService.determineAlertLevel(anomalies);
      expect(level).toBe(AlertLevel.WARNING);
    });

    it('应该返回WARNING当异常列表为空', () => {
      const anomalies: Anomaly[] = [];

      const level = alertService.determineAlertLevel(anomalies);
      expect(level).toBe(AlertLevel.WARNING);
    });
  });

  describe('createAlert', () => {
    it('应该成功创建预警记录', async () => {
      const deviceId = `test-device-alert-${Date.now()}`;
      
      // 先创建设备
      await pool.query(
        'INSERT INTO devices (id, name, status) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [deviceId, '测试设备', 'active']
      );

      const anomalyResult = {
        deviceId,
        timestamp: new Date(),
        isAnomaly: true,
        anomalies: [
          { metric: 'outletPressure', value: 1.0, baseline: 2.5, zScore: 5.5, deviation: -60 },
        ],
        severity: AlertLevel.CRITICAL,
      };

      const rootCause = {
        cause: '调压器膜片可能老化或损坏',
        recommendation: '立即检查并更换膜片',
        confidence: 0.8,
        method: AnalysisMethod.RULE_BASED,
        ruleId: 'rule-001',
      };

      const alert = await alertService.createAlert(deviceId, anomalyResult, rootCause);

      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.deviceId).toBe(deviceId);
      expect(alert.level).toBe(AlertLevel.CRITICAL);
      expect(alert.message).toContain('出口压力异常');
      expect(alert.anomalies).toHaveLength(1);
      expect(alert.rootCause).toEqual(rootCause);
      expect(alert.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('queryAlerts', () => {
    it('应该查询所有预警', async () => {
      const alerts = await alertService.queryAlerts();

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
    });

    it('应该按设备ID查询预警', async () => {
      const deviceId = `test-device-query-${Date.now()}`;
      
      // 先创建设备和预警
      await pool.query(
        'INSERT INTO devices (id, name, status) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
        [deviceId, '测试设备', 'active']
      );

      const anomalyResult = {
        deviceId,
        timestamp: new Date(),
        isAnomaly: true,
        anomalies: [
          { metric: 'temperature', value: 60, baseline: 25, zScore: 4.0, deviation: 140 },
        ],
        severity: AlertLevel.WARNING,
      };

      const rootCause = {
        cause: '设备温度异常',
        recommendation: '检查阀门润滑情况',
        confidence: 0.8,
        method: AnalysisMethod.RULE_BASED,
      };

      await alertService.createAlert(deviceId, anomalyResult, rootCause);

      const alerts = await alertService.queryAlerts({ deviceId });

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[0].deviceId).toBe(deviceId);
    });

    it('应该按预警等级查询', async () => {
      const alerts = await alertService.queryAlerts({ level: AlertLevel.CRITICAL });

      expect(alerts).toBeDefined();
      expect(Array.isArray(alerts)).toBe(true);
      alerts.forEach(alert => {
        expect(alert.level).toBe(AlertLevel.CRITICAL);
      });
    });

    it('应该支持分页查询', async () => {
      const alerts = await alertService.queryAlerts({ limit: 5, offset: 0 });

      expect(alerts).toBeDefined();
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });
});
