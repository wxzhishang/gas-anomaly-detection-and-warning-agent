#!/bin/bash

echo "=== Docker环境检查 ==="
echo ""

echo "1. 检查Docker版本..."
docker --version

echo ""
echo "2. 检查Docker运行状态..."
docker info > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Docker正在运行"
else
    echo "✗ Docker未运行，请启动Docker Desktop"
    exit 1
fi

echo ""
echo "3. 检查网络连接..."
ping -c 2 registry-1.docker.io > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ 可以连接到Docker Hub"
else
    echo "✗ 无法连接到Docker Hub"
    echo "  建议："
    echo "  - 配置Docker镜像加速器"
    echo "  - 使用VPN或代理"
fi

echo ""
echo "4. 检查现有镜像..."
docker images

echo ""
echo "5. 检查运行中的容器..."
docker ps -a

echo ""
echo "=== 建议的镜像源配置 ==="
echo "在Docker Desktop设置中添加以下镜像源："
echo ""
echo '{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev"
  ]
}'

echo ""
echo "=== 或者尝试使用简化版docker-compose ==="
echo "运行: docker compose -f docker-compose.simple.yml up -d"
