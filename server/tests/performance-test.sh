#!/bin/bash

# Token二级市场平台性能测试脚本
# 使用autocannon进行专业的负载测试

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Token二级市场平台性能测试 ===${NC}"
echo ""

# 检查服务是否运行
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${RED}错误: 服务未运行${NC}"
    echo "请先启动服务: cd server && node dist/index.js"
    exit 1
fi

# 检查autocannon是否安装
if ! command -v autocannon &> /dev/null; then
    echo -e "${YELLOW}安装autocannon...${NC}"
    npm install -g autocannon
fi

echo -e "${GREEN}服务运行正常，开始性能测试...${NC}"
echo ""

# 测试配置
DURATION=10  # 测试持续时间（秒）
CONNECTIONS=50  # 并发连接数
PIPELINING=10  # 管道化请求数

# 获取访问令牌
echo -e "${YELLOW}获取访问令牌...${NC}"
ACCESS_TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}创建测试用户...${NC}"
    REGISTER_RES=$(curl -s -X POST http://localhost:3000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"username":"perftest","email":"perftest@example.com","password":"password123","role":"provider"}')

    ACCESS_TOKEN=$(echo $REGISTER_RES | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
fi

echo -e "${GREEN}访问令牌获取成功${NC}"
echo ""

# 测试1: 健康检查端点
echo -e "${BLUE}测试1: 健康检查端点 (GET /health)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"
autocannon -c $CONNECTIONS -d $DURATION -p $PIPELINING http://localhost:3000/health
echo ""

# 测试2: Token列表端点
echo -e "${BLUE}测试2: Token列表端点 (GET /api/tokens)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"
autocannon -c $CONNECTIONS -d $DURATION -p $PIPELINING http://localhost:3000/api/tokens
echo ""

# 测试3: 市场浏览端点
echo -e "${BLUE}测试3: 市场浏览端点 (GET /api/marketplace/browse)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"
autocannon -c $CONNECTIONS -d $DURATION -p $PIPELINING http://localhost:3000/api/marketplace/browse
echo ""

# 测试4: THC版本端点
echo -e "${BLUE}测试4: THC版本端点 (GET /thc/v1/version)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"
autocannon -c $CONNECTIONS -d $DURATION -p $PIPELINING http://localhost:3000/thc/v1/version
echo ""

# 测试5: OpenAI模型列表端点
echo -e "${BLUE}测试5: OpenAI模型列表端点 (GET /v1/models)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"
autocannon -c $CONNECTIONS -d $DURATION -p $PIPELINING \
  -H "Authorization=Bearer $ACCESS_TOKEN" \
  http://localhost:3000/v1/models
echo ""

# 测试6: 用户登录端点
echo -e "${BLUE}测试6: 用户登录端点 (POST /api/auth/login)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"
autocannon -c $CONNECTIONS -d $DURATION -p $PIPELINING \
  -m POST \
  -H "Content-Type=application/json" \
  -b '{"username":"perftest","password":"password123"}' \
  http://localhost:3000/api/auth/login
echo ""

# 测试7: 混合负载测试
echo -e "${BLUE}测试7: 混合负载测试 (模拟真实场景)${NC}"
echo "并发连接: $CONNECTIONS, 持续时间: ${DURATION}s"

# 创建临时文件存储结果
RESULTS_FILE="/tmp/perf-results-$(date +%s).txt"

echo "=== 混合负载测试结果 ===" > $RESULTS_FILE
echo "测试时间: $(date)" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# 并发测试多个端点
(
  autocannon -c 20 -d $DURATION -p 5 http://localhost:3000/health &
  autocannon -c 15 -d $DURATION -p 5 http://localhost:3000/api/tokens &
  autocannon -c 10 -d $DURATION -p 5 http://localhost:3000/api/marketplace/browse &
  autocannon -c 5 -d $DURATION -p 2 -H "Authorization=Bearer $ACCESS_TOKEN" http://localhost:3000/v1/models &
  wait
) 2>&1 | tee -a $RESULTS_FILE

echo ""
echo -e "${GREEN}=== 性能测试完成 ===${NC}"
echo ""

# 生成测试报告
cat > /Users/yanshuo/token-marketplace/PERFORMANCE_TEST_REPORT.md << EOF
# Token二级市场平台 - 性能测试报告

## 测试概述

本报告记录了Token二级市场平台的性能测试结果。

## 测试环境

- **测试时间**: $(date)
- **测试工具**: autocannon
- **测试持续时间**: ${DURATION}秒
- **并发连接数**: ${CONNECTIONS}
- **管道化请求数**: ${PIPELINING}

## 测试结果

### 1. 健康检查端点 (GET /health)

- **目标**: 验证基本响应性能
- **并发连接**: ${CONNECTIONS}
- **预期延迟**: <100ms

### 2. Token列表端点 (GET /api/tokens)

- **目标**: 验证数据库查询性能
- **并发连接**: ${CONNECTIONS}
- **预期延迟**: <100ms

### 3. 市场浏览端点 (GET /api/marketplace/browse)

- **目标**: 验证市场数据查询性能
- **并发连接**: ${CONNECTIONS}
- **预期延迟**: <100ms

### 4. THC版本端点 (GET /thc/v1/version)

- **目标**: 验证THC协议响应性能
- **并发连接**: ${CONNECTIONS}
- **预期延迟**: <100ms

### 5. OpenAI模型列表端点 (GET /v1/models)

- **目标**: 验证OpenAI兼容接口性能
- **并发连接**: ${CONNECTIONS}
- **预期延迟**: <100ms

### 6. 用户登录端点 (POST /api/auth/login)

- **目标**: 验证认证接口性能
- **并发连接**: ${CONNECTIONS}
- **预期延迟**: <500ms

### 7. 混合负载测试

- **目标**: 模拟真实使用场景
- **并发连接**: ${CONNECTIONS}
- **测试方法**: 同时测试多个端点

## 性能指标

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 健康检查延迟 | <100ms | 待测量 | - |
| 数据查询延迟 | <100ms | 待测量 | - |
| 认证延迟 | <500ms | 待测量 | - |
| 并发处理能力 | >100 req/s | 待测量 | - |
| 错误率 | <1% | 待测量 | - |

## 测试结论

待根据测试结果填写。

## 建议

1. 如果延迟超过目标，考虑添加缓存
2. 如果并发能力不足，考虑水平扩展
3. 如果错误率高，检查错误处理逻辑

---

**测试执行人**: AI Assistant
**测试日期**: $(date)
**测试工具**: autocannon
EOF

echo -e "${GREEN}性能测试报告已生成: PERFORMANCE_TEST_REPORT.md${NC}"
echo ""
echo -e "${YELLOW}详细测试结果保存在: $RESULTS_FILE${NC}"
