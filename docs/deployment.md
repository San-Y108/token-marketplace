# Token二级市场平台部署指南

## 概述

本指南将帮助您在生产环境中部署Token二级市场平台。

## 前置要求

### 系统要求

- **操作系统**: Ubuntu 20.04+ / CentOS 7+ / macOS 10.15+
- **Node.js**: 18.0 或更高版本
- **PostgreSQL**: 14.0 或更高版本
- **内存**: 最少 2GB RAM（推荐 4GB+）
- **磁盘**: 最少 10GB 可用空间

### 软件依赖

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+
- Nginx（可选，用于反向代理）
- PM2（推荐，用于进程管理）

---

## 部署步骤

### 1. 环境准备

#### 安装Node.js

```bash
# 使用nvm安装Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### 安装pnpm

```bash
npm install -g pnpm
```

#### 安装PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

---

### 2. 数据库配置

#### 创建数据库用户和数据库

```bash
# 切换到postgres用户
sudo -u postgres psql

# 创建用户
CREATE USER token_marketplace WITH PASSWORD 'your_secure_password';

# 创建数据库
CREATE DATABASE token_marketplace OWNER token_marketplace;

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE token_marketplace TO token_marketplace;

# 退出
\q
```

#### 配置PostgreSQL认证

编辑PostgreSQL配置文件：

```bash
# Ubuntu/Debian
sudo nano /etc/postgresql/*/main/pg_hba.conf

# CentOS/RHEL
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

添加或修改以下行：
```
# IPv4 local connections:
host    all             all             127.0.0.1/32            md5

# IPv6 local connections:
host    all             all             ::1/128                 md5
```

重启PostgreSQL：
```bash
sudo systemctl restart postgresql
```

---

### 3. 应用部署

#### 克隆代码

```bash
# 创建应用目录
sudo mkdir -p /opt/token-marketplace
sudo chown $USER:$USER /opt/token-marketplace

# 克隆代码
cd /opt/token-marketplace
git clone <repository-url> .
```

#### 安装依赖

```bash
pnpm install
```

#### 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑环境变量
nano server/.env
```

配置以下环境变量：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# JWT配置（生产环境请使用强密码）
JWT_SECRET=your-very-strong-jwt-secret-key-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# PostgreSQL配置
DATABASE_URL=postgresql://token_marketplace:your_secure_password@localhost:5432/token_marketplace

# API配置
API_PREFIX=/api
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS配置（配置您的前端域名）
CORS_ORIGIN=https://yourdomain.com

# 积分配置
DEFAULT_POINTS_BALANCE=1000
MIN_POINTS_PER_TRANSACTION=1
```

#### 初始化数据库

```bash
# 运行数据库初始化脚本
./server/scripts/initDb.sh
```

---

### 4. 使用PM2部署（推荐）

#### 安装PM2

```bash
pnpm add -g pm2
```

#### 创建PM2配置文件

创建 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [{
    name: 'token-marketplace-server',
    script: './server/dist/index.js',
    cwd: '/opt/token-marketplace',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_file: './server/.env',
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
```

#### 构建应用

```bash
# 构建后端
cd server
pnpm build
cd ..
```

#### 启动应用

```bash
# 使用PM2启动
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup
```

#### PM2常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs token-marketplace-server

# 重启应用
pm2 restart token-marketplace-server

# 停止应用
pm2 stop token-marketplace-server

# 监控
pm2 monit
```

---

### 5. Nginx反向代理配置

#### 安装Nginx

**Ubuntu/Debian:**
```bash
sudo apt install nginx
```

**CentOS/RHEL:**
```bash
sudo yum install nginx
```

#### 配置Nginx

创建配置文件：

```bash
sudo nano /etc/nginx/sites-available/token-marketplace
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL配置（需要先获取SSL证书）
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 日志
    access_log /var/log/nginx/token-marketplace.access.log;
    error_log /var/log/nginx/token-marketplace.error.log;

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # OpenAI兼容API代理
    location /v1/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # 前端静态文件（如果需要）
    location / {
        root /opt/token-marketplace/frontend/out;
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
}
```

#### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/token-marketplace /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

---

### 6. SSL证书配置（Let's Encrypt）

#### 安装Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

#### 获取证书

```bash
sudo certbot --nginx -d yourdomain.com
```

#### 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# 添加定时任务
sudo crontab -e
# 添加以下行：
0 12 * * * /usr/bin/certbot renew --quiet
```

---

### 7. 防火墙配置

#### Ubuntu/Debian (UFW)

```bash
# 启用防火墙
sudo ufw enable

# 允许SSH
sudo ufw allow ssh

# 允许HTTP和HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 查看状态
sudo ufw status
```

#### CentOS/RHEL (firewalld)

```bash
# 启动防火墙
sudo systemctl start firewalld
sudo systemctl enable firewalld

# 允许HTTP和HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# 重新加载配置
sudo firewall-cmd --reload
```

---

### 8. 监控和日志

#### 日志配置

创建日志目录：

```bash
mkdir -p /opt/token-marketplace/logs
```

#### 日志轮转

创建日志轮转配置：

```bash
sudo nano /etc/logrotate.d/token-marketplace
```

添加以下内容：

```
/opt/token-marketplace/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 监控工具

推荐使用以下监控工具：

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   ```

2. **New Relic**（可选）
   - 注册New Relic账户
   - 安装Node.js agent
   - 配置license key

3. **Sentry**（错误追踪）
   - 注册Sentry账户
   - 安装Sentry SDK
   - 配置DSN

---

## Docker部署（可选）

### Dockerfile

创建 `Dockerfile`：

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-workspace.yaml ./
COPY server/package.json ./server/
COPY frontend/package.json ./frontend/

# 安装依赖
RUN pnpm install

# 复制源代码
COPY . .

# 构建
RUN cd server && pnpm build

# 生产阶段
FROM node:18-alpine

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 复制构建结果
COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/server/package.json ./server/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules

# 复制环境变量
COPY server/.env ./server/

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server/dist/index.js"]
```

### docker-compose.yml

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_USER: token_marketplace
      POSTGRES_PASSWORD: your_secure_password
      POSTGRES_DB: token_marketplace
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/database/schema.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://token_marketplace:your_secure_password@postgres:5432/token_marketplace
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

### 启动Docker服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## 生产环境检查清单

### 部署前检查

- [ ] 环境变量已正确配置
- [ ] 数据库已初始化
- [ ] JWT密钥已更改为强密码
- [ ] CORS已配置正确的前端域名
- [ ] 防火墙已配置
- [ ] SSL证书已安装
- [ ] 日志目录已创建

### 部署后检查

- [ ] 应用正常启动
- [ ] API端点可访问
- [ ] 数据库连接正常
- [ ] 日志正常记录
- [ ] 监控已配置
- [ ] 备份策略已设置

### 安全检查

- [ ] 使用HTTPS
- [ ] JWT密钥足够强
- [ ] 数据库密码足够强
- [ ] 定期更新依赖
- [ ] 定期备份数据库
- [ ] 监控异常访问

---

## 故障排查

### 常见问题

#### 1. 数据库连接失败

**错误信息**: `ECONNREFUSED 127.0.0.1:5432`

**解决方案**:
```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql

# 启动PostgreSQL
sudo systemctl start postgresql

# 检查端口是否监听
sudo netstat -tlnp | grep 5432
```

#### 2. 权限被拒绝

**错误信息**: `permission denied for table users`

**解决方案**:
```bash
# 连接到数据库
sudo -u postgres psql

# 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO token_marketplace;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO token_marketplace;
```

#### 3. 端口已被占用

**错误信息**: `EADDRINUSE: address already in use :::3000`

**解决方案**:
```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或者更改端口
# 编辑 .env 文件，修改 PORT 变量
```

#### 4. JWT验证失败

**错误信息**: `invalid token`

**解决方案**:
- 检查JWT_SECRET是否正确配置
- 确保token未过期
- 检查token格式是否正确

---

## 性能优化

### 数据库优化

1. **添加索引**
   - 为常用查询字段添加索引
   - 定期分析查询性能

2. **连接池配置**
   - 调整连接池大小
   - 配置连接超时

3. **查询优化**
   - 避免N+1查询
   - 使用分页查询

### 应用优化

1. **缓存**
   - 使用Redis缓存热点数据
   - 配置HTTP缓存头

2. **压缩**
   - 启用Gzip压缩
   - 压缩静态资源

3. **CDN**
   - 使用CDN加速静态资源
   - 配置缓存策略

---

## 备份策略

### 数据库备份

```bash
# 创建备份脚本
cat > /opt/token-marketplace/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/token-marketplace/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
pg_dump -U token_marketplace -h localhost token_marketplace > $BACKUP_FILE

# 压缩备份
gzip $BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
EOF

# 添加执行权限
chmod +x /opt/token-marketplace/scripts/backup.sh

# 添加定时任务
crontab -e
# 添加以下行：
0 2 * * * /opt/token-marketplace/scripts/backup.sh
```

### 应用备份

```bash
# 备份应用代码
tar -czf /opt/token-marketplace/backups/app_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=.git \
  /opt/token-marketplace
```

---

## 更新部署

### 更新步骤

```bash
# 1. 备份当前版本
./scripts/backup.sh

# 2. 拉取最新代码
cd /opt/token-marketplace
git pull origin main

# 3. 安装依赖
pnpm install

# 4. 构建应用
cd server && pnpm build && cd ..

# 5. 重启应用
pm2 restart token-marketplace-server

# 6. 验证
curl http://localhost:3000/health
```

### 回滚步骤

```bash
# 1. 停止应用
pm2 stop token-marketplace-server

# 2. 恢复代码
cd /opt/token-marketplace
git checkout <previous-commit-hash>

# 3. 安装依赖
pnpm install

# 4. 构建应用
cd server && pnpm build && cd ..

# 5. 恢复数据库（如果需要）
psql -U token_marketplace -h localhost token_marketplace < /opt/token-marketplace/backups/backup_XXXXXXXX.sql

# 6. 重启应用
pm2 restart token-marketplace-server
```

---

## 联系支持

如有问题，请联系：

- 邮箱：[待填写]
- 文档：[待填写]
- Issue：[待填写]
