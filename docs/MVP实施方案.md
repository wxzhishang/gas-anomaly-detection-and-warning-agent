# 燃气调压器异常检测AI Agent - MVP实施方案

## 1. MVP目标与范围

### 1.1 核心目标
在2周内构建一个可运行的原型系统，验证核心技术路线的可行性。

### 1.2 MVP功能范围

**包含功能（Must Have）**
- ✅ 单设备数据采集与存储
- ✅ 基于统计方法的异常检测（Z-Score）
- ✅ 简单的根因分析（规则匹配）
- ✅ 基础预警推送（WebSocket）
- ✅ 简单的监控面板（实时数据展示）
- ✅ 单一LLM集成（用于根因分析增强）

**暂不包含（Nice to Have）**
- ❌ 多Agent协作（简化为单一Agent）
- ❌ 向量数据库和RAG检索
- ❌ 机器学习模型（Isolation Forest等）
- ❌ 多渠道通知（邮件、短信）
- ❌ 学习Agent和反馈闭环
- ❌ 复杂的推理引擎

### 1.3 技术简化

**保留技术**
- Bun + NestJS（后端）
- Next.js（前端）
- TimescaleDB（时序数据）
- Redis（缓存）
- LangGraph（简化版工作流）
- 单一LLM（OpenAI或其他）

**暂时移除**
- Milvus向量数据库
- bge-large-zh-v1.5 Embedding
- BullMQ消息队列
- 多模型切换
- Prophet时序预测

## 2. MVP架构设计

### 2.1 简化架构

```
┌─────────────────────────────────────────────────────┐
│              前端 (Next.js)                          │
│  • 实时监控面板  • 预警列表  • 设备状态             │
└─────────────────────────────────────────────────────┘
                        ↕ WebSocket + REST
┌─────────────────────────────────────────────────────┐
│              API层 (NestJS + Bun)                    │
│  • REST API  • WebSocket Gateway  • 定时任务        │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│           简化Agent (LangGraph)                      │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 数据采集 │→ │ 异常检测 │→ │ 根因分析 │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                      ↓                              │
│                 ┌──────────┐                        │
│                 │ 预警推送 │                        │
│                 └──────────┘                        │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│              数据层                                  │
│  • TimescaleDB (时序数据)  • Redis (缓存)          │
└─────────────────────────────────────────────────────┘
```

### 2.2 数据流程

```
传感器数据 → API接收 → 存储TimescaleDB
                ↓
            定时任务触发
                ↓
        统计异常检测 (Z-Score)
                ↓
            发现异常？
           /          \
         否            是
         ↓             ↓
      继续监测    规则匹配根因
                      ↓
                  LLM增强分析
                      ↓
                  生成预警
                      ↓
              WebSocket推送前端
```

## 3. MVP技术实现

### 3.1 项目结构（简化版Monorepo）

```
gas-regulator-mvp/
├── apps/
│   ├── api/                    # NestJS后端
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── data/       # 数据采集
│   │   │   │   ├── detection/  # 异常检测
│   │   │   │   ├── analysis/   # 根因分析
│   │   │   │   └── alert/      # 预警
│   │   │   ├── agent/          # LangGraph Agent
│   │   │   └── main.ts
│   │   └── package.json
│   │
│   └── web/                    # Next.js前端
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       └── package.json
│
├── package.json
├── turbo.json
└── docker-compose.yml
```

### 3.2 核心模块实现要点

**数据采集模块**
- REST API接收传感器数据
- 简单的数据验证（范围检查）
- 直接存储到TimescaleDB
- 无需消息队列，同步处理

**异常检测模块**
- 定时任务（每分钟执行）
- 滑动窗口统计（最近100个数据点）
- Z-Score计算（3σ原则）
- 单指标独立检测
- 结果缓存到Redis

**根因分析模块**
- 硬编码规则库（5-10条规则）
- 简单的IF-THEN逻辑
- LLM调用（仅在规则无法匹配时）
- 使用LangGraph简单链式调用

**预警模块**
- 内存中的预警队列
- WebSocket实时推送
- 简单的预警等级判定（2级：警告/严重）
- 无持久化存储

