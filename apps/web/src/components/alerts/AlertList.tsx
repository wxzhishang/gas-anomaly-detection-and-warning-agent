'use client';

import { useState, useEffect } from 'react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { Alert } from '@/lib/types';
import AlertDetailModal from './AlertDetailModal';

interface AlertListProps {
  alerts: Alert[];
  selectedDevice?: string | null;
}

// TODO: 当预警数量较大时（>100），考虑实现虚拟列表优化性能
export default function AlertList({ alerts, selectedDevice }: AlertListProps) {
  const [listHeight, setListHeight] = useState(400);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedAlert(null), 300);
  };

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

  // 根据选中的设备过滤预警
  const filteredAlerts = selectedDevice
    ? alerts.filter((alert) => alert.deviceId === selectedDevice)
    : alerts;

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelText = (level: string) => {
    switch (level.toLowerCase()) {
      case 'warning':
        return '警告';
      case 'critical':
        return '严重';
      default:
        return '未知';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 flex-shrink-0">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">预警列表</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          {selectedDevice ? `设备 ${selectedDevice} 的预警` : '全部预警'} · 共 {filteredAlerts.length} 条
        </p>
      </div>

      <div 
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: listHeight }}
      >
        {filteredAlerts.length === 0 ? (
          <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500">
            <p className="text-sm sm:text-base">暂无预警</p>
            <p className="text-xs sm:text-sm mt-2">
              {selectedDevice ? '该设备运行正常' : '系统运行正常'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredAlerts.map((alert) => {
              const maxZScore = alert.anomalies?.reduce((max, a) => Math.max(max, a.zScore), 0) || 0;
              
              return (
                <div 
                  key={alert.id} 
                  className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleAlertClick(alert)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
                            getLevelColor(alert.level)
                          )}
                        >
                          {getLevelText(alert.level)}
                        </span>
                        <span className="text-xs text-gray-500 truncate">
                          {alert.deviceId}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1">
                        {alert.message}
                      </p>

                      {alert.rootCause && (
                        <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                          <p className="font-medium mb-1">根因分析:</p>
                          <p className="break-words line-clamp-2">{alert.rootCause.cause}</p>
                          {alert.rootCause.recommendation && (
                            <div className="mt-1">
                              <p className="font-medium">处理建议:</p>
                              <p className="break-words line-clamp-2">{alert.rootCause.recommendation}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {alert.anomalies && alert.anomalies.length > 0 && (
                        <div className="mt-2 flex items-center gap-2 sm:gap-3 text-xs text-gray-400 flex-wrap">
                          <span>异常指标: {alert.anomalies.length}</span>
                          <span>最大Z-Score: {maxZScore.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="mt-1 text-xs text-gray-400">
                        {formatRelativeTime(alert.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
