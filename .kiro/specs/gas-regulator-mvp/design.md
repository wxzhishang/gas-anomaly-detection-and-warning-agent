# 设计文档

## Overview

燃气调压器异常检测AI Agent MVP系统是一个实时监控和预警系统，采用简化的单Agent架构。系统通过REST API接收传感器数据，使用Z-Score统计方法进行异常检测，结合规则引擎和LLM进行根因分析，并通过WebSocket实时推送预警到前端监控面板。

### 核心设计原则

1. **简单优先**：MVP阶段避免过度设计，使用成熟稳定的技术栈
2. **实时性**：从数据接收到预警推送控制在5秒内
3. **可扩展性**：模块化设计，为后续迭代预留扩展空间
4. **可靠性**：优雅的错误处理和降级策略

### 技术栈

- **运行时**: Bun (高性能JavaScript/TypeScript运行时)
- **后端框架**: NestJS (企业级Node.js框架)
- **前端框架**: Next.js 14 (React + SSR)
- **时序数据库**: TimescaleDB (PostgreSQL扩展)
- **缓存**: Redis
- **AI框架**: LangGraph (Agent工作流编排)
- **LLM**: 支持多模型配置（OpenAI/其他）
- **UI组件**: shadcn/ui + Tailwind CSS
- **图表库**: Apache ECharts

## Architecture

### 系统架构图

```
┌─────────────────────────────────────────────────────┐
│              前端层 (Next.js)                        │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ 实时监控面板 │  │  预警列表    │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                ↕ WebSocket + REST API
┌─────────────────────────────────────────────────────┐
│              API层 (NestJS)                          │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ REST API     │  │ WebSocket    │                │
│  │ Controller   │  │ Gateway      │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           业务逻辑层 (Services)                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ 数据采集服务 │  │ 异常检测服务 │                │
│  └──────────────┘  └──────────────┘                │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ 根因分析服务 │  │ 预警服务     │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│           Agent层 (LangGraph)                        │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 数据采集 │→ │ 异常检测 │→ │ 根因分析 │         │
│  │  节点    │  │  节点    │  │  节点    │         │
│  └──────────┘  └──────────┘  └──────────┘         │
│                      ↓                              │
│                 ┌──────────┐                        │
│                 │ 预警推送 │                        │
│                 │  节点    │                        │
│                 └──────────┘                        │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│              数据层                                  │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ TimescaleDB  │  │    Redis     │                │
│  │ (时序数据)   │  │  (缓存)      │                │
│  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────┘
```

### 数据流程

```
传感器数据 → REST API → 数据验证 → 存储TimescaleDB
                                        ↓
                                   定时任务触发
                                        ↓
                              异常检测 (Z-Score)
                                        ↓
                                   发现异常？
                                   /        \
                                 否          是
                                 ↓           ↓
                            继续监测    规则匹配
                                           ↓
                                      匹配成功？
                                      /        \
                                    是          否
                                    ↓           ↓
                              返回规则结果   LLM分析
                                    \         /
                                     ↓       ↓
                                    生成预警
                                        ↓
                              WebSocket推送前端
```

### 模块职责

**数据采集模块 (DataModule)**
- 接收传感器数据
- 数据验证和范围检查
- 存储到TimescaleDB
- 设备管理

**异常检测模块 (DetectionModule)**
- 基线统计计算
- Z-Score异常检测
- 定时任务调度
- 结果缓存

**根因分析模块 (AnalysisModule)**
- 规则引擎匹配
- LLM增强分析
- LangGraph工作流编排

**预警模块 (AlertModule)**
- 预警生成
- 等级判定
- WebSocket推送
- 预警历史查询

## Components and Interfaces

### 1. 数据采集服务 (DataService)

**职责**: 处理传感器数据的接收、验证和存储

**接口**:
```typescript
interface DataService {
  // 接收并存储传感器数据
  receiveSensorData(data: SensorDataDto): Promise<SensorData>;
  
  // 验证数据范围
  validateSensorData(data: SensorDataDto): ValidationResult;
  
  // 查询历史数据
  queryHistoricalData(
    deviceId: string, 
    startTime: Date, 
    endTime: Date
  ): Promise<SensorData[]>;
  
  // 获取最近N条数据
  getRecentData(deviceId: string, limit: number): Promise<SensorData[]>;
}
```

