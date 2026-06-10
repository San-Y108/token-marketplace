import { Router, Response } from 'express';
import { z } from 'zod';
import { userModel } from '../models/user.js';
import { tokenModel } from '../models/token.js';
import { transactionModel } from '../models/transaction.js';
import { apiKeyModel } from '../models/apiKey.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// 所有管理员路由都需要admin角色
router.use(authMiddleware);
router.use(requireRole('admin'));

// 获取系统统计
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalTokens,
      activeTokens,
      totalTransactions,
      completedTransactions
    ] = await Promise.all([
      userModel.count(),
      userModel.count({ role: 'provider' }),
      tokenModel.count(),
      tokenModel.count({ isActive: true }),
      transactionModel.count(),
      transactionModel.count({ status: 'completed' })
    ]);

    const transactionStats = await transactionModel.getStats();

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          providers: totalProviders,
          consumers: totalUsers - totalProviders
        },
        tokens: {
          total: totalTokens,
          active: activeTokens,
          inactive: totalTokens - activeTokens
        },
        transactions: {
          total: totalTransactions,
          completed: completedTransactions,
          failed: transactionStats.failedTransactions,
          total_tokens_used: transactionStats.totalTokensUsed,
          total_points_traded: transactionStats.totalPointsCharged
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system stats'
    });
  }
});

// 获取用户列表
router.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { role, limit, offset } = req.query;

    const users = await userModel.findAll({
      role: role as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    // 移除密码哈希
    const sanitizedUsers = users.map(({ password_hash, ...user }) => user);

    res.json({
      success: true,
      data: sanitizedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

// 获取用户详情
router.get('/users/:userId', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 移除密码哈希
    const { password_hash, ...sanitizedUser } = user;

    // 获取用户的token和交易信息
    const [userTokens, userTransactions] = await Promise.all([
      tokenModel.findByProviderId(userId),
      transactionModel.findByConsumerId(userId)
    ]);

    res.json({
      success: true,
      data: {
        ...sanitizedUser,
        tokens: userTokens,
        transactions: userTransactions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user details'
    });
  }
});

// 更新用户角色
router.patch('/users/:userId/role', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'provider', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role'
      });
    }

    const user = await userModel.update(userId, { role });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 移除密码哈希
    const { password_hash, ...sanitizedUser } = user;

    res.json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update user role'
    });
  }
});

// 更新用户积分
router.patch('/users/:userId/points', async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { amount, action } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const pointsChange = action === 'add' ? amount : -amount;
    const user = await userModel.updatePoints(userId, pointsChange);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // 移除密码哈希
    const { password_hash, ...sanitizedUser } = user;

    res.json({
      success: true,
      data: sanitizedUser
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update user points';
    res.status(400).json({
      success: false,
      error: message
    });
  }
});

// 获取Token列表（管理员视图）
router.get('/tokens', async (req: AuthRequest, res: Response) => {
  try {
    const { provider_id, is_active, protocol, limit, offset } = req.query;

    const tokens = await tokenModel.findAll({
      providerId: provider_id as string,
      isActive: is_active ? is_active === 'true' : undefined,
      protocol: protocol as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tokens'
    });
  }
});

// 更新Token状态
router.patch('/tokens/:tokenId/status', async (req: AuthRequest, res: Response) => {
  try {
    const { tokenId } = req.params;
    const { is_active } = req.body;

    let success: boolean;
    if (is_active) {
      success = await tokenModel.activate(tokenId);
    } else {
      success = await tokenModel.deactivate(tokenId);
    }

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Token not found'
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

// 获取交易列表（管理员视图）
router.get('/transactions', async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit, offset, start_date, end_date } = req.query;

    const transactions = await transactionModel.findAllWithDetails({
      status: status as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: start_date as string,
      endDate: end_date as string
    });

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

// 获取交易详情
router.get('/transactions/:transactionId', async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const transaction = await transactionModel.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch transaction'
    });
  }
});

// 退款交易
router.post('/transactions/:transactionId/refund', async (req: AuthRequest, res: Response) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await transactionModel.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: 'Only completed transactions can be refunded'
      });
    }

    // 退还积分
    await userModel.updatePoints(transaction.consumer_id, transaction.points_charged);
    await userModel.updatePoints(transaction.provider_id, -transaction.points_charged);

    // 更新交易状态
    await transactionModel.refund(transactionId);

    res.json({
      success: true,
      message: 'Transaction refunded successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to refund transaction'
    });
  }
});

// 获取API Key列表
router.get('/api-keys', async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, is_active, limit, offset } = req.query;

    const apiKeys = await apiKeyModel.findAll({
      userId: user_id as string,
      isActive: is_active ? is_active === 'true' : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    });

    res.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch API keys'
    });
  }
});

// 清理过期的API Key
router.post('/api-keys/cleanup', async (req: AuthRequest, res: Response) => {
  try {
    const cleanedCount = await apiKeyModel.cleanupExpired();

    res.json({
      success: true,
      data: {
        cleaned_count: cleanedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup API keys'
    });
  }
});

// 获取系统健康状态
router.get('/health', async (req: AuthRequest, res: Response) => {
  try {
    // 检查数据库连接
    const userCount = await userModel.count();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        user_count: userCount,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
