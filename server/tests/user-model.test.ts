import { Pool } from 'pg';
import { UserModel } from '../src/models/user';

// 测试数据库连接
const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgresql://yanshuo@localhost:5432/token_marketplace';

describe('UserModel Tests', () => {
  let pool: Pool;
  let userModel: UserModel;

  beforeAll(async () => {
    pool = new Pool({ connectionString: TEST_DB_URL });
    userModel = new UserModel();

    // 清理测试数据
    await pool.query('DELETE FROM users WHERE username LIKE \'test%\'');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users WHERE username LIKE \'test%\'');
    await pool.end();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const user = await userModel.create({
        username: 'testuser1',
        email: 'test1@example.com',
        password: 'password123',
        role: 'user'
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser1');
      expect(user.email).toBe('test1@example.com');
      expect(user.role).toBe('user');
      expect(parseFloat(user.points_balance as any)).toBe(1000);
      expect(user.password_hash).not.toBe('password123');
    });

    it('should create a provider user', async () => {
      const user = await userModel.create({
        username: 'testprovider1',
        email: 'provider1@example.com',
        password: 'password123',
        role: 'provider'
      });

      expect(user.role).toBe('provider');
    });

    it('should throw error for duplicate username', async () => {
      await userModel.create({
        username: 'testduplicate',
        email: 'dup1@example.com',
        password: 'password123'
      });

      await expect(userModel.create({
        username: 'testduplicate',
        email: 'dup2@example.com',
        password: 'password456'
      })).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const created = await userModel.create({
        username: 'testfindbyid',
        email: 'findbyid@example.com',
        password: 'password123'
      });

      const found = await userModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe('testfindbyid');
    });

    it('should return null for non-existent id', async () => {
      const found = await userModel.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      await userModel.create({
        username: 'testfindbyname',
        email: 'findbyname@example.com',
        password: 'password123'
      });

      const found = await userModel.findByUsername('testfindbyname');

      expect(found).toBeDefined();
      expect(found?.username).toBe('testfindbyname');
    });

    it('should return null for non-existent username', async () => {
      const found = await userModel.findByUsername('nonexistentuser');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await userModel.create({
        username: 'testupdate',
        email: 'update@example.com',
        password: 'password123'
      });

      const updated = await userModel.update(user.id, {
        username: 'testupdated',
        email: 'updated@example.com'
      });

      expect(updated).toBeDefined();
      expect(updated?.username).toBe('testupdated');
      expect(updated?.email).toBe('updated@example.com');
    });
  });

  describe('updatePoints', () => {
    it('should add points', async () => {
      const user = await userModel.create({
        username: 'testaddpoints',
        email: 'addpoints@example.com',
        password: 'password123'
      });

      const updated = await userModel.updatePoints(user.id, 500);

      expect(parseFloat(updated?.points_balance as any)).toBe(1500);
    });

    it('should subtract points', async () => {
      const user = await userModel.create({
        username: 'testsubpoints',
        email: 'subpoints@example.com',
        password: 'password123'
      });

      const updated = await userModel.updatePoints(user.id, -200);

      expect(parseFloat(updated?.points_balance as any)).toBe(800);
    });

    it('should throw error for insufficient balance', async () => {
      const user = await userModel.create({
        username: 'testinsufficient',
        email: 'insufficient@example.com',
        password: 'password123'
      });

      // 尝试扣除超过余额的积分
      await expect(userModel.updatePoints(user.id, -2000)).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const user = await userModel.create({
        username: 'testverifypass',
        email: 'verifypass@example.com',
        password: 'correctpassword'
      });

      const isValid = await userModel.verifyPassword(user, 'correctpassword');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await userModel.create({
        username: 'testrejectpass',
        email: 'rejectpass@example.com',
        password: 'correctpassword'
      });

      const isValid = await userModel.verifyPassword(user, 'wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('count', () => {
    it('should count users', async () => {
      await userModel.create({ username: 'testcount1', email: 'count1@example.com', password: 'pass' });
      await userModel.create({ username: 'testcount2', email: 'count2@example.com', password: 'pass' });

      const count = await userModel.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });
  });
});
