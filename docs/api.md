# Token二级市场平台 API文档

## 概述

Token二级市场平台提供RESTful API接口，支持用户认证、Token管理、市场交易和Token转发代理等功能。

### 基础URL

- 开发环境：`http://localhost:3000`
- 生产环境：`https://api.token-marketplace.com`

### 认证方式

API支持两种认证方式：

1. **JWT Token认证**
   - 在请求头中添加：`Authorization: Bearer <access_token>`
   - Access Token有效期：15分钟
   - Refresh Token有效期：7天

2. **API Key认证**
   - 在请求头中添加：`Authorization: Bearer <api_key>`
   - API Key格式：`tk_<32位随机字符串>`

### 错误响应格式

```json
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE",
  "details": {}
}
```

### 成功响应格式

```json
{
  "success": true,
  "data": {}
}
```

---

## 认证接口

### 用户注册

**请求**
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "role": "user" | "provider"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "points_balance": 1000,
      "created_at": "datetime",
      "updated_at": "datetime"
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
}
```

**错误响应**
- 409: Username or email already exists
- 400: Validation error

---

### 用户登录

**请求**
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "points_balance": 1000
    },
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
}
```

**错误响应**
- 401: Invalid username or password

---

### 刷新Token

**请求**
```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "string"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

**错误响应**
- 401: Invalid refresh token

---

### 获取当前用户信息

**请求**
```
GET /api/auth/me
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "string",
    "role": "string"
  }
}
```

---

### 生成API Key

**请求**
```
POST /api/auth/api-keys
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "string (optional)"
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "apiKey": "tk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "keyId": "uuid"
  }
}
```

---

### 获取API Key列表

**请求**
```
GET /api/auth/api-keys
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "key_prefix": "tk_xxxxxx",
      "name": "string",
      "is_active": true,
      "created_at": "datetime"
    }
  ]
}
```

---

### 撤销API Key

**请求**
```
DELETE /api/auth/api-keys/:keyId
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

## Token管理接口

### 获取Token列表

**请求**
```
GET /api/tokens
Authorization: Bearer <access_token> (optional)

Query Parameters:
- page: 页码 (default: 1)
- limit: 每页数量 (default: 20)
- protocol: 协议类型 (openai|thc|custom)
- search: 搜索关键词
- is_active: 是否激活 (true|false)
```

**响应**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "id": "uuid",
        "provider_id": "uuid",
        "name": "string",
        "description": "string",
        "model_name": "string",
        "base_url": "string",
        "protocol": "string",
        "price_per_1k_tokens": 0.01,
        "is_active": true,
        "provider_username": "string",
        "provider_email": "string",
        "created_at": "datetime",
        "updated_at": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### 创建Token

**请求**
```
POST /api/tokens
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "string",
  "description": "string (optional)",
  "model_name": "string",
  "base_url": "string (url)",
  "api_key_encrypted": "string",
  "protocol": "openai" | "thc" | "custom",
  "price_per_1k_tokens": 0.01
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider_id": "uuid",
    "name": "string",
    "description": "string",
    "model_name": "string",
    "base_url": "string",
    "protocol": "string",
    "price_per_1k_tokens": 0.01,
    "is_active": true,
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

**权限要求**
- 需要provider或admin角色

---

### 获取Token详情

**请求**
```
GET /api/tokens/:id
Authorization: Bearer <access_token> (optional)
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider_id": "uuid",
    "name": "string",
    "description": "string",
    "model_name": "string",
    "base_url": "string",
    "protocol": "string",
    "price_per_1k_tokens": 0.01,
    "is_active": true,
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

---

### 更新Token

**请求**
```
PUT /api/tokens/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "string (optional)",
  "description": "string (optional)",
  "model_name": "string (optional)",
  "base_url": "string (optional)",
  "api_key_encrypted": "string (optional)",
  "protocol": "openai" | "thc" | "custom" (optional),
  "price_per_1k_tokens": 0.01 (optional),
  "is_active": true (optional)
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider_id": "uuid",
    "name": "string",
    "description": "string",
    "model_name": "string",
    "base_url": "string",
    "protocol": "string",
    "price_per_1k_tokens": 0.01,
    "is_active": true,
    "created_at": "datetime",
    "updated_at": "datetime"
  }
}
```

**权限要求**
- 只有提供者本人或管理员可以更新

---

### 删除Token

**请求**
```
DELETE /api/tokens/:id
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "message": "Token deleted successfully"
}
```

**权限要求**
- 只有提供者本人或管理员可以删除

---

### 激活/停用Token

**请求**
```
PATCH /api/tokens/:id/status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "is_active": true | false
}
```

**响应**
```json
{
  "success": true,
  "message": "Token activated/deactivated successfully"
}
```

---

## 市场交易接口

### 浏览市场

**请求**
```
GET /api/marketplace/browse
Authorization: Bearer <access_token> (optional)

Query Parameters:
- page: 页码 (default: 1)
- limit: 每页数量 (default: 20)
- protocol: 协议类型 (openai|thc|custom)
- search: 搜索关键词
- min_price: 最低价格
- max_price: 最高价格
```

