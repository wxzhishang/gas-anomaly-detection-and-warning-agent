# Requirements Document

## Introduction

本文档定义了燃气调压器异常检测AI Agent MVP系统的功能需求。该系统通过实时监测燃气调压器的传感器数据，使用统计方法进行异常检测，结合规则引擎和LLM进行根因分析，并通过WebSocket实时推送预警信息到监控面板。

MVP版本聚焦于核心功能验证，采用简化的单Agent架构，为后续迭代奠定基础。

## Glossary

- **System**: 燃气调压器异常检测AI Agent系统
- **Sensor_Data**: 传感器数据，包括进口压力、出口压力、温度、流量
- **Anomaly_Detector**: 异常检测模块
- **Root_Cause_Analyzer**: 根因分析模块
- **Alert_Manager**: 预警管理模块
- **Monitoring_Dashboard**: 监控面板
- **TimescaleDB**: 时序数据库
- **Redis**: 缓存数据库
- **LLM**: 大语言模型
- **Z-Score**: 标准分数，用于统计异常检测
- **Baseline**: 基线统计数据，包括均值和标准差
- **WebSocket**: 实时双向通信协议

## Requirements

### Requirement 1: 数据采集与存储

**User Story:** 作为系统，我需要接收并存储传感器数据，以便进行异常检测和历史分析。

#### Acceptance Criteria

1. WHEN THE System接收到传感器数据请求 THEN THE System SHALL验证数据格式和字段完整性
2. WHEN 数据验证通过 THEN THE System SHALL将数据存储到TimescaleDB
3. WHEN 数据验证失败 THEN THE System SHALL返回明确的错误信息并拒绝存储
4. THE System SHALL在100毫秒内完成单条数据的接收和存储
5. WHEN 存储数据 THEN THE System SHALL记录时间戳、设备ID、进口压力、出口压力、温度和流量

### Requirement 2: 基线统计计算

**User Story:** 作为异常检测模块，我需要计算设备的基线统计数据，以便识别偏离正常模式的异常值。

#### Acceptance Criteria

1. WHEN THE Anomaly_Detector计算基线 THEN THE System SHALL查询最近1000条历史数据
2. WHEN 计算基线统计 THEN THE System SHALL为每个指标计算均值和标准差
3. WHEN 基线计算完成 THEN THE System SHALL将结果缓存到Redis
4. THE System SHALL每小时自动更新一次基线统计
5. WHEN 历史数据不足1000条 THEN THE System SHALL使用所有可用数据计算基线

### Requirement 3: 异常检测

**User Story:** 作为异常检测模块，我需要使用Z-Score方法检测异常数据，以便及时发现设备运行异常。

#### Acceptance Criteria

1. WHEN THE Anomaly_Detector接收到新数据 THEN THE System SHALL从Redis获取对应设备的基线统计
2. WHEN 执行异常检测 THEN THE System SHALL为每个指标计算Z-Score值
3. WHEN Z-Score绝对值大于3 THEN THE System SHALL标记该指标为异常
4. WHEN 检测到异常 THEN THE System SHALL记录异常指标、数值和Z-Score
5. THE System SHALL每分钟执行一次异常检测任务
6. WHEN 检测到异常 THEN THE System SHALL触发根因分析流程

### Requirement 4: 规则引擎根因分析

**User Story:** 作为根因分析模块，我需要使用预定义规则匹配异常模式，以便快速识别常见故障原因。

#### Acceptance Criteria

1. WHEN THE Root_Cause_Analyzer接收到异常数据 THEN THE System SHALL遍历规则库进行匹配
2. WHEN 规则条件满足 THEN THE System SHALL返回对应的故障原因和处理建议
3. THE System SHALL支持至少5条预定义规则
4. WHEN 多条规则匹配 THEN THE System SHALL返回优先级最高的规则结果
5. WHEN 规则匹配成功 THEN THE System SHALL标记分析方法为rule-based并设置置信度为0.8

### Requirement 5: LLM增强根因分析

**User Story:** 作为根因分析模块，当规则无法匹配时，我需要调用LLM进行分析，以便处理复杂或未知的异常情况。

#### Acceptance Criteria

1. WHEN 规则引擎无法匹配 THEN THE System SHALL构建包含异常信息的提示词
2. WHEN 调用LLM THEN THE System SHALL设置5秒超时限制
3. WHEN LLM响应超时 THEN THE System SHALL使用默认分析结果
4. WHEN LLM返回结果 THEN THE System SHALL解析故障原因和处理建议
5. WHEN LLM分析完成 THEN THE System SHALL标记分析方法为llm-enhanced并设置置信度为0.6

### Requirement 6: 预警生成与推送

**User Story:** 作为预警管理模块，我需要生成预警信息并实时推送到前端，以便运维人员及时响应。

#### Acceptance Criteria