**前端模块**
- 单页面应用
- 实时数据图表（最近1小时）
- 预警列表
- 设备状态卡片


## 4. MVP开发计划（2周）

### 第1周：后端核心功能

**Day 1-2：环境搭建**
- 初始化Monorepo项目（Turbo + Yarn）
- 配置NestJS + Bun
- 配置Next.js
- Docker Compose（TimescaleDB + Redis）
- 数据库Schema设计

**Day 3-4：数据采集与存储**
- 实现数据采集API
- TimescaleDB集成
- 数据验证逻辑
- 简单的数据查询API

**Day 5：异常检测**
- 实现Z-Score异常检测
- 定时任务调度
- Redis缓存集成
- 基线统计计算

### 第2周：分析、预警与前端

**Day 6-7：根因分析**
- 规则引擎实现
- LangGraph简单工作流
- LLM集成（OpenAI）
- 根因分析API

**Day 8：预警系统**
- WebSocket Gateway
- 预警推送逻辑
- 预警等级判定

**Day 9-10：前端开发**
- 监控面板UI
- 实时数据图表（ECharts）
- 预警列表组件
- WebSocket客户端

**Day 11-12：集成测试**
- 端到端测试
- 模拟数据生成
- Bug修复
- 性能优化

**Day 13-14：部署与演示**
- Docker部署
- 演示准备
- 文档编写

## 5. MVP数据库设计

### 5.1 TimescaleDB Schema（简化版）

```sql
-- 传感器数据表
CREATE TABLE sensor_data (
  time TIMESTAMPTZ NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  inlet_pressure DOUBLE PRECISION,
  outlet_pressure DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  flow_rate DOUBLE PRECISION
);

SELECT create_hypertable('sensor_data', 'time');
CREATE INDEX idx_sensor_device ON sensor_data (device_id, time DESC);

-- 预警表（简化）
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  message TEXT,
  root_cause TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 设备表
CREATE TABLE devices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active'
);
```

### 5.2 Redis数据结构

```
# 设备基线统计
baseline:{device_id}:{metric} → JSON {mean, std, updated_at}

# 最新设备状态
device:status:{device_id} → JSON {latest_data, health_score}

# 异常检测结果缓存
anomaly:{device_id}:{timestamp} → JSON {is_anomaly, score, metrics}
```

## 6. MVP核心代码结构

### 6.1 异常检测服务（简化版）

```typescript
// apps/api/src/modules/detection/detection.service.ts

@Injectable()
export class DetectionService {
  // 计算基线统计
  async calculateBaseline(deviceId: string) {
    const data = await this.getRecentData(deviceId, 1000);
    const stats = {
      inletPressure: this.calculateStats(data.map(d => d.inletPressure)),
      outletPressure: this.calculateStats(data.map(d => d.outletPressure)),
      temperature: this.calculateStats(data.map(d => d.temperature)),
      flowRate: this.calculateStats(data.map(d => d.flowRate)),
    };
    await this.redis.set(`baseline:${deviceId}`, JSON.stringify(stats));
  }

  // Z-Score异常检测
  async detectAnomaly(deviceId: string, data: SensorData) {
    const baseline = await this.getBaseline(deviceId);
    const anomalies = [];

    for (const [metric, value] of Object.entries(data)) {
      const stat = baseline[metric];
      const zScore = Math.abs((value - stat.mean) / stat.std);
      
      if (zScore > 3) {
        anomalies.push({ metric, value, zScore });
      }
    }

    return {
      isAnomaly: anomalies.length > 0,
      anomalies,
      severity: this.calculateSeverity(anomalies),
    };
  }

  private calculateStats(values: number[]) {
    const mean = values.reduce((a, b) => a + b) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return { mean, std: Math.sqrt(variance) };
  }
}
```

### 6.2 根因分析服务（简化版）

