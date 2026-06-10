import { Request, Response, NextFunction } from 'express';
import { authService, TokenPayload } from '../services/auth.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
  apiKey?: {
    userId: string;
    permissions: any;
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    // 检查Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // 尝试验证JWT token
      try {
        const payload = await authService.validateAccessToken(token);
        req.user = payload;
        return next();
      } catch (error) {
        // JWT验证失败，尝试API Key
      }

      // 尝试验证API Key
      try {
        const apiKeyResult = await authService.validateApiKey(token);
        req.apiKey = apiKeyResult;
        return next();
      } catch (error) {
        // API Key也验证失败
      }
    }

    // 没有有效的认证信息
    res.status(401).json({
      success: false,
      error: 'Authentication required. Please provide a valid access token or API key.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

export function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  // 如果有auth header，尝试验证
  authMiddleware(req, res, next);
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
}
