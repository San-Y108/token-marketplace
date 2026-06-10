import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { userModel, User, CreateUserData } from '../models/user.js';
import { apiKeyModel } from '../models/apiKey.js';

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: Omit<User, 'password_hash'>;
  tokens: AuthTokens;
}

export class AuthService {
  private jwtSecret: string;
  private accessExpiresIn: number;
  private refreshExpiresIn: number;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    // 转换为秒数
    this.accessExpiresIn = this.parseExpiresIn(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
    this.refreshExpiresIn = this.parseExpiresIn(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
  }

  private parseExpiresIn(value: string): number {
    const match = value.match(/^(\d+)([mhds])$/);
    if (!match) return 900; // 默认15分钟

    const num = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's': return num;
      case 'm': return num * 60;
      case 'h': return num * 60 * 60;
      case 'd': return num * 60 * 60 * 24;
      default: return 900;
    }
  }

  async register(data: CreateUserData): Promise<LoginResult> {
    // 检查用户名是否已存在
    const existingUsername = await userModel.findByUsername(data.username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // 检查邮箱是否已存在
    const existingEmail = await userModel.findByEmail(data.email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // 创建用户
    const user = await userModel.create(data);

    // 生成tokens
    const tokens = this.generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async login(username: string, password: string): Promise<LoginResult> {
    // 查找用户
    const user = await userModel.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // 验证密码
    const isValidPassword = await userModel.verifyPassword(user, password);
    if (!isValidPassword) {
      throw new Error('Invalid username or password');
    }

    // 生成tokens
    const tokens = this.generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role
    });

    // 返回用户信息（不包含密码）
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      tokens
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // 验证refresh token
      const payload = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload;

      // 检查用户是否存在
      const user = await userModel.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // 生成新的tokens
      return this.generateTokens({
        userId: user.id,
        username: user.username,
        role: user.role
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;

      // 检查用户是否存在
      const user = await userModel.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async validateApiKey(apiKey: string): Promise<{ userId: string; permissions: any }> {
    // 从API Key中提取前缀
    const keyPrefix = apiKey.substring(0, 8);

    // 查找API Key
    const keyRecord = await apiKeyModel.findByPrefix(keyPrefix);
    if (!keyRecord) {
      throw new Error('Invalid API key');
    }

    // 检查是否过期
    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      throw new Error('API key has expired');
    }

    // 检查是否激活
    if (!keyRecord.is_active) {
      throw new Error('API key is inactive');
    }

    // 验证key hash
    const isValid = await apiKeyModel.verifyKey(apiKey, keyRecord.key_hash);
    if (!isValid) {
      throw new Error('Invalid API key');
    }

    return {
      userId: keyRecord.user_id,
      permissions: JSON.parse(keyRecord.permissions || '{}')
    };
  }

  private generateTokens(payload: TokenPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessExpiresIn
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshExpiresIn
    });

    return { accessToken, refreshToken };
  }

  async generateApiKey(userId: string, name?: string): Promise<{ apiKey: string; keyId: string }> {
    // 生成随机API Key
    const apiKey = `tk_${uuidv4().replace(/-/g, '')}`;
    const keyPrefix = apiKey.substring(0, 8);
    const keyId = uuidv4();

    // 存储API Key
    await apiKeyModel.create({
      id: keyId,
      user_id: userId,
      key_hash: apiKey, // 在实际应用中应该hash
      key_prefix: keyPrefix,
      name: name || 'API Key',
      permissions: JSON.stringify({ read: true, write: true })
    });

    return { apiKey, keyId };
  }

  async revokeApiKey(keyId: string): Promise<boolean> {
    return apiKeyModel.deactivate(keyId);
  }

  async getUserApiKeys(userId: string): Promise<any[]> {
    return apiKeyModel.findByUserId(userId);
  }
}

export const authService = new AuthService();
