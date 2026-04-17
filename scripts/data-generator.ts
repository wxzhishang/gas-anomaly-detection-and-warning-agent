#!/usr/bin/env bun

/**
 * 燃气调压器传感器数据生成器
 * 用于测试和演示系统功能
 */

interface SensorData {
  deviceId: string;
  timestamp?: string;
  inletPressure: number;
  outletPressure: number;
  temperature: number;
  flowRate: number;
}

interface GeneratorConfig {
  apiUrl: string;
  deviceId: string;
  interval: number; // 发送间隔（毫秒）
  anomalyProbability: number; // 异常数据概率 (0-1)
  anomalyType?: 'low-pressure' | 'high-temperature' | 'high-flow' | 'random' | 'multi';
}

// 正常数据范围
const NORMAL_RANGES = {
  inletPressure: { min: 0.25, max: 0.35, mean: 0.3, std: 0.02 },
  outletPressure: { min: 2.3, max: 2.7, mean: 2.5, std: 0.1 },
  temperature: { min: 18, max: 28, mean: 23, std: 2 },
  flowRate: { min: 450, max: 550, mean: 500, std: 20 },
};

// 异常数据配置
interface AnomalyConfig {
  outletPressure?: { min: number; max: number; mean: number; std: number };
  temperature?: { min: number; max: number; mean: number; std: number };
  flowRate?: { min: number; max: number; mean: number; std: number };
}

const ANOMALY_CONFIGS: Record<'low-pressure' | 'high-temperature' | 'high-flow', AnomalyConfig> = {
  'low-pressure': {
    outletPressure: { min: 0.8, max: 1.2, mean: 1.0, std: 0.1 },
  },
  'high-temperature': {
    temperature: { min: 55, max: 65, mean: 60, std: 2 },
  },
  'high-flow': {
    flowRate: { min: 1400, max: 1600, mean: 1500, std: 50 },
  },
};

/**
 * 生成符合正态分布的随机数
 */
function normalRandom(mean: number, std: number): number {
  // Box-Muller变换
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * std;
}

/**
 * 生成正常传感器数据
 */
function generateNormalData(deviceId: string): SensorData {
  return {
    deviceId,
    timestamp: new Date().toISOString(),
    inletPressure: Math.max(
      NORMAL_RANGES.inletPressure.min,
      Math.min(
        NORMAL_RANGES.inletPressure.max,
        normalRandom(NORMAL_RANGES.inletPressure.mean, NORMAL_RANGES.inletPressure.std)
      )
    ),
    outletPressure: Math.max(
      NORMAL_RANGES.outletPressure.min,
      Math.min(
        NORMAL_RANGES.outletPressure.max,
        normalRandom(NORMAL_RANGES.outletPressure.mean, NORMAL_RANGES.outletPressure.std)
      )
    ),
    temperature: Math.max(
      NORMAL_RANGES.temperature.min,
      Math.min(
        NORMAL_RANGES.temperature.max,
        normalRandom(NORMAL_RANGES.temperature.mean, NORMAL_RANGES.temperature.std)
      )
    ),
    flowRate: Math.max(
      NORMAL_RANGES.flowRate.min,
      Math.min(
        NORMAL_RANGES.flowRate.max,
        normalRandom(NORMAL_RANGES.flowRate.mean, NORMAL_RANGES.flowRate.std)
      )
    ),
  };
}

/**
 * 生成异常传感器数据
 */
function generateAnomalyData(
  deviceId: string,
  anomalyType: 'low-pressure' | 'high-temperature' | 'high-flow' | 'random' | 'multi'
): SensorData {
  const data = generateNormalData(deviceId);
  
  // 多指标异常模式：随机组合2-3个异常
  if (anomalyType === 'multi') {
    const anomalyTypes: Array<'low-pressure' | 'high-temperature' | 'high-flow'> = [
      'low-pressure',
      'high-temperature',
      'high-flow',
    ];
    
    // 随机选择2-3个异常类型
    const numAnomalies = Math.random() > 0.5 ? 2 : 3;
    const shuffled = anomalyTypes.sort(() => Math.random() - 0.5);
    const selectedTypes = shuffled.slice(0, numAnomalies);
    
    // 应用所有选中的异常类型
    selectedTypes.forEach(type => {
      const config = ANOMALY_CONFIGS[type];
      if (config.outletPressure) {
        data.outletPressure = normalRandom(config.outletPressure.mean, config.outletPressure.std);
      }
      if (config.temperature) {
        data.temperature = normalRandom(config.temperature.mean, config.temperature.std);
      }
      if (config.flowRate) {
        data.flowRate = normalRandom(config.flowRate.mean, config.flowRate.std);
      }
    });
    
    return data;
  }
  
  // 随机选择异常类型
  if (anomalyType === 'random') {
    const types: Array<'low-pressure' | 'high-temperature' | 'high-flow'> = [
      'low-pressure',
      'high-temperature',
      'high-flow',
    ];
    anomalyType = types[Math.floor(Math.random() * types.length)];
  }

  const config = ANOMALY_CONFIGS[anomalyType];
  
  // 应用异常配置
  if (config.outletPressure) {
    data.outletPressure = normalRandom(config.outletPressure.mean, config.outletPressure.std);
  }
  if (config.temperature) {
    data.temperature = normalRandom(config.temperature.mean, config.temperature.std);
  }
  if (config.flowRate) {
    data.flowRate = normalRandom(config.flowRate.mean, config.flowRate.std);
  }

  return data;
}

