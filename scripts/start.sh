#!/bin/bash

# Token二级市场平台启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Token二级市场平台启动脚本 ===${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未找到Node.js${NC}"
    echo "请先安装Node.js 18+"
    exit 1
fi

# 检查Node.js版本
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}错误: Node.js版本过低${NC}"
    echo "需要Node.js 18+，当前版本: $(node -v)"
    exit 1
fi

# 检查pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到pnpm，正在安装...${NC}"
    npm install -g pnpm
fi

# 检查PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}警告: 未找到PostgreSQL客户端${NC}"
    echo "请确保PostgreSQL已安装并正在运行"
fi

# 进入项目目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo -e "${YELLOW}当前目录: $(pwd)${NC}"

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}正在安装依赖...${NC}"
    pnpm install
fi

# 检查环境变量
if [ ! -f "server/.env" ]; then
    echo -e "${YELLOW}警告: 未找到server/.env文件${NC}"
    echo "正在从模板创建..."
    cp server/.env.example server/.env 2>/dev/null || echo "请手动创建server/.env文件"
fi

# 检查数据库
echo -e "${YELLOW}检查数据库连接...${NC}"
if command -v psql &> /dev/null; then
    # 尝试连接数据库
    if psql -U postgres -h localhost -c "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}数据库连接成功${NC}"

        # 检查数据库是否存在
        if ! psql -U postgres -h localhost -lqt | cut -d \| -f 1 | grep -qw token_marketplace; then
            echo -e "${YELLOW}正在创建数据库...${NC}"
            ./server/scripts/initDb.sh
        else
            echo -e "${GREEN}数据库已存在${NC}"
        fi
    else
        echo -e "${YELLOW}警告: 无法连接到PostgreSQL${NC}"
        echo "请确保PostgreSQL正在运行，并且配置正确"
        echo "您可以手动运行: ./server/scripts/initDb.sh"
    fi
else
    echo -e "${YELLOW}跳过数据库检查（未找到psql）${NC}"
fi

# 启动服务
echo -e "${GREEN}正在启动服务...${NC}"
echo ""

# 检查是否使用PM2
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}使用PM2启动服务...${NC}"
    pm2 start ecosystem.config.js 2>/dev/null || {
        echo -e "${YELLOW}PM2配置不存在，使用直接启动...${NC}"
        cd server && pnpm dev
    }
else
    echo -e "${YELLOW}使用直接启动...${NC}"
    cd server && pnpm dev
fi
