# Token二级市场平台 - 快速启动指南

## 前置要求

- Node.js 18+
- pnpm
- PostgreSQL 14+

## 快速开始

### 1. 克隆项目

```bash
cd /Users/yanshuo/token-marketplace
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 初始化数据库

```bash
# 确保PostgreSQL正在运行
./server/scripts/initDb.sh
```

### 4. 配置环境变量

```bash
# 编辑环境变量
nano server/.env
```

主要配置项：
```env
# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/token_marketplace

# JWT密钥（请使用强密码）
JWT_SECRET=your-strong-secret-key-here
```

### 5. 启动服务

```bash
# 开发模式
pnpm dev

# 或者使用启动脚本
./scripts/start.sh
```

服务将在 http://localhost:3000 启动

## 测试API

### 1. 注册用户

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "provider"
  }'
```

### 2. 登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 3. 创建Token

```bash
# 使用返回的access_token
curl -X POST http://localhost:3000/api/tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "GPT-4 Turbo",
    "description": "高质量的GPT-4 Turbo模型",
    "model_name": "gpt-4-turbo",
    "base_url": "https://api.openai.com",
    "api_key_encrypted": "sk-your-api-key",
    "protocol": "openai",
    "price_per_1k_tokens": 0.03
  }'
```

### 4. 浏览市场

```bash
curl http://localhost:3000/api/marketplace/browse
```

### 5. 使用OpenAI兼容API

```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "model": "gpt-4-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

## 使用Skill CLI工具

### 1. 安装CLI工具

```bash
cd skill-plugin
pnpm install
pnpm build
npm link
```

### 2. 绑定账号

```bash
token-marketplace bind
```

### 3. 上传Token

```bash
token-marketplace upload \
  -n "GPT-4 Turbo" \
  -m "gpt-4-turbo" \
  -u "https://api.openai.com" \
  -k "sk-your-api-key" \
  -p "openai" \
  --price 0.03
```

### 4. 查看Token列表

```bash
token-marketplace list
```

### 5. 查看状态

```bash
token-marketplace status
```

## 查看文档

- [API文档](docs/api.md) - 详细的API接口说明
- [部署指南](docs/deployment.md) - 生产环境部署
- [用户手册](docs/user-guide.md) - 用户操作指南
- [管理员指南](docs/admin-guide.md) - 系统管理指南

## 常见问题

### Q: 数据库连接失败

A: 确保PostgreSQL正在运行，并且配置正确：
```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 启动PostgreSQL
sudo systemctl start postgresql
```

### Q: 端口已被占用

A: 修改`.env`文件中的`PORT`配置：
```env
PORT=3001
```

### Q: 如何查看日志

A: 日志文件在`logs/`目录：
```bash
# 查看错误日志
tail -f logs/error.log

# 查看输出日志
tail -f logs/output.log
```

## 下一步

1. 阅读[API文档](docs/api.md)了解所有接口
2. 阅读[部署指南](docs/deployment.md)部署到生产环境
3. 阅读[用户手册](docs/user-guide.md)了解使用方法
4. 开始开发前端界面

## 获取帮助

- 查看[README.md](README.md)了解项目概述
- 查看[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)了解项目详情
- 提交Issue反馈问题
