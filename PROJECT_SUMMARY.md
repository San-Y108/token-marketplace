# Token二级市场平台 - 项目总结

## 项目概述

Token二级市场平台是一个AI模型token交易平台，支持用户上传、下载和交易AI模型token。平台提供两种接入方式：Skill集成模式和自主接入模式，兼容OpenAI API协议。

## 已完成的工作

### 1. 后端服务 (server/)

#### 核心架构
- ✅ Express.js应用框架
- ✅ PostgreSQL数据库集成
- ✅ JWT认证系统
- ✅ API Key认证
- ✅ 请求频率限制
- ✅ 错误处理中间件
- ✅ 请求日志记录

#### 数据模型
- ✅ 用户模型 (User)
- ✅ Token模型 (Token)
- ✅ API Key模型 (ApiKey)
- ✅ 交易模型 (Transaction)

#### API接口
- ✅ 认证接口 (auth)
  - 用户注册
  - 用户登录
  - Token刷新
  - API Key管理

- ✅ Token管理接口 (tokens)
  - 创建Token
  - 获取Token列表
  - 更新Token
  - 删除Token
  - 激活/停用Token

- ✅ 市场交易接口 (marketplace)
  - 浏览市场
  - 预览购买费用
  - 购买Token
  - 积分余额查询
  - 积分充值
  - 交易历史

- ✅ Token转发代理 (proxy)
  - 聊天补全 (OpenAI兼容)
  - 文本补全 (OpenAI兼容)
  - 向量嵌入 (OpenAI兼容)
  - 模型列表

- ✅ 管理后台接口 (admin)
  - 系统统计
  - 用户管理
  - Token管理
  - 交易管理
  - 退款处理

#### 业务服务
- ✅ 认证服务 (AuthService)
- ✅ 计费服务 (BillingService)
- ✅ 代理服务 (ProxyService)

#### 安全特性
- ✅ JWT Token认证
- ✅ API Key认证
- ✅ 密码加密 (bcrypt)
- ✅ 请求频率限制
- ✅ 输入验证 (Zod)
- ✅ CORS配置
- ✅ SQL注入防护

### 2. Skill插件 (skill-plugin/)

#### CLI工具
- ✅ 账号绑定/解绑
- ✅ Token上传
- ✅ Token列表查看
- ✅ 服务状态查看
- ✅ 积分余额查看
- ✅ 交易历史查看

#### 功能特性
- ✅ 交互式命令行界面
- ✅ 配置文件管理
- ✅ 错误处理
- ✅ 彩色输出

### 3. 文档 (docs/)

- ✅ API文档 (api.md)
- ✅ 部署指南 (deployment.md)
- ✅ 用户手册 (user-guide.md)
- ✅ 管理员指南 (admin-guide.md)

### 4. 项目配置

- ✅ pnpm workspace配置
- ✅ TypeScript配置
- ✅ ESLint配置
- ✅ Jest测试配置
- ✅ PM2配置
- ✅ 环境变量模板
- ✅ .gitignore文件

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 后端框架 | Node.js + Express | 高性能异步框架 |
| 数据库 | PostgreSQL | 关系型数据库 |
| 认证 | JWT + API Key | 双重认证机制 |
| API协议 | OpenAI API兼容 | 标准化接口 |
| 包管理 | pnpm | 高效的包管理器 |
| TypeScript | 5.5+ | 类型安全 |
| 测试 | Jest | 单元测试框架 |
| 部署 | PM2 | 进程管理 |

## 项目结构

