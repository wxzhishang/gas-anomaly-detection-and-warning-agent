import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { Alert } from '../../common/types/alert.types';
import { SensorData } from '../../common/types/sensor-data.types';
import {
  WebSocketMessageType,
  AlertMessage,
  SensorDataMessage,
  ConnectionMessage,
} from '../../common/types/websocket.types';
import { AlertService } from './alert.service';

/**
 * WebSocket网关
 * 负责管理WebSocket连接和实时消息推送
 */
@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境应该配置具体的域名
    credentials: true,
  },
  namespace: '/',
})
export class AlertGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(AlertGateway.name);
  private readonly connectedClients = new Map<string, Socket>();

  constructor(
    @Inject(forwardRef(() => AlertService))
    private readonly alertService: AlertService,
  ) {}

  /**
   * 模块初始化时设置AlertService的gateway引用
   */
  onModuleInit() {
    this.logger.log('Setting AlertGateway reference in AlertService');
    if (this.alertService && typeof this.alertService.setAlertGateway === 'function') {
      this.alertService.setAlertGateway(this);
      this.logger.log('✅ AlertGateway reference set successfully');
    } else {
      this.logger.error('❌ Failed to set AlertGateway reference - AlertService not available');
    }
  }

  /**
   * 网关初始化
   */
  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * 处理客户端连接
   * 记录连接ID并发送连接确认消息
   */
  handleConnection(client: Socket) {
    const clientId = client.id;
    this.connectedClients.set(clientId, client);

    this.logger.log(
      `Client connected: ${clientId}. Total clients: ${this.connectedClients.size}`,
    );

    // 发送连接确认消息
    const connectionMessage: ConnectionMessage = {
      type: WebSocketMessageType.CONNECTION,
      data: {
        clientId,
        connectedAt: new Date(),
      },
    };

    client.emit('connection', connectionMessage);
  }

  /**
   * 处理客户端断开
   * 清理连接记录
   */
  handleDisconnect(client: Socket) {
    const clientId = client.id;
    this.connectedClients.delete(clientId);

    this.logger.log(
      `Client disconnected: ${clientId}. Total clients: ${this.connectedClients.size}`,
    );
  }

  /**
   * 广播传感器数据到所有连接的客户端
   * 
   * @param data 传感器数据
   */
  broadcastSensorData(data: SensorData): void {
    const message: SensorDataMessage = {
      type: WebSocketMessageType.SENSOR_DATA,
      data,
    };

    this.logger.debug(
      `Broadcasting sensor data for device ${data.deviceId} to ${this.connectedClients.size} clients`,
    );

    // 广播到所有客户端
    this.server.emit('sensor-data', message);
  }

  /**
   * 广播预警到所有连接的客户端
   * 自动移除失效连接
   * 
   * @param alert 预警记录
   */
  broadcastAlert(alert: Alert): void {
    const message: AlertMessage = {
      type: WebSocketMessageType.ALERT,
      data: alert,
    };

    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    this.logger.log(`📢 广播预警到 WebSocket 客户端`);
    this.logger.log(`   设备: ${alert.deviceId}`);
    this.logger.log(`   等级: ${alert.level}`);
    this.logger.log(`   消息: ${alert.message}`);
    this.logger.log(`   连接客户端数: ${this.connectedClients.size}`);

    // 记录失效的连接
    const failedClients: string[] = [];

    // 遍历所有连接的客户端
    this.connectedClients.forEach((client, clientId) => {
      try {
        // 检查连接是否有效
        if (!client.connected) {
          failedClients.push(clientId);
          return;
        }

        // 发送预警消息
        client.emit('alert', message);
      } catch (error) {
        this.logger.error(
          `Failed to send alert to client ${clientId}: ${error instanceof Error ? error.message : String(error)}`,
        );
        failedClients.push(clientId);
      }
    });

    // 清理失效连接
    if (failedClients.length > 0) {
      this.logger.warn(
        `Removing ${failedClients.length} failed connections`,
      );
      failedClients.forEach((clientId) => {
        this.connectedClients.delete(clientId);
      });
    }

    this.logger.log(`✅ 预警广播完成`);
    this.logger.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // 广播设备状态更新
    this.broadcastDeviceStatusUpdate(alert.deviceId, alert.level);
  }

  /**
   * 广播设备状态更新到所有连接的客户端
   * 
   * @param deviceId 设备ID
   * @param status 新状态
   */
  broadcastDeviceStatusUpdate(deviceId: string, status: string): void {
    const message = {
      type: WebSocketMessageType.DEVICE_STATUS,
      data: {
        deviceId,
        status,
        updatedAt: new Date(),
      },
    };

    this.logger.log(
      `Broadcasting device status update for ${deviceId} (status: ${status}) to ${this.connectedClients.size} clients`,
    );

    this.server.emit('device-status', message);
  }

  /**
   * 获取当前连接的客户端数量
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * 获取所有连接的客户端ID列表
   */
  getConnectedClientIds(): string[] {
    return Array.from(this.connectedClients.keys());
  }
}
