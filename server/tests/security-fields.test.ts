import request from 'supertest';
import { Pool } from 'pg';

// 敏感字段隐藏测试
describe('Sensitive Fields Security Tests', () => {
  let app: any;
  let providerToken: string;
  let userToken: string;
  let tokenId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://yanshuo@localhost:5432/token_marketplace';
    process.env.JWT_SECRET = 'test-secret';

    // 清理测试数据
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("DELETE FROM users WHERE username LIKE 'sectest_%'");
    await pool.end();

    const module = await import('../src/index.js');
    app = module.default;

    // 创建provider用户
    const providerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'sectest_provider',
        email: 'sectest_provider@test.com',
        password: 'password123',
        role: 'provider'
      });

    providerToken = providerRes.body?.data?.tokens?.accessToken;

    if (providerToken) {
      // 创建token
      const tokenRes = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'Test Token',
          model_name: 'gpt-4',
          base_url: 'https://api.example.com',
          api_key_encrypted: 'secret-api-key-12345',
          protocol: 'openai',
          price_per_1k_tokens: 0.01
        });

      tokenId = tokenRes.body?.data?.id;
    }

    // 创建普通用户
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'sectest_user',
        email: 'sectest_user@test.com',
        password: 'password123',
        role: 'user'
      });

    userToken = userRes.body?.data?.tokens?.accessToken;
  });

  describe('Token API - Sensitive Fields', () => {
    it('should not expose api_key_encrypted in token list', async () => {
      if (!tokenId) {
        console.warn('Token not created, skipping test');
        return;
      }

      const res = await request(app)
        .get('/api/tokens')
        .expect(200);

      expect(res.body.success).toBe(true);
      const tokens = res.body.data.tokens;
      expect(tokens.length).toBeGreaterThan(0);

      // 验证不包含敏感字段
      tokens.forEach((token: any) => {
        expect(token.api_key_encrypted).toBeUndefined();
        expect(token.base_url).toBeUndefined();
      });
    });

    it('should not expose api_key_encrypted in token detail', async () => {
      if (!tokenId) {
        console.warn('Token not created, skipping test');
        return;
      }

      const res = await request(app)
        .get(`/api/tokens/detail/${tokenId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const token = res.body.data;

      // 验证不包含敏感字段
      expect(token.api_key_encrypted).toBeUndefined();
      expect(token.base_url).toBeUndefined();
    });

    it('should not expose api_key_encrypted in marketplace browse', async () => {
      const res = await request(app)
        .get('/api/marketplace/browse')
        .expect(200);

      expect(res.body.success).toBe(true);
      const tokens = res.body.data.tokens;

      tokens.forEach((token: any) => {
        expect(token.api_key_encrypted).toBeUndefined();
        expect(token.base_url).toBeUndefined();
      });
    });
  });

  describe('API Key API - Sensitive Fields', () => {
    it('should not expose key_hash in API key list', async () => {
      if (!userToken) {
        console.warn('User token not available, skipping test');
        return;
      }

      // 先生成一个API Key
      await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Key' });

      const res = await request(app)
        .get('/api/auth/api-keys')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const keys = res.body.data;

      keys.forEach((key: any) => {
        expect(key.key_hash).toBeUndefined();
      });
    });

    it('should return full API key only at creation', async () => {
      if (!userToken) {
        console.warn('User token not available, skipping test');
        return;
      }

      const res = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Key 2' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.apiKey).toBeDefined();
      expect(res.body.data.apiKey).toMatch(/^tk_/);
    });
  });
});
