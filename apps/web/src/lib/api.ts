import type { Alert, Device, SensorData } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API客户端类
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('API请求错误:', error);
      throw error;
    }
  }

  /**
   * 获取所有设备列表
   */
  async getDevices(): Promise<Device[]> {
    const response = await this.request<{ success: boolean; count: number; data: Device[] }>('/api/devices');
    return response.data;
  }

  /**
   * 获取设备历史数据
   */
  async getDeviceData(
    deviceId: string,
    params?: {
      startTime?: string;
      endTime?: string;
      limit?: number;
    }
  ): Promise<SensorData[]> {
    const queryParams = new URLSearchParams();
    if (params?.startTime) queryParams.append('startTime', params.startTime);
    if (params?.endTime) queryParams.append('endTime', params.endTime);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const endpoint = `/api/data/${deviceId}${query ? `?${query}` : ''}`;
    
    const response = await this.request<{ success: boolean; deviceId: string; count: number; data: SensorData[] }>(endpoint);
    return response.data;
  }

  /**
   * 获取所有预警
   */
  async getAlerts(params?: {
    level?: string;
    startTime?: string;
    endTime?: string;
    page?: number;
    limit?: number;
  }): Promise<Alert[]> {
    const queryParams = new URLSearchParams();
    if (params?.level) queryParams.append('level', params.level);
    if (params?.startTime) queryParams.append('startTime', params.startTime);
    if (params?.endTime) queryParams.append('endTime', params.endTime);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    const endpoint = `/api/alerts${query ? `?${query}` : ''}`;
    
    const response = await this.request<{ success: boolean; count: number; limit: number; offset: number; data: Alert[] }>(endpoint);
    return response.data;
  }

  /**
   * 获取设备的预警历史
   */
  async getDeviceAlerts(deviceId: string): Promise<Alert[]> {
    const response = await this.request<{ success: boolean; deviceId: string; count: number; limit: number; offset: number; data: Alert[] }>(`/api/alerts/${deviceId}`);
    return response.data;
  }
}

export const apiClient = new ApiClient(API_URL);
