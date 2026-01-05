#!/bin/bash

echo "=== 燃气调压器异常检测系统 - 环境验证 ==="
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Docker服务
echo "1. 检查Docker服务..."
docker compose ps | grep -q "Up"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Docker服务运行正常${NC}"
else
    echo -e "${RED}✗ Docker服务未运行${NC}"
    exit 1
fi

# 检查TimescaleDB
echo ""
echo "2. 检查TimescaleDB..."
docker exec gas-regulator-timescaledb psql -U postgres -d gas_regulator -c "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TimescaleDB连接正常${NC}"
    
    # 检查表
    TABLES=$(docker exec gas-regulator-timescaledb psql -U postgres -d gas_regulator -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'")
    echo "  - 数据库表数量: $TABLES"
    
    # 检查超表
    HYPERTABLES=$(docker exec gas-regulator-timescaledb psql -U postgres -d gas_regulator -t -c "SELECT COUNT(*) FROM timescaledb_information.hypertables")
    echo "  - 超表数量: $HYPERTABLES"
else
    echo -e "${RED}✗ TimescaleDB连接失败${NC}"
    exit 1
fi

# 检查Redis
echo ""
echo "3. 检查Redis..."
docker exec gas-regulator-redis redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Redis连接正常${NC}"
else
    echo -e "${RED}✗ Redis连接失败${NC}"
    exit 1
fi

# 检查环境变量
echo ""
echo "4. 检查环境配置..."
if [ -f "apps/api/.env" ]; then
    echo -e "${GREEN}✓ .env文件存在${NC}"
else
    echo -e "${RED}✗ .env文件不存在${NC}"
    exit 1
fi

# 运行测试
echo ""
echo "5. 运行单元测试..."
cd apps/api
bun test data.service.test.ts --run > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 数据采集模块测试通过${NC}"
else
    echo -e "${RED}✗ 测试失败${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}=== 所有检查通过！系统准备就绪 ===${NC}"
echo ""
echo "下一步："
echo "  1. 启动API服务: cd apps/api && bun run dev"
echo "  2. 测试API端点: curl http://localhost:3001/api/devices"
echo ""
