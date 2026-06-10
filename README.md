# Token二级市场平台

一个基于token二级市场的平台，支持用户上传/下载AI模型token，并通过两种方式接入。

## 功能特性

### 核心功能
- **用户Token上传系统**：支持用户将本地计算资源生成的token进行标准化上传与管理
- **用户Token下载系统**：提供安全可靠的token获取与使用机制
- **Token转发代理**：兼容OpenAI API协议，支持第三方服务直接调用

### 两种接入方式

#### 方式一：Skill集成模式
- 开发适用于主流AI助手的Skill插件
- 平台绑定机制，自动生成标准化的Base URL与访问Key
- 积分激励系统，确保token使用者向提供者支付相应积分
- Token转发协议，确保本地模型智能通过平台安全高效地对外提供服务

#### 方式二：自主接入模式
- 符合OpenAI API协议规范的兼容接口
- 用户自有Base URL与Key的安全验证与接入机制
- 标准化的token转发流程

## 技术栈

| 层级 | 技术选型 |
|------|---------|
| 后端框架 | Node.js + Express |
| 数据库 | PostgreSQL |
| 前端 | Next.js 15 + React |
| 认证 | JWT |
| API协议 | OpenAI API兼容 |

## 项目结构

```
token-marketplace/
├── server/                    # Node.js + Express后端
│   ├── src/
│   │   ├── index.ts          # 应用入口
│   │   ├── routes/           # API路由
│   │   ├── services/         # 业务服务层
│   │   ├── models/           # 数据模型
│   │   ├── middleware/       # 中间件
│   │   └── utils/            # 工具函数
│   ├── database/             # 数据库schema
│   ├── scripts/              # 脚本工具
│   └── tests/                # 单元测试
├── frontend/                  # Next.js前端（待开发）
├── skill-plugin/              # AG Skill插件（待开发）
├── docs/                      # 文档
└── package.json               # 根package.json
```

## 快速开始

### 前置要求

- Node.js 18+
- pnpm
- PostgreSQL 14+

### 安装步骤

1. **克隆项目**
```bash
cd /Users/yanshuo/token-marketplace
```

2. **安装依赖**
```bash
pnpm install
```

3. **初始化数据库**
```bash
# 确保PostgreSQL正在运行
./server/scripts/initDb.sh
```

4. **配置环境变量**
```bash
# 编辑 server/.env 文件
# 确保数据库连接信息正确
```

5. **启动开发服务器**
```bash
pnpm dev
```

服务器将在 http://localhost:3000 启动

### API端点

#### 认证相关
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/refresh` - 刷新token
- `GET /api/auth/me` - 获取当前用户信息

#### Token管理
- `GET /api/tokens` - 获取token列表
- `POST /api/tokens` - 创建token（需要provider角色）
- `GET /api/tokens/:id` - 获取token详情
- `PUT /api/tokens/:id` - 更新token
- `DELETE /api/tokens/:id` - 删除token

#### 市场交易
- `GET /api/marketplace/browse` - 浏览市场
- `POST /api/marketplace/purchase` - 购买token访问权
- `GET /api/marketplace/balance` - 查询积分余额
- `POST /api/marketplace/recharge` - 充值积分

#### Token转发代理（OpenAI兼容）
- `POST /v1/chat/completions` - 聊天补全
- `POST /v1/completions` - 文本补全
- `POST /v1/embeddings` - 向量嵌入
- `GET /v1/models` - 模型列表

#### 管理后台
- `GET /api/admin/stats` - 系统统计
- `GET /api/admin/users` - 用户管理
- `GET /api/admin/tokens` - Token管理
- `GET /api/admin/transactions` - 交易管理

## 开发指南

### 运行测试
```bash
pnpm test
```

### 代码检查
```bash
pnpm lint
```

### 构建生产版本
```bash
pnpm build
```

## 部署

### 本地部署
1. 确保PostgreSQL正在运行
2. 执行数据库初始化脚本
3. 配置环境变量
4. 运行 `pnpm start`

### Docker部署（待实现）
```bash
docker-compose up -d
```

## 文档

- [API文档](docs/api.md) - 详细的API接口说明
- [部署指南](docs/deployment.md) - 生产环境部署指南
- [用户手册](docs/user-guide.md) - 用户操作指南

## 安全特性

- JWT token认证
- API Key认证
- 请求频率限制
- 输入验证（Zod）
- SQL注入防护
- CORS配置

## 性能指标

- Token转发延迟：< 100ms（目标）
- 系统可用性：99.9%（目标）
- 支持并发用户：1000+（目标）

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建Pull Request

## 许可证

ISC License

## 联系方式

- 项目维护者：[待填写]
- 邮箱：[待填写]
- 项目链接：[待填写]

## 更新日志

### v1.0.0 (2026-06-10)
- 初始版本发布
- 用户认证系统
- Token管理功能
- 市场交易系统
- OpenAI API兼容代理
