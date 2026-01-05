# 实施计划：燃气调压器异常检测AI Agent MVP

## 概述

本实施计划将设计文档转化为可执行的开发任务。采用增量开发方式，每个任务都建立在前一个任务的基础上，确保系统逐步成型且可随时验证。

实施语言：**TypeScript**（使用Bun运行时 + NestJS框架）

## 任务列表

- [x] 1. 项目初始化和基础设施搭建
  - 初始化Monorepo项目结构（Turbo + Yarn）
  - 配置TypeScript、ESLint、Prettier
  - 创建apps/api和apps/web目录
  - 配置Docker Compose（TimescaleDB + Redis）
  - 编写数据库初始化脚本
  - _需求: 所有需求的基础_

- [x] 2. 数据库Schema和模型定义
  - [x] 2.1 创建TimescaleDB表结构
    - 创建sensor_data超表
    - 创建devices表
    - 创建alerts表
    - 添加索引和保留策略
    - _需求: 1.2, 1.5, 9.1_

  - [ ]* 2.2 编写数据库迁移测试
    - 测试表创建成功
    - 测试索引创建成功
    - 测试超表转换成功
    - _需求: 1.2, 9.1_

- [ ] 3. 数据采集模块实现
  - [ ] 3.1 实现DataService核心逻辑
    - 实现数据验证方法（validateSensorData）
    - 实现数据存储方法（receiveSensorData）
    - 实现历史数据查询（queryHistoricalData, getRecentData）
    - 实现设备自动注册逻辑
    - _需求: 1.1, 1.2, 1.3, 1.5, 9.2, 9.3, 10.1-10.5_

  - [ ]* 3.2 编写Property 1测试：数据验证范围检查
    - **Property 1: 数据验证范围检查**
    - **验证需求: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**

  - [ ]* 3.3 编写Property 2测试：数据存储完整性
    - **Property 2: 数据存储完整性**
    - **验证需求: Requirements 1.2, 1.5**

  - [ ]* 3.4 编写Property 3测试：数据验证失败拒绝存储
    - **Property 3: 数据验证失败拒绝存储**
    - **验证需求: Requirements 1.3**

  - [ ]* 3.5 编写Property 20测试：设备自动注册
    - **Property 20: 设备自动注册**
    - **验证需求: Requirements 9.2, 9.3**

  - [ ] 3.6 实现REST API Controller
    - 创建DataController
    - 实现POST /api/data端点
    - 实现GET /api/data/:deviceId端点
    - 实现GET /api/devices端点
    - 添加请求验证和错误处理
    - _需求: 1.1, 1.3, 9.5_

  - [ ]* 3.7 编写API端点单元测试
    - 测试数据接收端点
    - 测试数据查询端点
    - 测试设备列表端点
    - 测试错误响应格式
    - _需求: 1.1, 1.3, 13.5_

- [ ] 4. Checkpoint - 数据采集模块验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 5. 异常检测模块实现
  - [ ] 5.1 实现DetectionService核心逻辑
    - 实现基线统计计算（calculateBaseline）
    - 实现基线缓存逻辑（getBaseline）
    - 实现Z-Score计算（calculateZScore）
    - 实现异常检测（detectAnomaly）
    - 实现Redis降级策略
    - _需求: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 3.4, 13.2_

  - [ ]* 5.2 编写Property 4测试：基线统计计算正确性
    - **Property 4: 基线统计计算正确性**
    - **验证需求: Requirements 2.2**

  - [ ]* 5.3 编写Property 5测试：基线缓存一致性
    - **Property 5: 基线缓存一致性**
    - **验证需求: Requirements 2.3**

  - [ ]* 5.4 编写Property 6测试：Z-Score计算正确性
    - **Property 6: Z-Score计算正确性**
    - **验证需求: Requirements 3.2**

  - [ ]* 5.5 编写Property 7测试：异常判定阈值
    - **Property 7: 异常判定阈值**
    - **验证需求: Requirements 3.3**

  - [ ]* 5.6 编写Property 8测试：异常检测结果完整性
    - **Property 8: 异常检测结果完整性**
    - **验证需求: Requirements 3.4**

  - [ ]* 5.7 编写Property 26测试：Redis降级策略
    - **Property 26: Redis降级策略**
    - **验证需求: Requirements 13.2**

  - [ ] 5.8 实现定时任务调度
    - 配置NestJS Schedule模块
    - 实现每分钟异常检测任务（detectAllDevices）
    - 实现每小时基线更新任务（updateAllBaselines）
    - 添加任务错误处理和日志
    - _需求: 3.5, 2.4, 11.1, 11.2, 11.3, 11.4_

  - [ ]* 5.9 编写Property 22和23测试：定时任务错误处理
    - **Property 22: 定时任务错误日志**
    - **Property 23: 定时任务处理范围**
    - **验证需求: Requirements 11.3, 11.4**