```
token-marketplace/
├── server/                          # 后端服务
│   ├── src/
│   │   ├── index.ts                 # 应用入口
│   │   ├── routes/                  # API路由
│   │   │   ├── auth.ts             # 认证接口
│   │   │   ├── tokens.ts           # Token管理
│   │   │   ├── marketplace.ts      # 市场交易
│   │   │   ├── proxy.ts            # 转发代理
│   │   │   └── admin.ts            # 管理后台
│   │   ├── services/                # 业务服务
│   │   │   ├── auth.ts             # 认证服务
│   │   │   ├── billing.ts          # 计费服务
│   │   │   └── proxy.ts            # 代理服务
│   │   ├── models/                  # 数据模型
│   │   │   ├── user.ts             # 用户模型
│   │   │   ├── token.ts            # Token模型
│   │   │   ├── apiKey.ts           # API Key模型
│   │   │   └── transaction.ts      # 交易模型
│   │   ├── middleware/              # 中间件
│   │   │   ├── auth.ts             # 认证中间件
│   │   │   ├── errorHandler.ts     # 错误处理
│   │   │   └── requestLogger.ts    # 请求日志
│   │   └── utils/                   # 工具函数
│   │       └── dbInit.ts           # 数据库初始化
│   ├── database/
│   │   └── schema.sql              # 数据库schema
│   ├── scripts/
│   │   └── initDb.sh               # 数据库初始化脚本
│   ├── tests/                       # 测试文件
│   ├── dist/                        # 编译输出
│   ├── package.json
│   └── tsconfig.json
├── frontend/                        # 前端（待开发）
│   └── package.json
├── skill-plugin/                    # Skill插件
│   ├── src/
│   │   └── index.ts                # CLI入口
│   ├── skill.json                  # 插件配置
│   ├── package.json
│   └── README.md
├── docs/                            # 文档
│   ├── api.md                      # API文档
│   ├── deployment.md               # 部署指南
│   ├── user-guide.md               # 用户手册
│   └── admin-guide.md              # 管理员指南
├── scripts/                         # 脚本工具
│   └── start.sh                    # 启动脚本
├── logs/                            # 日志目录
├── ecosystem.config.js              # PM2配置
├── package.json                     # 根package.json
├── pnpm-workspace.yaml              # pnpm工作区配置
├── .gitignore
└── README.md
```

## 核心功能

### 1. 用户认证系统

- **注册**：用户注册，支持user/provider角色
- **登录**：用户名/密码登录，返回JWT token
- **Token刷新**：支持refresh token机制
- **API Key**：生成和管理API Key

### 2. Token管理

- **创建Token**：提供者可以创建token服务
- **配置信息**：名称、模型、URL、协议、价格
- **状态管理**：激活/停用token
- **权限控制**：只有提供者本人或管理员可以修改

### 3. 市场交易

- **浏览市场**：查看所有可用的token
- **筛选搜索**：按协议、价格、模型筛选
- **购买流程**：预览费用 → 确认购买 → 扣除积分
- **积分系统**：积分余额查询、充值

### 4. Token转发代理

- **OpenAI兼容**：完全兼容OpenAI API协议
- **支持接口**：聊天补全、文本补全、向量嵌入
- **自动计费**：根据token使用量自动计费
- **错误处理**：统一的错误响应格式

### 5. 管理后台

- **系统统计**：用户数、Token数、交易量
- **用户管理**：查看、编辑用户信息
- **Token管理**：审核、激活/停用Token
- **交易管理**：查看交易记录、处理退款

## API端点

### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户
- `POST /api/auth/api-keys` - 生成API Key
- `GET /api/auth/api-keys` - 获取API Key列表
- `DELETE /api/auth/api-keys/:id` - 撤销API Key

### Token管理
- `GET /api/tokens` - 获取Token列表
- `POST /api/tokens` - 创建Token
- `GET /api/tokens/:id` - 获取Token详情
- `PUT /api/tokens/:id` - 更新Token
- `DELETE /api/tokens/:id` - 删除Token
- `PATCH /api/tokens/:id/status` - 激活/停用Token

### 市场交易
- `GET /api/marketplace/browse` - 浏览市场
- `POST /api/marketplace/preview` - 预览购买费用
- `POST /api/marketplace/purchase` - 购买Token
- `GET /api/marketplace/balance` - 查询积分余额
- `POST /api/marketplace/recharge` - 充值积分
- `GET /api/marketplace/transactions` - 交易历史

### Token代理（OpenAI兼容）
- `POST /v1/chat/completions` - 聊天补全
- `POST /v1/completions` - 文本补全
- `POST /v1/embeddings` - 向量嵌入
- `GET /v1/models` - 模型列表

