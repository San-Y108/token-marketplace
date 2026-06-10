import { Pool } from 'pg';
import { TokenModel } from '../src/models/token';
import { UserModel } from '../src/models/user';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://yanshuo@localhost:5432/token_marketplace';

describe('TokenModel Tests', () => {
  let pool: Pool;
  let tokenModel: TokenModel;
  let userModel: UserModel;
  let testUserId: string;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    tokenModel = new TokenModel();
    userModel = new UserModel();

    // 清理测试数据
    await pool.query('DELETE FROM tokens WHERE name LIKE \'Test%\'');
    await pool.query('DELETE FROM users WHERE username = \'tokentestprovider\'');

    // 创建测试用户
    const user = await userModel.create({
      username: 'tokentestprovider',
      email: 'tokentest@example.com',
      password: 'password123',
      role: 'provider'
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM tokens WHERE name LIKE \'Test%\'');
    await pool.query('DELETE FROM users WHERE username = \'tokentestprovider\'');
    await pool.end();
  });

  describe('create', () => {
    it('should create a new token', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Test Token 1',
        description: 'Test description',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'test-key',
        protocol: 'openai',
        price_per_1k_tokens: 0.03
      });

      expect(token).toBeDefined();
      expect(token.id).toBeDefined();
      expect(token.name).toBe('Test Token 1');
      expect(token.model_name).toBe('gpt-4');
      expect(token.protocol).toBe('openai');
      expect(parseFloat(token.price_per_1k_tokens as any)).toBe(0.03);
      expect(token.is_active).toBe(true);
    });

    it('should create token with thc protocol', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Test THC Token',
        model_name: 'custom-model',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'test-key',
        protocol: 'thc',
        price_per_1k_tokens: 0.01
      });

      expect(token.protocol).toBe('thc');
    });
  });

  describe('findById', () => {
    it('should find token by id', async () => {
      const created = await tokenModel.create({
        provider_id: testUserId,
        name: 'Test Find Token',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'test-key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const found = await tokenModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Test Find Token');
    });

    it('should return null for non-existent id', async () => {
      const found = await tokenModel.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return active tokens', async () => {
      const tokens = await tokenModel.findAll({ isActive: true });

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(t => t.is_active)).toBe(true);
    });

    it('should filter by protocol', async () => {
      const tokens = await tokenModel.findAll({ protocol: 'openai' });

      expect(tokens.every(t => t.protocol === 'openai')).toBe(true);
    });

    it('should support search', async () => {
      const tokens = await tokenModel.findAll({ search: 'Test' });

      expect(tokens.length).toBeGreaterThan(0);
    });
  });

  describe('update', () => {
    it('should update token fields', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Test Update Token',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'test-key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const updated = await tokenModel.update(token.id, {
        name: 'Updated Token Name',
        price_per_1k_tokens: 0.05
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Token Name');
      expect(parseFloat(updated?.price_per_1k_tokens as any)).toBe(0.05);
    });
  });

  describe('activate/deactivate', () => {
    it('should deactivate token', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Test Deactivate',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'test-key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const success = await tokenModel.deactivate(token.id);
      expect(success).toBe(true);

      const found = await tokenModel.findById(token.id);
      expect(found?.is_active).toBe(false);
    });

    it('should activate token', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Test Activate',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'test-key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      await tokenModel.deactivate(token.id);
      const success = await tokenModel.activate(token.id);
      expect(success).toBe(true);

      const found = await tokenModel.findById(token.id);
      expect(found?.is_active).toBe(true);
    });
  });

  describe('findByModelName', () => {
    it('should find tokens by model name', async () => {
      const tokens = await tokenModel.findByModelName('gpt-4');

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(t => t.model_name === 'gpt-4')).toBe(true);
    });
  });

  describe('count', () => {
    it('should count tokens', async () => {
      const count = await tokenModel.count();
      expect(count).toBeGreaterThan(0);
    });
  });
});
