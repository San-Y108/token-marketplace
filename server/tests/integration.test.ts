import request from 'supertest';
import { Pool } from 'pg';
import app from '../src/index.js';

describe('Integration Tests', () => {
  let accessToken: string;
  let userId: string;
  let tokenId: string;
  const testUsername = `integrationtest_${Date.now()}`;
  const testEmail = `integration_${Date.now()}@test.com`;

  beforeAll(async () => {
    // 清理可能存在的测试数据
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("DELETE FROM users WHERE username LIKE 'integrationtest_%'");
    await pool.end();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'password123',
          role: 'provider'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens).toBeDefined();

      accessToken = res.body.data.tokens.accessToken;
      userId = res.body.data.user.id;
    });

    it('should login with registered user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUsername,
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should get current user info', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe(testUsername);
    });
  });

  describe('Token Management', () => {
    it('should create a new token', async () => {
      const res = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Integration Test Token',
          description: 'Test token for integration testing',
          model_name: 'gpt-4',
          base_url: 'https://api.example.com',
          api_key_encrypted: 'test-key',
          protocol: 'openai',
          price_per_1k_tokens: 0.01
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();

      tokenId = res.body.data.id;
    });

    it('should get token list', async () => {
      const res = await request(app)
        .get('/api/tokens');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.length).toBeGreaterThan(0);
    });

    it('should get token details', async () => {
      const res = await request(app)
        .get(`/api/tokens/${tokenId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Integration Test Token');
    });
  });

  describe('Marketplace', () => {
    it('should browse marketplace', async () => {
      const res = await request(app)
        .get('/api/marketplace/browse');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should get balance', async () => {
      const res = await request(app)
        .get('/api/marketplace/balance')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.points_balance).toBeDefined();
    });

    it('should recharge points', async () => {
      const res = await request(app)
        .post('/api/marketplace/recharge')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.points_recharged).toBe(100);
    });
  });

  describe('OpenAI Compatible API', () => {
    it('should get models list', async () => {
      const res = await request(app)
        .get('/v1/models')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.object).toBe('list');
      expect(res.body.data).toBeDefined();
    });
  });

  describe('THC Protocol', () => {
    it('should get THC version', async () => {
      const res = await request(app)
        .get('/thc/v1/version');

      expect(res.status).toBe(200);
      expect(res.body.protocol).toBe('thc');
      expect(res.body.version).toBe('1.0.0');
    });

    it('should get THC health', async () => {
      const res = await request(app)
        .get('/thc/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.protocol).toBe('thc');
      expect(res.body.status).toBe('healthy');
    });

    it('should get THC models', async () => {
      const res = await request(app)
        .get('/thc/v1/models')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.protocol).toBe('thc');
      expect(res.body.models).toBeDefined();
    });
  });

  describe('API Key Management', () => {
    let apiKey: string;

    it('should generate API key', async () => {
      const res = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Integration Test Key' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.apiKey).toMatch(/^tk_/);

      apiKey = res.body.data.apiKey;
    });

    it('should list API keys', async () => {
      const res = await request(app)
        .get('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
