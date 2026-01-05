import {
  Controller,
  Get,
  Logger,
} from '@nestjs/common';
import { DataService } from './data.service';

/**
 * 设备管理控制器
 * 提供设备查询的REST API端点
 */
@Controller('api/devices')
export class DevicesController {
  private readonly logger = new Logger(DevicesController.name);

  constructor(private readonly dataService: DataService) {}

  /**
   * GET /api/devices
   * 获取所有设备列表
   * 
   * @returns 设备数组
   */
  @Get()
  async getAllDevices() {
    try {
      const devices = await this.dataService.getAllDevices();
      
      return {
        success: true,
        count: devices.length,
        data: devices,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get all devices: ${error.message}`, error.stack);
      throw error;
    }
  }
}
