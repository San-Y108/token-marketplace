# 多阶段构建
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY server/package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY server/ .

# 构建TypeScript
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 安装curl用于健康检查
RUN apk add --no-cache curl

# 复制package文件
COPY server/package*.json ./

# 安装生产依赖
RUN npm install -g pnpm
RUN pnpm install --prod --frozen-lockfile

# 复制构建结果
COPY --from=builder /app/dist ./dist

# 创建日志目录
RUN mkdir -p logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动命令
CMD ["node", "dist/index.js"]
