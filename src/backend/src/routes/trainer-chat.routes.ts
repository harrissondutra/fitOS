import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { TrainerClientChatService } from '../services/trainer-chat.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { body, param } from 'express-validator';

const router = Router();
const prisma = new PrismaClient();
const chatService = new TrainerClientChatService(prisma);

// Extend Request interface
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    role: string;
  };
}

// POST /api/trainer-chat/message - Enviar mensagem
router.post(
  '/message',
  authMiddleware,
  tenantMiddleware,
  [
    body('receiverId').notEmpty().withMessage('Receiver ID is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const chatMessage = await chatService.sendMessage(
      {
        senderId: req.user!.id,
        receiverId: req.body.receiverId,
        message: req.body.message,
        attachments: req.body.attachments || []
      },
      req.tenantId
    );

    res.status(201).json({
      success: true,
      data: { message: chatMessage }
    });
  })
);

// GET /api/trainer-chat/conversation/:userId - Buscar conversa
router.get(
  '/conversation/:userId',
  authMiddleware,
  tenantMiddleware,
  [param('userId').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { userId } = req.params;

    const messages = await chatService.getConversation(req.user!.id, userId, req.tenantId);

    res.json({
      success: true,
      data: { messages }
    });
  })
);

// GET /api/trainer-chat/conversations - Listar conversas
router.get(
  '/conversations',
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const conversations = await chatService.getConversations(req.user!.id, req.tenantId);

    res.json({
      success: true,
      data: { conversations }
    });
  })
);

// GET /api/trainer-chat/unread-count - Contar mensagens não lidas
router.get(
  '/unread-count',
  authMiddleware,
  tenantMiddleware,
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const unreadCount = await chatService.getUnreadCount(req.user!.id, req.tenantId);

    res.json({
      success: true,
      data: { unreadCount }
    });
  })
);

// PUT /api/trainer-chat/read/:senderId - Marcar como lido
router.put(
  '/read/:senderId',
  authMiddleware,
  tenantMiddleware,
  [param('senderId').isString().notEmpty()],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { senderId } = req.params;

    await chatService.markAsRead(req.user!.id, senderId, req.tenantId);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  })
);

export { router as trainerChatRoutes };