```typescript
// apps/api/src/modules/analysis/analysis.service.ts

@Injectable()
export class AnalysisService {
  private rules = [
    {
      condition: (anomalies) => anomalies.some(a => a.metric === 'outletPressure'),
      cause: '调压器膜片可能老化或损坏',
      recommendation: '检查并更换膜片',
    },
    {
      condition: (anomalies) => anomalies.some(a => a.metric === 'temperature'),
      cause: '设备温度异常，可能存在阀门卡滞',
      recommendation: '检查阀门润滑情况',
    },
    // ... 更多规则
  ];

  async analyzeRootCause(anomalies: any[]) {
    // 1. 规则匹配
    const matchedRule = this.rules.find(rule => rule.condition(anomalies));
    
    if (matchedRule) {
      return {
        cause: matchedRule.cause,
        recommendation: matchedRule.recommendation,
        confidence: 0.8,
        method: 'rule-based',
      };
    }

    // 2. LLM增强分析
    return await this.llmAnalysis(anomalies);
  }

  private async llmAnalysis(anomalies: any[]) {
    const prompt = `
      燃气调压器检测到以下异常：
      ${anomalies.map(a => `- ${a.metric}: ${a.value} (Z-Score: ${a.zScore})`).join('\n')}
      
      请分析可能的根本原因，并提供处理建议。
    `;

    const response = await this.llm.invoke(prompt);
    
    return {
      cause: response.cause,
      recommendation: response.recommendation,
      confidence: 0.6,
      method: 'llm-enhanced',
    };
  }
}
```

### 6.3 LangGraph工作流（简化版）

```typescript
// apps/api/src/agent/workflow.ts

import { StateGraph } from "@langchain/langgraph";

interface AgentState {
  deviceId: string;
  sensorData: any;
  anomalyResult?: any;
  rootCause?: any;
  alert?: any;
}

export function createDetectionWorkflow() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      deviceId: null,
      sensorData: null,
      anomalyResult: null,
      rootCause: null,
      alert: null,
    }
  });

  // 节点1：异常检测
  workflow.addNode("detect", async (state) => {
    const result = await detectionService.detectAnomaly(
      state.deviceId, 
      state.sensorData
    );
    return { ...state, anomalyResult: result };
  });

  // 节点2：根因分析
  workflow.addNode("analyze", async (state) => {
    if (!state.anomalyResult.isAnomaly) {
      return state;
    }
    const rootCause = await analysisService.analyzeRootCause(
      state.anomalyResult.anomalies
    );
    return { ...state, rootCause };
  });

  // 节点3：生成预警
  workflow.addNode("alert", async (state) => {
    if (!state.anomalyResult.isAnomaly) {
      return state;
    }
    const alert = await alertService.createAlert(state);
    return { ...state, alert };
  });

  // 定义流程
  workflow.addEdge("__start__", "detect");
  workflow.addEdge("detect", "analyze");
  workflow.addEdge("analyze", "alert");
  workflow.addEdge("alert", "__end__");

  return workflow.compile();
}
```

### 6.4 前端监控面板（简化版）

```typescript
// apps/web/src/components/dashboard.tsx

'use client';

export function Dashboard() {
  const [sensorData, setSensorData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const ws = useWebSocket('/ws');

  useEffect(() => {
    // WebSocket接收实时数据
    ws.on('sensor-data', (data) => {
      setSensorData(prev => [...prev.slice(-100), data]);
    });

    ws.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev]);
    });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* 实时数据图表 */}
      <Card>
        <CardHeader>实时监测</CardHeader>
        <CardContent>
          <LineChart data={sensorData} />
        </CardContent>
      </Card>

      {/* 预警列表 */}
      <Card>
        <CardHeader>预警信息</CardHeader>
        <CardContent>
          {alerts.map(alert => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 7. MVP部署方案

### 7.1 Docker Compose（简化版）

```yaml
version: '3.9'

services:
  timescaledb:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: gas_regulator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - timescale-data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3000"
    environment:
      DATABASE_URL: postgresql://postgres:password@timescaledb:5432/gas_regulator
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    depends_on:
      - timescaledb
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - api

volumes:
  timescale-data:
```

### 7.2 启动命令

```bash
# 开发环境
yarn install
yarn dev

# 生产环境
docker-compose up -d
```

## 8. MVP测试方案

### 8.1 模拟数据生成器

```typescript
// apps/api/src/scripts/data-generator.ts

