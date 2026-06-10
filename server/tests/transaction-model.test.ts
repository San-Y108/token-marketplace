import { Pool } from 'pg';
import { TransactionModel } from '../src/models/transaction';
import { UserModel } from '../src/models/user';
import { TokenModel } from '../src/models/token';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://yanshuo@localhost:5432/token_marketplace';

describe('TransactionModel Tests', () => {
  let pool: Pool;
  let transactionModel: TransactionModel;
  let userModel: UserModel;
  let tokenModel: TokenModel;
  let consumerId: string;
  let providerId: string;
  let tokenId: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    transactionModel = new TransactionModel();
    userModel = new UserModel();
    tokenModel = new TokenModel();

    // 清理测试数据
    await pool.query('DELETE FROM transactions WHERE 1=1');
    await pool.query('DELETE FROM tokens WHERE name LIKE \'TxTest%\'');
    await pool.query('DELETE FROM users WHERE username LIKE \'txtest%\'');

    // 创建测试用户
    const consumer = await userModel.create({
      username: 'txtestconsumer',
      email: 'txtestconsumer@example.com',
      password: 'password123',
      role: 'user'
    });
    consumerId = consumer.id;

    const provider = await userModel.create({
      username: 'txtestprovider',
      email: 'txtestprovider@example.com',
      password: 'password123',
      role: 'provider'
    });
    providerId = provider.id;

    // 创建测试token
    const token = await tokenModel.create({
      provider_id: providerId,
      name: 'TxTest Token',
      model_name: 'gpt-4',
      base_url: 'https://api.example.com',
      api_key_encrypted: 'test-key',
      protocol: 'openai',
      price_per_1k_tokens: 0.01
    });
    tokenId = token.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM transactions WHERE 1=1');
    await pool.query('DELETE FROM tokens WHERE name LIKE \'TxTest%\'');
    await pool.query('DELETE FROM users WHERE username LIKE \'txtest%\'');
    await pool.end();
  });

  describe('create', () => {
    it('should create a new transaction', async () => {
      const tx = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 1000,
        points_charged: 0.01
      });

      expect(tx).toBeDefined();
      expect(tx.id).toBeDefined();
      expect(tx.consumer_id).toBe(consumerId);
      expect(tx.provider_id).toBe(providerId);
      expect(tx.token_id).toBe(tokenId);
      expect(tx.tokens_used).toBe(1000);
      expect(parseFloat(tx.points_charged as any)).toBe(0.01);
      expect(tx.status).toBe('pending');
    });
  });

  describe('findById', () => {
    it('should find transaction by id', async () => {
      const created = await transactionModel.create({
        consumer_id: consumerId,
        provider_id: providerId,
        token_id: tokenId,
        tokens_used: 500,
        points_charged: 0.005
      });

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
      const txs = await transactionModel.findByConsumerId(consumerId);

      expect(txs.length).toBeGreaterThan(0);
      expect(txs.every(tx => tx.consumer_id === consumerId)).toBe(true);
    });
  });

  describe('findByProviderId', () => {
    it('should find transactions by provider', async () => {
      const txs = await transactionModel.findByProviderId(providerId);

      expect(txs.length).toBeGreaterThan(0);
      expect(txs.every(tx => tx.provider_id === providerId)).toBe(true);
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
      const stats = await transactionModel.getStats({ consumerId });

      expect(stats).toBeDefined();
      // getStats可能返回BigInt或字符串，需要转换
      const totalTx = Number(stats.totalTransactions);
      const totalTokens = Number(stats.totalTokensUsed);
      expect(totalTx).toBeGreaterThan(0);
      expect(totalTokens).toBeGreaterThan(0);
    });
  });

  describe('count', () => {
    it('should count transactions', async () => {
      const count = await transactionModel.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
