const request = require('supertest');

// 动态导入app
let app: any;

beforeAll(async () => {
  // 设置环境变量
  process.env.DATABASE_URL = 'postgresql://yanshuo@localhost:5432/token_marketplace';
  process.env.JWT_SECRET = 'test-secret';

  // 动态导入
  const module = await import('../src/index.js');
  app = module.default;
});

describe('API Integration Tests', () => {
  let accessToken: string;
  let userId: string;
  let tokenId: string;

  describe('Health Check', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Token Marketplace');
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'apitest',
          email: 'api@test.com',
          password: 'password123',
          role: 'provider'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens).toBeDefined();
      expect(res.body.data.tokens.accessToken).toBeDefined();

      accessToken = res.body.data.tokens.accessToken;
      userId = res.body.data.user.id;
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'apitest',
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
      expect(res.body.data.username).toBe('apitest');
    });
  });

  describe('Token Management', () => {
    it('should create a token', async () => {
      const res = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'API Test Token',
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
      const res = await request(app).get('/api/tokens');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens.length).toBeGreaterThan(0);
    });
  });

  describe('Marketplace', () => {
    it('should browse marketplace', async () => {
      const res = await request(app).get('/api/marketplace/browse');

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
  });

  describe('THC Protocol', () => {
    it('should get THC version', async () => {
      const res = await request(app).get('/thc/v1/version');

      expect(res.status).toBe(200);
      expect(res.body.protocol).toBe('thc');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.supported_models).toBeDefined();
    });

    it('should get THC health', async () => {
      const res = await request(app).get('/thc/v1/health');

      expect(res.status).toBe(200);
      expect(res.body.protocol).toBe('thc');
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('OpenAI Compatible', () => {
    it('should get models list', async () => {
      const res = await request(app)
        .get('/v1/models')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.object).toBe('list');
      expect(res.body.data).toBeDefined();
    });
  });
});