### 管理后台
- `GET /api/admin/stats` - 系统统计
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/users/:id` - 用户详情
- `PATCH /api/admin/users/:id/role` - 修改用户角色
- `PATCH /api/admin/users/:id/points` - 调整用户积分
- `GET /api/admin/tokens` - Token列表
- `PATCH /api/admin/tokens/:id/status` - Token状态
- `GET /api/admin/transactions` - 交易列表
- `POST /api/admin/transactions/:id/refund` - 退款

## 数据库设计

### 用户表 (users)
- id: UUID主键
- username: 用户名（唯一）
- email: 邮箱（唯一）
- password_hash: 密码哈希
- role: 角色 (user/provider/admin)
- points_balance: 积分余额
- created_at: 创建时间
- updated_at: 更新时间

### Token表 (tokens)
- id: UUID主键
- provider_id: 提供者ID（外键）
- name: Token名称
- description: 描述
- model_name: 模型名称
- base_url: API基础URL
- api_key_encrypted: 加密的API密钥
- protocol: 协议类型 (openai/thc/custom)
- price_per_1k_tokens: 每1000token价格
- is_active: 是否激活
- created_at: 创建时间
- updated_at: 更新时间

### API Keys表 (api_keys)
- id: UUID主键
- user_id: 用户ID（外键）
- key_hash: 密钥哈希
- key_prefix: 密钥前缀
- name: 名称
- permissions: 权限（JSON）
- is_active: 是否激活
- expires_at: 过期时间
- created_at: 创建时间

### 交易记录表 (transactions)
- id: UUID主键
- consumer_id: 消费者ID（外键）
- provider_id: 提供者ID（外键）
- token_id: Token ID（外键）
- tokens_used: 使用的token数量
- points_charged: 扣除的积分
- status: 状态 (pending/completed/failed/refunded)
- request_metadata: 请求元数据（JSON）
- created_at: 创建时间

## 安全特性

1. **认证安全**
   - JWT Token认证
   - API Key认证
   - 密码bcrypt加密
   - Token过期机制

2. **传输安全**
   - HTTPS支持
   - CORS配置
   - 请求频率限制

3. **数据安全**
   - SQL注入防护
   - 输入验证（Zod）
   - 敏感数据加密

4. **访问控制**
   - 角色权限控制
   - 资源所有权验证
   - 管理员权限分离

## 部署方案

### 本地开发
```bash
# 安装依赖
pnpm install

# 初始化数据库
./server/scripts/initDb.sh

# 启动开发服务器
pnpm dev
```

### 生产部署
```bash
# 构建
pnpm build

# 使用PM2启动
pm2 start ecosystem.config.js
```

### Docker部署
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d
```

## 待开发功能

### 1. 前端界面
- [ ] 用户注册/登录页面
- [ ] Token市场浏览页面
- [ ] 用户仪表板
- [ ] Token管理页面
- [ ] 交易历史页面
- [ ] 管理后台页面

### 2. 高级功能
- [ ] WebSocket实时通知
- [ ] Token质量评分系统
- [ ] 用户评价系统
- [ ] 自动扩缩容
- [ ] 多语言支持

### 3. 集成功能
- [ ] 支付网关集成
- [ ] 邮件通知系统
- [ ] 短信验证
- [ ] 第三方登录（OAuth）

### 4. 监控和运维
- [ ] Prometheus监控
- [ ] Grafana仪表板
- [ ] 日志聚合系统
- [ ] 告警系统

## 性能指标

### 目标指标
- API响应时间：< 100ms（P95）
- 系统可用性：99.9%
- 并发用户数：1000+
- 数据库查询：< 50ms

### 优化策略
1. **数据库优化**
   - 索引优化
   - 连接池配置
   - 查询优化

2. **缓存策略**
   - Redis缓存
   - HTTP缓存头
   - 本地缓存

3. **负载均衡**
   - Nginx反向代理
   - PM2集群模式
   - 多实例部署

## 测试策略

### 单元测试
- 模型测试
- 服务测试
- 工具函数测试

### 集成测试
- API接口测试
- 数据库集成测试
- 第三方服务测试

### 端到端测试
- 用户流程测试
- 交易流程测试
- 错误场景测试

### 性能测试
- 负载测试
- 压力测试
- 并发测试

## 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 代码审查
6. 合并到主分支

### 代码规范
- 使用TypeScript
- 遵循ESLint规则
- 编写单元测试
- 更新文档

### 提交规范
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式
- refactor: 重构
- test: 测试相关
- chore: 构建/工具相关

## 许可证

ISC License

## 联系方式

- 项目维护者：[待填写]
- 邮箱：[待填写]
- GitHub：[待填写]

## 更新日志

### v1.0.0 (2026-06-10)
- 初始版本发布
- 后端API服务
- Skill CLI工具
- 完整文档
- 数据库设计
- 安全认证系统
