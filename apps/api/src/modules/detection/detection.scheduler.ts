import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../common/database/database.module';
import { DetectionService } from './detection.service';
import { AgentService } from '../../agent/agent.service';
import { SensorData } from '../../common/types/sensor-data.types';

/**
 * 异常检测调度服务
 * 负责定时执行异常检测和基线更新任务
 */
@Injectable()
export class DetectionScheduler {
  private readonly logger = new Logger(DetectionScheduler.name);

  constructor(
    @Inject(DetectionService) private readonly detectionService: DetectionService,
    @Inject(forwardRef(() => AgentService)) private readonly agentService: AgentService,
    @Inject(DATABASE_POOL) private readonly pool: Pool,
  ) {}

  /**
   * 每分钟执行异常检测任务
   * 检测所有活跃设备的最新数据，通过完整的Agent工作流处理
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAnomalyDetection() {
    this.logger.log('Starting scheduled anomaly detection task');
    
    try {
      // 查询所有活跃设备
      const query = `
        SELECT DISTINCT device_id
        FROM sensor_data
        WHERE time > NOW() - INTERVAL '1 hour'
      `;

      const result = await this.pool.query(query);
      const deviceIds = result.rows.map(row => row.device_id);

      this.logger.log(`Detecting anomalies for ${deviceIds.length} active devices`);

      // 为每个设备执行完整的Agent工作流
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

            // 通过Agent工作流执行完整的检测、分析、预警流程
            await this.agentService.executeDetectionWorkflow(deviceId, sensorData);
          }
        } catch (error: any) {
          this.logger.error(`Failed to process device ${deviceId}: ${error.message}`);
          // 继续处理其他设备
        }
      }

      this.logger.log('Completed scheduled anomaly detection task');
    } catch (error: any) {
      this.logger.error(
        `Scheduled anomaly detection task failed: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 每小时执行基线更新任务
   * 更新所有设备的基线统计数据
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleBaselineUpdate() {
    this.logger.log('Starting scheduled baseline update task');
    
    try {
      await this.detectionService.updateAllBaselines();
      this.logger.log('Completed scheduled baseline update task');
    } catch (error: any) {
      this.logger.error(
        `Scheduled baseline update task failed: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 手动触发异常检测（用于测试或手动触发）
   */
  async triggerAnomalyDetection(): Promise<void> {
    this.logger.log('Manually triggered anomaly detection');
    await this.handleAnomalyDetection();
  }

  /**
   * 手动触发基线更新（用于测试或手动触发）
   */
  async triggerBaselineUpdate(): Promise<void> {
    this.logger.log('Manually triggered baseline update');
    await this.handleBaselineUpdate();
  }
}
