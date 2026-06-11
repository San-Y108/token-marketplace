import bcrypt from 'bcryptjs';
import { getDatabase } from '../utils/dbInit.js';
import { v4 as uuidv4 } from 'uuid';

export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  permissions: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

export interface CreateApiKeyData {
  id?: string;
  user_id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  permissions: string;
  expires_at?: string;
}

export class ApiKeyModel {
  private pool = getDatabase();

  async create(data: CreateApiKeyData): Promise<ApiKey> {
    const id = data.id || uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO api_keys (id, user_id, key_hash, key_prefix, name, permissions, is_active, expires_at, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      id, data.user_id, data.key_hash, data.key_prefix, data.name,
      data.permissions, data.expires_at || null, now
    ]);

    return result.rows[0] as ApiKey;
  }

  async findById(id: string): Promise<ApiKey | null> {
    const query = 'SELECT * FROM api_keys WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rows[0] as ApiKey) || null;
  }

  async findByPrefix(keyPrefix: string): Promise<ApiKey | null> {
    const query = 'SELECT * FROM api_keys WHERE key_prefix = $1 AND is_active = true';
    const result = await this.pool.query(query, [keyPrefix]);
    return (result.rows[0] as ApiKey) || null;
  }

  async findByUserId(userId: string): Promise<ApiKey[]> {
    const query = 'SELECT * FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    return result.rows as ApiKey[];
  }

  async findAll(options?: { userId?: string; isActive?: boolean; limit?: number; offset?: number }): Promise<ApiKey[]> {
    let query = 'SELECT * FROM api_keys';
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(options.userId);
      paramIndex++;
    }

    if (options?.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(options.isActive);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
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
    return result.rows as ApiKey[];
  }

  async deactivate(id: string): Promise<boolean> {
    const query = 'UPDATE api_keys SET is_active = false WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async activate(id: string): Promise<boolean> {
    const query = 'UPDATE api_keys SET is_active = true WHERE id = $1 RETURNING id';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM api_keys WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async verifyKey(apiKey: string, storedHash: string): Promise<boolean> {
    return bcrypt.compare(apiKey, storedHash);
  }

  async count(options?: { userId?: string; isActive?: boolean }): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM api_keys';
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.userId) {
      conditions.push(`user_id = $${paramIndex}`);
      params.push(options.userId);
      paramIndex++;
    }

    if (options?.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(options.isActive);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async cleanupExpired(): Promise<number> {
    const query = `
      UPDATE api_keys
      SET is_active = false
      WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true
    `;
    const result = await this.pool.query(query);
    return result.rowCount ?? 0;
  }
}

export const apiKeyModel = new ApiKeyModel();
