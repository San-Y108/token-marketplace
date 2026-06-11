import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { TokenModel, CreateTokenData } from '../../src/models/token.js';
import { UserModel, CreateUserData } from '../../src/models/user.js';
import { setupTestDatabase, cleanupTestData, closeTestDatabase, isDbAvailable } from '../setup.js';

// 如果数据库不可用，跳过测试
const describeOrSkip = isDbAvailable() ? describe : describe.skip;

describeOrSkip('TokenModel', () => {
  let pool: Pool | null;
  let tokenModel: TokenModel;
  let userModel: UserModel;
  let testUserId: string;

  beforeAll(async () => {
    pool = await setupTestDatabase();
    tokenModel = new TokenModel();
    userModel = new UserModel();

    // 创建测试用户
    const user = await userModel.create({
      username: 'tokenprovider',
      email: 'provider@example.com',
      password: 'password123',
      role: 'provider'
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('create', () => {
    it('should create a new token', async () => {
      const tokenData: CreateTokenData = {
        provider_id: testUserId,
        name: 'GPT-4 Turbo',
        description: 'High quality GPT-4 model',
        model_name: 'gpt-4-turbo',
        base_url: 'https://api.openai.com',
        api_key_encrypted: 'sk-test-key',
        protocol: 'openai',
        price_per_1k_tokens: 0.03
      };

      const token = await tokenModel.create(tokenData);

      expect(token).toBeDefined();
      expect(token.id).toBeDefined();
      expect(token.name).toBe('GPT-4 Turbo');
      expect(token.model_name).toBe('gpt-4-turbo');
      expect(token.protocol).toBe('openai');
      expect(token.price_per_1k_tokens).toBe(0.03);
      expect(token.is_active).toBe(true);
    });

    it('should create token with default values', async () => {
      const tokenData: CreateTokenData = {
        provider_id: testUserId,
        name: 'Test Token',
        model_name: 'gpt-3.5-turbo',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      };

      const token = await tokenModel.create(tokenData);

      expect(token.description).toBeNull();
      expect(token.is_active).toBe(true);
    });
  });

  describe('findById', () => {
    it('should find token by id', async () => {
      const tokenData: CreateTokenData = {
        provider_id: testUserId,
        name: 'Find Me',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.05
      };

      const created = await tokenModel.create(tokenData);
      const found = await tokenModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Find Me');
    });

    it('should return null for non-existent id', async () => {
      const found = await tokenModel.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findByProviderId', () => {
    it('should find tokens by provider', async () => {
      await tokenModel.create({
        provider_id: testUserId,
        name: 'Token 1',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      await tokenModel.create({
        provider_id: testUserId,
        name: 'Token 2',
        model_name: 'gpt-3.5-turbo',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.02
      });

      const tokens = await tokenModel.findByProviderId(testUserId);

      expect(tokens).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it('should return all active tokens', async () => {
      await tokenModel.create({
        provider_id: testUserId,
        name: 'Active Token',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const tokens = await tokenModel.findAll({ isActive: true });

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(t => t.is_active)).toBe(true);
    });

    it('should filter by protocol', async () => {
      await tokenModel.create({
        provider_id: testUserId,
        name: 'OpenAI Token',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      await tokenModel.create({
        provider_id: testUserId,
        name: 'THC Token',
        model_name: 'custom-model',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'thc',
        price_per_1k_tokens: 0.02
      });

      const openaiTokens = await tokenModel.findAll({ protocol: 'openai' });
      const thcTokens = await tokenModel.findAll({ protocol: 'thc' });

      expect(openaiTokens.every(t => t.protocol === 'openai')).toBe(true);
      expect(thcTokens.every(t => t.protocol === 'thc')).toBe(true);
    });

    it('should support search', async () => {
      await tokenModel.create({
        provider_id: testUserId,
        name: 'GPT-4 Turbo',
        model_name: 'gpt-4-turbo',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const tokens = await tokenModel.findAll({ search: 'GPT' });

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some(t => t.name.includes('GPT'))).toBe(true);
    });
  });

  describe('update', () => {
    it('should update token fields', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Original Name',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const updated = await tokenModel.update(token.id, {
        name: 'Updated Name',
        price_per_1k_tokens: 0.05
      });

      expect(updated).toBeDefined();
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.price_per_1k_tokens).toBe(0.05);
    });
  });

  describe('activate/deactivate', () => {
    it('should deactivate token', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Deactivate Me',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
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
        name: 'Activate Me',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
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

  describe('delete', () => {
    it('should delete token', async () => {
      const token = await tokenModel.create({
        provider_id: testUserId,
        name: 'Delete Me',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const success = await tokenModel.delete(token.id);
      expect(success).toBe(true);

      const found = await tokenModel.findById(token.id);
      expect(found).toBeNull();
    });
  });

  describe('findByModelName', () => {
    it('should find tokens by model name', async () => {
      await tokenModel.create({
        provider_id: testUserId,
        name: 'GPT-4 Provider',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      const tokens = await tokenModel.findByModelName('gpt-4');

      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every(t => t.model_name === 'gpt-4')).toBe(true);
    });
  });

  describe('count', () => {
    it('should count all tokens', async () => {
      await tokenModel.create({
        provider_id: testUserId,
        name: 'Token 1',
        model_name: 'gpt-4',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.01
      });

      await tokenModel.create({
        provider_id: testUserId,
        name: 'Token 2',
        model_name: 'gpt-3.5-turbo',
        base_url: 'https://api.example.com',
        api_key_encrypted: 'key',
        protocol: 'openai',
        price_per_1k_tokens: 0.02
      });

      const count = await tokenModel.count();
      expect(count).toBe(2);
    });
  });
});
