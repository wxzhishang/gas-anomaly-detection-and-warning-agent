'use client';

import { useState, useEffect } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Device } from '@/lib/types';

interface DeviceListProps {
  devices: Device[];
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string) => void;
}

// TODO: 当设备数量较大时（>100），考虑实现虚拟列表优化性能
export default function DeviceList({
  devices,
  selectedDevice,
  onSelectDevice,
}: DeviceListProps) {
  const [listHeight, setListHeight] = useState(400);

  // 根据窗口高度动态计算列表高度
  useEffect(() => {
    const updateHeight = () => {
      const availableHeight = window.innerHeight - 200;
      setListHeight(Math.max(300, availableHeight));
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
        return 'bg-red-500';
      case 'offline':
      case 'inactive':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
        return '正常';
      case 'warning':
        return '警告';
      case 'critical':
        return '严重';
      case 'offline':
      case 'inactive':
        return '离线';
      default:
        return '未知';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">设备列表</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">共 {devices.length} 台设备</p>
      </div>

      <div 
        className="divide-y divide-gray-200 overflow-y-auto flex-1"
        style={{ maxHeight: listHeight }}
      >
        {devices.length === 0 ? (
          <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500">
            <p className="text-sm sm:text-base">暂无设备</p>
          </div>
        ) : (
          devices.map((device) => (
            <button
              key={device.id}
              onClick={() => onSelectDevice(device.id)}
              className={cn(
                'w-full px-3 sm:px-4 py-2 sm:py-3 text-left hover:bg-gray-50 transition-colors',
                selectedDevice === device.id && 'bg-blue-50'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        getStatusColor(device.status)
                      )}
                    />
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {device.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {device.id}
                  </p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  <span
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      (device.status.toLowerCase() === 'active' || device.status.toLowerCase() === 'online') && 'bg-green-100 text-green-800',
                      device.status.toLowerCase() === 'warning' && 'bg-yellow-100 text-yellow-800',
                      device.status.toLowerCase() === 'critical' && 'bg-red-100 text-red-800',
                      (device.status.toLowerCase() === 'offline' || device.status.toLowerCase() === 'inactive') && 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {getStatusText(device.status)}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs text-gray-400">
                更新于 {formatRelativeTime(device.updatedAt)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
