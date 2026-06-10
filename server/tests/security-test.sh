#!/bin/bash

# 安全渗透测试脚本

echo "=== Token二级市场平台安全渗透测试 ==="
echo ""

# 1. SQL注入测试
echo "1. SQL注入测试"
echo "测试登录接口..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin'\'' OR '\''1'\''='\''1","password":"anything'\'' OR '\''1'\''='\''1"}')

if echo "$RESPONSE" | grep -q '"success":false'; then
  echo "✅ SQL注入防护正常 - 登录接口拒绝恶意输入"
else
  echo "❌ SQL注入防护失败 - 登录接口未拒绝恶意输入"
fi

echo ""

# 2. XSS测试
echo "2. XSS测试"
echo "测试用户注册..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"<script>alert(1)</script>","email":"xss@test.com","password":"password123"}')

if echo "$RESPONSE" | grep -q '"success":false'; then
  echo "✅ XSS防护正常 - 注册接口拒绝恶意输入"
else
  echo "⚠️  XSS测试 - 注册接口接受了脚本输入（可能需要前端转义）"
fi

echo ""

# 3. 认证绕过测试
echo "3. 认证绕过测试"
echo "测试未认证访问..."
RESPONSE=$(curl -s http://localhost:3000/api/auth/me)

if echo "$RESPONSE" | grep -q '"success":false'; then
  echo "✅ 认证防护正常 - 未认证请求被拒绝"
else
  echo "❌ 认证防护失败 - 未认证请求被接受"
fi

echo ""

# 4. 无效Token测试
echo "4. 无效Token测试"
echo "测试无效Token访问..."
RESPONSE=$(curl -s http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer invalid-token")

if echo "$RESPONSE" | grep -q '"success":false'; then
  echo "✅ Token验证正常 - 无效Token被拒绝"
else
  echo "❌ Token验证失败 - 无效Token被接受"
fi

echo ""

# 5. 权限测试
echo "5. 权限测试"
echo "测试用户访问管理员接口..."
# 先登录获取token
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"frontendtest","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

RESPONSE=$(curl -s http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | grep -q '"success":false'; then
  echo "✅ 权限控制正常 - 普通用户无法访问管理员接口"
else
  echo "❌ 权限控制失败 - 普通用户可以访问管理员接口"
fi

echo ""

# 6. 输入验证测试
echo "6. 输入验证测试"
echo "测试无效邮箱格式..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"validuser","email":"invalid-email","password":"password123"}')

if echo "$RESPONSE" | grep -q '"success":false'; then
  echo "✅ 输入验证正常 - 无效邮箱格式被拒绝"
else
  echo "❌ 输入验证失败 - 无效邮箱格式被接受"
fi

echo ""

echo "=== 安全测试完成 ==="
