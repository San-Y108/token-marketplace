import { userModel } from '../models/user.js';
import { tokenModel } from '../models/token.js';
import { transactionModel, CreateTransactionData } from '../models/transaction.js';

export interface BillingResult {
  transactionId: string;
  pointsCharged: number;
  success: boolean;
  error?: string;
}

export class BillingService {
  /**
   * 计算token使用费用
   */
  calculateCost(tokensUsed: number, pricePer1kTokens: number): number {
    return (tokensUsed / 1000) * pricePer1kTokens;
  }

  /**
   * 验证用户积分余额
   */
  async validateBalance(userId: string, requiredPoints: number): Promise<boolean> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.points_balance >= requiredPoints;
  }

  /**
   * 处理token使用计费
   */
  async processUsage(data: {
    consumerId: string;
    tokenId: string;
    tokensUsed: number;
    requestMetadata?: any;
  }): Promise<BillingResult> {
    const { consumerId, tokenId, tokensUsed, requestMetadata } = data;

    // 获取token信息
    const token = await tokenModel.findById(tokenId);
    if (!token) {
      return {
        transactionId: '',
        pointsCharged: 0,
        success: false,
        error: 'Token not found'
      };
    }

    // 检查token是否激活
    if (!token.is_active) {
      return {
        transactionId: '',
        pointsCharged: 0,
        success: false,
        error: 'Token is not active'
      };
    }

    // 计算费用
    const pointsCharged = this.calculateCost(tokensUsed, token.price_per_1k_tokens);

    // 验证余额
    const hasSufficientBalance = await this.validateBalance(consumerId, pointsCharged);
    if (!hasSufficientBalance) {
      return {
        transactionId: '',
        pointsCharged,
        success: false,
        error: 'Insufficient points balance'
      };
    }

    // 创建交易记录
    const transactionData: CreateTransactionData = {
      consumer_id: consumerId,
      provider_id: token.provider_id,
      token_id: tokenId,
      tokens_used: tokensUsed,
      points_charged: pointsCharged,
      request_metadata: JSON.stringify(requestMetadata || {})
    };

    const transaction = await transactionModel.create(transactionData);

    try {
      // 扣除消费者积分
      await userModel.updatePoints(consumerId, -pointsCharged);

      // 增加提供者积分
      await userModel.updatePoints(token.provider_id, pointsCharged);

      // 完成交易
      await transactionModel.complete(transaction.id);

      return {
        transactionId: transaction.id,
        pointsCharged,
        success: true
      };
    } catch (error) {
      // 交易失败，标记为失败状态
      await transactionModel.fail(transaction.id);

      return {
        transactionId: transaction.id,
        pointsCharged,
        success: false,
        error: error instanceof Error ? error.message : 'Transaction failed'
      };
    }
  }

  /**
   * 处理退款
   */
  async processRefund(transactionId: string, reason?: string): Promise<BillingResult> {
    const transaction = await transactionModel.findById(transactionId);
    if (!transaction) {
      return {
        transactionId,
        pointsCharged: 0,
        success: false,
        error: 'Transaction not found'
      };
    }

    if (transaction.status !== 'completed') {
      return {
        transactionId,
        pointsCharged: 0,
        success: false,
        error: 'Only completed transactions can be refunded'
      };
    }

    try {
      // 退还消费者积分
      await userModel.updatePoints(transaction.consumer_id, transaction.points_charged);

      // 扣除提供者积分
      await userModel.updatePoints(transaction.provider_id, -transaction.points_charged);

      // 标记交易为退款
      await transactionModel.refund(transactionId);

      return {
        transactionId,
        pointsCharged: transaction.points_charged,
        success: true
      };
    } catch (error) {
      return {
        transactionId,
        pointsCharged: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Refund failed'
      };
    }
  }

  /**
   * 获取用户积分余额
   */
  async getBalance(userId: string): Promise<number> {
    const user = await userModel.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.points_balance;
  }

  /**
   * 充值积分
   */
  async rechargePoints(userId: string, amount: number): Promise<number> {
    if (amount <= 0) {
      throw new Error('Recharge amount must be positive');
    }

    const user = await userModel.updatePoints(userId, amount);
    if (!user) {
      throw new Error('User not found');
    }

    return user.points_balance;
  }

  /**
   * 获取交易统计
   */
  async getTransactionStats(userId: string, role: 'consumer' | 'provider'): Promise<any> {
    const options = role === 'provider'
      ? { providerId: userId }
      : { consumerId: userId };

    return transactionModel.getStats(options);
  }

  /**
   * 获取用户交易历史
   */
  async getTransactionHistory(userId: string, role: 'consumer' | 'provider', options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    if (role === 'provider') {
      return transactionModel.findByProviderId(userId, options);
    } else {
      return transactionModel.findByConsumerId(userId, options);
    }
  }
}

export const billingService = new BillingService();