**关键方法**:
- `receiveSensorData`: 验证并存储数据，返回存储结果
- `validateSensorData`: 检查数据范围，返回验证结果
- `queryHistoricalData`: 按时间范围查询历史数据
- `getRecentData`: 获取最近的N条数据用于基线计算

### 2. 异常检测服务 (DetectionService)

**职责**: 计算基线统计和执行Z-Score异常检测

**接口**:
```typescript
interface DetectionService {
  // 计算设备基线统计
  calculateBaseline(deviceId: string): Promise<BaselineStats>;
  
  // 获取缓存的基线统计
  getBaseline(deviceId: string): Promise<BaselineStats>;
  
  // 执行异常检测
  detectAnomaly(
    deviceId: string, 
    data: SensorData
  ): Promise<AnomalyResult>;
  
  // 定时任务：检测所有设备
  detectAllDevices(): Promise<void>;
  
  // 定时任务：更新所有基线
  updateAllBaselines(): Promise<void>;
}
```

**关键算法**:
```typescript
// Z-Score计算
function calculateZScore(value: number, mean: number, std: number): number {
  return Math.abs((value - mean) / std);
}

// 基线统计
function calculateStats(values: number[]): { mean: number; std: number } {
  const mean = values.reduce((a, b) => a + b) / values.length;
  const variance = values.reduce(
    (sum, val) => sum + Math.pow(val - mean, 2), 
    0
  ) / values.length;
  return { mean, std: Math.sqrt(variance) };
}
```

### 3. 根因分析服务 (AnalysisService)

**职责**: 使用规则引擎和LLM分析异常根因

**接口**:
```typescript
interface AnalysisService {
  // 分析异常根因
  analyzeRootCause(anomalies: Anomaly[]): Promise<RootCauseResult>;
  
  // 规则引擎匹配
  matchRules(anomalies: Anomaly[]): RuleMatchResult | null;
  
  // LLM增强分析
  llmAnalysis(anomalies: Anomaly[]): Promise<RootCauseResult>;
}
```

**规则引擎设计**:
```typescript
interface Rule {
  id: string;
  priority: number;
  condition: (anomalies: Anomaly[]) => boolean;
  cause: string;
  recommendation: string;
}

// 预定义规则示例
const rules: Rule[] = [
  {
    id: 'rule-001',
    priority: 1,
    condition: (anomalies) => 
      anomalies.some(a => a.metric === 'outletPressure' && a.zScore > 4),
    cause: '调压器膜片可能老化或损坏',
    recommendation: '立即检查并更换膜片，停止设备运行',
  },
  {
    id: 'rule-002',
    priority: 2,
    condition: (anomalies) => 
      anomalies.some(a => a.metric === 'temperature' && a.value > 60),
    cause: '设备温度异常，可能存在阀门卡滞',
    recommendation: '检查阀门润滑情况，清理阀门',
  },
  // ... 更多规则
];
```

**LLM集成**:
```typescript
// LLM提示词模板
const promptTemplate = `
你是一个燃气调压器故障诊断专家。

检测到以下异常：
{anomalies}

请分析：
1. 最可能的故障原因
2. 具体的处理建议
3. 风险等级评估

以JSON格式返回：
{
  "cause": "故障原因",
  "recommendation": "处理建议",
  "riskLevel": "high/medium/low"
}
`;
```

### 4. 预警服务 (AlertService)

**职责**: 生成预警、判定等级、推送通知

**接口**:
```typescript
interface AlertService {
  // 创建预警
  createAlert(
    deviceId: string,
    anomalyResult: AnomalyResult,
    rootCause: RootCauseResult
  ): Promise<Alert>;
  
  // 判定预警等级
  determineAlertLevel(anomalies: Anomaly[]): AlertLevel;
  
  // 推送预警
  pushAlert(alert: Alert): Promise<void>;
  
  // 查询预警历史
  queryAlerts(
    deviceId?: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<Alert[]>;
}
```

**等级判定逻辑**:
```typescript
function determineAlertLevel(anomalies: Anomaly[]): AlertLevel {
  const maxZScore = Math.max(...anomalies.map(a => a.zScore));
  const anomalyCount = anomalies.length;
  
  if (anomalyCount > 2 || maxZScore > 5) {
    return AlertLevel.CRITICAL; // 严重
  }
  return AlertLevel.WARNING; // 警告
}
```

### 5. WebSocket网关 (AlertGateway)

**职责**: 管理WebSocket连接和实时消息推送

