'use client';

import { Alert } from '@/lib/types';
import { cn, formatRelativeTime } from '@/lib/utils';
import { formatText } from '@/lib/formatText';

interface AlertDetailModalProps {
  alert: Alert | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AlertDetailModal({ alert, isOpen, onClose }: AlertDetailModalProps) {
  if (!isOpen || !alert) return null;

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
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

  const getMetricName = (metric: string) => {
    const metricMap: Record<string, string> = {
      inletPressure: '进口压力',
      outletPressure: '出口压力',
      temperature: '温度',
      flowRate: '流量',
    };
    return metricMap[metric] || metric;
  };

  const getMetricUnit = (metric: string) => {
    const unitMap: Record<string, string> = {
      inletPressure: 'MPa',
      outletPressure: 'MPa',
      temperature: '°C',
      flowRate: 'm³/h',
    };
    return unitMap[metric] || '';
  };

  const maxZScore = alert.anomalies?.reduce((max, a) => Math.max(max, a.zScore), 0) || 0;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-900">预警详情</h3>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded text-sm font-medium border',
                  getLevelColor(alert.level)
                )}
              >
                {getLevelText(alert.level)}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* 基本信息 */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">基本信息</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">预警ID</p>
                  <p className="text-sm font-medium text-gray-900">#{alert.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">设备ID</p>
                  <p className="text-sm font-medium text-gray-900">{alert.deviceId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">触发时间</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(alert.createdAt).toLocaleString('zh-CN')}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatRelativeTime(alert.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">预警等级</p>
                  <p className="text-sm font-medium text-gray-900">{getLevelText(alert.level)}</p>
                </div>
              </div>
            </div>

            {/* 预警消息 */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">预警消息</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-900">
                  {formatText(alert.message)}
                </div>
              </div>
            </div>

            {/* 异常指标详情 */}
            {alert.anomalies && alert.anomalies.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">异常指标详情</h4>
                <div className="bg-blue-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-700">检测到 {alert.anomalies.length} 个异常指标</span>
                    <span className="text-blue-900 font-medium">最大Z-Score: {maxZScore.toFixed(2)}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {alert.anomalies.map((anomaly, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-sm font-medium text-gray-900">
                          {getMetricName(anomaly.metric)}
                        </h5>
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            anomaly.zScore > 3
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          )}
                        >
                          Z-Score: {anomaly.zScore.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div>
                          <p className="text-gray-500 mb-1">当前值</p>
                          <p className="font-medium text-gray-900">
                            {anomaly.value.toFixed(2)} {getMetricUnit(anomaly.metric)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">基线值</p>
                          <p className="font-medium text-gray-900">
                            {anomaly.baseline.toFixed(2)} {getMetricUnit(anomaly.metric)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 mb-1">偏差</p>
                          <p className={cn(
                            'font-medium',
                            anomaly.deviation > 0 ? 'text-red-600' : 'text-blue-600'
                          )}>
                            {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(2)} {getMetricUnit(anomaly.metric)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 根因分析 */}
            {alert.rootCause && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">根因分析</h4>
                <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-500">分析结果</p>
                      <span className="text-xs text-gray-500">
                        置信度: {(alert.rootCause.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-900">
                      {formatText(alert.rootCause.cause)}
                    </div>
                  </div>

                  {alert.rootCause.recommendation && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">处理建议</p>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-900">
                          {formatText(alert.rootCause.recommendation)}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>分析方法: {alert.rootCause.method}</span>
                    {alert.rootCause.ruleId && (
                      <span>规则ID: {alert.rootCause.ruleId}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部操作栏 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
