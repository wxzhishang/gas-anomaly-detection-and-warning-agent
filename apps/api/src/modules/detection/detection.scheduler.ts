import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DetectionService } from './detection.service';

/**
 * 异常检测调度服务
 * 负责定时执行异常检测和基线更新任务
 */
@Injectable()
export class DetectionScheduler {
  private readonly logger = new Logger(DetectionScheduler.name);

  constructor(private readonly detectionService: DetectionService) {}

  /**
   * 每分钟执行异常检测任务
   * 检测所有活跃设备的最新数据
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleAnomalyDetection() {
    this.logger.log('Starting scheduled anomaly detection task');
    
    try {
      await this.detectionService.detectAllDevices();
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