**接口**:
```typescript
@WebSocketGateway()
class AlertGateway {
  // 处理客户端连接
  handleConnection(client: Socket): void;
  
  // 处理客户端断开
  handleDisconnect(client: Socket): void;
  
  // 广播传感器数据
  broadcastSensorData(data: SensorData): void;
  
  // 广播预警
  broadcastAlert(alert: Alert): void;
}
```

### 6. LangGraph工作流 (DetectionWorkflow)

**职责**: 编排异常检测到预警推送的完整流程

**状态定义**:
```typescript
interface AgentState {
  deviceId: string;
  sensorData: SensorData;
  anomalyResult?: AnomalyResult;
  rootCause?: RootCauseResult;
  alert?: Alert;
  error?: Error;
}
```

**工作流节点**:
```typescript
// 节点1: 异常检测
async function detectNode(state: AgentState): Promise<AgentState> {
  const result = await detectionService.detectAnomaly(
    state.deviceId,
    state.sensorData
  );
  return { ...state, anomalyResult: result };
}

// 节点2: 根因分析
async function analyzeNode(state: AgentState): Promise<AgentState> {
  if (!state.anomalyResult?.isAnomaly) {
    return state; // 无异常，跳过分析
  }
  const rootCause = await analysisService.analyzeRootCause(
    state.anomalyResult.anomalies
  );
  return { ...state, rootCause };
}

// 节点3: 生成预警
async function alertNode(state: AgentState): Promise<AgentState> {
  if (!state.anomalyResult?.isAnomaly) {
    return state; // 无异常，跳过预警
  }
  const alert = await alertService.createAlert(
    state.deviceId,
    state.anomalyResult,
    state.rootCause!
  );
  return { ...state, alert };
}

// 节点4: 推送预警
async function pushNode(state: AgentState): Promise<AgentState> {
  if (state.alert) {
    await alertService.pushAlert(state.alert);
  }
  return state;
}
```

**工作流编排**:
```typescript
function createDetectionWorkflow() {
  const workflow = new StateGraph<AgentState>({
    channels: {
      deviceId: null,
      sensorData: null,
      anomalyResult: null,
      rootCause: null,
      alert: null,
      error: null,
    }
  });

  // 添加节点
  workflow.addNode("detect", detectNode);
  workflow.addNode("analyze", analyzeNode);
  workflow.addNode("alert", alertNode);
  workflow.addNode("push", pushNode);

  // 定义边
  workflow.addEdge("__start__", "detect");
  workflow.addEdge("detect", "analyze");
  workflow.addEdge("analyze", "alert");
  workflow.addEdge("alert", "push");
  workflow.addEdge("push", "__end__");

  return workflow.compile();
}
```

## Data Models

### 1. 传感器数据 (SensorData)

```typescript
interface SensorData {
  id?: number;
  time: Date;
  deviceId: string;
  inletPressure: number;    // 进口压力 (MPa)
  outletPressure: number;   // 出口压力 (MPa)
  temperature: number;      // 温度 (°C)
  flowRate: number;         // 流量 (m³/h)
}

// 数据传输对象
interface SensorDataDto {
  deviceId: string;
  timestamp?: string;       // ISO 8601格式，可选
  inletPressure: number;
  outletPressure: number;
  temperature: number;
  flowRate: number;
}

// 验证规则
const validationRules = {
  inletPressure: { min: 0.1, max: 1.0 },
  outletPressure: { min: 0.5, max: 5.0 },
  temperature: { min: -20, max: 80 },
  flowRate: { min: 0, max: 2000 },
};
```

### 2. 基线统计 (BaselineStats)

```typescript
interface BaselineStats {
  deviceId: string;
  inletPressure: MetricStats;
  outletPressure: MetricStats;
  temperature: MetricStats;
  flowRate: MetricStats;
  updatedAt: Date;
  sampleSize: number;
}

interface MetricStats {
  mean: number;
  std: number;
}

// Redis存储格式
const redisKey = `baseline:${deviceId}`;
const redisValue = JSON.stringify(baselineStats);
```

### 3. 异常结果 (AnomalyResult)

```typescript
interface AnomalyResult {
  deviceId: string;
  timestamp: Date;
  isAnomaly: boolean;
  anomalies: Anomaly[];
  severity: AlertLevel;
}

interface Anomaly {
  metric: string;           // 指标名称
  value: number;            // 实际值
  baseline: number;         // 基线均值
  zScore: number;           // Z-Score值
  deviation: number;        // 偏离百分比
}

enum AlertLevel {
  WARNING = 'warning',      // 警告
  CRITICAL = 'critical',    // 严重
}
```

