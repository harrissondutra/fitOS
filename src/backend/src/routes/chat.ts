import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { chatRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Get chat history
router.get('/', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenant?.id;
  const userId = req.headers['x-user-id'] as string;
  const { limit = 50, offset = 0 } = req.query;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  const messages = await prisma.chatMessage.findMany({
    where: {
      tenantId,
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: parseInt(limit as string, 10),
    skip: parseInt(offset as string, 10),
    select: {
      id: true,
      content: true,
      role: true,
      createdAt: true,
      metadata: true,
    },
  });

  return res.json({
    success: true,
    data: { messages: messages.reverse() },
  });
}));

// Send message to AI
router.post('/message', chatRateLimiter, asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenant?.id;
  const userId = req.headers['x-user-id'] as string;
  const { message, context } = req.body;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Message is required',
      },
    });
  }

  const prisma = getPrismaClient();

  // Save user message
  const userMessage = await prisma.chatMessage.create({
    data: {
      content: message.trim(),
      role: 'USER',
      tenantId,
      userId,
      sessionId: 'default-session',
      metadata: context ? { context } : {},
    },
  });

  // TODO: Process message with AI (Ollama integration)
  // For now, return a simple response
  const aiResponse = `I received your message: "${message}". This is a placeholder response. AI integration will be implemented soon.`;

  // Save AI response
  const aiMessage = await prisma.chatMessage.create({
    data: {
      content: aiResponse,
      role: 'ASSISTANT',
      tenantId,
      userId,
      sessionId: 'default-session',
      metadata: {
        model: 'placeholder',
        tokens: aiResponse.length,
      },
    },
  });

  logger.info('Chat message processed', {
    userId,
    tenantId,
    messageId: userMessage.id,
  });

  return res.json({
    success: true,
    data: {
      messages: [
        {
          id: userMessage.id,
          content: userMessage.content,
          role: userMessage.role,
          createdAt: userMessage.createdAt,
          metadata: userMessage.metadata,
        },
        {
          id: aiMessage.id,
          content: aiMessage.content,
          role: aiMessage.role,
          createdAt: aiMessage.createdAt,
          metadata: aiMessage.metadata,
        },
      ],
    },
  });
}));

// Get chat statistics
router.get('/stats', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenant?.id;
  const userId = req.headers['x-user-id'] as string;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  const stats = await prisma.chatMessage.aggregate({
    where: {
      tenantId,
      userId,
    },
    _count: {
      id: true,
    },
  });

  const lastMessage = await prisma.chatMessage.findFirst({
    where: {
      tenantId,
      userId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
    },
  });

  return res.json({
    success: true,
    data: {
      totalMessages: stats._count.id,
      lastMessageAt: lastMessage?.createdAt || null,
    },
  });
}));

// Clear chat history
router.delete('/', asyncHandler(async (req: RequestWithTenant, res: Response) => {
  const tenantId = req.tenant?.id;
  const userId = req.headers['x-user-id'] as string;

  if (!tenantId || !userId) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'User not authenticated',
      },
    });
  }

  const prisma = getPrismaClient();

  await prisma.chatMessage.deleteMany({
    where: {
      tenantId,
      userId,
    },
  });

  logger.info('Chat history cleared', {
    userId,
    tenantId,
  });

  return res.json({
    success: true,
    message: 'Chat history cleared successfully',
  });
}));

export { router as chatRoutes };
