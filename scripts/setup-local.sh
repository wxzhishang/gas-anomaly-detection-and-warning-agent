#!/bin/bash

# 本地开发环境快速设置脚本（无 Docker）

set -e

echo "🚀 开始设置本地开发环境..."

# 检查 Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ 未检测到 Homebrew，请先安装: https://brew.sh"
    exit 1
fi

echo "✅ Homebrew 已安装"

# 添加 PostgreSQL 到 PATH
export PATH="/usr/local/opt/postgresql@16/bin:$PATH"

# 安装 PostgreSQL
echo "📦 检查 PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "正在安装 PostgreSQL 16..."
    brew install postgresql@16
else
    echo "✅ PostgreSQL 已安装"
fi

# 启动 PostgreSQL
echo "🔄 启动 PostgreSQL 服务..."
brew services start postgresql@16

# 等待 PostgreSQL 启动
sleep 3

# 安装 Redis
echo "📦 检查 Redis..."
if ! command -v redis-cli &> /dev/null; then
    echo "正在安装 Redis..."
    brew install redis
else
    echo "✅ Redis 已安装"
fi

# 启动 Redis
echo "🔄 启动 Redis 服务..."
brew services start redis

# 等待 Redis 启动
sleep 2

# 验证 Redis
echo "🔍 验证 Redis 连接..."
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 运行正常"
else
    echo "❌ Redis 连接失败"
    exit 1
fi

# 创建数据库
echo "🗄️  创建数据库..."
if psql -lqt | cut -d \| -f 1 | grep -qw gas_regulator; then
    echo "✅ 数据库 gas_regulator 已存在"
else
    createdb gas_regulator
    echo "✅ 数据库创建成功"
fi

# 初始化数据库表结构
echo "📋 初始化数据库表结构..."
if [ -f "scripts/init-db.sql" ]; then
    psql gas_regulator < scripts/init-db.sql
    echo "✅ 数据库表结构初始化完成"
else
    echo "⚠️  未找到 init-db.sql 文件"
fi

# 安装 TimescaleDB（可选）
echo "📦 检查 TimescaleDB..."
echo "⚠️  TimescaleDB 需要从源码安装，跳过此步骤"
echo "💡 提示：项目可以在没有 TimescaleDB 的情况下运行，只是时序查询性能会稍低"

# 验证安装
echo ""
echo "🔍 验证安装..."
echo "----------------------------------------"

# 检查 PostgreSQL
PG_VERSION=$(psql --version | head -n 1)
echo "PostgreSQL: $PG_VERSION"

# 检查 Redis
REDIS_VERSION=$(redis-cli --version)
echo "Redis: $REDIS_VERSION"

# 检查数据库连接
if psql gas_regulator -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
fi

# 检查 TimescaleDB
if psql gas_regulator -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'timescaledb';" 2>/dev/null | grep -q timescaledb; then
    echo "✅ TimescaleDB 扩展已启用"
else
    echo "ℹ️  TimescaleDB 扩展未启用（不影响基本功能）"
fi

echo "----------------------------------------"
echo ""
echo "✨ 本地开发环境设置完成！"
echo ""
echo "⚠️  重要：将 PostgreSQL 添加到 PATH"
echo "运行以下命令（根据你的 shell 选择）："
echo ""
echo "# 如果使用 bash (~/.bash_profile 或 ~/.bashrc)"
echo 'echo '\''export PATH="/usr/local/opt/postgresql@16/bin:$PATH"'\'' >> ~/.bash_profile'
echo 'source ~/.bash_profile'
echo ""
echo "# 如果使用 zsh (~/.zshrc)"
echo 'echo '\''export PATH="/usr/local/opt/postgresql@16/bin:$PATH"'\'' >> ~/.zshrc'
echo 'source ~/.zshrc'
echo ""
echo "📝 下一步："
echo "1. 添加 PostgreSQL 到 PATH（见上方命令）"
echo "2. 编辑 .env 文件，配置 LLM_API_KEY"
echo "3. 启动 API 服务: cd apps/api && bun run dev"
echo "4. 启动 Web 服务: cd apps/web && yarn dev"
echo "5. 运行数据生成器: bun run generate:data"
echo ""
echo "🔗 访问地址："
echo "   - 前端: http://localhost:3001"
echo "   - API: http://localhost:3000"
echo "   - 健康检查: http://localhost:3000/health"
echo ""
echo "📚 查看完整文档: docs/本地开发环境配置指南.md"