### 4. 根因分析结果 (RootCauseResult)

```typescript
interface RootCauseResult {
  cause: string;            // 故障原因
  recommendation: string;   // 处理建议
  confidence: number;       // 置信度 (0-1)
  method: AnalysisMethod;   // 分析方法
  ruleId?: string;          // 匹配的规则ID（如果是规则匹配）
}

enum AnalysisMethod {
  RULE_BASED = 'rule-based',
  LLM_ENHANCED = 'llm-enhanced',
}
```

### 5. 预警 (Alert)

```typescript
interface Alert {
  id?: number;
  deviceId: string;
  level: AlertLevel;
  message: string;
  anomalies: Anomaly[];
  rootCause: RootCauseResult;
  createdAt: Date;
}

// 数据库表结构
CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  device_id VARCHAR(50) NOT NULL,
  level VARCHAR(20) NOT NULL,
  message TEXT,
  anomalies JSONB,
  root_cause JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6. 设备 (Device)

```typescript
interface Device {
  id: string;
  name: string;
  status: DeviceStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

// 数据库表结构
CREATE TABLE devices (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7. TimescaleDB Schema

```sql
-- 传感器数据表（超表）
CREATE TABLE sensor_data (
  time TIMESTAMPTZ NOT NULL,
  device_id VARCHAR(50) NOT NULL,
  inlet_pressure DOUBLE PRECISION,
  outlet_pressure DOUBLE PRECISION,
  temperature DOUBLE PRECISION,
  flow_rate DOUBLE PRECISION
);

-- 创建超表
SELECT create_hypertable('sensor_data', 'time');

-- 创建索引
CREATE INDEX idx_sensor_device_time 
  ON sensor_data (device_id, time DESC);

-- 数据保留策略（可选）
SELECT add_retention_policy('sensor_data', INTERVAL '90 days');
```

### 8. Redis数据结构

```typescript
// 基线统计
// Key: baseline:{deviceId}
// Value: JSON string of BaselineStats
// TTL: 24小时

// 设备状态缓存
// Key: device:status:{deviceId}
// Value: JSON string of Device
// TTL: 1小时

// 异常检测结果缓存
// Key: anomaly:{deviceId}:{timestamp}
// Value: JSON string of AnomalyResult
// TTL: 1小时
```

### 9. WebSocket消息格式

```typescript
// 传感器数据消息
interface SensorDataMessage {
  type: 'sensor-data';
  data: SensorData;
}

// 预警消息
interface AlertMessage {
  type: 'alert';
  data: Alert;
}

// 连接确认消息
interface ConnectionMessage {
  type: 'connection';
  data: {
    clientId: string;
    connectedAt: Date;
  };
}

type WebSocketMessage = 
  | SensorDataMessage 
  | AlertMessage 
  | ConnectionMessage;
```


## Correctness Properties

*属性（Property）是系统在所有有效执行中都应该保持为真的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### Property 1: 数据验证范围检查

*对于任何*传感器数据，系统应该验证所有指标都在有效范围内（进口压力0.1-1.0 MPa，出口压力0.5-5.0 MPa，温度-20-80°C，流量0-2000 m³/h），超出范围的数据应该被拒绝并返回具体的验证错误信息。

**验证需求: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

### Property 2: 数据存储完整性

*对于任何*通过验证的传感器数据，存储到数据库后查询应该返回包含所有字段（时间戳、设备ID、进口压力、出口压力、温度、流量）的完整记录。

**验证需求: Requirements 1.2, 1.5**

### Property 3: 数据验证失败拒绝存储

*对于任何*未通过验证的传感器数据，系统应该返回错误信息且数据不应该出现在数据库中。

**验证需求: Requirements 1.3**

### Property 4: 基线统计计算正确性

*对于任何*数据集，计算的基线统计应该包含每个指标的均值和标准差，且计算结果应该符合统计学定义（均值 = Σx/n，标准差 = √(Σ(x-μ)²/n)）。

**验证需求: Requirements 2.2**

### Property 5: 基线缓存一致性

*对于任何*设备，基线计算完成后，从Redis查询应该返回相同的基线统计数据。

**验证需求: Requirements 2.3**

### Property 6: Z-Score计算正确性

*对于任何*传感器数据和基线统计，异常检测应该为每个指标计算Z-Score值，且计算结果应该符合公式 Z = |x - μ| / σ。

**验证需求: Requirements 3.2**

### Property 7: 异常判定阈值

*对于任何*指标，当且仅当其Z-Score绝对值大于3时，该指标应该被标记为异常。

**验证需求: Requirements 3.3**

### Property 8: 异常检测结果完整性

*对于任何*检测到的异常，结果应该包含异常指标名称、实际数值和Z-Score值。

**验证需求: Requirements 3.4**

### Property 9: 异常触发根因分析

*对于任何*检测到异常的情况，系统应该触发根因分析流程（工作流状态应该从detect节点转移到analyze节点）。

**验证需求: Requirements 3.6**

### Property 10: 规则引擎匹配逻辑

*对于任何*异常数据，根因分析应该遍历规则库，当规则条件满足时返回对应的故障原因和处理建议。

**验证需求: Requirements 4.1, 4.2**

### Property 11: 规则优先级处理

*对于任何*匹配多条规则的异常数据，系统应该返回优先级最高的规则结果。

**验证需求: Requirements 4.4**

### Property 12: 根因分析结果元数据

*对于任何*根因分析结果，当使用规则匹配时应该标记method为'rule-based'且confidence为0.8，当使用LLM分析时应该标记method为'llm-enhanced'且confidence为0.6。

**验证需求: Requirements 4.5, 5.5**

### Property 13: LLM调用降级策略

*对于任何*LLM调用超时或失败的情况，系统应该使用默认分析结果而不是抛出错误。

**验证需求: Requirements 5.3, 13.3**

### Property 14: 预警生成完整性

*对于任何*根因分析完成的异常，生成的预警应该包含设备ID、预警等级、异常信息、根因分析结果和时间戳。

**验证需求: Requirements 6.1, 6.2**

### Property 15: 预警等级判定逻辑

*对于任何*异常数据，当异常指标数量大于2或最大Z-Score大于5时预警等级应该为'critical'，否则应该为'warning'。

**验证需求: Requirements 6.3, 6.4**

### Property 16: 预警WebSocket推送

*对于任何*生成的预警，系统应该通过WebSocket广播到所有连接的客户端。

**验证需求: Requirements 6.5**

### Property 17: 前端数据窗口管理

*对于任何*前端数据数组，当数据点数量超过3600时，添加新数据点应该移除最早的数据点，保持数组长度不超过3600。

**验证需求: Requirements 7.4**

### Property 18: 预警列表插入位置

*对于任何*新接收的预警，应该被插入到预警列表的顶部（索引0位置）。

**验证需求: Requirements 8.2**

### Property 19: 预警展示完整性

*对于任何*展示的预警，渲染的内容应该包含预警等级、设备ID、异常信息、根因和时间。

**验证需求: Requirements 8.3**

### Property 20: 设备自动注册

*对于任何*新设备ID的传感器数据，如果设备不存在，系统应该自动创建设备记录，默认状态为'active'。

**验证需求: Requirements 9.2, 9.3**

### Property 21: 设备查询结果结构

*对于任何*设备查询，返回结果应该包含设备ID、名称和最新数据时间。

**验证需求: Requirements 9.4**

### Property 22: 定时任务错误日志

*对于任何*定时任务执行失败的情况，系统应该记录错误日志。

**验证需求: Requirements 11.3**

### Property 23: 定时任务处理范围

*对于任何*定时任务执行，应该处理所有状态为'active'的设备。

**验证需求: Requirements 11.4**

### Property 24: WebSocket连接管理

*对于任何*客户端连接，系统应该记录连接ID，当客户端断开或推送失败时应该清理连接记录。

**验证需求: Requirements 12.1, 12.2, 12.3**

### Property 25: WebSocket连接确认

*对于任何*新建立的WebSocket连接，系统应该发送包含clientId和connectedAt的连接确认消息。

**验证需求: Requirements 12.5**

### Property 26: Redis降级策略

*对于任何*Redis连接失败的情况，系统应该降级为无缓存模式并记录警告日志，而不是抛出错误。

**验证需求: Requirements 13.2**

### Property 27: 全局错误处理

*对于任何*未捕获的异常，系统应该记录完整错误堆栈并返回500错误响应。

**验证需求: Requirements 13.4**

### Property 28: 错误响应格式一致性

*对于任何*API错误响应，应该使用统一的格式（包含statusCode、message、timestamp等字段）。

**验证需求: Requirements 13.5**

### Property 29: 结构化日志格式

*对于任何*日志记录，应该使用JSON格式且包含时间戳、日志级别、模块名称和消息内容。

**验证需求: Requirements 14.4, 14.5**

### Property 30: 关键事件日志记录

*对于任何*API请求、异常检测和根因分析事件，系统应该记录相应的日志条目。

**验证需求: Requirements 14.1, 14.2, 14.3**

## Error Handling

### 错误分类

系统采用分层错误处理策略，根据错误类型采取不同的处理方式：

**1. 数据验证错误 (400 Bad Request)**
- 场景：传感器数据格式错误、字段缺失、数值超出范围
- 处理：返回详细的验证错误信息，不存储数据
- 示例：
```typescript
{
  statusCode: 400,
  message: "Validation failed",
  errors: [
    { field: "inletPressure", value: 1.5, message: "Value must be between 0.1 and 1.0" }
  ],
  timestamp: "2024-01-05T10:30:00Z"
}
```

**2. 资源不存在错误 (404 Not Found)**
- 场景：查询不存在的设备、预警记录
- 处理：返回明确的资源不存在信息
- 示例：
```typescript
{
  statusCode: 404,
  message: "Device not found",
  deviceId: "device-999",
  timestamp: "2024-01-05T10:30:00Z"
}
```

**3. 外部服务错误 (503 Service Unavailable)**
- 场景：数据库连接失败、LLM服务不可用
- 处理：返回服务不可用错误，记录详细日志
- 降级策略：
  - 数据库失败：返回503，停止服务
  - Redis失败：降级为无缓存模式，记录警告
  - LLM失败：使用默认分析结果，记录警告

**4. 超时错误 (408 Request Timeout)**
- 场景：LLM调用超时（5秒）
- 处理：使用默认分析结果，记录超时日志
- 降级：
```typescript
const defaultResult: RootCauseResult = {
  cause: "系统正在分析中，请稍后查看详细结果",
  recommendation: "建议人工检查设备状态",
  confidence: 0.3,
  method: AnalysisMethod.LLM_ENHANCED,
};
```

**5. 内部服务器错误 (500 Internal Server Error)**
- 场景：未捕获的异常、逻辑错误
- 处理：记录完整错误堆栈，返回通用错误信息
- 示例：
```typescript
{
  statusCode: 500,
  message: "Internal server error",
  requestId: "req-12345",
  timestamp: "2024-01-05T10:30:00Z"
}
```

### 错误处理实现

**全局异常过滤器**:
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    // 记录错误日志
    logger.error({
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      stack: exception instanceof Error ? exception.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // 返回统一格式的错误响应
    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

**降级策略实现**:
```typescript
// Redis降级
async getBaseline(deviceId: string): Promise<BaselineStats> {
  try {
    const cached = await this.redis.get(`baseline:${deviceId}`);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    logger.warn('Redis connection failed, falling back to database', { error });
  }
  
  // 降级：直接从数据库计算
  return await this.calculateBaseline(deviceId);
}

// LLM降级
async llmAnalysis(anomalies: Anomaly[]): Promise<RootCauseResult> {
  try {
    const result = await Promise.race([
      this.llm.invoke(prompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 5000)
      ),
    ]);
    return this.parseResult(result);
  } catch (error) {
    logger.warn('LLM analysis failed, using default result', { error });
    return this.getDefaultResult();
  }
}
```

### 错误监控

**日志级别**:
- ERROR: 需要立即关注的错误（数据库连接失败、未捕获异常）
- WARN: 降级或异常情况（Redis失败、LLM超时）
- INFO: 正常业务事件（异常检测、预警生成）
- DEBUG: 调试信息（详细的数据流）

**关键指标监控**:
- 数据库连接失败率
- Redis连接失败率
- LLM调用成功率和平均响应时间
- API错误率（按状态码分类）
- WebSocket连接数和断开率

## Testing Strategy

### 测试方法论

系统采用**双重测试策略**，结合单元测试和基于属性的测试（Property-Based Testing, PBT）：

- **单元测试**：验证特定示例、边界情况和错误条件
- **属性测试**：验证通用属性在所有输入下都成立
- 两者互补，共同提供全面的测试覆盖

**重要原则**：
- 单元测试适合具体示例和边界情况
- 属性测试通过随机化输入覆盖大量场景
- 避免编写过多单元测试，让属性测试处理输入覆盖
- 每个属性测试至少运行100次迭代

### 测试框架

**单元测试**:
- 框架：Vitest
- 断言库：Vitest内置
- Mock库：Vitest内置

**属性测试**:
- 框架：fast-check
- 配置：每个属性测试运行100次迭代
- 标签格式：`// Feature: gas-regulator-mvp, Property N: [属性描述]`

### 测试分层

**1. 单元测试层**

**数据验证测试**:
```typescript
describe('DataService - Validation', () => {
  it('should accept valid sensor data', () => {
    const validData = {
      deviceId: 'device-001',
      inletPressure: 0.5,
      outletPressure: 2.5,
      temperature: 25,
      flowRate: 500,
    };
    const result = dataService.validateSensorData(validData);
    expect(result.isValid).toBe(true);
  });

  it('should reject data with out-of-range inlet pressure', () => {
    const invalidData = {
      deviceId: 'device-001',
      inletPressure: 1.5, // 超出范围
      outletPressure: 2.5,
      temperature: 25,
      flowRate: 500,
    };
    const result = dataService.validateSensorData(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual({
      field: 'inletPressure',
      message: expect.stringContaining('0.1 and 1.0'),
    });
  });
});
```

**Z-Score计算测试**:
```typescript
describe('DetectionService - Z-Score', () => {
  it('should calculate correct Z-Score', () => {
    const value = 10;
    const mean = 5;
    const std = 2;
    const zScore = detectionService.calculateZScore(value, mean, std);
    expect(zScore).toBe(2.5);
  });

  it('should handle zero standard deviation', () => {
    const value = 5;
    const mean = 5;
    const std = 0;
    const zScore = detectionService.calculateZScore(value, mean, std);
    expect(zScore).toBe(0);
  });
});
```

**规则引擎测试**:
```typescript
describe('AnalysisService - Rule Engine', () => {
  it('should match rule for outlet pressure anomaly', () => {
    const anomalies = [
      { metric: 'outletPressure', value: 1.0, zScore: 4.5 },
    ];
    const result = analysisService.matchRules(anomalies);
    expect(result).toBeDefined();
    expect(result.cause).toContain('膜片');
  });

  it('should return null when no rules match', () => {
    const anomalies = [
      { metric: 'flowRate', value: 600, zScore: 3.2 },
    ];
    const result = analysisService.matchRules(anomalies);
    expect(result).toBeNull();
  });
});
```

**2. 属性测试层**

**Property 1: 数据验证范围检查**:
```typescript
// Feature: gas-regulator-mvp, Property 1: 数据验证范围检查
describe('Property 1: Data Validation Range Check', () => {
  it('should validate all metrics within valid ranges', () => {
    fc.assert(
      fc.property(
        fc.record({
          deviceId: fc.string(),
          inletPressure: fc.double({ min: 0.1, max: 1.0 }),
          outletPressure: fc.double({ min: 0.5, max: 5.0 }),
          temperature: fc.double({ min: -20, max: 80 }),
          flowRate: fc.double({ min: 0, max: 2000 }),
        }),
        (data) => {
          const result = dataService.validateSensorData(data);
          expect(result.isValid).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject data with any metric out of range', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.record({
            deviceId: fc.string(),
            inletPressure: fc.double({ min: 1.1, max: 10 }), // 超出范围
            outletPressure: fc.double({ min: 0.5, max: 5.0 }),
            temperature: fc.double({ min: -20, max: 80 }),
            flowRate: fc.double({ min: 0, max: 2000 }),
          }),
          // ... 其他超出范围的情况
        ),
        (data) => {
          const result = dataService.validateSensorData(data);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 2: 数据存储完整性**:
```typescript
// Feature: gas-regulator-mvp, Property 2: 数据存储完整性
describe('Property 2: Data Storage Integrity', () => {
  it('should store and retrieve complete sensor data', async () => {
    fc.assert(
      await fc.asyncProperty(
        fc.record({
          deviceId: fc.string(),
          inletPressure: fc.double({ min: 0.1, max: 1.0 }),
          outletPressure: fc.double({ min: 0.5, max: 5.0 }),
          temperature: fc.double({ min: -20, max: 80 }),
          flowRate: fc.double({ min: 0, max: 2000 }),
        }),
        async (data) => {
          const stored = await dataService.receiveSensorData(data);
          const retrieved = await dataService.queryHistoricalData(
            data.deviceId,
            new Date(Date.now() - 1000),
            new Date()
          );
          
          const found = retrieved.find(r => r.id === stored.id);
          expect(found).toBeDefined();
          expect(found.deviceId).toBe(data.deviceId);
          expect(found.inletPressure).toBe(data.inletPressure);
          expect(found.outletPressure).toBe(data.outletPressure);
          expect(found.temperature).toBe(data.temperature);
          expect(found.flowRate).toBe(data.flowRate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 6: Z-Score计算正确性**:
```typescript
// Feature: gas-regulator-mvp, Property 6: Z-Score计算正确性
describe('Property 6: Z-Score Calculation Correctness', () => {
  it('should calculate Z-Score according to formula', () => {
    fc.assert(
      fc.property(
        fc.double(),
        fc.double(),
        fc.double({ min: 0.01, max: 100 }), // std > 0
        (value, mean, std) => {
          const zScore = detectionService.calculateZScore(value, mean, std);
          const expected = Math.abs((value - mean) / std);
          expect(zScore).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Property 15: 预警等级判定逻辑**:
```typescript
// Feature: gas-regulator-mvp, Property 15: 预警等级判定逻辑
describe('Property 15: Alert Level Determination Logic', () => {
  it('should set level to critical when conditions met', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            metric: fc.constantFrom('inletPressure', 'outletPressure', 'temperature', 'flowRate'),
            value: fc.double(),
            zScore: fc.double({ min: 0, max: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (anomalies) => {
          const maxZScore = Math.max(...anomalies.map(a => a.zScore));
          const count = anomalies.length;
          const level = alertService.determineAlertLevel(anomalies);
          
          if (count > 2 || maxZScore > 5) {
            expect(level).toBe(AlertLevel.CRITICAL);
          } else {
            expect(level).toBe(AlertLevel.WARNING);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 集成测试

**端到端工作流测试**:
```typescript
describe('E2E: Anomaly Detection Workflow', () => {
  it('should complete full workflow from data to alert', async () => {
    // 1. 发送传感器数据
    const data = {
      deviceId: 'test-device',
      inletPressure: 0.5,
      outletPressure: 1.0, // 异常低
      temperature: 25,
      flowRate: 500,
    };
    await request(app).post('/api/data').send(data).expect(201);

    // 2. 等待异常检测（模拟定时任务）
    await detectionService.detectAllDevices();

    // 3. 验证预警生成
    const alerts = await alertService.queryAlerts('test-device');
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].level).toBe(AlertLevel.CRITICAL);
    expect(alerts[0].rootCause).toBeDefined();
  });
});
```

**WebSocket集成测试**:
```typescript
describe('WebSocket Integration', () => {
  it('should push alerts to connected clients', async () => {
    const client = io('http://localhost:3001');
    const alertReceived = new Promise((resolve) => {
      client.on('alert', (alert) => {
        resolve(alert);
      });
    });

    // 触发预警
    await alertService.createAlert(/* ... */);

    const alert = await alertReceived;
    expect(alert).toBeDefined();
    expect(alert.level).toBeDefined();
    
    client.disconnect();
  });
});
```

### 测试数据生成

**模拟数据生成器**:
```typescript
// 生成正常数据
function generateNormalData(deviceId: string): SensorData {
  return {
    deviceId,
    timestamp: new Date(),
    inletPressure: 0.3 + Math.random() * 0.05,
    outletPressure: 2.5 + Math.random() * 0.2,
    temperature: 20 + Math.random() * 5,
    flowRate: 500 + Math.random() * 50,
  };
}

// 生成异常数据
function generateAnomalyData(deviceId: string, anomalyType: string): SensorData {
  const data = generateNormalData(deviceId);
  switch (anomalyType) {
    case 'low-pressure':
      data.outletPressure = 1.0;
      break;
    case 'high-temperature':
      data.temperature = 60;
      break;
    case 'high-flow':
      data.flowRate = 1500;
      break;
  }
  return data;
}
```

### 测试覆盖率目标

- 单元测试覆盖率：> 80%
- 属性测试覆盖：所有30个正确性属性
- 集成测试：核心工作流和API端点
- E2E测试：关键用户场景

### 持续测试

**CI/CD集成**:
- 每次提交运行单元测试和属性测试
- 每日运行完整的集成测试套件
- 部署前运行E2E测试

**测试报告**:
- 生成覆盖率报告
- 记录属性测试的迭代次数和失败案例
- 追踪测试执行时间趋势