- [ ] 6. Checkpoint - 异常检测模块验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 7. 根因分析模块实现
  - [ ] 7.1 实现规则引擎
    - 定义Rule接口和规则数据结构
    - 实现至少5条预定义规则
    - 实现规则匹配逻辑（matchRules）
    - 实现规则优先级排序
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 7.2 编写Property 10测试：规则引擎匹配逻辑
    - **Property 10: 规则引擎匹配逻辑**
    - **验证需求: Requirements 4.1, 4.2**

  - [ ]* 7.3 编写Property 11测试：规则优先级处理
    - **Property 11: 规则优先级处理**
    - **验证需求: Requirements 4.4**

  - [ ] 7.4 集成LLM服务
    - 配置LangChain和LLM客户端
    - 实现提示词模板
    - 实现LLM调用逻辑（llmAnalysis）
    - 实现5秒超时和降级策略
    - 实现响应解析
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5, 13.3_

  - [ ]* 7.5 编写Property 12测试：根因分析结果元数据
    - **Property 12: 根因分析结果元数据**
    - **验证需求: Requirements 4.5, 5.5**

  - [ ]* 7.6 编写Property 13测试：LLM调用降级策略
    - **Property 13: LLM调用降级策略**
    - **验证需求: Requirements 5.3, 13.3**

  - [ ] 7.7 实现AnalysisService
    - 整合规则引擎和LLM分析
    - 实现analyzeRootCause方法
    - 添加错误处理和日志
    - _需求: 4.1, 5.1_

- [ ] 8. LangGraph工作流实现
  - [ ] 8.1 配置LangGraph
    - 安装@langchain/langgraph依赖
    - 定义AgentState接口
    - 创建工作流编排函数
    - _需求: 3.6_

  - [ ] 8.2 实现工作流节点
    - 实现detectNode（异常检测节点）
    - 实现analyzeNode（根因分析节点）
    - 实现alertNode（预警生成节点）
    - 实现pushNode（预警推送节点）
    - 定义节点间的边和条件
    - _需求: 3.6, 6.1_

  - [ ]* 8.3 编写Property 9测试：异常触发根因分析
    - **Property 9: 异常触发根因分析**
    - **验证需求: Requirements 3.6**

  - [ ]* 8.4 编写工作流集成测试
    - 测试完整工作流执行
    - 测试无异常时的短路逻辑
    - 测试异常时的完整流程
    - _需求: 3.6, 6.1_

