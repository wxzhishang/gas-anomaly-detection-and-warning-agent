import { Injectable, Inject, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../../common/database/database.module';
import {
  Alert,
  CreateAlertDto,
  AlertQueryParams,
} from '../../common/types/alert.types';
import {
  AnomalyResult,
  Anomaly,
  AlertLevel,
} from '../../common/types/anomaly.types';
import { RootCauseResult } from '../../common/types/analysis.types';

/**
 * 预警服务
 * 负责预警生成、等级判定、存储和查询
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);
  private alertGateway: any; // 延迟注入,避免循环依赖

  constructor(
    @Inject(DATABASE_POOL)
    private readonly pool: Pool,
  ) {}

  /**
   * 设置AlertGateway(用于避免循环依赖)
   */
  setAlertGateway(gateway: any) {
    this.alertGateway = gateway;
  }

  /**
   * 更新设备状态
   * 根据预警等级更新设备状态
   */
  private async updateDeviceStatus(deviceId: string, alertLevel: AlertLevel): Promise<void> {
    const status = alertLevel === AlertLevel.CRITICAL ? 'critical' : 'warning';
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
      // 不抛出错误，避免影响预警创建
    }
  }

  /**
   * 创建预警
   * 根据异常检测结果和根因分析结果生成预警记录
   * 
   * @param deviceId 设备ID
   * @param anomalyResult 异常检测结果
   * @param rootCause 根因分析结果
   * @returns 创建的预警记录
   */
  async createAlert(
    deviceId: string,
    anomalyResult: AnomalyResult,
    rootCause: RootCauseResult,
  ): Promise<Alert> {
    try {
      // 判定预警等级
      const level = this.determineAlertLevel(anomalyResult.anomalies);

      // 生成预警消息
      const message = this.generateAlertMessage(anomalyResult.anomalies, rootCause);

      // 存储到数据库
      const query = `
        INSERT INTO alerts (device_id, level, message, anomalies, root_cause, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, device_id, level, message, anomalies, root_cause, created_at
      `;

      const values = [
        deviceId,
        level,
        message,
        JSON.stringify(anomalyResult.anomalies),
        JSON.stringify(rootCause),
        anomalyResult.timestamp,
      ];

      const result = await this.pool.query(query, values);
      const row = result.rows[0];

      const alert: Alert = {
        id: row.id,
        deviceId: row.device_id,
        level: row.level as AlertLevel,
        message: row.message,
        anomalies: row.anomalies,
        rootCause: row.root_cause,
        createdAt: row.created_at,
      };

      // 更新设备状态
      await this.updateDeviceStatus(deviceId, level);

      this.logger.log(
        `Created alert for device ${deviceId} with level ${level}`,
      );

      return alert;
    } catch (error: any) {
      this.logger.error(
        `Failed to create alert: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * 判定预警等级
   * 规则：异常指标数量>2 或 最大Z-Score>5 则为严重，否则为警告
   * 
   * @param anomalies 异常列表
   * @returns 预警等级
   */
  determineAlertLevel(anomalies: Anomaly[]): AlertLevel {
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
   * 生成预警消息
   * 
   * @param anomalies 异常列表
   * @param rootCause 根因分析结果
   * @returns 预警消息文本
   */
  private generateAlertMessage(
    anomalies: Anomaly[],
    rootCause: RootCauseResult,
  ): string {
    const metricNames: Record<string, string> = {
      inletPressure: '进口压力',
      outletPressure: '出口压力',
      temperature: '温度',
      flowRate: '流量',
    };

    const anomalyDescriptions = anomalies.map(a => {
      const name = metricNames[a.metric] || a.metric;
      return `${name}异常(Z-Score: ${a.zScore.toFixed(2)})`;
    });

    return `检测到${anomalyDescriptions.join('、')}。${rootCause.cause}`;
  }

  /**
   * 推送预警
   * 通过WebSocket广播预警到所有连接的客户端
   * 
   * @param alert 预警记录
   */
  async pushAlert(alert: Alert): Promise<void> {
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`📤 pushAlert 被调用`);
    this.logger.log(`   预警ID: ${alert.id}`);
    this.logger.log(`   设备: ${alert.deviceId}`);
    this.logger.log(`   alertGateway 是否存在: ${!!this.alertGateway}`);
    
    if (this.alertGateway) {
      this.alertGateway.broadcastAlert(alert);
      this.logger.log(`✅ 预警 ${alert.id} 已通过 WebSocket 推送`);
    } else {
      this.logger.warn('❌ AlertGateway 未初始化，跳过推送');
    }
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  }

  /**
   * 查询预警历史
   * 支持按设备ID、预警等级、时间范围查询
   * 
   * @param params 查询参数
   * @returns 预警列表
   */
  async queryAlerts(params: AlertQueryParams = {}): Promise<Alert[]> {
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 构建查询条件
      if (params.deviceId) {
        conditions.push(`device_id = $${paramIndex++}`);
        values.push(params.deviceId);
      }

      if (params.level) {
        conditions.push(`level = $${paramIndex++}`);
        values.push(params.level);
      }

      if (params.startTime) {
        conditions.push(`created_at >= $${paramIndex++}`);
        values.push(params.startTime);
      }

      if (params.endTime) {
        conditions.push(`created_at <= $${paramIndex++}`);
        values.push(params.endTime);
      }

      const whereClause = conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

      const limit = params.limit || 100;
      const offset = params.offset || 0;

      const query = `
        SELECT id, device_id, level, message, anomalies, root_cause, created_at
        FROM alerts
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++}
        OFFSET $${paramIndex++}
      `;

      values.push(limit, offset);

      const result = await this.pool.query(query, values);

      const alerts: Alert[] = result.rows.map(row => ({
        id: row.id,
        deviceId: row.device_id,
        level: row.level as AlertLevel,
        message: row.message,
        anomalies: row.anomalies,
        rootCause: row.root_cause,
        createdAt: row.created_at,
      }));

      this.logger.debug(`Queried ${alerts.length} alerts`);

      return alerts;
    } catch (error: any) {
      this.logger.error(
        `Failed to query alerts: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
