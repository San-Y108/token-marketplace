import { Router, Response } from 'express';
import { z } from 'zod';
import { tokenModel } from '../models/token.js';
import { billingService } from '../services/billing.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// 验证schemas
const purchaseSchema = z.object({
  token_id: z.string().uuid(),
  tokens_used: z.number().positive()
});

const querySchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  protocol: z.string().optional(),
  search: z.string().optional(),
  min_price: z.string().transform(Number).optional(),
  max_price: z.string().transform(Number).optional()
});

// 浏览市场（公开）
router.get('/browse', async (req: AuthRequest, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const offset = (page - 1) * limit;

    const tokens = await tokenModel.findAllWithProvider({
      isActive: true,
      protocol: query.protocol,
      search: query.search,
      limit,
      offset
    });

    // 过滤价格范围
    let filteredTokens = tokens;
    if (query.min_price !== undefined) {
      filteredTokens = filteredTokens.filter(t => t.price_per_1k_tokens >= query.min_price!);
    }
    if (query.max_price !== undefined) {
      filteredTokens = filteredTokens.filter(t => t.price_per_1k_tokens <= query.max_price!);
    }

    const total = await tokenModel.count({ isActive: true });

    res.json({
      success: true,
      data: {
        tokens: filteredTokens,
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
      error: 'Failed to browse marketplace'
    });
  }
});

// 获取市场统计
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const totalTokens = await tokenModel.count({ isActive: true });
    const totalTransactions = await billingService.getTransactionStats('', 'consumer');

    res.json({
      success: true,
      data: {
        total_active_tokens: totalTokens,
        total_transactions: totalTransactions.totalTransactions,
        total_tokens_used: totalTransactions.totalTokensUsed,
        total_points_traded: totalTransactions.totalPointsCharged
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch marketplace stats'
    });
  }
});

// 预览购买费用
router.post('/preview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = purchaseSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 获取token信息
    const token = await tokenModel.findById(validatedData.token_id);
    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
      });
    }

    if (!token.is_active) {
      return res.status(400).json({
        success: false,
        error: 'Token is not available'
      });
    }

    // 计算费用
    const pointsCharged = billingService.calculateCost(
      validatedData.tokens_used,
      token.price_per_1k_tokens
    );

    // 检查余额
    const hasSufficientBalance = await billingService.validateBalance(user.userId, pointsCharged);

    res.json({
      success: true,
      data: {
        token_id: token.id,
        token_name: token.name,
        model_name: token.model_name,
        tokens_requested: validatedData.tokens_used,
        price_per_1k_tokens: token.price_per_1k_tokens,
        points_charged: pointsCharged,
        current_balance: await billingService.getBalance(user.userId),
        has_sufficient_balance: hasSufficientBalance
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
      error: 'Failed to preview purchase'
    });
  }
});

// 购买token访问权（实际是创建交易记录）
router.post('/purchase', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = purchaseSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // 处理计费
    const result = await billingService.processUsage({
      consumerId: user.userId,
      tokenId: validatedData.token_id,
      tokensUsed: validatedData.tokens_used,
      requestMetadata: {
        source: 'marketplace',
        timestamp: new Date().toISOString()
      }
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        transaction_id: result.transactionId,
        points_charged: result.pointsCharged,
        tokens_used: validatedData.tokens_used
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
      error: 'Failed to process purchase'
    });
  }
});

// 获取用户积分余额
router.get('/balance', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const balance = await billingService.getBalance(user.userId);

    res.json({
      success: true,
      data: {
        user_id: user.userId,
        points_balance: balance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch balance'
    });
  }
});

// 充值积分
router.post('/recharge', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid recharge amount'
      });
    }

    const newBalance = await billingService.rechargePoints(user.userId, amount);

    res.json({
      success: true,
      data: {
        user_id: user.userId,
        points_recharged: amount,
        new_balance: newBalance
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to recharge points';
    res.status(400).json({
      success: false,
      error: message
    });
  }
});

// 获取交易历史
router.get('/transactions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { status, limit, offset, role } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const transactionRole = role === 'provider' ? 'provider' : 'consumer';
    const transactions = await billingService.getTransactionHistory(
      user.userId,
      transactionRole,
      {
        status: status as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined
      }
    );

    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transactions'
    });
  }
});

// 获取交易统计
router.get('/transactions/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { role } = req.query;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const transactionRole = role === 'provider' ? 'provider' : 'consumer';
    const stats = await billingService.getTransactionStats(user.userId, transactionRole);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction stats'
    });
  }
});

export default router;
