# Token二级市场平台管理员指南

## 概述

本指南为平台管理员提供系统管理、监控和维护的详细说明。

## 目录

1. [管理员职责](#管理员职责)
2. [系统管理](#系统管理)
3. [用户管理](#用户管理)
4. [Token管理](#token管理)
5. [交易管理](#交易管理)
6. [监控与告警](#监控与告警)
7. [安全管理](#安全管理)
8. [故障处理](#故障处理)
9. [性能优化](#性能优化)
10. [备份与恢复](#备份与恢复)

---

## 管理员职责

### 核心职责

- **系统监控**：确保平台稳定运行
- **用户管理**：处理用户问题和投诉
- **内容审核**：审核Token和服务质量
- **安全管理**：防范安全威胁
- **性能优化**：优化系统性能
- **数据备份**：确保数据安全

### 权限说明

管理员拥有以下权限：

- 查看所有用户信息
- 管理用户角色和权限
- 管理所有Token
- 查看所有交易记录
- 处理退款请求
- 查看系统统计
- 配置系统参数

---

## 系统管理

### 系统状态检查

#### 健康检查API

```bash
curl http://localhost:3000/api/admin/health \
  -H "Authorization: Bearer admin-token"
```

响应示例：

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "database": "connected",
    "user_count": 1000,
    "timestamp": "2026-06-10T12:00:00Z",
    "uptime": 86400
  }
}
```

#### 系统统计API

```bash
curl http://localhost:3000/api/admin/stats \
  -H "Authorization: Bearer admin-token"
```

响应示例：

```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "providers": 200,
      "consumers": 800
    },
    "tokens": {
      "total": 500,
      "active": 450,
      "inactive": 50
    },
    "transactions": {
      "total": 10000,
      "completed": 9500,
      "failed": 500,
      "total_tokens_used": 10000000,
      "total_points_traded": 100000
    }
  }
}
```

### 配置管理

#### 环境变量配置

主要配置项：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# JWT配置
JWT_SECRET=your-strong-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# 数据库配置
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# API配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# 积分配置
DEFAULT_POINTS_BALANCE=1000
```

#### 动态配置更新

某些配置可以通过API动态更新：

```bash
# 更新默认积分余额
curl -X PATCH http://localhost:3000/api/admin/config \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"DEFAULT_POINTS_BALANCE": 2000}'
```

---

## 用户管理

### 用户列表

#### 获取用户列表

```bash
curl "http://localhost:3000/api/admin/users?role=user&limit=20&offset=0" \
  -H "Authorization: Bearer admin-token"
```

#### 筛选条件

- `role`: 用户角色 (user/provider/admin)
- `limit`: 每页数量
- `offset`: 偏移量

### 用户详情

#### 获取用户详情

```bash
curl http://localhost:3000/api/admin/users/:userId \
  -H "Authorization: Bearer admin-token"
```

响应包含：
- 用户基本信息
- 用户的Token列表
- 用户的交易历史

### 用户角色管理

#### 修改用户角色

```bash
curl -X PATCH http://localhost:3000/api/admin/users/:userId/role \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"role": "provider"}'
```

#### 角色说明

| 角色 | 权限 | 适用场景 |
|------|------|----------|
| user | 浏览、购买、使用API | 普通消费者 |
| provider | 创建token、管理服务 | token提供者 |
| admin | 所有权限 | 平台管理员 |

### 用户积分管理

#### 调整用户积分

```bash
# 增加积分
curl -X PATCH http://localhost:3000/api/admin/users/:userId/points \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "action": "add"}'

# 扣除积分
curl -X PATCH http://localhost:3000/api/admin/users/:userId/points \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "action": "subtract"}'
```

---

## Token管理

### Token列表

#### 获取所有Token

```bash
curl "http://localhost:3000/api/admin/tokens?is_active=true&limit=20" \
  -H "Authorization: Bearer admin-token"
```

#### 筛选条件

- `provider_id`: 提供者ID
- `is_active`: 是否激活
- `protocol`: 协议类型
- `limit`: 每页数量
- `offset`: 偏移量

### Token审核

#### 审核流程

1. **新Token提交**
   - 提供者创建新Token
   - Token进入待审核状态

2. **审核内容**
   - 检查Token名称和描述
   - 验证API端点可用性
   - 检查价格合理性
   - 确认协议兼容性

3. **审核结果**
   - 通过：Token激活
   - 拒绝：通知提供者原因

#### 激活/停用Token

```bash
# 激活Token
curl -X PATCH http://localhost:3000/api/admin/tokens/:tokenId/status \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"is_active": true}'

# 停用Token
curl -X PATCH http://localhost:3000/api/admin/tokens/:tokenId/status \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false}'
```

### 质量监控

#### 监控指标

- **可用性**：Token服务是否正常
- **响应时间**：API响应延迟
- **错误率**：请求失败比例
- **用户评价**：用户反馈

#### 处理质量问题

1. **发现问题**
   - 监控告警
   - 用户投诉
   - 定期检查

2. **调查原因**
   - 检查日志
   - 测试API
   - 联系提供者

3. **采取行动**
   - 警告提供者
   - 临时停用Token
   - 永久下架（严重问题）

---

## 交易管理

### 交易列表

#### 获取交易记录

```bash
curl "http://localhost:3000/api/admin/transactions?status=completed&limit=20" \
  -H "Authorization: Bearer admin-token"
```

#### 筛选条件

- `status`: 交易状态 (pending/completed/failed/refunded)
- `start_date`: 开始日期
- `end_date`: 结束日期
- `limit`: 每页数量
- `offset`: 偏移量

### 交易详情

#### 获取交易详情

```bash
curl http://localhost:3000/api/admin/transactions/:transactionId \
  -H "Authorization: Bearer admin-token"
```

### 退款处理

#### 退款流程

1. **接收退款请求**
   - 用户提交退款申请
   - 提供退款原因

2. **审核退款请求**
   - 检查交易记录
   - 验证退款原因
   - 确认是否符合退款政策

3. **执行退款**
   - 调用退款API
   - 更新交易状态
   - 通知用户

#### 退款API

```bash
curl -X POST http://localhost:3000/api/admin/transactions/:transactionId/refund \
  -H "Authorization: Bearer admin-token" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Service not as described"}'
```

### 争议处理

#### 常见争议类型

1. **服务质量问题**
   - Token无法使用
   - 响应时间过长
   - 输出质量差

2. **计费问题**
   - 多扣积分
   - 计费不准确
   - 重复扣费

3. **虚假宣传**
   - 模型名称不符
   - 功能描述不实

#### 争议处理流程

1. **收集证据**
   - 交易记录
   - 用户反馈
   - 系统日志

2. **调查核实**
   - 测试Token服务
   - 对比宣传内容
   - 咨询技术专家

3. **做出裁决**
   - 支持用户：全额退款
   - 支持提供者：驳回申请
   - 部分责任：部分退款

4. **执行裁决**
   - 执行退款
   - 更新记录
   - 通知双方

---

## 监控与告警

### 监控指标

#### 系统指标

- **CPU使用率**：< 80%
- **内存使用率**：< 80%
- **磁盘使用率**：< 90%
- **网络带宽**：监控异常流量

#### 应用指标

- **请求量**：每秒请求数
- **响应时间**：平均响应时间
- **错误率**：请求失败比例
- **并发连接数**：当前连接数

#### 业务指标

- **用户增长**：新注册用户数
- **Token数量**：活跃Token数量
- **交易量**：每日交易数量
- **积分流通**：积分使用情况

### 告警配置

#### 告警级别

| 级别 | 说明 | 响应时间 |
|------|------|----------|
| P0 | 系统宕机 | 立即 |
| P1 | 功能异常 | 1小时内 |
| P2 | 性能下降 | 4小时内 |
| P3 | 警告信息 | 24小时内 |

#### 告警渠道

- **邮件**：详细告警信息
- **短信**：紧急告警
- **Slack/钉钉**：实时通知
- **电话**：P0级告警

### 监控工具

#### PM2监控

```bash
# 查看进程状态
pm2 status

# 查看日志
pm2 logs

# 监控资源使用
pm2 monit
```

#### 数据库监控

```sql
-- 查看连接数
SELECT count(*) FROM pg_stat_activity;

-- 查看慢查询
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看表大小
SELECT 
  relname as "table",
  pg_size_pretty(pg_total_relation_size(relid)) as "size"
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

---

## 安全管理

### 安全策略

#### 访问控制

1. **最小权限原则**
   - 用户只拥有必要权限
   - 定期审查权限分配

2. **角色分离**
   - 管理员与用户分离
   - 不同管理员不同权限

3. **访问审计**
   - 记录所有管理操作
   - 定期审查访问日志

#### 数据安全

1. **传输加密**
   - 使用HTTPS
   - 强制TLS 1.2+

2. **存储加密**
   - 敏感数据加密存储
   - 定期轮换加密密钥

3. **数据脱敏**
   - 日志中脱敏敏感信息
   - 测试环境使用脱敏数据

### 安全审计

#### 审计内容

- **用户活动**：登录、操作、异常行为
- **API调用**：调用频率、来源、异常模式
- **管理操作**：配置变更、权限变更
- **安全事件**：攻击尝试、漏洞利用

#### 审计日志

```bash
# 查看登录日志
tail -f /var/log/auth.log

# 查看应用日志
pm2 logs token-marketplace-server

# 查看Nginx访问日志
tail -f /var/log/nginx/access.log
```

### 安全事件响应

#### 事件分类

| 级别 | 说明 | 响应时间 |
|------|------|----------|
| 紧急 | 数据泄露、系统入侵 | 立即 |
| 高危 | 漏洞利用、异常访问 | 1小时内 |
| 中危 | 可疑行为、配置错误 | 4小时内 |
| 低危 | 安全警告、最佳实践 | 24小时内 |

#### 响应流程

1. **事件检测**
   - 监控告警
   - 用户报告
   - 安全扫描

2. **事件评估**
   - 确定影响范围
   - 评估严重程度
   - 制定响应计划

3. **事件处理**
   - 隔离受影响系统
   - 收集证据
   - 修复漏洞

4. **事后分析**
   - 分析根本原因
   - 更新安全策略
   - 改进监控

---

## 故障处理

### 常见故障

#### 1. 服务不可用

**症状**：
- API返回500错误
- 无法访问平台
- 连接超时

**排查步骤**：

```bash
# 检查服务状态
pm2 status

# 检查日志
pm2 logs token-marketplace-server --lines 100

# 检查端口
lsof -i :3000

# 检查数据库连接
psql -U token_marketplace -h localhost -c "SELECT 1"
```

**解决方案**：

1. 重启服务
```bash
pm2 restart token-marketplace-server
```

2. 检查数据库
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

3. 检查系统资源
```bash
top
df -h
free -m
```

#### 2. 数据库连接失败

**症状**：
- 无法登录
- 数据加载失败
- 连接超时

**排查步骤**：

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 检查连接数
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# 检查日志
sudo tail -f /var/log/postgresql/postgresql-*.log
```

**解决方案**：

1. 重启数据库
```bash
sudo systemctl restart postgresql
```

2. 增加连接数
```sql
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

3. 清理空闲连接
```sql
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND query_start < now() - interval '10 minutes';
```

#### 3. 性能下降

**症状**：
- 响应时间变慢
- 请求超时
- 用户投诉

**排查步骤**：

```bash
# 检查CPU使用率
top

# 检查内存使用
free -m

# 检查磁盘I/O
iostat -x 1

# 检查网络
netstat -an | grep :3000 | wc -l
```

**解决方案**：

1. 优化数据库查询
```sql
EXPLAIN ANALYZE SELECT * FROM tokens WHERE is_active = true;
```

2. 增加索引
```sql
CREATE INDEX idx_tokens_is_active ON tokens(is_active);
```

3. 扩展资源
- 增加CPU/内存
- 使用负载均衡
- 部署多个实例

#### 4. 内存泄漏

**症状**：
- 内存使用持续增长
- 服务响应变慢
- 最终OOM崩溃

**排查步骤**：

```bash
# 监控内存使用
pm2 monit

# 检查进程内存
ps aux | grep node

# 生成堆快照
kill -USR2 <pid>
```

**解决方案**：

1. 重启服务
```bash
pm2 restart token-marketplace-server
```

2. 配置内存限制
```javascript
// ecosystem.config.js
{
  max_memory_restart: '1G'
}
```

3. 修复代码
- 检查未关闭的连接
- 检查未清理的定时器
- 检查循环引用

---

## 性能优化

### 数据库优化

#### 索引优化

```sql
-- 分析查询计划
EXPLAIN ANALYZE 
SELECT * FROM tokens 
WHERE is_active = true AND model_name = 'gpt-4';

-- 创建复合索引
CREATE INDEX idx_tokens_active_model 
ON tokens(is_active, model_name);

-- 创建部分索引
CREATE INDEX idx_active_tokens 
ON tokens(provider_id) 
WHERE is_active = true;
```

#### 查询优化

```sql
-- 避免SELECT *
SELECT id, name, model_name, price_per_1k_tokens
FROM tokens
WHERE is_active = true;

-- 使用分页
SELECT * FROM tokens
ORDER BY created_at DESC
LIMIT 20 OFFSET 0;

-- 使用EXISTS代替IN
SELECT * FROM users u
WHERE EXISTS (
  SELECT 1 FROM tokens t 
  WHERE t.provider_id = u.id
);
```

#### 连接池优化

```typescript
// 优化连接池配置
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 应用优化

#### 缓存策略

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5分钟缓存

async function getActiveTokens() {
  const cacheKey = 'active_tokens';
  let tokens = cache.get(cacheKey);
  
  if (!tokens) {
    tokens = await tokenModel.findAll({ isActive: true });
    cache.set(cacheKey, tokens);
  }
  
  return tokens;
}
```

#### 响应压缩

```typescript
import compression from 'compression';

app.use(compression());
```

#### 请求限流

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 每个IP最多100个请求
});

app.use(limiter);
```

### 负载均衡

#### Nginx负载均衡

```nginx
upstream token_marketplace {
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    
    location / {
        proxy_pass http://token_marketplace;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### PM2集群模式

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'token-marketplace',
    script: './server/dist/index.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster'
  }]
};
```

---

## 备份与恢复

### 备份策略

#### 备份类型

1. **全量备份**
   - 完整数据库备份
   - 频率：每天一次
   - 保留时间：7天

2. **增量备份**
   - 只备份变更数据
   - 频率：每小时一次
   - 保留时间：24小时

3. **日志备份**
   - 应用日志
   - 数据库日志
   - 保留时间：30天

#### 备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="token_marketplace"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 全量备份
pg_dump -U postgres -h localhost $DB_NAME > $BACKUP_DIR/full_$DATE.sql

# 压缩
gzip $BACKUP_DIR/full_$DATE.sql

# 删除7天前的备份
find $BACKUP_DIR -name "full_*.sql.gz" -mtime +7 -delete

echo "Backup completed: full_$DATE.sql.gz"
```

#### 定时备份

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点执行全量备份
0 2 * * * /opt/token-marketplace/scripts/backup.sh

# 每小时执行增量备份
0 * * * * /opt/token-marketplace/scripts/incremental_backup.sh
```

### 恢复流程

#### 恢复步骤

1. **停止服务**
```bash
pm2 stop token-marketplace-server
```

2. **恢复数据库**
```bash
# 从全量备份恢复
psql -U postgres -h localhost token_marketplace < /opt/backups/full_20260610_020000.sql

# 或从压缩备份恢复
gunzip -c /opt/backups/full_20260610_020000.sql.gz | psql -U postgres -h localhost token_marketplace
```

3. **重启服务**
```bash
pm2 start token-marketplace-server
```

4. **验证恢复**
```bash
curl http://localhost:3000/health
```

#### 恢复演练

定期进行恢复演练，确保备份有效：

```bash
# 创建测试数据库
createdb -U postgres token_marketplace_test

# 恢复到测试数据库
psql -U postgres token_marketplace_test < /opt/backups/full_20260610_020000.sql

# 验证数据
psql -U postgres token_marketplace_test -c "SELECT count(*) FROM users;"

# 清理测试数据库
dropdb -U postgres token_marketplace_test
```

---

## 最佳实践

### 运维最佳实践

1. **自动化**
   - 使用CI/CD自动部署
   - 自动化备份和恢复
   - 自动化监控和告警

2. **文档化**
   - 记录所有配置变更
   - 维护操作手册
   - 更新故障处理流程

3. **演练**
   - 定期进行故障演练
   - 测试备份恢复流程
   - 验证告警响应

### 安全最佳实践

1. **定期更新**
   - 更新系统补丁
   - 更新依赖包
   - 更新安全配置

2. **访问控制**
   - 使用强密码
   - 启用双因素认证
   - 限制管理访问

3. **监控审计**
   - 监控异常行为
   - 审计管理操作
   - 定期安全扫描

---

## 联系支持

如有问题，请联系：

- **技术负责人**：[待填写]
- **运维团队**：[待填写]
- **安全团队**：[待填写]
- **文档**：[待填写]

---

## 更新日志

### v1.0.0 (2026-06-10)
- 初始版本发布
- 管理员指南
- 系统管理功能
- 用户管理功能
- 监控与告警
- 安全管理
- 故障处理