- [ ] 9. Checkpoint - 分析模块验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 10. 预警模块实现
  - [ ] 10.1 实现AlertService
    - 实现预警生成逻辑（createAlert）
    - 实现预警等级判定（determineAlertLevel）
    - 实现预警查询（queryAlerts）
    - 实现预警存储到数据库
    - _需求: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 10.2 编写Property 14测试：预警生成完整性
    - **Property 14: 预警生成完整性**
    - **验证需求: Requirements 6.1, 6.2**

  - [ ]* 10.3 编写Property 15测试：预警等级判定逻辑
    - **Property 15: 预警等级判定逻辑**
    - **验证需求: Requirements 6.3, 6.4**

  - [ ] 10.4 实现WebSocket Gateway
    - 创建AlertGateway类
    - 实现连接管理（handleConnection, handleDisconnect）
    - 实现广播方法（broadcastSensorData, broadcastAlert）
    - 实现连接确认消息
    - 添加错误处理和失效连接清理
    - _需求: 6.5, 12.1, 12.2, 12.3, 12.5_

  - [ ]* 10.5 编写Property 16测试：预警WebSocket推送
    - **Property 16: 预警WebSocket推送**
    - **验证需求: Requirements 6.5**

  - [ ]* 10.6 编写Property 24和25测试：WebSocket连接管理
    - **Property 24: WebSocket连接管理**
    - **Property 25: WebSocket连接确认**
    - **验证需求: Requirements 12.1, 12.2, 12.3, 12.5**

  - [ ] 10.7 实现预警API端点
    - 创建AlertController
    - 实现GET /api/alerts端点
    - 实现GET /api/alerts/:deviceId端点
    - _需求: 8.1_

- [ ] 11. 全局错误处理和日志
  - [ ] 11.1 实现全局异常过滤器
    - 创建GlobalExceptionFilter
    - 实现统一错误响应格式
    - 添加错误日志记录
    - 处理不同类型的HTTP异常
    - _需求: 13.1, 13.4, 13.5_

  - [ ]* 11.2 编写Property 27和28测试：错误处理
    - **Property 27: 全局错误处理**
    - **Property 28: 错误响应格式一致性**
    - **验证需求: Requirements 13.4, 13.5**

  - [ ] 11.3 配置结构化日志
    - 配置Winston或Pino日志库
    - 实现JSON格式日志输出
    - 添加日志中间件记录API请求
    - 在关键模块添加日志记录
    - _需求: 14.1, 14.2, 14.3, 14.4, 14.5_

  - [ ]* 11.4 编写Property 29和30测试：日志记录
    - **Property 29: 结构化日志格式**
    - **Property 30: 关键事件日志记录**
    - **验证需求: Requirements 14.1, 14.2, 14.3, 14.4, 14.5**

- [ ] 12. Checkpoint - 后端完整性验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 13. 前端项目初始化
  - [ ] 13.1 创建Next.js应用
    - 初始化apps/web项目
    - 配置TypeScript和Tailwind CSS
    - 安装shadcn/ui组件库
    - 安装Apache ECharts
    - 配置环境变量
    - _需求: 7.1, 8.1_

  - [ ] 13.2 创建基础布局和路由
    - 创建主页面布局
    - 创建监控面板页面
    - 配置路由
    - _需求: 7.1, 8.1_

- [ ] 14. 实时监控面板实现
  - [ ] 14.1 实现WebSocket客户端
    - 创建WebSocket连接hook
    - 实现自动重连逻辑
    - 实现消息类型处理
    - _需求: 7.1, 7.2_

  - [ ] 14.2 实现实时数据图表组件
    - 创建SensorChart组件
    - 集成ECharts折线图
    - 实现数据窗口管理（最多3600个点）
    - 实现实时数据更新
    - _需求: 7.2, 7.3, 7.4_

  - [ ]* 14.3 编写Property 17测试：前端数据窗口管理
    - **Property 17: 前端数据窗口管理**
    - **验证需求: Requirements 7.4**

  - [ ] 14.4 实现设备状态卡片组件
    - 创建DeviceCard组件
    - 显示设备ID、名称和最新数据
    - 显示设备健康状态
    - _需求: 9.4_

  - [ ]* 14.5 编写Property 21测试：设备查询结果结构
    - **Property 21: 设备查询结果结构**
    - **验证需求: Requirements 9.4**