/**
 * 发送数据到API
 */
async function sendData(apiUrl: string, data: SensorData): Promise<boolean> {
  try {
    const response = await fetch(`${apiUrl}/api/data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ 发送失败 (${response.status}):`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('❌ 发送错误:', error);
    return false;
  }
}

/**
 * 主生成器循环
 */
async function runGenerator(config: GeneratorConfig) {
  console.log('🚀 数据生成器启动');
  console.log(`📡 API地址: ${config.apiUrl}`);
  console.log(`🔧 设备ID: ${config.deviceId}`);
  console.log(`⏱️  发送间隔: ${config.interval}ms`);
  console.log(`⚠️  异常概率: ${(config.anomalyProbability * 100).toFixed(1)}%`);
  if (config.anomalyType) {
    console.log(`🎯 异常类型: ${config.anomalyType}`);
  }
  console.log('');

  let count = 0;
  let successCount = 0;
  let anomalyCount = 0;

  const interval = setInterval(async () => {
    count++;
    
    // 决定是否生成异常数据
    const isAnomaly = Math.random() < config.anomalyProbability;
    
    const data = isAnomaly
      ? generateAnomalyData(config.deviceId, config.anomalyType || 'random')
      : generateNormalData(config.deviceId);

    if (isAnomaly) {
      anomalyCount++;
    }

    const success = await sendData(config.apiUrl, data);
    
    if (success) {
      successCount++;
      const status = isAnomaly ? '⚠️  异常' : '✅ 正常';
      console.log(
        `[${count}] ${status} | ` +
        `进口: ${data.inletPressure.toFixed(2)} MPa | ` +
        `出口: ${data.outletPressure.toFixed(2)} MPa | ` +
        `温度: ${data.temperature.toFixed(1)} °C | ` +
        `流量: ${data.flowRate.toFixed(2)} m³/h`
      );
    }

    // 每10条数据显示统计
    if (count % 10 === 0) {
      console.log(
        `\n📊 统计: 总计 ${count} | 成功 ${successCount} | 异常 ${anomalyCount} | ` +
        `成功率 ${((successCount / count) * 100).toFixed(1)}%\n`
      );
    }
  }, config.interval);

  // 优雅退出
  process.on('SIGINT', () => {
    console.log('\n\n🛑 停止生成器...');
    clearInterval(interval);
    console.log(
      `\n📊 最终统计:\n` +
      `  总计: ${count}\n` +
      `  成功: ${successCount}\n` +
      `  异常: ${anomalyCount}\n` +
      `  成功率: ${((successCount / count) * 100).toFixed(1)}%\n`
    );
    process.exit(0);
  });
}

// 解析命令行参数
function parseArgs(): GeneratorConfig {
  const args = process.argv.slice(2);
  
  const config: GeneratorConfig = {
    apiUrl: process.env.API_URL || 'http://localhost:3001',
    deviceId: 'device-001',
    interval: 1000,
    anomalyProbability: 0.1,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--api-url':
      case '-u':
        config.apiUrl = args[++i];
        break;
      case '--device-id':
      case '-d':
        config.deviceId = args[++i];
        break;
      case '--interval':
      case '-i':
        config.interval = parseInt(args[++i], 10);
        break;
      case '--anomaly-probability':
      case '-p':
        config.anomalyProbability = parseFloat(args[++i]);
        break;
      case '--anomaly-type':
      case '-t':
        config.anomalyType = args[++i] as any;
        break;
      case '--help':
      case '-h':
        console.log(`
燃气调压器传感器数据生成器

用法:
  bun run scripts/data-generator.ts [选项]

选项:
  -u, --api-url <url>              API地址 (默认: http://localhost:3001)
  -d, --device-id <id>             设备ID (默认: device-001)
  -i, --interval <ms>              发送间隔（毫秒） (默认: 1000)
  -p, --anomaly-probability <0-1>  异常数据概率 (默认: 0.1)
  -t, --anomaly-type <type>        异常类型: low-pressure, high-temperature, high-flow, random, multi
  -h, --help                       显示帮助信息

示例:
  # 正常模式（10%异常概率）
  bun run scripts/data-generator.ts

  # 高异常概率模式
  bun run scripts/data-generator.ts -p 0.5

  # 指定异常类型
  bun run scripts/data-generator.ts -p 0.3 -t low-pressure

  # 多指标异常模式（同时触发2-3个指标异常）
  bun run scripts/data-generator.ts -p 0.5 -t multi

  # 多设备模拟（在不同终端运行）
  bun run scripts/data-generator.ts -d device-001
  bun run scripts/data-generator.ts -d device-002
  bun run scripts/data-generator.ts -d device-003
        `);
        process.exit(0);
        break;
    }
  }

  return config;
}

// 启动生成器
const config = parseArgs();
runGenerator(config);
