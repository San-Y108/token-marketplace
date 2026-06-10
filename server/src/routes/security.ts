import { Router, Response } from 'express';
import { z } from 'zod';
import { securityService } from '../services/security.js';
import { authMiddleware, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// 所有安全路由都需要认证
router.use(authMiddleware);

// 获取安全统计（管理员）
router.get('/stats', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const stats = await securityService.getSecurityStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security stats'
    });
  }
});

// 获取用户安全状态
router.get('/users/:userId/status', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const status = await securityService.getUserSecurityStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user security status'
    });
  }
});

// 封禁用户
router.post('/users/:userId/block', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason, duration_hours } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    if (!reason || !duration_hours) {
      return res.status(400).json({
        success: false,
        error: 'Reason and duration_hours are required'
      });
    }

    const durationMs = duration_hours * 60 * 60 * 1000;
    await securityService.blockUser(userId, reason, durationMs, adminId);

    res.json({
      success: true,
      message: 'User blocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to block user'
    });
  }
});

// 解封用户
router.post('/users/:userId/unblock', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required'
      });
    }

    await securityService.unblockUser(userId, adminId);

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user'
    });
  }
});

// 添加IP到黑名单
router.post('/blacklist/ip', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { ip_address, reason, duration_hours } = req.body;

    if (!ip_address || !reason || !duration_hours) {
      return res.status(400).json({
        success: false,
        error: 'IP address, reason, and duration_hours are required'
      });
    }

    const durationMs = duration_hours * 60 * 60 * 1000;
    await securityService.addToBlacklist(ip_address, reason, durationMs);

    res.json({
      success: true,
      message: 'IP added to blacklist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add IP to blacklist'
    });
  }
});

// 从黑名单移除IP
router.delete('/blacklist/ip/:ip', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { ip } = req.params;
    await securityService.removeFromBlacklist(ip);

    res.json({
      success: true,
      message: 'IP removed from blacklist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove IP from blacklist'
    });
  }
});

// 检测异常行为
router.post('/detect', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, ip_address } = req.body;

    if (!user_id || !ip_address) {
      return res.status(400).json({
        success: false,
        error: 'User ID and IP address are required'
      });
    }

    const result = await securityService.detectAbnormalBehavior(user_id, ip_address);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to detect abnormal behavior'
    });
  }
});

// 清理过期数据
router.post('/cleanup', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const result = await securityService.cleanupExpiredData();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup expired data'
    });
  }
});

// 获取当前用户的安全状态
router.get('/me/status', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const status = await securityService.getUserSecurityStatus(userId);

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security status'
    });
  }
});

export default router;
