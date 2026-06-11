import { Router, Response } from 'express';
import { z } from 'zod';
import { tokenModel, CreateTokenData, UpdateTokenData } from '../models/token.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// 验证schemas
const createTokenSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  model_name: z.string().min(1).max(100),
  base_url: z.string().url(),
  api_key_encrypted: z.string().min(1),
  protocol: z.enum(['openai', 'thc', 'custom']),
  price_per_1k_tokens: z.number().positive()
});

const updateTokenSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  model_name: z.string().min(1).max(100).optional(),
  base_url: z.string().url().optional(),
  api_key_encrypted: z.string().min(1).optional(),
  protocol: z.enum(['openai', 'thc', 'custom']).optional(),
  price_per_1k_tokens: z.number().positive().optional(),
  is_active: z.boolean().optional()
});

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  protocol: z.string().optional(),
  search: z.string().optional(),
  is_active: z.string().transform(val => val === 'true').optional()
});

// 获取所有Token（公开）
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const tokens = await tokenModel.findAllWithProvider({
      isActive: query.is_active !== undefined ? query.is_active : true,
      protocol: query.protocol,
      search: query.search,
      limit,
      offset
    });

    const total = await tokenModel.count({
      isActive: query.is_active !== undefined ? query.is_active : true
    });

    // 隐藏敏感字段
    const sanitizedTokens = tokens.map(({ api_key_encrypted, base_url, ...token }) => token);

    res.json({
      success: true,
      data: {
        tokens: sanitizedTokens,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
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
      error: 'Failed to fetch tokens'
    });
  }
});

// 获取单个Token详情（隐藏敏感字段）
router.get('/detail/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const token = await tokenModel.findById(id);

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // 隐藏敏感字段
    const { api_key_encrypted, base_url, ...sanitizedToken } = token;

    res.json({
      success: true,
      data: sanitizedToken
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch token'
    });
  }
});

// 创建Token（需要provider角色）
router.post('/', authMiddleware, requireRole('provider', 'admin'), async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = createTokenSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const tokenData: CreateTokenData = {
      provider_id: user.userId,
      ...validatedData
    };

    const token = await tokenModel.create(tokenData);

    res.status(201).json({
      success: true,
      data: token
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
      error: 'Failed to create token'
    });
  }
});

// 更新Token
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateTokenSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 检查Token是否存在
    const existingToken = await tokenModel.findById(id);
    if (!existingToken) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // 检查权限（只有提供者本人或管理员可以更新）
    if (existingToken.provider_id !== user.userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const updatedToken = await tokenModel.update(id, validatedData);

    res.json({
      success: true,
      data: updatedToken
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
      error: 'Failed to update token'
    });
  }
});

// 删除Token
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 检查Token是否存在
    const existingToken = await tokenModel.findById(id);
    if (!existingToken) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // 检查权限（只有提供者本人或管理员可以删除）
    if (existingToken.provider_id !== user.userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    const success = await tokenModel.delete(id);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to delete token'
      });
    }

    res.json({
      success: true,
      message: 'Token deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete token'
    });
  }
});

// 激活/停用Token
router.patch('/:id/status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 检查Token是否存在
    const existingToken = await tokenModel.findById(id);
    if (!existingToken) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    // 检查权限
    if (existingToken.provider_id !== user.userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    let success: boolean;
    if (is_active) {
      success = await tokenModel.activate(id);
    } else {
      success = await tokenModel.deactivate(id);
    }

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update token status'
      });
    }

    res.json({
      success: true,
      message: `Token ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update token status'
    });
  }
});

// 获取提供者的Token列表
router.get('/provider/:providerId', async (req: AuthRequest, res: Response) => {
  try {
    const { providerId } = req.params;
    const tokens = await tokenModel.findByProviderId(providerId);

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider tokens'
    });
  }
});

export default router;
