import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { Pool } from 'pg';
import app from '../src/index.js';
import { setupTestDatabase, cleanupTestData, closeTestDatabase, isDbAvailable } from '../tests/setup.js';

// 如果数据库不可用，跳过测试
const describeOrSkip = isDbAvailable() ? describe : describe.skip;

describeOrSkip('Auth API', () => {
  let pool: Pool;

  beforeAll(async () => {
    pool = await setupTestDatabase();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens).toBeDefined();
      expect(res.body.data.user.username).toBe('newuser');
      expect(res.body.data.user.email).toBe('new@example.com');
      expect(res.body.data.tokens.accessToken).toBeDefined();
      expect(res.body.data.tokens.refreshToken).toBeDefined();
    });

    it('should register a provider', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'provider',
          email: 'provider@example.com',
          password: 'password123',
          role: 'provider'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe('provider');
    });

    it('should return 409 for duplicate username', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'first@example.com',
          password: 'password123'
        });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'duplicate',
          email: 'second@example.com',
          password: 'password456'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab', // too short
          email: 'invalid-email',
          password: '123' // too short
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'password123'
        });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.tokens.accessToken).toBeDefined();
    });

    it('should return 401 for invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'refreshuser',
          email: 'refresh@example.com',
          password: 'password123'
        });

      const { refreshToken } = registerRes.body.data.tokens;

      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'meuser',
          email: 'me@example.com',
          password: 'password123'
        });

      const { accessToken } = registerRes.body.data.tokens;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('meuser');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/api-keys', () => {
    it('should generate API key', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'apikeyuser',
          email: 'apikey@example.com',
          password: 'password123'
        });

      const { accessToken } = registerRes.body.data.tokens;

      const res = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test Key' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.apiKey).toBeDefined();
      expect(res.body.data.keyId).toBeDefined();
      expect(res.body.data.apiKey).toMatch(/^tk_/);
    });
  });

  describe('GET /api/auth/api-keys', () => {
    it('should list API keys', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'listkeys',
          email: 'listkeys@example.com',
          password: 'password123'
        });

      const { accessToken } = registerRes.body.data.tokens;

      // 创建一个API key
      await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Key 1' });

      const res = await request(app)
        .get('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });
});
