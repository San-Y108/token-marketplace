# Token二级市场平台 - 高可用架构设计

## 概述

本文档描述Token二级市场平台的高可用架构设计，包括负载均衡、多实例部署和弹性扩展机制。

## 架构设计

### 1. 单实例部署（开发环境）

```
┌─────────────────────────────────────┐
│           Client Request            │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│     Node.js Server (port 3000)      │
│  ┌───────────────────────────────┐  │
│  │       Express.js App          │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
└─────────────────────────────────────┘
```

### 2. 多实例部署（生产环境）

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (Nginx)       │
                    └─────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Node.js #1      │ │ Node.js #2      │ │ Node.js #3      │
│ (port 3001)     │ │ (port 3002)     │ │ (port 3003)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Primary)     │
                    └─────────────────┘
                            │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   (Replica)     │
                    └─────────────────┘
```

### 3. 容器化部署（Kubernetes）

```
┌─────────────────────────────────────┐
│           Kubernetes Cluster        │
└─────────────────────────────────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Pod #1    │ │   Pod #2    │ │   Pod #3    │
│ (Node.js)   │ │ (Node.js)   │ │ (Node.js)   │
└─────────────┘ └─────────────┘ └─────────────┘
        │           │           │
        └───────────┼───────────┘
                    │
            ┌───────┴───────┐
            │               │
            ▼               ▼
    ┌─────────────┐ ┌─────────────┐
    │   Service   │ │   Service   │
    │  (PostgreSQL)│ │  (Redis)    │
    └─────────────┘ └─────────────┘
```

## 实现方案

### 1. PM2集群模式

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'token-marketplace',
    script: './server/dist/index.js',
    instances: 'max', // 使用所有CPU核心
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // 健康检查
    health_check_url: '/health',
    health_check_grace_period: 3000,
    // 自动重启
    max_memory_restart: '1G',
    // 日志
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    merge_logs: true
  }]
};
```

### 2. Nginx负载均衡配置

```nginx
# nginx.conf
upstream token_marketplace {
    least_conn; # 最少连接算法
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004 backup; # 备用服务器
}

server {
    listen 80;
    server_name api.tokenmarketplace.com;

    # 健康检查
    location /health {
        proxy_pass http://token_marketplace;
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
    }

    # API代理
    location / {
        proxy_pass http://token_marketplace;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # 连接池
        keepalive 64;
    }
}
```

### 3. Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - app1
      - app2
      - app3

  app1:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/token_marketplace
    depends_on:
      - postgres

  app2:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/token_marketplace
    depends_on:
      - postgres

  app3:
    build: .
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/token_marketplace
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: token_marketplace
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 4. Kubernetes部署

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: token-marketplace
spec:
  replicas: 3
  selector:
    matchLabels:
      app: token-marketplace
  template:
    metadata:
      labels:
        app: token-marketplace
    spec:
      containers:
      - name: token-marketplace
        image: token-marketplace:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: token-marketplace-service
spec:
  selector:
    app: token-marketplace
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: token-marketplace-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: token-marketplace
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 弹性扩展机制

### 1. 水平扩展

- **自动扩展**：根据CPU/内存使用率自动增加/减少实例
- **手动扩展**：管理员可手动调整实例数量
- **计划扩展**：根据历史流量模式预设扩展计划

### 2. 垂直扩展

- **CPU升级**：增加CPU核心数
- **内存升级**：增加内存容量
- **存储升级**：增加磁盘空间

### 3. 数据库扩展

- **读写分离**：主库写，从库读
- **分库分表**：按用户/时间分片
- **缓存层**：Redis缓存热点数据

## 高可用保证

### 1. 故障检测

- **健康检查**：定期检查服务状态
- **心跳检测**：实例间相互检测
- **监控告警**：异常时发送告警

### 2. 故障转移

- **自动故障转移**：主节点故障时自动切换到从节点
- **手动故障转移**：管理员手动切换
- **数据一致性**：确保故障转移后数据一致

### 3. 数据备份

- **定期备份**：每日自动备份
- **增量备份**：实时增量备份
- **异地备份**：备份到不同地理位置

## 性能优化

### 1. 缓存策略

- **Redis缓存**：缓存热点数据
- **CDN加速**：静态资源CDN分发
- **浏览器缓存**：设置合理的缓存头

### 2. 数据库优化

- **索引优化**：为常用查询添加索引
- **查询优化**：优化慢查询
- **连接池**：合理配置连接池大小

### 3. 应用优化

- **异步处理**：使用消息队列异步处理
- **代码压缩**：压缩JS/CSS代码
- **懒加载**：按需加载资源

## 监控与告警

### 1. 监控指标

- **系统指标**：CPU、内存、磁盘、网络
- **应用指标**：请求量、响应时间、错误率
- **业务指标**：用户数、交易量、积分流动

### 2. 告警规则

- **CPU使用率 > 80%**：发出警告
- **内存使用率 > 85%**：发出警告
- **错误率 > 5%**：发出严重警告
- **响应时间 > 1s**：发出性能警告

### 3. 日志管理

- **集中日志**：ELK Stack收集日志
- **日志分析**：分析日志发现异常
- **日志归档**：定期归档旧日志

## 部署流程

### 1. 开发环境

```bash
# 启动单实例
cd server
pnpm dev
```

### 2. 测试环境

```bash
# 使用PM2集群
cd server
pm2 start ecosystem.config.js
```

### 3. 生产环境

```bash
# Docker Compose部署
docker-compose up -d

# 或Kubernetes部署
kubectl apply -f k8s-deployment.yaml
```

## 验证清单

- [ ] 单实例部署正常
- [ ] 多实例部署正常
- [ ] 负载均衡工作正常
- [ ] 健康检查正常
- [ ] 故障转移正常
- [ ] 弹性扩展正常
- [ ] 监控告警正常
- [ ] 备份恢复正常

---

**文档版本**: 1.0.0
**最后更新**: 2026-06-10
**维护人员**: AI Assistant
