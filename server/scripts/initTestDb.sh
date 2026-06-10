#!/bin/bash

# 测试数据库初始化脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 测试数据库初始化 ===${NC}"

# 数据库配置
TEST_DB_NAME="token_marketplace_test"
DB_USER="postgres"
DB_PASSWORD="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# 检查PostgreSQL是否运行
if ! pg_isready -q; then
    echo -e "${RED}错误: PostgreSQL未运行${NC}"
    echo "请先启动PostgreSQL服务"
    exit 1
fi

echo -e "${YELLOW}正在创建测试数据库...${NC}"

# 创建测试数据库
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "DROP DATABASE IF EXISTS $TEST_DB_NAME;" 2>/dev/null || true
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $TEST_DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}测试数据库 '$TEST_DB_NAME' 创建成功${NC}"
else
    echo -e "${RED}测试数据库创建失败${NC}"
    exit 1
fi

# 执行schema
echo -e "${YELLOW}正在执行数据库schema...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEMA_FILE="$SCRIPT_DIR/../database/schema.sql"

if [ -f "$SCHEMA_FILE" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $TEST_DB_NAME -f "$SCHEMA_FILE"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}数据库schema执行成功${NC}"
    else
        echo -e "${RED}数据库schema执行失败${NC}"
        exit 1
    fi
else
    echo -e "${RED}错误: 找不到schema文件: $SCHEMA_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}=== 测试数据库初始化完成 ===${NC}"
echo ""
echo "测试数据库连接信息:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $TEST_DB_NAME"
echo "  User: $DB_USER"
echo ""
echo "连接字符串: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$TEST_DB_NAME"
