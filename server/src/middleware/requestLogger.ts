import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, path, ip } = req;

  // 记录请求开始
  console.log(`[${new Date().toISOString()}] ${method} ${path} - IP: ${ip}`);

  // 响应结束时记录
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    const logLevel = statusCode >= 400 ? 'ERROR' : 'INFO';
    const message = `[${new Date().toISOString()}] ${method} ${path} ${statusCode} - ${duration}ms`;

    if (logLevel === 'ERROR') {
      console.error(message);
    } else {
      console.log(message);
    }
  });

  next();
}