// 生成正常数据
function generateNormalData() {
  return {
    deviceId: 'device-001',
    timestamp: new Date(),
    inletPressure: 0.3 + Math.random() * 0.05,
    outletPressure: 2.5 + Math.random() * 0.2,
    temperature: 20 + Math.random() * 5,
    flowRate: 500 + Math.random() * 50,
  };
}

// 生成异常数据
function generateAnomalyData() {
  const data = generateNormalData();
  // 随机注入异常
  if (Math.random() > 0.5) {
    data.outletPressure = 1.0; // 压力异常低
  } else {
    data.temperature = 50; // 温度异常高
  }
  return data;
}

// 持续发送数据
setInterval(async () => {
  const data = Math.random() > 0.9 
    ? generateAnomalyData() 
    : generateNormalData();
  
  await fetch('http://localhost:3001/api/data', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}, 1000); // 每秒一条
```

### 8.2 测试场景

**场景1：正常运行**
- 发送100条正常数据
- 验证：无预警产生

**场景2：单指标异常**
- 发送出口压力异常数据
- 验证：检测到异常，生成预警，规则匹配根因

**场景3：多指标异常**
- 发送温度和压力同时异常
- 验证：检测到多个异常，LLM增强分析

**场景4：实时推送**
- 前端连接WebSocket
- 验证：实时接收数据和预警

## 9. MVP成功标准

### 9.1 功能验证

- ✅ 能够接收并存储传感器数据
- ✅ 能够检测到明显的异常（Z-Score > 3）
- ✅ 能够通过规则匹配给出根因
- ✅ 能够实时推送预警到前端
- ✅ 前端能够展示实时数据和预警

### 9.2 性能指标

- 数据采集延迟：< 100ms
- 异常检测延迟：< 5秒
- 预警推送延迟：< 1秒
- 前端刷新率：1秒/次

### 9.3 质量指标

- 异常检测准确率：> 80%（基于模拟数据）
- 系统稳定性：连续运行24小时无崩溃
- 代码覆盖率：> 60%

## 10. MVP之后的迭代计划

### 10.1 第一次迭代（+2周）

**新增功能**
- Isolation Forest多维异常检测
- 向量数据库（Milvus）集成
- RAG案例检索
- 多设备支持

### 10.2 第二次迭代（+2周）

**新增功能**
- 多Agent协作
- 学习Agent和反馈闭环
- 多渠道通知（邮件、短信）
- 时序预测（Prophet）

### 10.3 第三次迭代（+2周）

**新增功能**
- 深度学习模型（LSTM Autoencoder）
- 知识图谱
- 高级可视化
- 移动端应用

## 11. MVP风险与应对

### 11.1 技术风险

**风险1：LLM响应慢**
- 应对：设置超时，超时则使用规则结果

**风险2：数据库性能**
- 应对：限制查询范围，使用索引

**风险3：WebSocket连接不稳定**
- 应对：实现自动重连机制

### 11.2 时间风险

**风险：2周时间不够**
- 应对：优先核心功能，砍掉非必要特性
- 备选：延长到3周，增加缓冲时间

## 12. MVP资源需求

### 12.1 人力

- 全栈开发：1人（可以是你）
- 时间：2周全职

### 12.2 基础设施

- 开发机器：本地开发
- 云服务器：可选（演示用）
- 成本：< $50（主要是LLM API调用）

### 12.3 工具与服务

- OpenAI API（或其他LLM）
- Docker Desktop
- VS Code
- Git

## 13. MVP交付物

- ✅ 可运行的系统（Docker Compose一键启动）
- ✅ 源代码（GitHub仓库）
- ✅ 部署文档
- ✅ 演示视频（5分钟）
- ✅ 技术文档（架构、API）
- ✅ 测试报告

## 14. 总结

这个MVP方案通过大幅简化架构和功能，将开发周期压缩到2周，重点验证：

1. **技术可行性**：统计方法 + LLM的组合是否有效
2. **架构合理性**：简化的Agent架构是否能工作
3. **用户体验**：实时监控和预警是否满足需求

MVP成功后，可以基于反馈逐步迭代，添加更复杂的功能（向量数据库、机器学习、多Agent等）。

**核心原则：先跑起来，再优化！**
