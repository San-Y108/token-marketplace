import { Router, Response } from 'express';
import { z } from 'zod';
import { proxyService, ProxyRequest } from '../services/proxy.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// 验证schemas
const chatCompletionSchema = z.object({
  model: z.string(),
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })),
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional()
});

const completionSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  max_tokens: z.number().optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional()
});

const embeddingSchema = z.object({
  model: z.string(),
  input: z.union([z.string(), z.array(z.string())]),
  encoding_format: z.enum(['float', 'base64']).optional()
});

// 聊天补全
router.post('/chat/completions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = chatCompletionSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await proxyService.handleChatCompletion({
      request: validatedData as ProxyRequest,
      consumerId: user.userId,
      apiKey: req.headers.authorization?.substring(7)
    });

    res.json(result.response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid request body',
          type: 'invalid_request_error',
          code: 'invalid_request',
          details: error.errors
        }
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      error: {
        message,
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

// 文本补全
router.post('/completions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = completionSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await proxyService.handleCompletion({
      request: validatedData as ProxyRequest,
      consumerId: user.userId,
      apiKey: req.headers.authorization?.substring(7)
    });

    res.json(result.response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid request body',
          type: 'invalid_request_error',
          code: 'invalid_request',
          details: error.errors
        }
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      error: {
        message,
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

// 嵌入
router.post('/embeddings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = embeddingSchema.parse(req.body);
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await proxyService.handleEmbedding({
      request: validatedData as ProxyRequest,
      consumerId: user.userId,
      apiKey: req.headers.authorization?.substring(7)
    });

    res.json(result.response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          message: 'Invalid request body',
          type: 'invalid_request_error',
          code: 'invalid_request',
          details: error.errors
        }
      });
    }

    const message = error instanceof Error ? error.message : 'Internal server error';
    const statusCode = message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      error: {
        message,
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

// 模型列表
router.get('/models', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const models = await proxyService.getModels();

    res.json({
      object: 'list',
      data: models
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to fetch models',
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

// 单个模型详情
router.get('/models/:modelId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { modelId } = req.params;
    const models = await proxyService.getModels();
    const model = models.find(m => m.id === modelId);

    if (!model) {
      return res.status(404).json({
        error: {
          message: `Model ${modelId} not found`,
          type: 'not_found_error',
          code: 'model_not_found'
        }
      });
    }

    res.json(model);
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to fetch model',
        type: 'server_error',
        code: 'internal_error'
      }
    });
  }
});

export default router;
