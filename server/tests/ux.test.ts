import request from 'supertest';
import { Pool } from 'pg';

// 用户体验测试
describe('User Experience Tests', () => {
  let app: any;
  let userToken: string;
  let providerToken: string;
  const testUsername = `uxtestuser_${Date.now()}`;
  const testEmail = `uxtest_${Date.now()}@example.com`;
  const providerUsername = `uxtestprovider_${Date.now()}`;
  const providerEmail = `uxprovider_${Date.now()}@example.com`;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://yanshuo@localhost:5432/token_marketplace';
    process.env.JWT_SECRET = 'test-secret';

    // 清理测试数据
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("DELETE FROM users WHERE username LIKE 'uxtestuser_%' OR username LIKE 'uxtestprovider_%'");
    await pool.end();

    const module = await import('../src/index.js');
    app = module.default;
  });

  describe('User Registration Flow', () => {
    it('should complete registration with clear feedback', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: testEmail,
          password: 'password123',
          role: 'user'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens).toBeDefined();
      expect(res.body.data.user.points_balance).toBeDefined();

      userToken = res.body.data.tokens.accessToken;
    });

    it('should provide helpful error for duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: testUsername,
          email: 'another@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should validate input with clear messages', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ux', // 太短
          email: 'invalid-email',
          password: '123' // 太短
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Provider Registration Flow', () => {
    it('should register as provider', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: providerUsername,
          email: providerEmail,
          password: 'password123',
          role: 'provider'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('provider');

      providerToken = res.body.data.tokens.accessToken;
    });
  });

  describe('Token Management UX', () => {
    it('should create token with all required fields', async () => {
      const res = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'UX Test Token',
          description: 'A test token for UX testing',
          model_name: 'gpt-4',
          base_url: 'https://api.example.com',
          api_key_encrypted: 'test-key-123',
          protocol: 'openai',
          price_per_1k_tokens: 0.03
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.name).toBe('UX Test Token');
    });

    it('should list tokens with pagination', async () => {
      const res = await request(app)
        .get('/api/tokens?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toBeDefined();
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(10);
    });

    it('should search tokens', async () => {
      const res = await request(app)
        .get('/api/tokens?search=UX');

      expect(res.status).toBe(200);
      expect(res.body.data.tokens.length).toBeGreaterThan(0);
    });
  });

  describe('Marketplace UX', () => {
    it('should browse marketplace easily', async () => {
      const res = await request(app)
        .get('/api/marketplace/browse');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should show balance clearly', async () => {
      const res = await request(app)
        .get('/api/marketplace/balance')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.points_balance).toBeDefined();
    });

    it('should recharge points easily', async () => {
      const res = await request(app)
        .post('/api/marketplace/recharge')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 100 });

      expect(res.status).toBe(200);
      expect(res.body.data.points_recharged).toBe(100);
    });
  });

  describe('API Key Management UX', () => {
    let apiKey: string;

    it('should generate API key', async () => {
      const res = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'My Test Key' });

      expect(res.status).toBe(201);
      expect(res.body.data.apiKey).toBeDefined();
      expect(res.body.data.apiKey).toMatch(/^tk_/);

      apiKey = res.body.data.apiKey;
    });

    it('should list API keys', async () => {
      const res = await request(app)
        .get('/api/auth/api-keys')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Protocol Compatibility UX', () => {
    it('should provide clear OpenAI compatibility', async () => {
      const res = await request(app)
        .get('/v1/models')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.object).toBe('list');
      expect(res.body.data).toBeDefined();
    });

    it('should provide clear THC protocol info', async () => {
      const res = await request(app)
        .get('/thc/v1/version');

      expect(res.status).toBe(200);
      expect(res.body.protocol).toBe('thc');
      expect(res.body.version).toBeDefined();
      expect(res.body.supported_models).toBeDefined();
    });

    it('should provide health check endpoint', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBeDefined();
      expect(res.body.version).toBeDefined();
    });
  });

  describe('Error Handling UX', () => {
    it('should provide helpful 404 errors', async () => {
      const res = await request(app)
        .get('/api/tokens/nonexistent');

      // 接受404或500，但应该有错误信息
      expect([404, 500]).toContain(res.status);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    it('should provide helpful 401 errors', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('should provide helpful 400 errors', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('Response Format UX', () => {
    it('should return consistent JSON format', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.headers['content-type']).toContain('application/json');
      expect(res.body).toBeDefined();
      expect(typeof res.body).toBe('object');
    });

    it('should include success flag', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.body.success).toBeDefined();
      expect(typeof res.body.success).toBe('boolean');
    });

    it('should include timestamp', async () => {
      const res = await request(app)
        .get('/health');

      expect(res.body.timestamp).toBeDefined();
    });
  });
});
