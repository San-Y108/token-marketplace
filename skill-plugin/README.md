# Token二级市场平台 CLI工具

一个用于与Token二级市场平台交互的命令行工具。

## 功能特性

- 🔐 **账号绑定**：安全绑定平台账号
- 📤 **Token上传**：快速上传token服务
- 📋 **Token列表**：查看已上传的token
- 💰 **积分管理**：查看积分余额
- 📊 **交易历史**：查看交易记录
- 🔍 **状态检查**：查看服务状态

## 安装

### 从源码安装

```bash
# 克隆项目
git clone <repository-url>
cd token-marketplace/skill-plugin

# 安装依赖
pnpm install

# 构建
pnpm build

# 全局安装
npm link
```

### 从npm安装（待发布）

```bash
npm install -g token-marketplace-skill
```

## 使用方法

### 绑定账号

```bash
# 交互式绑定
token-marketplace bind

# 指定参数绑定
token-marketplace bind -s http://localhost:3000 -u username -p password
```

### 上传Token

```bash
# 上传token服务
token-marketplace upload \
  -n "GPT-4 Turbo" \
  -m "gpt-4-turbo" \
  -u "https://api.yourservice.com" \
  -k "your-api-key" \
  -p "openai" \
  --price 0.03

# 带描述上传
token-marketplace upload \
  -n "GPT-4 Turbo" \
  -m "gpt-4-turbo" \
  -u "https://api.yourservice.com" \
  -k "your-api-key" \
  -d "高质量的GPT-4 Turbo模型服务"
```

### 查看Token列表

```bash
# 查看活跃token
token-marketplace list

# 查看所有token（包括停用的）
token-marketplace list --all
```

### 查看状态

```bash
token-marketplace status
```

输出示例：
```
服务状态:
────────────────────────────────────────
服务器地址: http://localhost:3000
绑定状态: ✓ 已绑定
登录状态: ✓ 已登录
用户名: testuser
服务器状态: ✓ 正常
服务版本: 1.0.0
────────────────────────────────────────
```

### 查看积分余额

```bash
token-marketplace balance
```

输出示例：
```
积分余额:
  1000 积分
```

### 查看交易历史

```bash
# 查看最近10条记录
token-marketplace history

# 查看最近20条记录
token-marketplace history -l 20

# 查看作为提供者的交易
token-marketplace history -r provider
```

输出示例：
```
交易历史:
──────────────────────────────────────────────────────────────────────────────────────────────────
ID                                    Token                数量        积分        状态        时间
──────────────────────────────────────────────────────────────────────────────────────────────────
123e4567-e89b-12d3-a456-426614174000  GPT-4 Turbo          1000        0.03        completed   2026/6/10 12:00:00
──────────────────────────────────────────────────────────────────────────────────────────────────
共 1 条记录
```

### 解绑账号

```bash
token-marketplace unbind
```

### 查看帮助

```bash
# 查看所有命令
token-marketplace help

# 查看特定命令帮助
token-marketplace help upload
```

## 配置

配置文件存储在用户目录下：

- **macOS**: `~/Library/Preferences/token-marketplace-nodejs`
- **Linux**: `~/.config/token-marketplace-nodejs`
- **Windows**: `%APPDATA%/token-marketplace-nodejs/config.json`

### 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| server | string | http://localhost:3000 | 平台服务器地址 |
| username | string | - | 用户名 |
| apiKey | string | - | API密钥 |
| userId | string | - | 用户ID |
| role | string | - | 用户角色 |
| autoSync | boolean | true | 自动同步状态 |
| syncInterval | number | 60000 | 同步间隔（毫秒） |

## 环境变量

支持以下环境变量：

```bash
# 平台服务器地址
TOKEN_MARKETPLACE_SERVER=http://localhost:3000

# API密钥
TOKEN_MARKETPLACE_API_KEY=your-api-key
```

## 开发

