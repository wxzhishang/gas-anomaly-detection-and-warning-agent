'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SensorData } from '@/lib/types';

interface SensorChartProps {
  data: SensorData[];
  deviceId: string;
}

export default function SensorChart({ data, deviceId }: SensorChartProps) {
  const option = useMemo(() => {
    // 提取时间和各指标数据
    const timestamps = data.map((d) =>
      new Date(d.time).toLocaleTimeString('zh-CN')
    );
    const inletPressure = data.map((d) => d.inletPressure);
    const outletPressure = data.map((d) => d.outletPressure);
    const temperature = data.map((d) => d.temperature);
    const flowRate = data.map((d) => d.flowRate);

    // 检测屏幕尺寸
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

    return {
      title: {
        text: `设备 ${deviceId} 实时监控`,
        left: 'center',
        textStyle: {
          fontSize: isMobile ? 14 : 16,
          fontWeight: 'bold',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
        },
        confine: true,
      },
      legend: {
        data: ['进口压力 (MPa)', '出口压力 (MPa)', '温度 (°C)', '流量 (m³/h)'],
        top: isMobile ? 25 : 30,
        textStyle: {
          fontSize: isMobile ? 10 : 12,
        },
      },
      grid: {
        left: isMobile ? '5%' : '3%',
        right: isMobile ? '5%' : '4%',
        bottom: isMobile ? '5%' : '3%',
        top: isMobile ? 70 : 80,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          rotate: 45,
          interval: Math.floor(timestamps.length / (isMobile ? 5 : 10)) || 0,
          fontSize: isMobile ? 10 : 12,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '压力/流量',
          position: 'left',
          nameTextStyle: {
            fontSize: isMobile ? 10 : 12,
          },
          axisLabel: {
            fontSize: isMobile ? 10 : 12,
          },
        },
        {
          type: 'value',
          name: '温度',
          position: 'right',
          nameTextStyle: {
            fontSize: isMobile ? 10 : 12,
          },
          axisLabel: {
            fontSize: isMobile ? 10 : 12,
          },
        },
      ],
      series: [
        {
          name: '进口压力 (MPa)',
          type: 'line',
          data: inletPressure,
          smooth: true,
          yAxisIndex: 0,
          lineStyle: {
            width: isMobile ? 1.5 : 2,
          },
          itemStyle: {
            color: '#3b82f6',
          },
        },
        {
          name: '出口压力 (MPa)',
          type: 'line',
          data: outletPressure,
          smooth: true,
          yAxisIndex: 0,
          lineStyle: {
            width: isMobile ? 1.5 : 2,
          },
          itemStyle: {
            color: '#8b5cf6',
          },
        },
        {
          name: '温度 (°C)',
          type: 'line',
          data: temperature,
          smooth: true,
          yAxisIndex: 1,
          lineStyle: {
            width: isMobile ? 1.5 : 2,
          },
          itemStyle: {
            color: '#ef4444',
          },
        },
        {
          name: '流量 (m³/h)',
          type: 'line',
          data: flowRate,
          smooth: true,
          yAxisIndex: 0,
          lineStyle: {
            width: isMobile ? 1.5 : 2,
          },
          itemStyle: {
            color: '#10b981',
          },
        },
      ],
    };
  }, [data, deviceId]);

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-64 sm:h-96">
          <div className="text-center text-gray-500">
            <p>暂无数据</p>
            <p className="text-sm mt-2">等待设备上报数据...</p>
          </div>
        </div>
      ) : (
        <ReactECharts
          option={option}
          style={{ height: '400px', width: '100%' }}
          className="sm:!h-[500px]"
          notMerge={true}
          lazyUpdate={true}
        />
      )}
    </div>
  );
}
