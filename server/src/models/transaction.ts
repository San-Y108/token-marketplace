import { getDatabase } from '../utils/dbInit.js';
import { v4 as uuidv4 } from 'uuid';

export interface Transaction {
  id: string;
  consumer_id: string;
  provider_id: string;
  token_id: string;
  tokens_used: number;
  points_charged: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  request_metadata: string;
  created_at: string;
}

export interface CreateTransactionData {
  consumer_id: string;
  provider_id: string;
  token_id: string;
  tokens_used: number;
  points_charged: number;
  request_metadata?: string;
}

export interface TransactionWithDetails extends Transaction {
  consumer_username: string;
  provider_username: string;
  token_name: string;
  model_name: string;
}

export class TransactionModel {
  private pool = getDatabase();

  async create(data: CreateTransactionData): Promise<Transaction> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const query = `
      INSERT INTO transactions (id, consumer_id, provider_id, token_id, tokens_used, points_charged, status, request_metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      id, data.consumer_id, data.provider_id, data.token_id,
      data.tokens_used, data.points_charged, data.request_metadata || '{}', now
    ]);

    return result.rows[0] as Transaction;
  }

  async findById(id: string): Promise<Transaction | null> {
    const query = 'SELECT * FROM transactions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rows[0] as Transaction) || null;
  }

  async findByConsumerId(consumerId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE consumer_id = $1';
    const params: any[] = [consumerId];
    let paramIndex = 2;

    if (options?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
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
    return result.rows as Transaction[];
  }

  async findByProviderId(providerId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE provider_id = $1';
    const params: any[] = [providerId];
    let paramIndex = 2;

    if (options?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
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
    return result.rows as Transaction[];
  }

  async findByTokenId(tokenId: string, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    let query = 'SELECT * FROM transactions WHERE token_id = $1';
    const params: any[] = [tokenId];
    let paramIndex = 2;

    if (options?.status) {
      query += ` AND status = $${paramIndex}`;
      params.push(options.status);
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
    return result.rows as Transaction[];
  }

  async findAllWithDetails(options?: {
    status?: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<TransactionWithDetails[]> {
    let query = `
      SELECT t.*,
             cu.username as consumer_username,
             pu.username as provider_username,
             tk.name as token_name,
             tk.model_name
      FROM transactions t
      JOIN users cu ON t.consumer_id = cu.id
      JOIN users pu ON t.provider_id = pu.id
      JOIN tokens tk ON t.token_id = tk.id
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.status) {
      conditions.push(`t.status = $${paramIndex}`);
      params.push(options.status);
      paramIndex++;
    }

    if (options?.startDate) {
      conditions.push(`t.created_at >= $${paramIndex}`);
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      conditions.push(`t.created_at <= $${paramIndex}`);
      params.push(options.endDate);
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
    return result.rows as TransactionWithDetails[];
  }

  async updateStatus(id: string, status: Transaction['status']): Promise<Transaction | null> {
    const query = 'UPDATE transactions SET status = $1 WHERE id = $2 RETURNING *';
    const result = await this.pool.query(query, [status, id]);
    return (result.rows[0] as Transaction) || null;
  }

  async complete(id: string): Promise<Transaction | null> {
    return this.updateStatus(id, 'completed');
  }

  async fail(id: string): Promise<Transaction | null> {
    return this.updateStatus(id, 'failed');
  }

  async refund(id: string): Promise<Transaction | null> {
    return this.updateStatus(id, 'refunded');
  }

  async getStats(options?: {
    providerId?: string;
    consumerId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    totalTransactions: number;
    totalTokensUsed: number;
    totalPointsCharged: number;
    completedTransactions: number;
    failedTransactions: number;
  }> {
    let query = `
      SELECT
        COUNT(*) as totalTransactions,
        COALESCE(SUM(tokens_used), 0) as totalTokensUsed,
        COALESCE(SUM(points_charged), 0) as totalPointsCharged,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completedTransactions,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedTransactions
      FROM transactions
    `;
    const params: any[] = [];
    let paramIndex = 1;
    const conditions: string[] = [];

    if (options?.providerId) {
      conditions.push(`provider_id = $${paramIndex}`);
      params.push(options.providerId);
      paramIndex++;
    }

    if (options?.consumerId) {
      conditions.push(`consumer_id = $${paramIndex}`);
      params.push(options.consumerId);
      paramIndex++;
    }

    if (options?.startDate) {
      conditions.push(`created_at >= $${paramIndex}`);
      params.push(options.startDate);
      paramIndex++;
    }

    if (options?.endDate) {
      conditions.push(`created_at <= $${paramIndex}`);
      params.push(options.endDate);
      paramIndex++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const result = await this.pool.query(query, params);
    const row = result.rows[0];

    // PostgreSQL返回BigInt，需要转换为Number
    return {
      totalTransactions: Number(row.totaltransactions || row.totalTransactions || 0),
      totalTokensUsed: Number(row.totaltokensused || row.totalTokensUsed || 0),
      totalPointsCharged: Number(row.totalpointscharged || row.totalPointsCharged || 0),
      completedTransactions: Number(row.completedtransactions || row.completedTransactions || 0),
      failedTransactions: Number(row.failedtransactions || row.failedTransactions || 0)
    };
  }

  async count(options?: { status?: string }): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM transactions';
    const params: any[] = [];

    if (options?.status) {
      query += ' WHERE status = $1';
      params.push(options.status);
    }

    const result = await this.pool.query(query, params);
    return parseInt(result.rows[0].count);
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM transactions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}

export const transactionModel = new TransactionModel();
