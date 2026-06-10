import { tokenModel, Token } from '../models/token.js';
import { billingService } from './billing.js';

export interface ProxyRequest {
  model: string;
  messages?: any[];
  prompt?: string;
  input?: string | string[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  [key: string]: any;
}

export interface ProxyResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: any[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class ProxyService {
  /**
   * 根据模型名称查找可用的token
   */
  async findTokenForModel(modelName: string): Promise<Token | null> {
    const tokens = await tokenModel.findByModelName(modelName);

    // 返回第一个激活的token
    return tokens.find(t => t.is_active) || null;
  }

  /**
   * 转发请求到目标API
   */
  async forwardRequest(options: {
    token: Token;
    path: string;
    method: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<{ response: Response; responseBody: any }> {
    const { token, path, method, headers = {}, body } = options;

    // 构建目标URL
    const baseUrl = token.base_url.replace(/\/$/, '');
    const targetUrl = `${baseUrl}${path}`;

    // 准备请求头
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.api_key_encrypted}`,
      ...headers
    };

    // 发送请求
    const response = await fetch(targetUrl, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseBody = await response.json();

    return { response, responseBody };
  }

  /**
   * 处理聊天补全请求
   */
  async handleChatCompletion(options: {
    request: ProxyRequest;
    consumerId: string;
    apiKey?: string;
  }): Promise<{ response: ProxyResponse; tokensUsed: number }> {
    const { request, consumerId, apiKey } = options;

    // 查找对应的token
    const token = await this.findTokenForModel(request.model);
    if (!token) {
      throw new Error(`Model ${request.model} not found`);
    }

    // 转发请求
    const { response, responseBody } = await this.forwardRequest({
      token,
      path: '/v1/chat/completions',
      method: 'POST',
      body: request
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${responseBody.error?.message || response.statusText}`);
    }

    // 计算token使用量
    const tokensUsed = responseBody.usage?.total_tokens || 0;

    // 处理计费
    if (consumerId && tokensUsed > 0) {
      await billingService.processUsage({
        consumerId,
        tokenId: token.id,
        tokensUsed,
        requestMetadata: {
          model: request.model,
          path: '/v1/chat/completions',
          timestamp: new Date().toISOString()
        }
      });
    }

    return {
      response: responseBody,
      tokensUsed
    };
  }

  /**
   * 处理文本补全请求
   */
  async handleCompletion(options: {
    request: ProxyRequest;
    consumerId: string;
    apiKey?: string;
  }): Promise<{ response: ProxyResponse; tokensUsed: number }> {
    const { request, consumerId, apiKey } = options;

    // 查找对应的token
    const token = await this.findTokenForModel(request.model);
    if (!token) {
      throw new Error(`Model ${request.model} not found`);
    }

    // 转发请求
    const { response, responseBody } = await this.forwardRequest({
      token,
      path: '/v1/completions',
      method: 'POST',
      body: request
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${responseBody.error?.message || response.statusText}`);
    }

    // 计算token使用量
    const tokensUsed = responseBody.usage?.total_tokens || 0;

    // 处理计费
    if (consumerId && tokensUsed > 0) {
      await billingService.processUsage({
        consumerId,
        tokenId: token.id,
        tokensUsed,
        requestMetadata: {
          model: request.model,
          path: '/v1/completions',
          timestamp: new Date().toISOString()
        }
      });
    }

    return {
      response: responseBody,
      tokensUsed
    };
  }

  /**
   * 处理嵌入请求
   */
  async handleEmbedding(options: {
    request: ProxyRequest;
    consumerId: string;
    apiKey?: string;
  }): Promise<{ response: ProxyResponse; tokensUsed: number }> {
    const { request, consumerId, apiKey } = options;

    // 查找对应的token
    const token = await this.findTokenForModel(request.model);
    if (!token) {
      throw new Error(`Model ${request.model} not found`);
    }

    // 转发请求
    const { response, responseBody } = await this.forwardRequest({
      token,
      path: '/v1/embeddings',
      method: 'POST',
      body: request
    });

    if (!response.ok) {
      throw new Error(`Upstream API error: ${responseBody.error?.message || response.statusText}`);
    }

    // 计算token使用量
    const tokensUsed = responseBody.usage?.total_tokens || 0;

    // 处理计费
    if (consumerId && tokensUsed > 0) {
      await billingService.processUsage({
        consumerId,
        tokenId: token.id,
        tokensUsed,
        requestMetadata: {
          model: request.model,
          path: '/v1/embeddings',
          timestamp: new Date().toISOString()
        }
      });
    }

    return {
      response: responseBody,
      tokensUsed
    };
  }

  /**
   * 获取可用模型列表
   */
  async getModels(): Promise<any[]> {
    const tokens = await tokenModel.findAll({ isActive: true });

    // 提取唯一的模型名称
    const modelNames = [...new Set(tokens.map(t => t.model_name))];

    return modelNames.map(name => ({
      id: name,
      object: 'model',
      created: Math.floor(Date.now() / 1000),
      owned_by: 'marketplace',
      permission: [],
      root: name,
      parent: null
    }));
  }

  /**
   * 解密API Key（占位实现）
   */
  async decryptApiKey(encryptedKey: string): Promise<string> {
    // 在实际应用中，这里应该使用真正的解密逻辑
    // 简化实现：直接返回
    return encryptedKey;
  }
}

export const proxyService = new ProxyService();
