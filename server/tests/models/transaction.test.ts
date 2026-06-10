import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { TransactionModel, CreateTransactionData } from '../src/models/transaction.js';
import { UserModel } from '../src/models/user.js';
import { TokenModel } from '../src/models/token.js';
import { setupTestDatabase, cleanupTestData, closeTestDatabase, isDbAvailable } from './setup.js';

// 如果数据库不可用，跳过测试
const describeOrSkip = isDbAvailable() ? describe : describe.skip;

describeOrSkip('TransactionModel', () => {
  let pool: Pool;
  let transactionModel: TransactionModel;
  let userModel: UserModel;
  let tokenModel: TokenModel;
  let consumerId: string;
  let providerId: string;
  let tokenId: string;

  beforeAll(async () => {
    pool = await setupTestDatabase();
    transactionModel = new TransactionModel();
    userModel = new UserModel();
    tokenModel = new TokenModel();

    // 创建测试用户
    const consumer = await userModel.create({
      username: 'consumer',
      email: 'consumer@example.com',
      password: 'password123',
      role: 'user'
    });
    consumerId = consumer.id;

    const provider = await userModel.create({
      username: 'provider',
      email: 'provider@example.com',
      password: 'password123',
      role: 'provider'
    });
    providerId = provider.id;

    // 创建测试token
    const token = await tokenModel.create({
      provider_id: providerId,
      name: 'Test Token',
      model_name: 'gpt-4',
      base_url: 'https://api.example.com',
      api_key_encrypted: 'key',
      protocol: 'openai',
      price_per_1k_tokens: 0.01
    });
    tokenId = token.id;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const txData: CreateTransactionData = {
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      };

      const tx = await transactionModel.create(txData);

      expect(tx).toBeDefined();
      expect(tx.id).toBeDefined();
      expect(tx.consumer_id).toBe(consumerId);
      expect(tx.provider_id).toBe(providerId);
      expect(tx.token_id).toBe(tokenId);
      expect(tx.tokens_used).toBe(1000);
      expect(tx.points_charged).toBe(0.01);
      expect(tx.status).toBe('pending');
    });

    it('should create transaction with metadata', async () => {
      const txData: CreateTransactionData = {
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 500,
        points_charged: 0.005,
        request_metadata: '{"model": "gpt-4", "endpoint": "/v1/chat/completions"}'
      };

      const tx = await transactionModel.create(txData);

      expect(tx.request_metadata).toBeDefined();
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      const txData: CreateTransactionData = {
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      };

      const created = await transactionModel.create(txData);
      const found = await transactionModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return null for non-existent id', async () => {
      const found = await transactionModel.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findByConsumerId', () => {
    it('should find transactions by consumer', async () => {
      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 2000,
        points_charged: 0.02
      });

      const txs = await transactionModel.findByConsumerId(consumerId);

      expect(txs).toHaveLength(2);
    });

    it('should filter by status', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      await transactionModel.complete(tx.id);

      const completed = await transactionModel.findByConsumerId(consumerId, { status: 'completed' });
      const pending = await transactionModel.findByConsumerId(consumerId, { status: 'pending' });

      expect(completed).toHaveLength(1);
      expect(pending).toHaveLength(0);
    });
  });

  describe('findByProviderId', () => {
    it('should find transactions by provider', async () => {
      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      const txs = await transactionModel.findByProviderId(providerId);

      expect(txs.length).toBeGreaterThan(0);
    });
  });

  describe('updateStatus', () => {
    it('should update transaction status', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      const updated = await transactionModel.updateStatus(tx.id, 'completed');

      expect(updated).toBeDefined();
      expect(updated?.status).toBe('completed');
    });
  });

  describe('complete/fail/refund', () => {
    it('should complete transaction', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      const completed = await transactionModel.complete(tx.id);

      expect(completed?.status).toBe('completed');
    });

    it('should fail transaction', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      const failed = await transactionModel.fail(tx.id);

      expect(failed?.status).toBe('failed');
    });

    it('should refund transaction', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      await transactionModel.complete(tx.id);
      const refunded = await transactionModel.refund(tx.id);

      expect(refunded?.status).toBe('refunded');
    });
  });

  describe('getStats', () => {
    it('should get transaction statistics', async () => {
      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 2000,
        points_charged: 0.02
      });

      const stats = await transactionModel.getStats({ consumerId });

      expect(stats.totalTransactions).toBe(2);
      expect(stats.totalTokensUsed).toBe(3000);
      expect(parseFloat(stats.totalPointsCharged as any)).toBeCloseTo(0.03, 2);
    });
  });

  describe('count', () => {
    it('should count all transactions', async () => {
      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 2000,
        points_charged: 0.02
      });

      const count = await transactionModel.count();
      expect(count).toBe(2);
    });
  });

  describe('delete', () => {
    it('should delete transaction', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      const success = await transactionModel.delete(tx.id);
      expect(success).toBe(true);

      const found = await transactionModel.findById(tx.id);
      expect(found).toBeNull();
    });
  });
});
