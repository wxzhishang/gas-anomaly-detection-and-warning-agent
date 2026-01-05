# 燃气调压器异常检测AI Agent MVP系统

基于AI Agent的燃气调压器实时监控和异常检测系统，采用统计方法和LLM增强的根因分析。

## 系统架构

- **后端**: Bun + NestJS + LangGraph
- **前端**: Next.js 14 + Tailwind CSS + ECharts
- **数据库**: TimescaleDB (时序数据) + Redis (缓存)
- **AI**: LangGraph工作流 + 多LLM支持

## 快速开始

### 前置要求

- Bun >= 1.0.0
- Docker & Docker Compose

### 安装Bun

```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (使用WSL)
# 先安装WSL，然后在WSL中运行上面的命令

# 验证安装
bun --version
```

### 1. 克隆项目

```bash
git clone <repository-url>
cd gas-regulator-mvp
```

### 2. 安装依赖

```bash
bun install
```

### 3. 启动数据库服务

```bash
docker-compose up -d
```

等待数据库初始化完成（约10-20秒）。

### 4. 配置环境变量

```bash
# 后端配置
cp apps/api/.env.example apps/api/.env
# 编辑 apps/api/.env，填入你的OpenAI API Key

# 前端配置
cp apps/web/.env.example apps/web/.env
```

### 5. 启动开发服务器

```bash
# 启动所有服务
bun run dev

# 或分别启动
cd apps/api && bun run dev  # 后端: http://localhost:3001
cd apps/web && bun run dev  # 前端: http://localhost:3000
```

## 项目结构

```
gas-regulator-mvp/
├── apps/
│   ├── api/                    # NestJS后端服务
│   │   ├── src/
│   │   │   ├── modules/        # 业务模块
│   │   │   │   ├── data/       # 数据采集模块
│   │   │   │   ├── detection/  # 异常检测模块
│   │   │   │   ├── analysis/   # 根因分析模块
│   │   │   │   └── alert/      # 预警模块
│   │   │   ├── agent/          # LangGraph Agent
│   │   │   └── main.ts         # 入口文件
│   │   └── package.json
│   │
│   └── web/                    # Next.js前端
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── components/     # React组件
│       │   └── lib/            # 工具函数
│       └── package.json
│
├── docs/                       # 文档
│   ├── MVP实施方案.md
│   └── 燃气调压器异常检测AI Agent技术方案.md
│
├── scripts/                    # 脚本
│   └── init-db.sql            # 数据库初始化
│
├── .kiro/specs/               # 规范文档
│   └── gas-regulator-mvp/
│       ├── requirements.md    # 需求文档
│       ├── design.md          # 设计文档
│       └── tasks.md           # 任务列表
│
├── docker-compose.yml         # Docker配置
├── turbo.json                 # Turbo配置
└── package.json               # 根package.json
```

## 核心功能

### 1. 数据采集
- REST API接收传感器数据
- 数据验证和范围检查
- TimescaleDB时序存储

### 2. 异常检测
- Z-Score统计方法
- 滑动窗口基线计算
- 定时任务自动检测

### 3. 根因分析
- 规则引擎快速匹配
- LLM增强分析
- LangGraph工作流编排

### 4. 实时预警
- WebSocket实时推送
- 预警等级判定
- 监控面板展示

## API端点

### 数据采集
- `POST /api/data` - 接收传感器数据
- `GET /api/data/:deviceId` - 查询历史数据
- `GET /api/devices` - 获取设备列表

### 预警查询
- `GET /api/alerts` - 查询所有预警
- `GET /api/alerts/:deviceId` - 查询设备预警

### WebSocket
- `ws://localhost:3001` - 实时数据和预警推送

## 开发指南

### 运行测试

```bash
# 运行所有测试
bun test

# 运行单个应用的测试
cd apps/api && bun test
cd apps/web && bun test
```

### 代码格式化

```bash
bun run format
```

### 代码检查

```bash
bun run lint
```

### 构建生产版本

```bash
bun run build
```

## 数据库管理

### 连接数据库

```bash
docker exec -it gas-regulator-timescaledb psql -U postgres -d gas_regulator
```

### 查看表结构

```sql
\dt                                    -- 查看所有表
\d sensor_data                         -- 查看sensor_data表结构
SELECT * FROM timescaledb_information.hypertables;  -- 查看超表信息
```

### 查询数据

```sql
-- 查询最近的传感器数据
SELECT * FROM sensor_data 
ORDER BY time DESC 
LIMIT 10;

-- 查询设备列表
SELECT * FROM devices;

-- 查询预警记录
SELECT * FROM alerts 
ORDER BY created_at DESC 
LIMIT 10;
```

## 故障排查

### 数据库连接失败

```bash
# 检查数据库状态
docker-compose ps

# 查看数据库日志
docker-compose logs timescaledb

# 重启数据库
docker-compose restart timescaledb
```

### Redis连接失败

```bash
# 检查Redis状态
docker-compose ps

# 测试Redis连接
docker exec -it gas-regulator-redis redis-cli ping
```

### 端口冲突

如果端口被占用，修改docker-compose.yml中的端口映射：

```yaml
ports:
  - "5433:5432"  # 修改PostgreSQL端口
  - "6380:6379"  # 修改Redis端口
```

## 环境变量说明

### 后端 (apps/api/.env)

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gas_regulator
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
PORT=3001
NODE_ENV=development
LOG_LEVEL=info
```

### 前端 (apps/web/.env)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

MIT License

## 联系方式

项目链接: [https://github.com/yourusername/gas-regulator-mvp](https://github.com/yourusername/gas-regulator-mvp)