- [ ] 15. 预警列表实现
  - [ ] 15.1 实现预警列表组件
    - 创建AlertList组件
    - 实现预警项渲染（AlertItem）
    - 实现预警等级颜色标识
    - 实现时间格式化
    - _需求: 8.2, 8.3, 8.4, 8.5_

  - [ ]* 15.2 编写Property 18和19测试：预警列表
    - **Property 18: 预警列表插入位置**
    - **Property 19: 预警展示完整性**
    - **验证需求: Requirements 8.2, 8.3**

  - [ ] 15.3 实现预警实时更新
    - 监听WebSocket预警消息
    - 实现预警列表头部插入
    - 实现预警列表滚动
    - _需求: 8.2_

  - [ ] 15.4 实现预警历史查询
    - 创建API客户端
    - 实现页面加载时查询历史预警
    - 实现分页或滚动加载
    - _需求: 8.1_

- [ ] 16. 前端样式和交互优化
  - [ ] 16.1 实现响应式布局
    - 适配桌面和平板尺寸
    - 优化图表和列表布局
    - _需求: 7.1, 8.1_

  - [ ] 16.2 添加加载状态和错误处理
    - 实现加载骨架屏
    - 实现错误提示
    - 实现WebSocket断线重连提示
    - _需求: 7.1_

- [ ] 17. Checkpoint - 前端完整性验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 18. 端到端集成测试
  - [ ]* 18.1 编写E2E测试：完整工作流
    - 测试数据采集到预警推送的完整流程
    - 测试前端实时更新
    - 测试多设备场景
    - _需求: 所有核心需求_

  - [ ]* 18.2 编写E2E测试：错误场景
    - 测试数据验证失败
    - 测试数据库连接失败
    - 测试LLM超时降级
    - _需求: 1.3, 13.1, 13.2, 13.3_

- [ ] 19. 模拟数据生成器
  - [ ] 19.1 实现数据生成脚本
    - 创建正常数据生成函数
    - 创建异常数据生成函数
    - 实现持续发送数据的脚本
    - 添加命令行参数配置
    - _需求: 测试和演示_

  - [ ] 19.2 测试数据生成器
    - 验证生成的数据格式正确
    - 验证异常数据能触发预警
    - 验证数据发送频率
    - _需求: 测试和演示_

- [ ] 20. 部署配置和文档
  - [ ] 20.1 完善Docker配置
    - 优化docker-compose.yml
    - 创建生产环境Dockerfile
    - 配置环境变量模板
    - _需求: 部署_

  - [ ] 20.2 编写部署文档
    - 编写README.md
    - 编写开发环境搭建指南
    - 编写部署指南
    - 编写API文档
    - _需求: 文档_

  - [ ] 20.3 编写用户手册
    - 编写系统使用说明
    - 编写监控面板使用指南
    - 编写故障排查指南
    - _需求: 文档_

- [ ] 21. 最终验证和优化
  - [ ] 21.1 性能测试
    - 测试数据采集延迟
    - 测试异常检测延迟
    - 测试预警推送延迟
    - 测试并发连接数
    - _需求: 1.4, 6.6_

  - [ ] 21.2 系统稳定性测试
    - 运行24小时稳定性测试
    - 监控内存和CPU使用
    - 验证无内存泄漏
    - _需求: 系统稳定性_

  - [ ] 21.3 代码质量检查
    - 运行ESLint检查
    - 运行Prettier格式化
    - 检查测试覆盖率
    - 代码审查
    - _需求: 代码质量_

- [ ] 22. 最终Checkpoint - 系统交付验证
  - 确保所有测试通过，系统满足MVP成功标准，如有问题请询问用户

## 注意事项

- 标记为 `*` 的任务是可选的测试任务，可以跳过以加快MVP开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- Checkpoint任务用于增量验证，确保系统在每个阶段都是可工作的
- 属性测试使用fast-check库，每个测试运行100次迭代
- 单元测试使用Vitest框架
- 所有测试都应该在实现代码之后立即编写