1. WHEN 根因分析完成 THEN THE Alert_Manager SHALL生成预警记录
2. WHEN 生成预警 THEN THE System SHALL包含设备ID、预警等级、异常信息、根因分析结果和时间戳
3. WHEN 异常指标数量大于2或Z-Score大于5 THEN THE System SHALL设置预警等级为严重
4. WHEN 异常指标数量小于等于2且Z-Score小于等于5 THEN THE System SHALL设置预警等级为警告
5. WHEN 预警生成完成 THEN THE System SHALL通过WebSocket推送到所有连接的客户端
6. THE System SHALL在1秒内完成预警推送

### Requirement 7: 实时数据展示

**User Story:** 作为运维人员，我需要在监控面板上查看实时传感器数据，以便了解设备当前运行状态。

#### Acceptance Criteria

1. WHEN THE Monitoring_Dashboard加载 THEN THE System SHALL建立WebSocket连接
2. WHEN 接收到新的传感器数据 THEN THE Monitoring_Dashboard SHALL更新实时图表
3. THE Monitoring_Dashboard SHALL显示最近1小时的数据
4. WHEN 数据点超过3600个 THEN THE System SHALL移除最早的数据点
5. THE Monitoring_Dashboard SHALL每秒刷新一次图表

### Requirement 8: 预警列表展示

**User Story:** 作为运维人员，我需要查看预警列表，以便了解历史和当前的异常情况。

#### Acceptance Criteria

1. WHEN THE Monitoring_Dashboard加载 THEN THE System SHALL查询最近的预警记录
2. WHEN 接收到新预警 THEN THE Monitoring_Dashboard SHALL将其添加到列表顶部
3. THE Monitoring_Dashboard SHALL显示预警等级、设备ID、异常信息、根因和时间
4. WHEN 预警等级为严重 THEN THE System SHALL使用红色高亮显示
5. WHEN 预警等级为警告 THEN THE System SHALL使用黄色高亮显示

### Requirement 9: 设备状态管理

**User Story:** 作为系统，我需要管理设备信息和状态，以便支持多设备监控扩展。

#### Acceptance Criteria

1. THE System SHALL在数据库中存储设备ID、名称和状态
2. WHEN 接收到新设备的数据 THEN THE System SHALL自动创建设备记录
3. THE System SHALL将设备默认状态设置为active
4. WHEN 查询设备状态 THEN THE System SHALL返回设备ID、名称和最新数据时间
5. THE System SHALL支持通过API查询所有设备列表

### Requirement 10: 数据验证

**User Story:** 作为系统，我需要验证传感器数据的合理性，以便过滤错误数据。

#### Acceptance Criteria

1. WHEN 验证进口压力 THEN THE System SHALL确保值在0.1到1.0 MPa范围内
2. WHEN 验证出口压力 THEN THE System SHALL确保值在0.5到5.0 MPa范围内
3. WHEN 验证温度 THEN THE System SHALL确保值在-20到80摄氏度范围内
4. WHEN 验证流量 THEN THE System SHALL确保值在0到2000立方米每小时范围内
5. WHEN 任何指标超出范围 THEN THE System SHALL拒绝数据并返回具体的验证错误信息

### Requirement 11: 定时任务调度

**User Story:** 作为系统，我需要定时执行异常检测和基线更新任务，以便持续监控设备状态。

#### Acceptance Criteria

1. THE System SHALL每分钟执行一次异常检测任务
2. THE System SHALL每小时执行一次基线统计更新任务
3. WHEN 定时任务执行失败 THEN THE System SHALL记录错误日志
4. WHEN 定时任务执行 THEN THE System SHALL处理所有活跃设备
5. THE System SHALL支持手动触发定时任务

### Requirement 12: WebSocket连接管理

**User Story:** 作为系统，我需要管理WebSocket连接，以便实现可靠的实时通信。

#### Acceptance Criteria

1. WHEN 客户端连接 THEN THE System SHALL建立WebSocket连接并记录连接ID
2. WHEN 客户端断开 THEN THE System SHALL清理连接记录
3. WHEN 推送消息失败 THEN THE System SHALL自动移除失效连接
4. THE System SHALL支持同时连接至少10个客户端
5. WHEN 连接建立 THEN THE System SHALL发送连接确认消息

### Requirement 13: 错误处理

**User Story:** 作为系统，我需要优雅地处理各种错误情况，以便保证系统稳定性。

#### Acceptance Criteria

1. WHEN 数据库连接失败 THEN THE System SHALL返回503服务不可用错误
2. WHEN Redis连接失败 THEN THE System SHALL降级为无缓存模式并记录警告
3. WHEN LLM调用失败 THEN THE System SHALL使用默认分析结果
4. WHEN 发生未捕获异常 THEN THE System SHALL记录完整错误堆栈并返回500错误
5. THE System SHALL为所有API端点提供统一的错误响应格式

### Requirement 14: 日志记录

**User Story:** 作为开发和运维人员，我需要详细的日志记录，以便调试和监控系统运行状态。

#### Acceptance Criteria

1. THE System SHALL记录所有API请求和响应
2. WHEN 检测到异常 THEN THE System SHALL记录异常详情和检测结果
3. WHEN 执行根因分析 THEN THE System SHALL记录分析方法和结果
4. THE System SHALL使用结构化JSON格式记录日志
5. THE System SHALL包含时间戳、日志级别、模块名称和消息内容
