import { Router, Response } from 'express';
import { z } from 'zod';
import { proxyService, ProxyRequest } from '../services/proxy.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { billingService } from '../services/billing.js';

const router = Router();

// THC协议请求schema
const thcChatSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  stream: z.boolean().optional(),
  // THC特有字段
  thc_version: z.string().optional(),
  chain_id: z.string().optional(),
  token_hash: z.string().optional(),
  nonce: z.string().optional()
});

const thcCompleteSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  // THC特有字段
  thc_version: z.string().optional(),
  chain_id: z.string().optional(),
  token_hash: z.string().optional()
});

const thcEmbeddingSchema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
  // THC特有字段
  thc_version: z.string().optional(),
  chain_id: z.string().optional()
});

// THC协议信息
const THC_VERSION = '1.0.0';
const THC_SUPPORTED_MODELS = [
  'gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo',
  'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku',
  'llama-3', 'llama-2', 'mistral', 'mixtral'
];

// THC协议版本信息
router.get('/version', (req: AuthRequest, res: Response) => {
  res.json({
    protocol: 'thc',
    version: THC_VERSION,
    supported_models: THC_SUPPORTED_MODELS,
    features: [
      'chat_completion',
      'text_completion',
      'embedding',
      'streaming',
      'token_hash_verification'
    ]
  });
});

// THC协议聊天补全
router.post('/chat/completions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = thcChatSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // 验证THC协议版本
    if (validatedData.thc_version && validatedData.thc_version !== THC_VERSION) {
      return res.status(400).json({
        success: false,
        error: `Unsupported THC version: ${validatedData.thc_version}. Supported: ${THC_VERSION}`
      });
    }

    // 转换为OpenAI格式并转发
    const openaiRequest: ProxyRequest = {
      model: validatedData.model,
      messages: validatedData.messages,
      max_tokens: validatedData.max_tokens,
      temperature: validatedData.temperature,
      top_p: validatedData.top_p,
      stream: validatedData.stream
    };

    const result = await proxyService.handleChatCompletion({
      request: openaiRequest,
      consumerId: user.userId
    });

    // 添加THC协议元数据
    const thcResponse = {
      ...result.response,
      thc_version: THC_VERSION,
      chain_id: validatedData.chain_id || `chain_${Date.now()}`,
      token_hash: validatedData.token_hash,
      protocol: 'thc'
    };

    res.json(thcResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid THC request',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: message,
      protocol: 'thc'
    });
  }
});

// THC协议文本补全
router.post('/completions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = thcCompleteSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // 验证THC协议版本
    if (validatedData.thc_version && validatedData.thc_version !== THC_VERSION) {
      return res.status(400).json({
        success: false,
        error: `Unsupported THC version: ${validatedData.thc_version}. Supported: ${THC_VERSION}`
      });
    }

    // 转换为OpenAI格式并转发
    const openaiRequest: ProxyRequest = {
      model: validatedData.model,
      prompt: validatedData.prompt,
      max_tokens: validatedData.max_tokens,
      temperature: validatedData.temperature
    };

    const result = await proxyService.handleCompletion({
      request: openaiRequest,
      consumerId: user.userId
    });

    // 添加THC协议元数据
    const thcResponse = {
      ...result.response,
      thc_version: THC_VERSION,
      chain_id: validatedData.chain_id || `chain_${Date.now()}`,
      protocol: 'thc'
    };

    res.json(thcResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid THC request',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: message,
      protocol: 'thc'
    });
  }
});

// THC协议向量嵌入
router.post('/embeddings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = thcEmbeddingSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // 验证THC协议版本
    if (validatedData.thc_version && validatedData.thc_version !== THC_VERSION) {
      return res.status(400).json({
        success: false,
        error: `Unsupported THC version: ${validatedData.thc_version}. Supported: ${THC_VERSION}`
      });
    }

    // 转换为OpenAI格式并转发
    const openaiRequest: ProxyRequest = {
      model: validatedData.model,
      input: validatedData.input
    };

    const result = await proxyService.handleEmbedding({
      request: openaiRequest,
      consumerId: user.userId
    });

    // 添加THC协议元数据
    const thcResponse = {
      ...result.response,
      thc_version: THC_VERSION,
      chain_id: validatedData.chain_id || `chain_${Date.now()}`,
      protocol: 'thc'
    };

    res.json(thcResponse);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid THC request',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({
      success: false,
      error: message,
      protocol: 'thc'
    });
  }
});

// THC协议模型列表
router.get('/models', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const models = await proxyService.getModels();

    // 转换为THC格式
    const thcModels = models.map(model => ({
      id: model.id,
      name: model.id,
      protocol: 'thc',
      thc_version: THC_VERSION,
      capabilities: ['chat', 'completion', 'embedding'],
      created_at: model.created
    }));

    res.json({
      protocol: 'thc',
      version: THC_VERSION,
      models: thcModels
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch models',
      protocol: 'thc'
    });
  }
});

// THC协议Token验证
router.post('/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { token_hash, chain_id } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // 验证token hash（简化实现）
    const isValid = token_hash && token_hash.length > 0;

    res.json({
      protocol: 'thc',
      version: THC_VERSION,
      valid: isValid,
      chain_id: chain_id,
      verified_at: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Verification failed',
      protocol: 'thc'
    });
  }
});

// THC协议健康检查
router.get('/health', (req: AuthRequest, res: Response) => {
  res.json({
    protocol: 'thc',
    version: THC_VERSION,
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