### 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint
```

### 项目结构

```
skill-plugin/
├── src/
│   ├── index.ts          # 主入口
│   ├── commands/         # 命令实现
│   ├── hooks/            # 钩子函数
│   └── utils/            # 工具函数
├── dist/                 # 编译输出
├── tests/                # 测试文件
├── package.json
├── tsconfig.json
└── README.md
```

## API参考

### 命令列表

#### bind
绑定平台账号。

```bash
token-marketplace bind [options]
```

选项：
- `-s, --server <url>`: 平台服务器地址
- `-u, --username <username>`: 用户名
- `-p, --password <password>`: 密码

#### unbind
解绑平台账号。

```bash
token-marketplace unbind
```

#### upload
上传token服务。

```bash
token-marketplace upload [options]
```

选项：
- `-n, --name <name>`: Token名称（必填）
- `-m, --model <model>`: 模型名称（必填）
- `-u, --url <url>`: API基础URL（必填）
- `-k, --key <key>`: API密钥（必填）
- `-p, --protocol <protocol>`: 协议类型（默认: openai）
- `--price <price>`: 每1000token价格（默认: 0.01）
- `-d, --description <description>`: 描述

#### list
列出已上传的token。

```bash
token-marketplace list [options]
```

选项：
- `-a, --all`: 显示所有token（包括停用的）

#### status
查看服务状态。

```bash
token-marketplace status
```

#### balance
查看积分余额。

```bash
token-marketplace balance
```

#### history
查看交易历史。

```bash
token-marketplace history [options]
```

选项：
- `-l, --limit <limit>`: 显示数量（默认: 10）
- `-r, --role <role>`: 角色（默认: consumer）

## 错误处理

### 常见错误

#### 未绑定账号
```
错误: 请先绑定账号: token-marketplace bind
```

解决方案：运行 `token-marketplace bind` 绑定账号。

#### 连接失败
```
错误: 无法连接到服务器
```

解决方案：
1. 检查服务器地址是否正确
2. 检查服务器是否正在运行
3. 检查网络连接

#### 认证失败
```
错误: 未授权
```

解决方案：
1. 重新绑定账号
2. 检查API密钥是否有效

## 最佳实践

### 安全建议

1. **保护API密钥**
   - 不要在脚本中硬编码API密钥
   - 使用环境变量或配置文件存储
   - 定期轮换API密钥

2. **验证服务器**
   - 只连接可信的服务器
   - 使用HTTPS连接（生产环境）

3. **权限控制**
   - 使用最小权限原则
   - 定期审查权限设置

### 使用技巧

1. **批量操作**
   - 使用脚本自动化常见操作
   - 结合其他命令行工具使用

2. **监控**
   - 定期检查服务状态
   - 监控积分余额

3. **备份**
   - 备份配置文件
   - 记录重要操作

## 故障排查

### 问题：命令无响应

**可能原因**：
- 服务器不可用
- 网络连接问题
- 认证失败

**解决方案**：
```bash
# 检查服务状态
token-marketplace status

# 检查网络连接
ping your-server.com

# 重新绑定账号
token-marketplace bind
```

### 问题：上传失败

**可能原因**：
- 参数错误
- 权限不足
- 服务器错误

**解决方案**：
```bash
# 检查参数
token-marketplace help upload

# 检查用户角色
token-marketplace status

# 查看详细错误信息
token-marketplace upload -n "test" -m "test" -u "http://test.com" -k "test" 2>&1
```

### 问题：积分余额显示异常

**可能原因**：
- 缓存问题
- 服务器延迟
- 数据不一致

**解决方案**：
```bash
# 重新获取余额
token-marketplace balance

# 检查交易历史
token-marketplace history

# 联系管理员
```

## 更新日志

### v1.0.0 (2026-06-10)
- 初始版本发布
- 基本命令实现
- 账号绑定功能
- Token管理功能
- 交易历史查看

## 许可证

ISC License

## 联系方式

- 邮箱：[待填写]
- 文档：[待填写]
- Issue：[待填写]
