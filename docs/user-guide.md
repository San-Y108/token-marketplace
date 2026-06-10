# Token二级市场平台用户手册

## 概述

欢迎使用Token二级市场平台！本手册将帮助您快速上手并充分利用平台功能。

## 目录

1. [快速开始](#快速开始)
2. [用户注册与登录](#用户注册与登录)
3. [Token管理](#token管理)
4. [市场交易](#市场交易)
5. [API使用](#api使用)
6. [账户管理](#账户管理)
7. [常见问题](#常见问题)

---

## 快速开始

### 什么是Token二级市场平台？

Token二级市场平台是一个AI模型token交易平台，允许用户：

- **作为提供者**：上传和销售您的AI模型token
- **作为消费者**：购买和使用其他用户的AI模型token
- **作为代理**：通过OpenAI兼容API访问各种AI模型

### 平台优势

✅ **统一接口**：兼容OpenAI API，无需修改现有代码  
✅ **灵活计费**：按token使用量计费，公平透明  
✅ **安全可靠**：JWT认证，数据加密传输  
✅ **易于集成**：支持多种接入方式  

---

## 用户注册与登录

### 注册新账户

1. 访问平台首页
2. 点击"注册"按钮
3. 填写注册信息：
   - **用户名**：3-50个字符，唯一
   - **邮箱**：有效邮箱地址
   - **密码**：至少6个字符
   - **角色**：选择"用户"或"提供者"
4. 点击"提交"完成注册

注册成功后，您将获得：
- 1000积分（默认余额）
- JWT访问令牌
- 刷新令牌

### 登录账户

1. 访问平台首页
2. 点击"登录"按钮
3. 输入用户名和密码
4. 点击"登录"

登录成功后，系统将返回访问令牌，用于后续API调用。

### 角色说明

| 角色 | 权限 | 说明 |
|------|------|------|
| 用户 (user) | 浏览市场、购买token、使用API | 普通消费者 |
| 提供者 (provider) | 创建token、管理服务、查看收益 | token提供者 |
| 管理员 (admin) | 所有权限、用户管理、系统配置 | 平台管理员 |

---

## Token管理

### 创建Token（提供者）

如果您是提供者角色，可以创建token来销售您的AI模型服务。

#### 创建步骤

1. 登录后进入"我的Token"页面
2. 点击"创建新Token"
3. 填写Token信息：

```json
{
  "name": "GPT-4 Turbo",
  "description": "高质量的GPT-4 Turbo模型服务",
  "model_name": "gpt-4-turbo",
  "base_url": "https://api.yourservice.com",
  "api_key_encrypted": "your-api-key-here",
  "protocol": "openai",
  "price_per_1k_tokens": 0.03
}
```

4. 点击"创建"完成

#### 字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| name | Token显示名称 | "GPT-4 Turbo" |
| description | 服务描述 | "高质量的GPT-4模型" |
| model_name | 模型标识符 | "gpt-4-turbo" |
| base_url | API基础URL | "https://api.example.com" |
| api_key_encrypted | API密钥 | "sk-xxx" |
| protocol | 协议类型 | "openai" / "thc" / "custom" |
| price_per_1k_tokens | 每1000token价格 | 0.03 |

#### 管理Token

- **编辑**：修改Token信息
- **激活/停用**：控制Token是否可用
- **删除**：永久删除Token

### 浏览Token（消费者）

1. 进入"市场"页面
2. 使用筛选条件：
   - 协议类型
   - 价格范围
   - 模型名称
3. 查看Token详情
4. 选择合适的Token进行购买

---

## 市场交易

### 购买Token访问权

1. 在市场中找到合适的Token
2. 点击"购买"按钮
3. 输入需要使用的token数量
4. 确认购买信息：
   - Token名称
   - 模型名称
   - 使用数量
   - 费用（积分）
5. 确认购买

购买成功后，积分将从您的账户扣除，并转入提供者账户。

### 积分管理

#### 查看余额

- 访问"我的账户"页面
- 或调用API：`GET /api/marketplace/balance`

#### 充值积分

1. 进入"我的账户"页面
2. 点击"充值"按钮
3. 输入充值金额
4. 确认充值

#### 交易历史

- 进入"交易历史"页面
- 查看所有交易记录
- 筛选交易状态

---

## API使用

### 获取API凭证

1. 登录后进入"API设置"页面
2. 点击"生成API Key"
3. 复制生成的API Key
4. 安全存储API Key

API Key格式：`tk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 使用OpenAI兼容API

平台提供OpenAI兼容的API接口，您可以直接使用OpenAI SDK或任何兼容的客户端。

#### Python示例

```python
import openai

# 配置客户端
client = openai.OpenAI(
    api_key="your-api-key",
    base_url="http://your-server/v1"
)

# 调用聊天补全
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ]
)

print(response.choices[0].message.content)
```

#### Node.js示例

```javascript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'your-api-key',
  baseURL: 'http://your-server/v1'
});

async function chat() {
  const response = await client.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ]
  });

  console.log(response.choices[0].message.content);
}

