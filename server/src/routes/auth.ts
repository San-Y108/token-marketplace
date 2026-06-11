import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.js';
import { apiKeyModel } from '../models/apiKey.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// 验证schemas
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(['user', 'provider']).optional()
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

const refreshTokenSchema = z.object({
  refreshToken: z.string()
});

const generateApiKeySchema = z.object({
  name: z.string().optional()
});

// 注册
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await authService.register({
      username: validatedData.username,
      email: validatedData.email,
      password: validatedData.password,
      role: validatedData.role
    });

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = message.includes('already exists') ? 409 : 500;

    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
});

// 登录
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await authService.login(validatedData.username, validatedData.password);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Login failed';
    const statusCode = message.includes('Invalid') ? 401 : 500;

    res.status(statusCode).json({
      success: false,
      error: message
    });
  }
});

// 刷新token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const validatedData = refreshTokenSchema.parse(req.body);
    const tokens = await authService.refreshToken(validatedData.refreshToken);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Token refresh failed';
    res.status(401).json({
      success: false,
      error: message
    });
  }
});

// 获取当前用户信息
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: user.userId,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get user info'
    });
  }
});

// 生成API Key
router.post('/api-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = generateApiKeySchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const result = await authService.generateApiKey(user.userId, validatedData.name);

    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate API key'
    });
  }
});

// 获取用户的API Keys（隐藏敏感字段）
router.get('/api-keys', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const apiKeys = await authService.getUserApiKeys(user.userId);

    // 隐藏敏感字段
    const sanitizedKeys = apiKeys.map(({ key_hash, permissions, ...key }) => key);

    res.json({
      success: true,
      data: sanitizedKeys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get API keys'
    });
  }
});

// 撤销API Key（需要验证所有权）
router.delete('/api-keys/:keyId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { keyId } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 验证API Key是否属于当前用户
    const key = await apiKeyModel.findById(keyId);
    if (!key || key.user_id !== user.userId) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    const success = await authService.revokeApiKey(keyId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key'
    });
  }
});

export default router;
