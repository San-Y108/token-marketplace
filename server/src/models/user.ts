import { getDatabase } from '../utils/dbInit.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: 'user' | 'provider' | 'admin';
  points_balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  role?: 'user' | 'provider' | 'admin';
}

export interface UpdateUserData {
  username?: string;
  email?: string;
  role?: 'user' | 'provider' | 'admin';
  points_balance?: number;
}

export class UserModel {
  private pool = getDatabase();

  async create(data: CreateUserData): Promise<User> {
    const id = uuidv4();
    const password_hash = await bcrypt.hash(data.password, 12);
    const now = new Date().toISOString();

    const role = data.role || 'user';
    const points_balance = parseFloat(process.env.DEFAULT_POINTS_BALANCE || '1000');

    const query = `
      INSERT INTO users (id, username, email, password_hash, role, points_balance, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [id, data.username, data.email, password_hash, role, points_balance, now, now]);
    return result.rows[0] as User;
  }

  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rows[0] as User) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await this.pool.query(query, [username]);
    return (result.rows[0] as User) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);
    return (result.rows[0] as User) || null;
  }

  async findAll(options?: { role?: string; limit?: number; offset?: number }): Promise<User[]> {
    let query = 'SELECT * FROM users';
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.role) {
      query += ` WHERE role = $${paramIndex}`;
      params.push(options.role);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (options?.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(options.limit);
      paramIndex++;
    }

    if (options?.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(options.offset);
      paramIndex++;
    }

    const result = await this.pool.query(query, params);
    return result.rows as User[];
  }

  async update(id: string, data: UpdateUserData): Promise<User | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.username !== undefined) {
      updates.push(`username = $${paramIndex}`);
      params.push(data.username);
      paramIndex++;
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      params.push(data.role);
      paramIndex++;
    }
    if (data.points_balance !== undefined) {
      updates.push(`points_balance = $${paramIndex}`);
      params.push(data.points_balance);
      paramIndex++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = $${paramIndex}`);
    params.push(new Date().toISOString());
    paramIndex++;
    params.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return (result.rows[0] as User) || null;
  }

  async updatePoints(id: string, amount: number): Promise<User | null> {
    const user = await this.findById(id);
    if (!user) return null;

    const currentBalance = parseFloat(user.points_balance as any);
    const newBalance = currentBalance + amount;
    if (newBalance < 0) {
      throw new Error('Insufficient points balance');
    }

    return this.update(id, { points_balance: newBalance });
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  async count(options?: { role?: string }): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM users';
    const params: any[] = [];

    if (options?.role) {
      query += ' WHERE role = $1';
      params.push(options.role);
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count);
  }
}

export const userModel = new UserModel();
