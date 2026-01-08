'use client';

import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SensorData } from '@/lib/types';

interface SensorChartProps {
  data: SensorData[];
  deviceId: string;
}

export default function SensorChart({ data, deviceId }: SensorChartProps) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  // 压力图表配置
  const pressureOption = useMemo(() => {
    const timestamps = data.map((d) =>
      new Date(d.time).toLocaleTimeString('zh-CN')
    );
    const inletPressure = data.map((d) => d.inletPressure);
    const outletPressure = data.map((d) => d.outletPressure);

    return {
      title: {
        text: `设备 ${deviceId} - 压力监控`,
        left: 'center',
        textStyle: { fontSize: isMobile ? 13 : 14, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        confine: true,
      },
      legend: {
        data: ['进口压力 (MPa)', '出口压力 (MPa)'],
        top: isMobile ? 25 : 28,
        textStyle: { fontSize: isMobile ? 10 : 12 },
      },
      grid: {
        left: isMobile ? '5%' : '3%',
        right: isMobile ? '5%' : '4%',
        bottom: '5%',
        top: isMobile ? 60 : 65,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          rotate: 45,
          interval: Math.floor(timestamps.length / (isMobile ? 5 : 10)) || 0,
          fontSize: isMobile ? 10 : 11,
        },
      },
      yAxis: {
        type: 'value',
        name: '压力 (MPa)',
        nameTextStyle: { fontSize: isMobile ? 10 : 11 },
        axisLabel: { fontSize: isMobile ? 10 : 11 },
      },
      series: [
        {
          name: '进口压力 (MPa)',
          type: 'line',
          data: inletPressure,
          smooth: true,
          lineStyle: { width: isMobile ? 1.5 : 2 },
          itemStyle: { color: '#3b82f6' },
        },
        {
          name: '出口压力 (MPa)',
          type: 'line',
          data: outletPressure,
          smooth: true,
          lineStyle: { width: isMobile ? 1.5 : 2 },
          itemStyle: { color: '#8b5cf6' },
        },
      ],
    };
  }, [data, deviceId, isMobile]);

  // 温度和流量图表配置
  const tempFlowOption = useMemo(() => {
    const timestamps = data.map((d) =>
      new Date(d.time).toLocaleTimeString('zh-CN')
    );
    const temperature = data.map((d) => d.temperature);
    const flowRate = data.map((d) => d.flowRate);

    return {
      title: {
        text: `设备 ${deviceId} - 温度/流量监控`,
        left: 'center',
        textStyle: { fontSize: isMobile ? 13 : 14, fontWeight: 'bold' },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        confine: true,
      },
      legend: {
        data: ['温度 (°C)', '流量 (m³/h)'],
        top: isMobile ? 25 : 28,
        textStyle: { fontSize: isMobile ? 10 : 12 },
      },
      grid: {
        left: isMobile ? '5%' : '3%',
        right: isMobile ? '5%' : '4%',
        bottom: '5%',
        top: isMobile ? 60 : 65,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timestamps,
        axisLabel: {
          rotate: 45,
          interval: Math.floor(timestamps.length / (isMobile ? 5 : 10)) || 0,
          fontSize: isMobile ? 10 : 11,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '温度 (°C)',
          position: 'left',
          nameTextStyle: { fontSize: isMobile ? 10 : 11 },
          axisLabel: { fontSize: isMobile ? 10 : 11 },
          axisLine: { lineStyle: { color: '#ef4444' } },
        },
        {
          type: 'value',
          name: '流量 (m³/h)',
          position: 'right',
          nameTextStyle: { fontSize: isMobile ? 10 : 11 },
          axisLabel: { fontSize: isMobile ? 10 : 11 },
          axisLine: { lineStyle: { color: '#10b981' } },
        },
      ],
      series: [
        {
          name: '温度 (°C)',
          type: 'line',
          data: temperature,
          smooth: true,
          yAxisIndex: 0,
          lineStyle: { width: isMobile ? 1.5 : 2 },
          itemStyle: { color: '#ef4444' },
        },
        {
          name: '流量 (m³/h)',
          type: 'line',
          data: flowRate,
          smooth: true,
          yAxisIndex: 1,
          lineStyle: { width: isMobile ? 1.5 : 2 },
          itemStyle: { color: '#10b981' },
        },
      ],
    };
  }, [data, deviceId, isMobile]);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <div className="flex items-center justify-center h-64 sm:h-96">
          <div className="text-center text-gray-500">
            <p>暂无数据</p>
            <p className="text-sm mt-2">等待设备上报数据...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <ReactECharts
          option={pressureOption}
          style={{ height: '280px', width: '100%' }}
          className="sm:!h-[320px]"
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
      <div className="bg-white rounded-lg shadow p-3 sm:p-4">
        <ReactECharts
          option={tempFlowOption}
          style={{ height: '280px', width: '100%' }}
          className="sm:!h-[320px]"
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
