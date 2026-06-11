# 更新日志

本项目的所有重要更改都将记录在此文件。

格式基于[Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)。

## [1.1.0] - 2026-06-11

### 安全改进 (Security)
- **Token API响应隐藏敏感字段** - `api_key_encrypted`和`base_url`不再暴露给客户端
- **API Key bcrypt哈希存储** - 使用bcrypt(12)哈希存储API Key，创建时只返回一次完整Key
- **API Key所有权校验** - 撤销API Key时验证是否属于当前用户
- **积分原子性更新** - 使用数据库条件更新防止并发双花问题
- **充值端点权限限制** - `POST /api/marketplace/recharge`现在需要admin角色
- **Stream模式明确拒绝** - 暂不支持的stream模式返回明确的400错误
- **404 JSON处理** - 未匹配路由返回标准JSON格式响应
- **Docker安全配置** - 移除硬编码密码，使用环境变量注入

### 修复 (Fixed)
- **路由顺序问题** - `/api/tokens/provider/:providerId`现在正确匹配，不再被`/:id`遮蔽
- **分页查询验证** - 使用Zod验证分页参数，防止NaN、负数和无上限查询
- **环境变量配置** - `.env.example`修正为PostgreSQL配置，移除错误的DB_PATH

### 新增 (Added)
- **敏感字段安全测试** - `tests/security-fields.test.ts`验证敏感字段是否正确隐藏
- **Docker环境变量示例** - `.env.docker`文件提供Docker部署配置模板
- **CHANGELOG.md** - 项目更新日志

### 测试结果
- 测试套件: 13 passed, 4 skipped
- 测试用例: 146 passed, 62 skipped

## [1.0.0] - 2026-06-10

### 初始发布
- 用户认证系统（JWT + API Key）
- Token管理（CRUD操作）
- 市场交易系统
- OpenAI兼容API代理
- THC协议支持
- 管理员后台
- 完整测试套件（141个测试）
- Docker部署配置
- 完整文档
