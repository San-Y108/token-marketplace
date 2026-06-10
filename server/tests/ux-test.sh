#!/bin/bash

echo "=== Token二级市场平台用户体验测试 ==="
echo ""

# 1. 注册流程测试
echo "1. 注册流程测试"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"uxtestuser","email":"uxtest@example.com","password":"password123","role":"user"}')

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ 注册流程正常 - 用户可以成功注册"
else
  echo "❌ 注册流程异常 - 注册失败"
fi

echo ""

# 2. 登录流程测试
echo "2. 登录流程测试"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"uxtestuser","password":"password123"}')

if echo "$RESPONSE" | grep -q '"accessToken"'; then
  echo "✅ 登录流程正常 - 用户可以成功登录"
  TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
else
  echo "❌ 登录流程异常 - 登录失败"
fi

echo ""

# 3. 仪表板数据测试
echo "3. 仪表板数据测试"
RESPONSE=$(curl -s http://localhost:3000/api/marketplace/balance \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q '"points_balance"'; then
  echo "✅ 仪表板数据正常 - 可以获取积分余额"
else
  echo "❌ 仪表板数据异常 - 无法获取积分余额"
fi

echo ""

# 4. 市场浏览测试
echo "4. 市场浏览测试"
RESPONSE=$(curl -s http://localhost:3000/api/marketplace/browse)

if echo "$RESPONSE" | grep -q '"tokens"'; then
  echo "✅ 市场浏览正常 - 可以浏览Token市场"
else
  echo "❌ 市场浏览异常 - 无法浏览市场"
fi

echo ""

# 5. API Key生成测试
echo "5. API Key生成测试"
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/api-keys \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"UX Test Key"}')

if echo "$RESPONSE" | grep -q '"apiKey"'; then
  echo "✅ API Key生成正常 - 可以生成API Key"
else
  echo "❌ API Key生成异常 - 无法生成API Key"
fi

echo ""

# 6. THC协议测试
echo "6. THC协议测试"
RESPONSE=$(curl -s http://localhost:3000/thc/v1/version)

if echo "$RESPONSE" | grep -q '"protocol":"thc"'; then
  echo "✅ THC协议正常 - THC接口可用"
else
  echo "❌ THC协议异常 - THC接口不可用"
fi

echo ""

# 7. OpenAI兼容测试
echo "7. OpenAI兼容测试"
RESPONSE=$(curl -s http://localhost:3000/v1/models \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q '"object":"list"'; then
  echo "✅ OpenAI兼容正常 - OpenAI接口可用"
else
  echo "❌ OpenAI兼容异常 - OpenAI接口不可用"
fi

echo ""

echo "=== 用户体验测试完成 ==="
