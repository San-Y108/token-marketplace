import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import tokenRoutes from './routes/tokens.js';
import marketplaceRoutes from './routes/marketplace.js';
import proxyRoutes from './routes/proxy.js';
import adminRoutes from './routes/admin.js';
import { initializeDatabase } from './utils/dbInit.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// 频率限制
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 每个窗口最大请求数
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// API路由
const apiPrefix = process.env.API_PREFIX || '/api';
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/tokens`, tokenRoutes);
app.use(`${apiPrefix}/marketplace`, marketplaceRoutes);
app.use(`${apiPrefix}/admin`, adminRoutes);

// Token转发代理路由（OpenAI兼容）
app.use('/v1', proxyRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Token Marketplace API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 错误处理
app.use(errorHandler);

// 初始化数据库并启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    // 启动服务器
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}${apiPrefix}`);
      console.log(`🔗 Proxy available at http://localhost:${PORT}/v1`);
      console.log(`💊 Health check at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
