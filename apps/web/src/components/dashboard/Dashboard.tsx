'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { apiClient } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { SensorData, Alert, Device, WebSocketMessage } from '@/lib/types';
import DeviceList from './DeviceList';
import SensorChart from './SensorChart';
import AlertList from '../alerts/AlertList';
import { DeviceListSkeleton, ChartSkeleton, AlertListSkeleton } from '../ui/Skeleton';
import { ErrorAlert } from '../ui/ErrorAlert';

export default function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // WebSocket消息处理
  const handleMessage = useCallback((message: WebSocketMessage) => {
    console.log('[Dashboard] 收到WebSocket消息:', message.type, message);
    
    if (message.type === 'sensor_data') {
      const data = message.data;
      
      // 只更新当前选中设备的传感器数据
      if (data.deviceId === selectedDevice) {
        setSensorData((prev) => {
          const newData = [...prev, data];
          return newData.slice(-3600); // 保持最多3600个点
        });
      }

      // 只更新设备的最后更新时间，不改变状态
      // 状态由 device_status 消息或预警消息来更新
      setDevices((prev) =>
        prev.map((device) =>
          device.id === data.deviceId
            ? { ...device, updatedAt: data.time }
            : device
        )
      );
    } else if (message.type === 'alert') {
      console.log('[Dashboard] 📢 收到新预警，添加到列表:', message.data);
      // 在列表头部插入新预警
      setAlerts((prev) => {
        const newAlerts = [message.data, ...prev];
        console.log('[Dashboard] 更新后的预警列表长度:', newAlerts.length);
        return newAlerts;
      });
      
      // 根据预警等级更新设备状态
      const alertData = message.data;
      setDevices((prev) =>
        prev.map((device) =>
          device.id === alertData.deviceId
            ? { ...device, status: alertData.level, updatedAt: new Date().toISOString() }
            : device
        )
      );
    } else if (message.type === 'device_status') {
      // 更新设备状态
      const { deviceId, status, updatedAt } = message.data;
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId
            ? { ...device, status, updatedAt: updatedAt || new Date().toISOString() }
            : device
        )
      );
    }
  }, [selectedDevice]);

  const { isConnected, error: wsError } = useWebSocket({
    onMessage: handleMessage,
    autoConnect: true,
    onReconnecting: () => setReconnecting(true),
    onReconnected: () => setReconnecting(false),
  });

  // 加载初始数据（只在组件挂载时执行一次）
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 加载设备列表
        const devicesData = await apiClient.getDevices();
        setDevices(devicesData);

        // 如果有设备，选择第一个
        if (devicesData.length > 0) {
          setSelectedDevice(devicesData[0].id);
        }

        // 加载预警历史
        const alertsData = await apiClient.getAlerts({ limit: 50 });
        setAlerts(alertsData);
      } catch (err) {
        console.error('加载初始数据失败:', err);
        setError(err instanceof Error ? err.message : '加载数据失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // 加载选中设备的历史数据
  useEffect(() => {
    if (!selectedDevice) return;

    const loadDeviceData = async () => {
      try {
        setDataLoading(true);
        const data = await apiClient.getDeviceData(selectedDevice, {
          limit: 100,
        });
        setSensorData(data.reverse()); // 按时间正序排列
      } catch (err) {
        console.error('加载设备数据失败:', err);
        // 不设置全局错误，只在控制台记录
      } finally {
        setDataLoading(false);
      }
    };

    loadDeviceData();
  }, [selectedDevice]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  燃气调压器异常检测系统
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  基于AI Agent的实时监控和异常检测
                </p>
              </div>
            </div>
          </div>
        </header>
        <div className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="md:col-span-2 lg:col-span-1">
              <DeviceListSkeleton />
            </div>
            <div className="md:col-span-2 lg:col-span-2">
              <ChartSkeleton />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <AlertListSkeleton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <ErrorAlert
            title="系统初始化失败"
            message={error}
            onRetry={handleRetry}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                燃气调压器异常检测系统
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                基于AI Agent的实时监控和异常检测
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm',
                  isConnected
                    ? 'bg-green-100 text-green-700'
                    : reconnecting
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                )}
              >
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected
                      ? 'bg-green-500'
                      : reconnecting
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  )}
                />
                {isConnected ? '已连接' : reconnecting ? '重连中...' : '未连接'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* 左侧：设备列表 */}
          <div className="md:col-span-2 lg:col-span-1 order-1">
            <DeviceList
              devices={devices}
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
            />
          </div>

          {/* 中间：图表 */}
          <div className="md:col-span-2 lg:col-span-2 order-3 lg:order-2">
            <SensorChart
              data={sensorData}
              deviceId={selectedDevice || ''}
            />
          </div>

          {/* 右侧：预警列表 */}
          <div className="md:col-span-2 lg:col-span-1 order-2 lg:order-3">
            <AlertList alerts={alerts} selectedDevice={selectedDevice} />
          </div>
        </div>
      </div>

      {/* WebSocket错误提示 */}
      {wsError && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="text-sm">WebSocket连接错误: {wsError}</p>
        </div>
      )}
    </div>
  );
}
