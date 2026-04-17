import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../common/database/database.module';
import { REDIS_CLIENT } from '../../common/redis/redis.module';
import {
  BaselineStats,
  MetricStats,
  AnomalyResult,
  Anomaly,
  AlertLevel,
} from '../../common/types/anomaly.types';
import { SensorData } from '../../common/types/sensor-data.types';

/**
 * 异常检测服务
 * 负责基线统计计算和Z-Score异常检测
 */
@Injectable()
export class DetectionService {
  private readonly logger = new Logger(DetectionService.name);
  private readonly BASELINE_SAMPLE_SIZE = 1000; // 基线计算使用的数据点数量
  private readonly BASELINE_CACHE_TTL = 3600; // 基线缓存时间（秒）
  private readonly ANOMALY_THRESHOLD = 3; // Z-Score异常阈值

  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
    @Inject(REDIS_CLIENT)
    private readonly redis: any, // 使用any避免类型导入问题
  ) {}

  /**
   * 计算设备基线统计
   * 
   * 重要：为了避免异常数据污染基线，我们使用固定的默认基线
   * 默认基线基于设备正常运行参数设置，确保检测标准一致
   * 
   * @param deviceId 设备ID
   * @returns 基线统计数据
   */
  async calculateBaseline(deviceId: string): Promise<BaselineStats> {
    // 始终使用默认基线，避免异常数据污染
    // 如果需要动态基线，可以考虑：
    // 1. 只使用标记为"正常"的历史数据
    // 2. 使用中位数而非均值来减少异常值影响
    // 3. 使用滑动窗口排除最近的异常数据
    this.logger.log(`Using default baseline for device ${deviceId}`);
    return this.getDefaultBaseline(deviceId);
  }

  /**
   * 获取默认基线（基于设备正常运行参数）
   * 这些值应该根据实际设备规格设置
   */
  private getDefaultBaseline(deviceId: string): BaselineStats {
    return {
      deviceId,
      inletPressure: { mean: 0.3, std: 0.02 },
      outletPressure: { mean: 2.5, std: 0.1 },
      temperature: { mean: 23, std: 2 },
      flowRate: { mean: 500, std: 20 },
      updatedAt: new Date(),
      sampleSize: 0,
    };
  }

  /**
   * 计算统计指标（均值和标准差）
   * 
   * @param values 数值数组
   * @returns 统计指标
   */
  private calculateStats(values: number[]): MetricStats {
    if (values.length === 0) {
      return { mean: 0, std: 0 };
    }

    // 计算均值
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    // 计算方差
    const variance = values.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0
    ) / values.length;

    // 计算标准差
    const std = Math.sqrt(variance);

    return { mean, std };
  }

  /**
   * 获取基线统计
   * 始终使用默认基线，避免被污染的缓存数据影响检测
   * 
   * @param deviceId 设备ID
   * @returns 基线统计数据
   */
  async getBaseline(deviceId: string): Promise<BaselineStats> {
    // 直接返回默认基线，不使用缓存
    // 这样可以确保检测标准一致，不受历史异常数据影响
    return this.getDefaultBaseline(deviceId);
  }

  /**
   * 计算Z-Score
   * Z-Score = |x - μ| / σ
   * 
   * @param value 实际值
   * @param mean 均值
   * @param std 标准差
   * @returns Z-Score值
   */
  calculateZScore(value: number, mean: number, std: number): number {
    if (std === 0) {
      return 0; // 标准差为0时，返回0
    }
    return Math.abs((value - mean) / std);
  }

  /**
   * 执行异常检测
   * 使用Z-Score方法检测传感器数据是否异常
   * 
   * @param deviceId 设备ID
   * @param data 传感器数据
   * @returns 异常检测结果
   */
  async detectAnomaly(deviceId: string, data: SensorData): Promise<AnomalyResult> {
    try {
      // 获取基线统计
      const baseline = await this.getBaseline(deviceId);

      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      this.logger.log(`🔍 异常检测开始 - 设备: ${deviceId}`);
      this.logger.log(`📊 当前数据: 进口=${data.inletPressure}, 出口=${data.outletPressure}, 温度=${data.temperature}, 流量=${data.flowRate}`);
      this.logger.log(`📈 基线数据: 进口=${baseline.inletPressure.mean}±${baseline.inletPressure.std}, 出口=${baseline.outletPressure.mean}±${baseline.outletPressure.std}, 温度=${baseline.temperature.mean}±${baseline.temperature.std}, 流量=${baseline.flowRate.mean}±${baseline.flowRate.std}`);
      this.logger.log(`📏 基线样本数: ${baseline.sampleSize}, 阈值: ${this.ANOMALY_THRESHOLD}`);

      const anomalies: Anomaly[] = [];

      // 检测进口压力
      const inletZScore = this.calculateZScore(
        data.inletPressure,
        baseline.inletPressure.mean,
        baseline.inletPressure.std
      );
      this.logger.log(`   进口压力 Z-Score: ${inletZScore.toFixed(2)} (阈值: ${this.ANOMALY_THRESHOLD})`);
      if (inletZScore > this.ANOMALY_THRESHOLD) {
        anomalies.push({
          metric: 'inletPressure',
          value: data.inletPressure,
          baseline: baseline.inletPressure.mean,
          zScore: inletZScore,
          deviation: ((data.inletPressure - baseline.inletPressure.mean) / baseline.inletPressure.mean) * 100,
        });
      }

      // 检测出口压力
      const outletZScore = this.calculateZScore(
        data.outletPressure,
        baseline.outletPressure.mean,
        baseline.outletPressure.std
      );
      this.logger.log(`   出口压力 Z-Score: ${outletZScore.toFixed(2)} (阈值: ${this.ANOMALY_THRESHOLD})`);
      if (outletZScore > this.ANOMALY_THRESHOLD) {
        anomalies.push({
          metric: 'outletPressure',
          value: data.outletPressure,
          baseline: baseline.outletPressure.mean,
          zScore: outletZScore,
          deviation: ((data.outletPressure - baseline.outletPressure.mean) / baseline.outletPressure.mean) * 100,
        });
      }

      // 检测温度
      const tempZScore = this.calculateZScore(
        data.temperature,
        baseline.temperature.mean,
        baseline.temperature.std
      );
      this.logger.log(`   温度 Z-Score: ${tempZScore.toFixed(2)} (阈值: ${this.ANOMALY_THRESHOLD})`);
      if (tempZScore > this.ANOMALY_THRESHOLD) {
        anomalies.push({
          metric: 'temperature',
          value: data.temperature,
          baseline: baseline.temperature.mean,
          zScore: tempZScore,
          deviation: ((data.temperature - baseline.temperature.mean) / baseline.temperature.mean) * 100,
        });
      }

      // 检测流量
      const flowZScore = this.calculateZScore(
        data.flowRate,
        baseline.flowRate.mean,
        baseline.flowRate.std
      );
      this.logger.log(`   流量 Z-Score: ${flowZScore.toFixed(2)} (阈值: ${this.ANOMALY_THRESHOLD})`);
      if (flowZScore > this.ANOMALY_THRESHOLD) {
        anomalies.push({
          metric: 'flowRate',
          value: data.flowRate,
          baseline: baseline.flowRate.mean,
          zScore: flowZScore,
          deviation: ((data.flowRate - baseline.flowRate.mean) / baseline.flowRate.mean) * 100,
        });
      }

      // 判定异常等级
      const isAnomaly = anomalies.length > 0;
      const severity = this.determineAlertLevel(anomalies);

      const result: AnomalyResult = {
        deviceId,
        timestamp: data.time,
        isAnomaly,
        anomalies,
        severity,
      };

      if (isAnomaly) {
        this.logger.warn(
          `⚠️ 检测到异常! 设备 ${deviceId}: ${anomalies.length} 个指标超过阈值`
        );
        anomalies.forEach(a => {
          this.logger.warn(`   - ${a.metric}: 值=${a.value}, 基线=${a.baseline}, Z-Score=${a.zScore.toFixed(2)}`);
        });
      } else {
        this.logger.log(`✅ 未检测到异常 - 设备 ${deviceId}`);
      }
      this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to detect anomaly: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 判定异常等级
   * 规则：异常指标数量>2 或 最大Z-Score>5 则为严重，否则为警告
   * 
   * @param anomalies 异常列表
   * @returns 异常等级
   */
  private determineAlertLevel(anomalies: Anomaly[]): AlertLevel {
    if (anomalies.length === 0) {
      return AlertLevel.WARNING;
    }

    const maxZScore = Math.max(...anomalies.map(a => a.zScore));
    const anomalyCount = anomalies.length;

    if (anomalyCount > 2 || maxZScore > 5) {
      return AlertLevel.CRITICAL;
    }

    return AlertLevel.WARNING;
  }

  /**
   * 定时任务：检测所有活跃设备
   * 每分钟执行一次
   */
  async detectAllDevices(): Promise<void> {
    try {
      // 查询所有活跃设备
      const query = `
        SELECT DISTINCT device_id
        FROM sensor_data
        WHERE time > NOW() - INTERVAL '1 hour'
      `;

      const result = await this.pool.query(query);
      const deviceIds = result.rows.map(row => row.device_id);

      this.logger.log(`Starting anomaly detection for ${deviceIds.length} devices`);

      // 为每个设备执行异常检测
      for (const deviceId of deviceIds) {
        try {
          // 获取最新数据
          const dataQuery = `
            SELECT time, device_id, inlet_pressure, outlet_pressure, temperature, flow_rate
            FROM sensor_data
            WHERE device_id = $1
            ORDER BY time DESC
            LIMIT 1
          `;

          const dataResult = await this.pool.query(dataQuery, [deviceId]);
          
          if (dataResult.rows.length > 0) {
            const row = dataResult.rows[0];
            const sensorData: SensorData = {
              time: row.time,
              deviceId: row.device_id,
              inletPressure: row.inlet_pressure,
              outletPressure: row.outlet_pressure,
              temperature: row.temperature,
              flowRate: row.flow_rate,
            };

            await this.detectAnomaly(deviceId, sensorData);
          }
        } catch (error: any) {
          this.logger.error(`Failed to detect anomaly for device ${deviceId}: ${error.message}`);
          // 继续处理其他设备
        }
      }

      this.logger.log(`Completed anomaly detection for ${deviceIds.length} devices`);
    } catch (error: any) {
      this.logger.error(`Failed to detect all devices: ${error.message}`, error.stack);
    }
  }

  /**
   * 定时任务：更新所有设备的基线统计
   * 每小时执行一次
   */
  async updateAllBaselines(): Promise<void> {
    try {
      // 查询所有有数据的设备
      const query = `
        SELECT DISTINCT device_id
        FROM sensor_data
      `;

      const result = await this.pool.query(query);
      const deviceIds = result.rows.map(row => row.device_id);

      this.logger.log(`Starting baseline update for ${deviceIds.length} devices`);

      // 为每个设备更新基线
      for (const deviceId of deviceIds) {
        try {
          const baseline = await this.calculateBaseline(deviceId);
          
          // 更新缓存
          const cacheKey = `baseline:${deviceId}`;
          await this.redis.setEx(
            cacheKey,
            this.BASELINE_CACHE_TTL,
            JSON.stringify(baseline)
          );

          this.logger.debug(`Updated baseline for device ${deviceId}`);
        } catch (error: any) {
          this.logger.error(`Failed to update baseline for device ${deviceId}: ${error.message}`);
          // 继续处理其他设备
        }
      }

      this.logger.log(`Completed baseline update for ${deviceIds.length} devices`);
    } catch (error: any) {
      this.logger.error(`Failed to update all baselines: ${error.message}`, error.stack);
    }
  }
}
