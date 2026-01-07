import {
  Controller,
  Get,
  Param,
  Query,
  Logger,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { AlertService } from './alert.service';
import { AlertLevel } from '../../common/types/anomaly.types';

/**
 * 预警控制器
 * 提供预警查询的REST API端点
 */
@Controller('api/alerts')
export class AlertController {
  private readonly logger = new Logger(AlertController.name);

  constructor(@Inject(AlertService) private readonly alertService: AlertService) {}

  /**
   * GET /api/alerts
   * 查询预警历史
   * 
   * @param level 预警等级（可选）
   * @param startTime 开始时间（ISO 8601格式，可选）
   * @param endTime 结束时间（ISO 8601格式，可选）
   * @param limit 返回数据条数限制（默认100）
   * @param offset 偏移量（默认0）
   * @returns 预警列表
   */
  @Get()
  async queryAlerts(
    @Query('level') level?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      // 验证预警等级
      if (level && !Object.values(AlertLevel).includes(level as AlertLevel)) {
        throw new BadRequestException(
          `Invalid alert level. Must be one of: ${Object.values(AlertLevel).join(', ')}`
        );
      }

      // 解析时间参数
      let start: Date | undefined;
      let end: Date | undefined;

      if (startTime) {
        start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new BadRequestException('Invalid startTime format. Use ISO 8601 format.');
        }
      }

      if (endTime) {
        end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('Invalid endTime format. Use ISO 8601 format.');
        }
      }

      // 解析分页参数
      const limitNum = limit ? parseInt(limit, 10) : 100;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
        throw new BadRequestException('Invalid limit value. Must be between 1 and 1000.');
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        throw new BadRequestException('Invalid offset value. Must be >= 0.');
      }

      // 查询预警
      const alerts = await this.alertService.queryAlerts({
        level: level as AlertLevel,
        startTime: start,
        endTime: end,
        limit: limitNum,
        offset: offsetNum,
      });

      return {
        success: true,
        count: alerts.length,
        limit: limitNum,
        offset: offsetNum,
        data: alerts,
      };
    } catch (error: any) {
      this.logger.error(`Failed to query alerts: ${error.message}`, error.stack);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw error;
    }
  }

  /**
   * GET /api/alerts/:deviceId
   * 查询指定设备的预警历史
   * 
   * @param deviceId 设备ID
   * @param level 预警等级（可选）
   * @param startTime 开始时间（ISO 8601格式，可选）
   * @param endTime 结束时间（ISO 8601格式，可选）
   * @param limit 返回数据条数限制（默认100）
   * @param offset 偏移量（默认0）
   * @returns 预警列表
   */
  @Get(':deviceId')
  async getDeviceAlerts(
    @Param('deviceId') deviceId: string,
    @Query('level') level?: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    try {
      // 验证预警等级
      if (level && !Object.values(AlertLevel).includes(level as AlertLevel)) {
        throw new BadRequestException(
          `Invalid alert level. Must be one of: ${Object.values(AlertLevel).join(', ')}`
        );
      }

      // 解析时间参数
      let start: Date | undefined;
      let end: Date | undefined;

      if (startTime) {
        start = new Date(startTime);
        if (isNaN(start.getTime())) {
          throw new BadRequestException('Invalid startTime format. Use ISO 8601 format.');
        }
      }

      if (endTime) {
        end = new Date(endTime);
        if (isNaN(end.getTime())) {
          throw new BadRequestException('Invalid endTime format. Use ISO 8601 format.');
        }
      }

      // 解析分页参数
      const limitNum = limit ? parseInt(limit, 10) : 100;
      const offsetNum = offset ? parseInt(offset, 10) : 0;

      if (isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
        throw new BadRequestException('Invalid limit value. Must be between 1 and 1000.');
      }

      if (isNaN(offsetNum) || offsetNum < 0) {
        throw new BadRequestException('Invalid offset value. Must be >= 0.');
      }

      // 查询预警
      const alerts = await this.alertService.queryAlerts({
        deviceId,
        level: level as AlertLevel,
        startTime: start,
        endTime: end,
        limit: limitNum,
        offset: offsetNum,
      });

      return {
        success: true,
        deviceId,
        count: alerts.length,
        limit: limitNum,
        offset: offsetNum,
        data: alerts,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to query alerts for device ${deviceId}: ${error.message}`,
        error.stack
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw error;
    }
  }
}
