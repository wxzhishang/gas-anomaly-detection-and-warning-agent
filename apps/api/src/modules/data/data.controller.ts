import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { DataService } from './data.service';
import { SensorDataDto } from '../../common/types/sensor-data.types';

/**
 * 数据采集控制器
 * 提供传感器数据接收和查询的REST API端点
 */
@Controller('api/data')
export class DataController {
  private readonly logger = new Logger(DataController.name);

  constructor(private readonly dataService: DataService) {}

  /**
   * POST /api/data
   * 接收传感器数据
   * 
   * @param data 传感器数据DTO
   * @returns 存储的传感器数据
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async receiveSensorData(@Body() data: SensorDataDto) {
    try {
      // 验证必填字段
      if (!data.deviceId) {
        throw new BadRequestException('deviceId is required');
      }
      if (data.inletPressure === undefined || data.inletPressure === null) {
        throw new BadRequestException('inletPressure is required');
      }
      if (data.outletPressure === undefined || data.outletPressure === null) {
        throw new BadRequestException('outletPressure is required');
      }
      if (data.temperature === undefined || data.temperature === null) {
        throw new BadRequestException('temperature is required');
      }
      if (data.flowRate === undefined || data.flowRate === null) {
        throw new BadRequestException('flowRate is required');
      }

      const result = await this.dataService.receiveSensorData(data);
      
      this.logger.log(`Received sensor data from device ${data.deviceId}`);
      
      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error(`Failed to receive sensor data: ${error.message}`, error.stack);
      
      if (error.message.includes('Validation failed')) {
        throw new BadRequestException(error.message);
      }
      
      throw error;
    }
  }

  /**
   * GET /api/data/:deviceId
   * 查询指定设备的历史数据
   * 
   * @param deviceId 设备ID
   * @param startTime 开始时间（ISO 8601格式）
   * @param endTime 结束时间（ISO 8601格式）
   * @param limit 返回数据条数限制（默认1000）
   * @returns 传感器数据数组
   */
  @Get(':deviceId')
  async getDeviceData(
    @Param('deviceId') deviceId: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      // 如果提供了时间范围，使用历史数据查询
      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          throw new BadRequestException('Invalid date format. Use ISO 8601 format.');
        }
        
        const data = await this.dataService.queryHistoricalData(deviceId, start, end);
        
        return {
          success: true,
          deviceId,
          startTime: start,
          endTime: end,
          count: data.length,
          data,
        };
      }
      
      // 否则返回最近的N条数据
      const limitNum = limit ? parseInt(limit, 10) : 1000;
      
      if (isNaN(limitNum) || limitNum <= 0) {
        throw new BadRequestException('Invalid limit value');
      }
      
      const data = await this.dataService.getRecentData(deviceId, limitNum);
      
      return {
        success: true,
        deviceId,
        count: data.length,
        data,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get device data: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw error;
    }
  }
}