chat();
```

#### cURL示例

```bash
curl http://your-server/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 支持的API端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/v1/chat/completions` | POST | 聊天补全 |
| `/v1/completions` | POST | 文本补全 |
| `/v1/embeddings` | POST | 向量嵌入 |
| `/v1/models` | GET | 模型列表 |

### 请求参数

#### 聊天补全

```json
{
  "model": "gpt-4",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "max_tokens": 1000,
  "temperature": 0.7,
  "top_p": 1,
  "n": 1,
  "stream": false
}
```

#### 文本补全

```json
{
  "model": "gpt-3.5-turbo-instruct",
  "prompt": "Write a short story about a robot.",
  "max_tokens": 500,
  "temperature": 0.7
}
```

#### 向量嵌入

```json
{
  "model": "text-embedding-ada-002",
  "input": "The food was delicious and the waiter..."
}
```

### 错误处理

API返回标准HTTP状态码：

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器错误 |

错误响应格式：

```json
{
  "error": {
    "message": "Error message",
    "type": "error_type",
    "code": "error_code"
  }
}
```

---

## 账户管理

### 修改个人信息

1. 进入"账户设置"页面
2. 修改用户名或邮箱
3. 保存更改

### 修改密码

1. 进入"账户设置"页面
2. 点击"修改密码"
3. 输入当前密码
4. 输入新密码
5. 确认新密码
6. 保存更改

### API Key管理

#### 生成新API Key

1. 进入"API设置"页面
2. 点击"生成新Key"
3. 输入Key名称（可选）
4. 复制生成的Key

#### 查看API Key列表

- 进入"API设置"页面
- 查看所有已生成的API Key
- 查看每个Key的使用情况

#### 撤销API Key

1. 进入"API设置"页面
2. 找到要撤销的Key
3. 点击"撤销"按钮
4. 确认撤销

### 交易历史

1. 进入"交易历史"页面
2. 查看所有交易记录
3. 筛选条件：
   - 交易状态
   - 时间范围
   - 交易类型

---

## 常见问题

### Q: 如何成为提供者？

A: 在注册时选择"提供者"角色，或在账户设置中申请升级为提供者。

### Q: 积分如何获取？

A: 您可以通过以下方式获取积分：
- 注册时获得1000积分（默认）
- 作为提供者销售token获得积分
- 手动充值积分

### Q: API Key泄露了怎么办？

A: 立即在"API设置"页面撤销泄露的API Key，并生成新的API Key。

### Q: 如何查看token使用量？

A: 在"交易历史"页面可以查看所有token使用记录，包括使用量和费用。

### Q: 支持哪些AI模型？

A: 支持所有兼容OpenAI API的模型，包括：
- GPT-4
- GPT-3.5 Turbo
- Claude
- Llama
- 等等

### Q: 如何联系客服？

A: 您可以通过以下方式联系我们：
- 邮箱：[待填写]
- 在线客服：[待填写]
- GitHub Issues：[待填写]

---

## 最佳实践

### 安全建议

1. **保护API Key**
   - 不要在代码中硬编码API Key
   - 使用环境变量存储
   - 定期轮换API Key

2. **监控使用量**
   - 定期查看交易历史
   - 设置使用量告警
   - 避免意外超支

3. **错误处理**
   - 实现适当的重试逻辑
   - 处理各种错误状态码
   - 记录错误日志

### 性能优化

1. **批量请求**
   - 尽量批量处理请求
   - 减少API调用次数

2. **缓存**
   - 缓存常用响应
   - 使用本地缓存减少延迟

3. **异步处理**
   - 使用异步API调用
   - 提高并发处理能力

### 成本控制

1. **选择合适的模型**
   - 根据需求选择模型
   - 平衡质量和成本

2. **控制token使用量**
   - 设置合理的max_tokens
   - 避免不必要的长文本

3. **监控费用**
   - 定期查看费用统计
   - 设置预算告警

---

## 技术支持

如有任何问题，请通过以下方式联系我们：

- **邮箱**：[待填写]
- **文档**：[待填写]
- **GitHub**：[待填写]
- **在线客服**：[待填写]

---

## 更新日志

### v1.0.0 (2026-06-10)
- 初始版本发布
- 用户认证系统
- Token管理功能
- 市场交易系统
- OpenAI API兼容代理

---

感谢使用Token二级市场平台！
