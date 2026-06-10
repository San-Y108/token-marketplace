import { Pool } from 'pg';

// 测试数据库配置
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/token_marketplace_test';

let testPool: Pool | null = null;
let isDatabaseAvailable = false;

export async function setupTestDatabase(): Promise<Pool | null> {
  try {
    testPool = new Pool({
      connectionString: TEST_DATABASE_URL,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 5000,
    });

    // 测试连接
    await testPool.query('SELECT 1');
    isDatabaseAvailable = true;

    // 清理测试数据
    await cleanupTestData();

    return testPool;
  } catch (error) {
    console.warn('Database not available, skipping database tests:', error);
    isDatabaseAvailable = false;
    return null;
  }
}

export async function cleanupTestData(): Promise<void> {
  if (!testPool || !isDatabaseAvailable) return;

  try {
    await testPool.query('DELETE FROM security_events');
    await testPool.query('DELETE FROM request_logs');
    await testPool.query('DELETE FROM ip_blacklist');
    await testPool.query('DELETE FROM transactions');
    await testPool.query('DELETE FROM api_keys');
    await testPool.query('DELETE FROM tokens');
    await testPool.query('DELETE FROM users');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
  }
}

export async function closeTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end();
    testPool = null;
    isDatabaseAvailable = false;
  }
}

export function getTestPool(): Pool | null {
  return testPool;
}

export function isDbAvailable(): boolean {
  return isDatabaseAvailable;
}

// 跳过数据库测试的辅助函数
export function describeDb(name: string, fn: () => void) {
  if (isDatabaseAvailable) {
    describe(name, fn);
  } else {
    describe.skip(name, fn);
  }
}

export function itDb(name: string, fn: () => void) {
  if (isDatabaseAvailable) {
    it(name, fn);
  } else {
    it.skip(name, fn);
  }
}
