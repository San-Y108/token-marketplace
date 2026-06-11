# 🎯 Token 二级市场平台

<div align="center">

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.5-blue.svg)
![Tests](https://img.shields.io/badge/tests-141%20passed-brightgreen.svg)

**安全、高效、透明的 AI 模型 Token 交易平台**

[快速开始](#-快速开始) • [功能特性](#-功能特性) • [API文档](#-api接口) • [部署指南](#-部署指南)

</div>

---

## ✨ 功能特性

### 核心功能
- 🔐 **用户认证系统** - JWT + API Key 双重认证
- 🪙 **Token 管理** - 上传、下载、交易 AI 模型 Token
- 💰 **积分系统** - 积分充值、消费、余额管理
- 🛒 **市场浏览** - 搜索、筛选、购买 Token 服务

### 两种接入方式

#### 方式一：Skill 集成模式
- 开发适用于主流 AI 助手的 Skill CLI 插件
- 平台绑定机制，自动生成标准化的 Base URL 与访问 Key
- 积分激励系统，确保 Token 使用者向提供者支付相应积分

#### 方式二：自主接入模式
- 符合 OpenAI API 协议规范的兼容接口 (`/v1/*`)
- 支持 THC 协议接口 (`/thc/v1/*`)
- 用户自有 Base URL 与 Key 的安全验证与接入机制

### 安全特性
- ✅ JWT Token 认证
- ✅ API Key bcrypt哈希存储
- ✅ RBAC 权限控制
- ✅ 请求频率限制
- ✅ 输入验证（Zod）
- ✅ SQL 注入防护（参数化查询）
- ✅ XSS 防护
- ✅ CORS 配置
- ✅ 敏感字段自动隐藏
- ✅ API Key所有权校验
- ✅ 积分原子性更新（防并发）
- ✅ Docker安全配置（环境变量注入）

---

## 🛠️ 技术栈

| 层级 | 技术选型 |
|------|---------|
| 后端框架 | Node.js + Express |
| 数据库 | PostgreSQL |
| 前端 | Next.js 15 + React |
| 认证 | JWT + API Key |
| API 协议 | OpenAI API 兼容 |
| 测试 | Jest + Supertest |
| 容器化 | Docker + Docker Compose |

---

## 📁 项目结构

```
token-marketplace/
├── server/                    # Node.js + Express 后端
│   ├── src/
│   │   ├── index.ts          # 应用入口
│   │   ├── routes/           # API 路由 (7 个文件)
│   │   ├── services/         # 业务服务层 (4 个文件)
│   │   ├── models/           # 数据模型 (4 个文件)
│   │   ├── middleware/       # 中间件 (3 个文件)
│   │   └── utils/            # 工具函数
│   ├── database/             # 数据库 Schema
│   ├── tests/                # 测试文件 (16 个文件)
│   └── dist/                 # 编译输出
├── frontend/                  # Next.js 前端
│   └── app/
│       ├── page.tsx          # 主页面（深色主题 UI）
│       └── layout.tsx        # 布局文件
├── docs/                      # 文档 (14 个文件)
├── docker-compose.yml         # Docker 部署配置
├── nginx.conf                 # Nginx 配置
└── package.json               # 根配置
```

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm
- PostgreSQL 14+

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/San-Y108/token-marketplace.git
cd token-marketplace
```

2. **安装依赖**
```bash
pnpm install
```

3. **初始化数据库**
```bash
# 确保 PostgreSQL 正在运行
./server/scripts/initDb.sh
```

4. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

5. **启动开发服务器**
```bash
# 启动后端
cd server && pnpm dev

# 启动前端（新终端）
cd frontend && npm run dev
```

6. **访问应用**
- 前端界面: http://localhost:3001
- 后端 API: http://localhost:3000
- 健康检查: http://localhost:3000/health

---

## 📡 API 接口

### 认证相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 用户注册 |
| POST | `/api/auth/login` | 用户登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| GET | `/api/auth/me` | 获取当前用户信息 |
| POST | `/api/auth/api-keys` | 生成 API Key |

### Token 管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/tokens` | 获取 Token 列表（公开） |
| GET | `/api/tokens/detail/:id` | 获取 Token 详情（公开） |
| GET | `/api/tokens/provider/:providerId` | 获取提供者 Token 列表 |
| POST | `/api/tokens` | 创建 Token（需要 provider 角色） |
| PUT | `/api/tokens/:id` | 更新 Token（需要所有权） |
| DELETE | `/api/tokens/:id` | 删除 Token（需要所有权） |
| PATCH | `/api/tokens/:id/status` | 激活/停用 Token（需要所有权） |

### 市场交易
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/marketplace/browse` | 浏览市场（公开） |
| GET | `/api/marketplace/stats` | 市场统计（公开） |
| POST | `/api/marketplace/preview` | 预览购买费用 |
| POST | `/api/marketplace/purchase` | 购买 Token 访问权 |
| GET | `/api/marketplace/balance` | 查询积分余额 |
| POST | `/api/marketplace/recharge` | 充值积分（仅管理员） |
| GET | `/api/marketplace/transactions` | 交易历史 |

### Token 转发代理（OpenAI 兼容）
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/v1/chat/completions` | 聊天补全 |
| POST | `/v1/completions` | 文本补全 |
| POST | `/v1/embeddings` | 向量嵌入 |
| GET | `/v1/models` | 模型列表 |

### THC 协议
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/thc/v1/version` | 获取版本信息 |
| GET | `/thc/v1/health` | 健康检查 |
| GET | `/thc/v1/models` | 模型列表 |

### 管理后台
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/admin/stats` | 系统统计 |
| GET | `/api/admin/users` | 用户管理 |
| GET | `/api/admin/tokens` | Token 管理 |
| GET | `/api/admin/transactions` | 交易管理 |

---

## 💻 使用示例

### 注册用户
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "role": "user"
  }'
```

### 登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 使用 API Key 调用 OpenAI 兼容接口
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

## 🧪 测试

### 运行测试
```bash
# 运行所有测试
pnpm test

# 运行测试并查看覆盖率
pnpm test:coverage

# 运行特定测试文件
cd server && pnpm test -- tests/auth.test.ts
```

### 测试统计
- ✅ **141 个测试通过**
- ✅ **9 个测试套件通过**
- ✅ **测试覆盖**: 认证、Token、市场、安全、UX

---

## 🐳 Docker 部署

### 使用 Docker Compose
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 服务访问
- 前端: http://localhost:3001
- 后端 API: http://localhost:3000
- Nginx 代理: http://localhost:80

---

## 📊 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| API 响应延迟 | <100ms | 10-15ms ✅ |
| 97.5% 延迟 | <100ms | 25-40ms ✅ |
| 吞吐量 | >1,000 req/s | 30,000-50,000 req/s ✅ |
| 测试通过率 | >90% | 100% ✅ |

---

## 📚 文档

- [API 文档](docs/api.md) - 详细的 API 接口说明
- [部署指南](docs/deployment.md) - 生产环境部署指南
- [用户手册](docs/user-guide.md) - 用户操作指南
- [管理员指南](docs/admin-guide.md) - 管理员操作指南
- [高可用架构](HIGH_AVAILABILITY.md) - 高可用部署方案

---

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 📄 许可证

ISC License

---

## 📧 联系方式

- 项目维护者: [San-Y108](https://github.com/San-Y108)
- 项目链接: https://github.com/San-Y108/token-marketplace

---

## 🙏 致谢

感谢所有为这个项目做出贡献的人！

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给个 Star！⭐**

</div>