**响应**
```json
{
  "success": true,
  "data": {
    "tokens": [
      {
        "id": "uuid",
        "name": "string",
        "model_name": "string",
        "protocol": "string",
        "price_per_1k_tokens": 0.01,
        "provider_username": "string",
        "provider_email": "string"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

### 预览购买费用

**请求**
```
POST /api/marketplace/preview
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token_id": "uuid",
  "tokens_used": 1000
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "token_id": "uuid",
    "token_name": "string",
    "model_name": "string",
    "tokens_requested": 1000,
    "price_per_1k_tokens": 0.01,
    "points_charged": 0.01,
    "current_balance": 1000,
    "has_sufficient_balance": true
  }
}
```

---

### 购买Token访问权

**请求**
```
POST /api/marketplace/purchase
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "token_id": "uuid",
  "tokens_used": 1000
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "points_charged": 0.01,
    "tokens_used": 1000
  }
}
```

**错误响应**
- 400: Insufficient points balance
- 404: Token not found

---

### 查询积分余额

**请求**
```
GET /api/marketplace/balance
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "points_balance": 1000
  }
}
```

---

### 充值积分

**请求**
```
POST /api/marketplace/recharge
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 100
}
```

**响应**
```json
{
  "success": true,
  "data": {
    "user_id": "uuid",
    "points_recharged": 100,
    "new_balance": 1100
  }
}
```

---

### 获取交易历史

**请求**
```
GET /api/marketplace/transactions
Authorization: Bearer <access_token>

Query Parameters:
- status: 交易状态 (pending|completed|failed|refunded)
- limit: 每页数量
- offset: 偏移量
- role: 角色 (consumer|provider)
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "consumer_id": "uuid",
      "provider_id": "uuid",
      "token_id": "uuid",
      "tokens_used": 1000,
      "points_charged": 0.01,
      "status": "completed",
      "created_at": "datetime"
    }
  ]
}
```

---

## Token转发代理接口（OpenAI兼容）

### 聊天补全

**请求**
```
POST /v1/chat/completions
Authorization: Bearer <access_token_or_api_key>
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant."
    },
    {
      "role": "user",
      "content": "Hello!"
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.7
}
```

**响应**
```json
{
  "id": "chatcmpl-xxx",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

---

### 文本补全

**请求**
```
POST /v1/completions
Authorization: Bearer <access_token_or_api_key>
Content-Type: application/json

{
  "model": "gpt-3.5-turbo-instruct",
  "prompt": "Write a short story about a robot.",
  "max_tokens": 500,
  "temperature": 0.7
}
```

**响应**
```json
{
  "id": "cmpl-xxx",
  "object": "text_completion",
  "created": 1234567890,
  "model": "gpt-3.5-turbo-instruct",
  "choices": [
    {
      "text": "Once upon a time...",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 100,
    "total_tokens": 110
  }
}
```

---

### 向量嵌入

**请求**
```
POST /v1/embeddings
Authorization: Bearer <access_token_or_api_key>
Content-Type: application/json

{
  "model": "text-embedding-ada-002",
  "input": "The food was delicious and the waiter..."
}
```

**响应**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [0.0023064255, -0.009327292, ...],
      "index": 0
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 8,
    "total_tokens": 8
  }
}
```

---

### 模型列表

**请求**
```
GET /v1/models
Authorization: Bearer <access_token_or_api_key>
```

**响应**
```json
{
  "object": "list",
  "data": [
    {
      "id": "gpt-4",
      "object": "model",
      "created": 1234567890,
      "owned_by": "marketplace",
      "permission": [],
      "root": "gpt-4",
      "parent": null
    }
  ]
}
```

---

## 管理后台接口

### 获取系统统计

**请求**
```
GET /api/admin/stats
Authorization: Bearer <access_token>
```

**响应**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 100,
      "providers": 20,
      "consumers": 80
    },
    "tokens": {
      "total": 50,
      "active": 40,
      "inactive": 10
    },
    "transactions": {
      "total": 1000,
      "completed": 950,
      "failed": 50,
      "total_tokens_used": 1000000,
      "total_points_traded": 10000
    }
  }
}
```

**权限要求**
- 需要admin角色

---

### 获取用户列表

**请求**
```
GET /api/admin/users
Authorization: Bearer <access_token>

Query Parameters:
- role: 用户角色 (user|provider|admin)
- limit: 每页数量
- offset: 偏移量
```

**响应**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "role": "string",
      "points_balance": 1000,
      "created_at": "datetime",
      "updated_at": "datetime"
    }
  ]
}
```

---

## 状态码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如用户名已存在） |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |

---

## 频率限制

- 默认限制：100次/15分钟
- 超出限制返回429状态码
- 响应头包含：
  - `X-RateLimit-Limit`: 限制次数
  - `X-RateLimit-Remaining`: 剩余次数
  - `X-RateLimit-Reset`: 重置时间

---

## 最佳实践

1. **安全存储Token**
   - 不要在客户端代码中硬编码Token
   - 使用环境变量或安全存储

2. **错误处理**
   - 始终检查响应状态码
   - 实现适当的重试逻辑

3. **Token刷新**
   - 在Access Token过期前刷新
   - 实现自动刷新机制

4. **API Key管理**
   - 定期轮换API Key
   - 为不同应用使用不同的Key
