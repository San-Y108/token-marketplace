// 测试配置

export const testConfig = {
  // 是否跳过数据库测试
  skipDatabaseTests: process.env.SKIP_DB_TESTS === 'true' || !process.env.DATABASE_URL,

  // 测试数据库URL
  testDatabaseUrl: process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/token_marketplace_test',

  // 测试服务器端口
  testPort: 3001,

  // 测试超时时间
  testTimeout: 10000,

  // 测试用户数据
  testUser: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'user' as const
  },

  // 测试提供者数据
  testProvider: {
    username: 'testprovider',
    email: 'provider@example.com',
    password: 'password123',
    role: 'provider' as const
  },

  // 测试Token数据
  testToken: {
    name: 'Test Token',
    description: 'Test token description',
    model_name: 'gpt-4',
    base_url: 'https://api.example.com',
    api_key_encrypted: 'test-key',
    protocol: 'openai' as const,
    price_per_1k_tokens: 0.01
  }
};

// 检查是否应该运行数据库测试
export function shouldRunDatabaseTests(): boolean {
  return !testConfig.skipDatabaseTests;
}

// 获取测试数据库连接字符串
export function getTestDatabaseUrl(): string {
  return testConfig.testDatabaseUrl;
}
