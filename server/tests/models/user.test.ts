import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { Pool } from 'pg';
import { UserModel, CreateUserData } from '../../src/models/user.js';
import { setupTestDatabase, cleanupTestData, closeTestDatabase, isDbAvailable } from '../setup.js';

// 如果数据库不可用，跳过测试
const describeOrSkip = isDbAvailable() ? describe : describe.skip;

describeOrSkip('UserModel', () => {
  let pool: Pool | null;
  let userModel: UserModel;

  beforeAll(async () => {
    pool = await setupTestDatabase();
    userModel = new UserModel();
  });

  afterAll(async () => {
    await closeTestDatabase();
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData: CreateUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      const user = await userModel.create(userData);

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe('user');
      expect(user.points_balance).toBe(1000);
      expect(user.password_hash).not.toBe('password123');
    });

    it('should create a provider user', async () => {
      const userData: CreateUserData = {
        username: 'provider',
        email: 'provider@example.com',
        password: 'password123',
        role: 'provider'
      };

      const user = await userModel.create(userData);

      expect(user.role).toBe('provider');
    });

    it('should throw error for duplicate username', async () => {
      const userData: CreateUserData = {
        username: 'duplicate',
        email: 'first@example.com',
        password: 'password123'
      };

      await userModel.create(userData);

      const duplicateData: CreateUserData = {
        username: 'duplicate',
        email: 'second@example.com',
        password: 'password456'
      };

      await expect(userModel.create(duplicateData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData: CreateUserData = {
        username: 'findme',
        email: 'findme@example.com',
        password: 'password123'
      };

      const created = await userModel.create(userData);
      const found = await userModel.findById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.username).toBe('findme');
    });

    it('should return null for non-existent id', async () => {
      const found = await userModel.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const userData: CreateUserData = {
        username: 'findbyname',
        email: 'findbyname@example.com',
        password: 'password123'
      };

      await userModel.create(userData);
      const found = await userModel.findByUsername('findbyname');

      expect(found).toBeDefined();
      expect(found?.username).toBe('findbyname');
    });

    it('should return null for non-existent username', async () => {
      const found = await userModel.findByUsername('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData: CreateUserData = {
        username: 'emailuser',
        email: 'email@example.com',
        password: 'password123'
      };

      await userModel.create(userData);
      const found = await userModel.findByEmail('email@example.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('email@example.com');
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      await userModel.create({ username: 'user1', email: 'user1@example.com', password: 'pass1' });
      await userModel.create({ username: 'user2', email: 'user2@example.com', password: 'pass2' });
      await userModel.create({ username: 'user3', email: 'user3@example.com', password: 'pass3' });

      const users = await userModel.findAll();

      expect(users).toHaveLength(3);
    });

    it('should filter by role', async () => {
      await userModel.create({ username: 'user1', email: 'user1@example.com', password: 'pass1', role: 'user' });
      await userModel.create({ username: 'prov1', email: 'prov1@example.com', password: 'pass2', role: 'provider' });

      const users = await userModel.findAll({ role: 'provider' });

      expect(users).toHaveLength(1);
      expect(users[0].role).toBe('provider');
    });

    it('should support pagination', async () => {
      for (let i = 0; i < 5; i++) {
        await userModel.create({
          username: `user${i}`,
          email: `user${i}@example.com`,
          password: 'pass'
        });
      }

      const page1 = await userModel.findAll({ limit: 2, offset: 0 });
      const page2 = await userModel.findAll({ limit: 2, offset: 2 });

      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await userModel.create({
        username: 'updateme',
        email: 'update@example.com',
        password: 'password123'
      });

      const updated = await userModel.update(user.id, {
        username: 'updated',
        email: 'updated@example.com'
      });

      expect(updated).toBeDefined();
      expect(updated?.username).toBe('updated');
      expect(updated?.email).toBe('updated@example.com');
    });

    it('should update points balance', async () => {
      const user = await userModel.create({
        username: 'points',
        email: 'points@example.com',
        password: 'password123'
      });

      const updated = await userModel.update(user.id, { points_balance: 5000 });

      expect(updated?.points_balance).toBe(5000);
    });
  });

  describe('updatePoints', () => {
    it('should add points', async () => {
      const user = await userModel.create({
        username: 'addpoints',
        email: 'add@example.com',
        password: 'password123'
      });

      const updated = await userModel.updatePoints(user.id, 500);

      expect(updated?.points_balance).toBe(1500);
    });

    it('should subtract points', async () => {
      const user = await userModel.create({
        username: 'subpoints',
        email: 'sub@example.com',
        password: 'password123'
      });

      const updated = await userModel.updatePoints(user.id, -200);

      expect(updated?.points_balance).toBe(800);
    });

    it('should throw error for insufficient balance', async () => {
      const user = await userModel.create({
        username: 'insufficient',
        email: 'insufficient@example.com',
        password: 'password123'
      });

      await expect(userModel.updatePoints(user.id, -2000)).rejects.toThrow('Insufficient points balance');
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const user = await userModel.create({
        username: 'deleteme',
        email: 'delete@example.com',
        password: 'password123'
      });

      const deleted = await userModel.delete(user.id);
      expect(deleted).toBe(true);

      const found = await userModel.findById(user.id);
      expect(found).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const user = await userModel.create({
        username: 'verify',
        email: 'verify@example.com',
        password: 'correctpassword'
      });

      const isValid = await userModel.verifyPassword(user, 'correctpassword');
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const user = await userModel.create({
        username: 'verify2',
        email: 'verify2@example.com',
        password: 'correctpassword'
      });

      const isValid = await userModel.verifyPassword(user, 'wrongpassword');
      expect(isValid).toBe(false);
    });
  });

  describe('count', () => {
    it('should count all users', async () => {
      await userModel.create({ username: 'count1', email: 'count1@example.com', password: 'pass' });
      await userModel.create({ username: 'count2', email: 'count2@example.com', password: 'pass' });

      const count = await userModel.count();
      expect(count).toBe(2);
    });

    it('should count users by role', async () => {
      await userModel.create({ username: 'user1', email: 'user1@example.com', password: 'pass', role: 'user' });
      await userModel.create({ username: 'prov1', email: 'prov1@example.com', password: 'pass', role: 'provider' });
      await userModel.create({ username: 'prov2', email: 'prov2@example.com', password: 'pass', role: 'provider' });

      const userCount = await userModel.count({ role: 'user' });
      const providerCount = await userModel.count({ role: 'provider' });

      expect(userCount).toBe(1);
      expect(providerCount).toBe(2);
    });
  });
});
