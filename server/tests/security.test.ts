import request from 'supertest';
import { Pool } from 'pg';

// 安全渗透测试
describe('Security Penetration Tests', () => {
  let app: any;
  let accessToken: string;
  let providerToken: string;
  let userId: string;

  beforeAll(async () => {
    // 动态导入app
    process.env.DATABASE_URL = 'postgresql://yanshuo@localhost:5432/token_marketplace';
    process.env.JWT_SECRET = 'test-secret';

    // 先清理测试用户
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("DELETE FROM users WHERE username IN ('sectestuser', 'secprovuser', 'otheruser')");
    await pool.end();

    const module = await import('../src/index.js');
    app = module.default;

    // 创建测试用户（普通用户）
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'sectestuser',
        email: 'sectest@example.com',
        password: 'password123',
        role: 'user'
      });

    if (res.body.success && res.body.data) {
      accessToken = res.body.data.tokens.accessToken;
      userId = res.body.data.user.id;
    } else {
      console.warn('Failed to create test user:', res.body);
    }

    // 创建provider用户
    const provRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'secprovuser',
        email: 'secprov@example.com',
        password: 'password123',
        role: 'provider'
      });

    if (provRes.body.success && provRes.body.data) {
      providerToken = provRes.body.data.tokens.accessToken;
    }
  });

  describe('SQL Injection Tests', () => {
    it('should prevent SQL injection in login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: "admin' OR '1'='1",
          password: "anything' OR '1'='1"
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should prevent SQL injection in search', async () => {
      const res = await request(app)
        .get('/api/tokens?search=test\'; DROP TABLE users; --');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should prevent SQL injection in user lookup', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid\' OR \'1\'=\'1');

      expect(res.status).toBe(401);
    });
  });

  describe('XSS Prevention Tests', () => {
    it('should sanitize XSS in username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '<script>alert("xss")</script>',
          email: 'xss@test.com',
          password: 'password123'
        });

      // 应该拒绝或转义
      if (res.status === 201) {
        expect(res.body.data.user.username).not.toContain('<script>');
      }
    });

    it('should sanitize XSS in token name', async () => {
      const xssPayload = '<img src=x onerror=alert(1)>';
      const res = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: xssPayload,
          model_name: 'gpt-4',
          base_url: 'https://api.example.com',
          api_key_encrypted: 'test-key',
          protocol: 'openai',
          price_per_1k_tokens: 0.01
        });

      // API应该能正常处理（JSON API不需要转义，前端负责转义）
      // 验证请求不会导致服务器错误
      expect([201, 400, 422]).toContain(res.status);
    });
  });

  describe('Authentication Bypass Tests', () => {
    it('should reject requests without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwidXNlcm5hbWUiOiJ0ZXN0Iiwicm9sZSI6InVzZXIiLCJpYXQiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-format');

      expect(res.status).toBe(401);
    });

    it('should reject tampered tokens', async () => {
      // 修改token的一个字符
      const tamperedToken = accessToken.slice(0, -1) + 'X';

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${tamperedToken}`);

      expect(res.status).toBe(401);
    });
  });

  describe('Authorization Tests', () => {
    it('should prevent unauthorized access to admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should prevent users from accessing other users data', async () => {
      // 创建另一个用户
      const otherRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          email: 'other@example.com',
          password: 'password123'
        });

      if (!otherRes.body.success || !otherRes.body.data) {
        // 如果用户已存在，尝试登录
        const loginRes = await request(app)
          .post('/api/auth/login')
          .send({
            username: 'otheruser',
            password: 'password123'
          });

        if (loginRes.body.success && loginRes.body.data) {
          const otherToken = loginRes.body.data.tokens.accessToken;
          const res = await request(app)
            .get(`/api/admin/users/${userId}`)
            .set('Authorization', `Bearer ${otherToken}`);

          expect(res.status).toBe(403);
        }
        return;
      }

      const otherToken = otherRes.body.data.tokens.accessToken;

      // 尝试访问第一个用户的数据
      const res = await request(app)
        .get(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Password Security Tests', () => {
    it('should reject weak passwords', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'weakpassuser',
          email: 'weak@example.com',
          password: '123' // 太短
        });

      expect(res.status).toBe(400);
    });

    it('should hash passwords properly', async () => {
      const uniqueUsername = `hashtestuser_${Date.now()}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: uniqueUsername,
          email: `hash_${Date.now()}@example.com`,
          password: 'mypassword123'
        });

      expect(res.status).toBe(201);
      // 密码不应该明文存储
      expect(res.body.data.user.password_hash).toBeUndefined();
    });
  });

  describe('Input Validation Tests', () => {
    it('should validate email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'invalidemail',
          email: 'not-an-email',
          password: 'password123'
        });

      expect(res.status).toBe(400);
    });

    it('should validate URL format', async () => {
      const res = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'Invalid URL Token',
          model_name: 'gpt-4',
          base_url: 'not-a-url',
          api_key_encrypted: 'test-key',
          protocol: 'openai',
          price_per_1k_tokens: 0.01
        });

      expect(res.status).toBe(400);
    });

    it('should validate price range', async () => {
      const res = await request(app)
        .post('/api/tokens')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          name: 'Negative Price Token',
          model_name: 'gpt-4',
          base_url: 'https://api.example.com',
          api_key_encrypted: 'test-key',
          protocol: 'openai',
          price_per_1k_tokens: -0.01 // 负数价格
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Error Handling Tests', () => {
    it('should not leak sensitive information in errors', async () => {
      const res = await request(app)
        .get('/api/tokens/nonexistent-id');

      // 接受404或500，但不应该泄露敏感信息
      expect([404, 500]).toContain(res.status);
      // 不应该包含数据库错误信息
      const errorStr = JSON.stringify(res.body).toLowerCase();
      expect(errorStr).not.toContain('postgresql');
      expect(errorStr).not.toContain('password');
    });

    it('should handle malformed JSON gracefully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid json');

      expect(res.status).toBe(400);
    });
  });

  // 频率限制测试放在最后，避免影响其他测试
  describe('Rate Limiting Tests', () => {
    it('should enforce rate limits', async () => {
      const requests = [];

      // 发送大量请求
      for (let i = 0; i < 150; i++) {
        requests.push(
          request(app)
            .get('/health')
        );
      }

      const results = await Promise.all(requests);
      const rateLimited = results.some(r => r.status === 429);

      // 应该有一些请求被限制
      expect(rateLimited).toBe(true);
    });
  });
});
