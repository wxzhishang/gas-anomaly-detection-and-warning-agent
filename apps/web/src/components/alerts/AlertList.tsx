'use client';

import { cn, formatRelativeTime } from '@/lib/utils';
import type { Alert } from '@/lib/types';

interface AlertListProps {
  alerts: Alert[];
}

export default function AlertList({ alerts }: AlertListProps) {
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
    <div className="bg-white rounded-lg shadow h-full flex flex-col max-h-[600px] lg:max-h-none">
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">预警列表</h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">共 {alerts.length} 条预警</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="px-3 sm:px-4 py-6 sm:py-8 text-center text-gray-500">
            <p className="text-sm sm:text-base">暂无预警</p>
            <p className="text-xs sm:text-sm mt-2">系统运行正常</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {alerts.map((alert) => {
              const maxZScore = alert.anomalies?.reduce((max, a) => Math.max(max, a.zScore), 0) || 0;
              
              return (
                <div key={alert.id} className="px-3 sm:px-4 py-2 sm:py-3 hover:bg-gray-50">
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
                          <p className="break-words">{alert.rootCause.cause}</p>
                          {alert.rootCause.recommendation && (
                            <div className="mt-1">
                              <p className="font-medium">处理建议:</p>
                              <p className="break-words">{alert.rootCause.recommendation}</p>
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
    </div>
  );
}
