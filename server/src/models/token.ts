import { getDatabase } from '../utils/dbInit.js';
import { v4 as uuidv4 } from 'uuid';

export interface Token {
  id: string;
  provider_id: string;
  name: string;
  description: string | null;
  model_name: string;
  base_url: string;
  api_key_encrypted: string;
  protocol: 'openai' | 'thc' | 'custom';
  price_per_1k_tokens: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateTokenData {
  provider_id: string;
  name: string;
  description?: string;
  model_name: string;
  base_url: string;
  api_key_encrypted: string;
  protocol: 'openai' | 'thc' | 'custom';
  price_per_1k_tokens: number;
}

export interface UpdateTokenData {
  name?: string;
  description?: string;
  model_name?: string;
  base_url?: string;
  api_key_encrypted?: string;
  protocol?: 'openai' | 'thc' | 'custom';
  price_per_1k_tokens?: number;
  is_active?: boolean;
}

export interface TokenWithProvider extends Token {
  provider_username: string;
  provider_email: string;
}

export class TokenModel {
  private pool = getDatabase();

  async create(data: CreateTokenData): Promise<Token> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO tokens (id, provider_id, name, description, model_name, base_url, api_key_encrypted, protocol, price_per_1k_tokens, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      id, data.provider_id, data.name, data.description || null,
      data.model_name, data.base_url, data.api_key_encrypted,
      data.protocol, data.price_per_1k_tokens, now, now
    ]);

    return result.rows[0] as Token;
  }

  async findById(id: string): Promise<Token | null> {
    const query = 'SELECT * FROM tokens WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rows[0] as Token) || null;
  }

  async findByProviderId(providerId: string): Promise<Token[]> {
    const query = 'SELECT * FROM tokens WHERE provider_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [providerId]);
    return result.rows as Token[];
  }

  async findAll(options?: {
    isActive?: boolean;
    protocol?: string;
    providerId?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<Token[]> {
    let query = 'SELECT * FROM tokens';
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(options.isActive);
      paramIndex++;
    }

    if (options?.protocol) {
      conditions.push(`protocol = $${paramIndex}`);
      params.push(options.protocol);
      paramIndex++;
    }

    if (options?.providerId) {
      conditions.push(`provider_id = $${paramIndex}`);
      params.push(options.providerId);
      paramIndex++;
    }

    if (options?.search) {
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR model_name ILIKE $${paramIndex})`);
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm);
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
    return result.rows as Token[];
  }

  async findAllWithProvider(options?: {
    isActive?: boolean;
    protocol?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<TokenWithProvider[]> {
    let query = `
      SELECT t.*, u.username as provider_username, u.email as provider_email
      FROM tokens t
      JOIN users u ON t.provider_id = u.id
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.isActive !== undefined) {
      conditions.push(`t.is_active = $${paramIndex}`);
      params.push(options.isActive);
      paramIndex++;
    }

    if (options?.protocol) {
      conditions.push(`t.protocol = $${paramIndex}`);
      params.push(options.protocol);
      paramIndex++;
    }

    if (options?.search) {
      conditions.push(`(t.name ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex} OR t.model_name ILIKE $${paramIndex})`);
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.created_at DESC';

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
    return result.rows as TokenWithProvider[];
  }

  async update(id: string, data: UpdateTokenData): Promise<Token | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(data.description);
      paramIndex++;
    }
    if (data.model_name !== undefined) {
      updates.push(`model_name = $${paramIndex}`);
      params.push(data.model_name);
      paramIndex++;
    }
    if (data.base_url !== undefined) {
      updates.push(`base_url = $${paramIndex}`);
      params.push(data.base_url);
      paramIndex++;
    }
    if (data.api_key_encrypted !== undefined) {
      updates.push(`api_key_encrypted = $${paramIndex}`);
      params.push(data.api_key_encrypted);
      paramIndex++;
    }
    if (data.protocol !== undefined) {
      updates.push(`protocol = $${paramIndex}`);
      params.push(data.protocol);
      paramIndex++;
    }
    if (data.price_per_1k_tokens !== undefined) {
      updates.push(`price_per_1k_tokens = $${paramIndex}`);
      params.push(data.price_per_1k_tokens);
      paramIndex++;
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(data.is_active);
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
      UPDATE tokens
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, params);
    return (result.rows[0] as Token) || null;
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM tokens WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async deactivate(id: string): Promise<boolean> {
    const query = 'UPDATE tokens SET is_active = false, updated_at = $1 WHERE id = $2 RETURNING id';
    const result = await this.pool.query(query, [new Date().toISOString(), id]);
    return (result.rowCount ?? 0) > 0;
  }

  async activate(id: string): Promise<boolean> {
    const query = 'UPDATE tokens SET is_active = true, updated_at = $1 WHERE id = $2 RETURNING id';
    const result = await this.pool.query(query, [new Date().toISOString(), id]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(options?: { isActive?: boolean; providerId?: string }): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM tokens';
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.isActive !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      params.push(options.isActive);
      paramIndex++;
    }

    if (options?.providerId) {
      conditions.push(`provider_id = $${paramIndex}`);
      params.push(options.providerId);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async findByModelName(modelName: string): Promise<Token[]> {
    const query = 'SELECT * FROM tokens WHERE model_name = $1 AND is_active = true';
    const result = await this.pool.query(query, [modelName]);
    return result.rows as Token[];
  }

  async findRandomActive(limit: number = 10): Promise<Token[]> {
    const query = 'SELECT * FROM tokens WHERE is_active = true ORDER BY RANDOM() LIMIT $1';
    const result = await this.pool.query(query, [limit]);
    return result.rows as Token[];
  }
}

export const tokenModel = new TokenModel();
