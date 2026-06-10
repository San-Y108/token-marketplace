import { getDatabase } from '../utils/dbInit.js';

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ip_address: string;
  user_agent: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RateLimitInfo {
  userId: string;
  endpoint: string;
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
  isBlocked: boolean;
}

export interface AbusePattern {
  type: string;
  threshold: number;
  windowMs: number;
  action: 'warn' | 'throttle' | 'block';
}

export class SecurityService {
  private pool = getDatabase();

  // 预定义的滥用模式
  private abusePatterns: AbusePattern[] = [
    {
      type: 'rapid_requests',
      threshold: 100,
      windowMs: 60000, // 1分钟
      action: 'throttle'
    },
    {
      type: 'failed_auth',
      threshold: 5,
      windowMs: 300000, // 5分钟
      action: 'block'
    },
    {
      type: 'suspicious_tokens',
      threshold: 1000,
      windowMs: 3600000, // 1小时
      action: 'warn'
    },
    {
      type: 'unusual_hours',
      threshold: 50,
      windowMs: 3600000, // 1小时
      action: 'warn'
    },
    {
      type: 'large_requests',
      threshold: 10,
      windowMs: 60000, // 1分钟
      action: 'throttle'
    }
  ];

  // 记录安全事件
  async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'created_at'>): Promise<void> {
    const query = `
      INSERT INTO security_events (user_id, event_type, severity, description, ip_address, user_agent, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `;

    await this.pool.query(query, [
      event.user_id,
      event.event_type,
      event.severity,
      event.description,
      event.ip_address,
      event.user_agent,
      JSON.stringify(event.metadata)
    ]);
  }

  // 检查请求频率
  async checkRateLimit(userId: string, endpoint: string, windowMs: number, maxRequests: number): Promise<RateLimitInfo> {
    const windowStart = new Date(Date.now() - windowMs);
    const windowEnd = new Date();

    // 查询当前窗口内的请求数
    const query = `
      SELECT COUNT(*) as request_count
      FROM request_logs
      WHERE user_id = $1
        AND endpoint = $2
        AND created_at >= $3
    `;

    const result = await this.pool.query(query, [userId, endpoint, windowStart]);
    const requestCount = parseInt(result.rows[0].request_count);

    return {
      userId,
      endpoint,
      requestCount,
      windowStart,
      windowEnd,
      isBlocked: requestCount >= maxRequests
    };
  }

  // 记录请求日志
  async logRequest(userId: string, endpoint: string, ip: string, userAgent: string, metadata?: Record<string, any>): Promise<void> {
    const query = `
      INSERT INTO request_logs (user_id, endpoint, ip_address, user_agent, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;

    await this.pool.query(query, [
      userId,
      endpoint,
      ip,
      userAgent,
      JSON.stringify(metadata || {})
    ]);
  }

  // 检测异常行为
  async detectAbnormalBehavior(userId: string, ip: string): Promise<{
    isAbnormal: boolean;
    patterns: string[];
    riskScore: number;
    recommendations: string[];
  }> {
    const patterns: string[] = [];
    let riskScore = 0;
    const recommendations: string[] = [];

    // 检查各种滥用模式
    for (const pattern of this.abusePatterns) {
      const isTriggered = await this.checkAbusePattern(userId, ip, pattern);
      if (isTriggered) {
        patterns.push(pattern.type);
        riskScore += this.getPatternRiskScore(pattern.type);

        switch (pattern.action) {
          case 'warn':
            recommendations.push(`Monitor user activity for ${pattern.type}`);
            break;
          case 'throttle':
            recommendations.push(`Apply rate limiting for ${pattern.type}`);
            break;
          case 'block':
            recommendations.push(`Temporarily block user for ${pattern.type}`);
            break;
        }
      }
    }

    // 检查IP地址异常
    const ipRisk = await this.checkIpRisk(ip);
    if (ipRisk > 0) {
      patterns.push('suspicious_ip');
      riskScore += ipRisk;
      recommendations.push('Consider IP-based restrictions');
    }

    // 检查用户行为异常
    const userRisk = await this.checkUserBehaviorRisk(userId);
    if (userRisk > 0) {
      patterns.push('unusual_behavior');
      riskScore += userRisk;
      recommendations.push('Review user activity patterns');
    }

    return {
      isAbnormal: patterns.length > 0,
      patterns,
      riskScore,
      recommendations
    };
  }

  // 检查特定滥用模式
  private async checkAbusePattern(userId: string, ip: string, pattern: AbusePattern): Promise<boolean> {
    const windowStart = new Date(Date.now() - pattern.windowMs);

    let query = '';
    let params: any[] = [];

    switch (pattern.type) {
      case 'rapid_requests':
        query = `
          SELECT COUNT(*) as count
          FROM request_logs
          WHERE user_id = $1 AND created_at >= $2
        `;
        params = [userId, windowStart];
        break;

      case 'failed_auth':
        query = `
          SELECT COUNT(*) as count
          FROM security_events
          WHERE user_id = $1
            AND event_type = 'failed_auth'
            AND created_at >= $2
        `;
        params = [userId, windowStart];
        break;

      case 'suspicious_tokens':
        query = `
          SELECT COALESCE(SUM(tokens_used), 0) as total_tokens
          FROM transactions
          WHERE consumer_id = $1
            AND created_at >= $2
            AND status = 'completed'
        `;
        params = [userId, windowStart];
        break;

      case 'unusual_hours':
        const hour = new Date().getHours();
        if (hour >= 2 && hour <= 5) {
          query = `
            SELECT COUNT(*) as count
            FROM request_logs
            WHERE user_id = $1 AND created_at >= $2
          `;
          params = [userId, windowStart];
        }
        break;

      case 'large_requests':
        query = `
          SELECT COUNT(*) as count
          FROM request_logs
          WHERE user_id = $1
            AND created_at >= $2
            AND (metadata->>'tokens_requested')::int > 10000
        `;
        params = [userId, windowStart];
        break;

      default:
        return false;
    }

    if (!query) return false;

    const result = await this.pool.query(query, params);
    const count = parseInt(result.rows[0].count || result.rows[0].total_tokens || 0);

    return count >= pattern.threshold;
  }

  // 获取模式风险分数
  private getPatternRiskScore(patternType: string): number {
    const scores: Record<string, number> = {
      'rapid_requests': 20,
      'failed_auth': 40,
      'suspicious_tokens': 30,
      'unusual_hours': 15,
      'large_requests': 25
    };

    return scores[patternType] || 10;
  }

  // 检查IP风险
  private async checkIpRisk(ip: string): Promise<number> {
    // 检查IP是否在黑名单中
    const blacklistQuery = `
      SELECT COUNT(*) as count
      FROM ip_blacklist
      WHERE ip_address = $1 AND expires_at > NOW()
    `;

    const blacklistResult = await this.pool.query(blacklistQuery, [ip]);
    if (parseInt(blacklistResult.rows[0].count) > 0) {
      return 100; // 高风险
    }

    // 检查IP的历史违规记录
    const violationsQuery = `
      SELECT COUNT(*) as count
      FROM security_events
      WHERE ip_address = $1
        AND severity IN ('high', 'critical')
        AND created_at >= NOW() - INTERVAL '7 days'
    `;

    const violationsResult = await this.pool.query(violationsQuery, [ip]);
    const violations = parseInt(violationsResult.rows[0].count);

    return violations * 10;
  }

  // 检查用户行为风险
  private async checkUserBehaviorRisk(userId: string): Promise<number> {
    let riskScore = 0;

    // 检查用户账户年龄
    const userQuery = `
      SELECT created_at, points_balance
      FROM users
      WHERE id = $1
    `;

    const userResult = await this.pool.query(userQuery, [userId]);
    if (userResult.rows.length === 0) return 100;

    const user = userResult.rows[0];
    const accountAge = Date.now() - new Date(user.created_at).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);

    // 新账户风险更高
    if (daysSinceCreation < 1) riskScore += 30;
    else if (daysSinceCreation < 7) riskScore += 15;

    // 检查积分余额异常
    if (user.points_balance > 10000) {
      riskScore += 10;
    }

    // 检查交易模式
    const transactionQuery = `
      SELECT COUNT(*) as count, SUM(points_charged) as total_spent
      FROM transactions
      WHERE consumer_id = $1
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;

    const transactionResult = await this.pool.query(transactionQuery, [userId]);
    const transactions = transactionResult.rows[0];

    if (parseInt(transactions.count) > 50) {
      riskScore += 20;
    }

    return riskScore;
  }

  // 获取安全统计
  async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    blockedUsers: number;
    topThreats: Array<{ type: string; count: number }>;
  }> {
    // 总事件数
    const totalQuery = `SELECT COUNT(*) as count FROM security_events`;
    const totalResult = await this.pool.query(totalQuery);
    const totalEvents = parseInt(totalResult.rows[0].count);

    // 严重事件数
    const criticalQuery = `
      SELECT COUNT(*) as count
      FROM security_events
      WHERE severity = 'critical'
        AND created_at >= NOW() - INTERVAL '24 hours'
    `;
    const criticalResult = await this.pool.query(criticalQuery);
    const criticalEvents = parseInt(criticalResult.rows[0].count);

    // 被封禁的用户数
    const blockedQuery = `
      SELECT COUNT(DISTINCT user_id) as count
      FROM security_events
      WHERE event_type = 'user_blocked'
        AND created_at >= NOW() - INTERVAL '7 days'
    `;
    const blockedResult = await this.pool.query(blockedQuery);
    const blockedUsers = parseInt(blockedResult.rows[0].count);

    // 主要威胁类型
    const threatsQuery = `
      SELECT event_type as type, COUNT(*) as count
      FROM security_events
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `;
    const threatsResult = await this.pool.query(threatsQuery);
    const topThreats = threatsResult.rows;

    return {
      totalEvents,
      criticalEvents,
      blockedUsers,
      topThreats
    };
  }

  // 封禁用户
  async blockUser(userId: string, reason: string, durationMs: number, adminId: string): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMs);

    // 更新用户状态
    const updateUserQuery = `
      UPDATE users
      SET is_blocked = true,
          blocked_until = $1,
          block_reason = $2
      WHERE id = $3
    `;
    await this.pool.query(updateUserQuery, [expiresAt, reason, userId]);

    // 记录安全事件
    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'user_blocked',
      severity: 'high',
      description: `User blocked: ${reason}`,
      ip_address: '',
      user_agent: '',
      metadata: {
        blocked_by: adminId,
        expires_at: expiresAt.toISOString(),
        reason
      }
    });
  }

  // 解封用户
  async unblockUser(userId: string, adminId: string): Promise<void> {
    const updateUserQuery = `
      UPDATE users
      SET is_blocked = false,
          blocked_until = NULL,
          block_reason = NULL
      WHERE id = $1
    `;
    await this.pool.query(updateUserQuery, [userId]);

    // 记录安全事件
    await this.logSecurityEvent({
      user_id: userId,
      event_type: 'user_unblocked',
      severity: 'medium',
      description: 'User unblocked',
      ip_address: '',
      user_agent: '',
      metadata: {
        unblocked_by: adminId
      }
    });
  }

  // 添加IP到黑名单
  async addToBlacklist(ip: string, reason: string, durationMs: number): Promise<void> {
    const expiresAt = new Date(Date.now() + durationMs);

    const query = `
      INSERT INTO ip_blacklist (ip_address, reason, expires_at, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (ip_address)
      DO UPDATE SET reason = $2, expires_at = $3
    `;

    await this.pool.query(query, [ip, reason, expiresAt]);
  }

  // 从黑名单移除IP
  async removeFromBlacklist(ip: string): Promise<void> {
    const query = `DELETE FROM ip_blacklist WHERE ip_address = $1`;
    await this.pool.query(query, [ip]);
  }

  // 获取用户安全状态
  async getUserSecurityStatus(userId: string): Promise<{
    isBlocked: boolean;
    blockedUntil: Date | null;
    blockReason: string | null;
    recentEvents: SecurityEvent[];
    riskScore: number;
  }> {
    // 获取用户状态
    const userQuery = `
      SELECT is_blocked, blocked_until, block_reason
      FROM users
      WHERE id = $1
    `;
    const userResult = await this.pool.query(userQuery, [userId]);
    const user = userResult.rows[0];

    // 获取最近的安全事件
    const eventsQuery = `
      SELECT *
      FROM security_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 10
    `;
    const eventsResult = await this.pool.query(eventsQuery, [userId]);

    // 计算风险分数
    const behaviorRisk = await this.checkUserBehaviorRisk(userId);

    return {
      isBlocked: user?.is_blocked || false,
      blockedUntil: user?.blocked_until ? new Date(user.blocked_until) : null,
      blockReason: user?.block_reason || null,
      recentEvents: eventsResult.rows,
      riskScore: behaviorRisk
    };
  }

  // 清理过期数据
  async cleanupExpiredData(): Promise<{
    deletedLogs: number;
    deletedEvents: number;
    removedBlacklist: number;
  }> {
    // 删除30天前的请求日志
    const deleteLogsQuery = `
      DELETE FROM request_logs
      WHERE created_at < NOW() - INTERVAL '30 days'
    `;
    const logsResult = await this.pool.query(deleteLogsQuery);

    // 删除90天前的安全事件
    const deleteEventsQuery = `
      DELETE FROM security_events
      WHERE created_at < NOW() - INTERVAL '90 days'
    `;
    const eventsResult = await this.pool.query(deleteEventsQuery);

    // 删除过期的黑名单记录
    const deleteBlacklistQuery = `
      DELETE FROM ip_blacklist
      WHERE expires_at < NOW()
    `;
    const blacklistResult = await this.pool.query(deleteBlacklistQuery);

    return {
      deletedLogs: logsResult.rowCount || 0,
      deletedEvents: eventsResult.rowCount || 0,
      removedBlacklist: blacklistResult.rowCount || 0
    };
  }
}

export const securityService = new SecurityService();
