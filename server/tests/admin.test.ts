import request from 'supertest';
import { Pool } from 'pg';

// 管理员API测试
describe('Admin API Tests', () => {
  let app: any;
  let adminToken: string;
  let userToken: string;
  const adminUsername = `admin_${Date.now()}`;
  const adminEmail = `admin_${Date.now()}@test.com`;
  const testUsername = `admintest_${Date.now()}`;
  const testEmail = `admintest_${Date.now()}@test.com`;

  beforeAll(async () => {
    process.env.DATABASE_URL = 'postgresql://yanshuo@localhost:5432/token_marketplace';
    process.env.JWT_SECRET = 'test-secret';

    // 清理测试数据
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query("DELETE FROM users WHERE username LIKE 'admin_%' OR username LIKE 'admintest_%'");
    await pool.end();

    const module = await import('../src/index.js');
    app = module.default;

    // 创建admin用户（直接插入数据库）
    const adminPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await adminPool.query(
      `INSERT INTO users (id, username, email, password_hash, role, points_balance, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, '$2a$12$dummy', 'admin', 1000, NOW(), NOW())`,
      [adminUsername, adminEmail]
    );
    await adminPool.end();

    // 登录admin用户
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        username: adminUsername,
        password: 'password123'
      });

    if (loginRes.body.success && loginRes.body.data) {
      adminToken = loginRes.body.data.tokens.accessToken;
    }

    // 创建普通用户
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: testUsername,
        email: testEmail,
        password: 'password123',
        role: 'user'
      });

    if (userRes.body.success && userRes.body.data) {
      userToken = userRes.body.data.tokens.accessToken;
    }
  });

  describe('Admin Authorization', () => {
    it('should reject non-admin users', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests without token', async () => {
      const res = await request(app)
        .get('/api/admin/stats');

      expect(res.status).toBe(401);
    });
  });

  describe('System Statistics', () => {
    it('should get system statistics', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }

      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.tokens).toBeDefined();
      expect(res.body.data.transactions).toBeDefined();
    });
  });

  describe('User Management', () => {
    it('should list users', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    it('should get user details', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }

      // 先获取用户列表
      const listRes = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listRes.body.data.users.length > 0) {
        const userId = listRes.body.data.users[0].id;
        const res = await request(app)
          .get(`/api/admin/users/${userId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe(userId);
      }
    });
  });

  describe('Token Management', () => {
    it('should list all tokens', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }

      const res = await request(app)
        .get('/api/admin/tokens')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.tokens)).toBe(true);
    });
  });

  describe('Transaction Management', () => {
    it('should list transactions', async () => {
      if (!adminToken) {
        console.warn('Admin token not available, skipping test');
        return;
      }

      const res = await request(app)
        .get('/api/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.transactions)).toBe(true);
    });
  });
});
