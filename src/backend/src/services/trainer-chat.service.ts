import { PrismaClient, TrainerClientChat } from '@prisma/client';
import { logger } from '../utils/logger';

export interface ChatMessageData {
  senderId: string;
  receiverId: string;
  message: string;
  attachments?: string[];
}

export class TrainerClientChatService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Enviar mensagem
   */
  async sendMessage(data: ChatMessageData, tenantId: string): Promise<TrainerClientChat> {
    const chatMessage = await this.prisma.trainerClientChat.create({
      data: {
        ...data,
        tenantId,
        attachments: data.attachments || []
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true
          }
        }
      }
    });

    logger.info(`Chat message sent from ${data.senderId} to ${data.receiverId} in tenant ${tenantId}`);
    return chatMessage;
  }

  /**
   * Buscar conversa entre dois usuários
   */
  async getConversation(userId1: string, userId2: string, tenantId: string, limit = 50): Promise<TrainerClientChat[]> {
    return await this.prisma.trainerClientChat.findMany({
      where: {
        tenantId,
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 }
        ]
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Marcar mensagens como lidas
   */
  async markAsRead(userId: string, senderId: string, tenantId: string): Promise<void> {
    await this.prisma.trainerClientChat.updateMany({
      where: {
        tenantId,
        senderId,
        receiverId: userId,
        readAt: null
      },
      data: {
        readAt: new Date()
      }
    });

    logger.info(`Messages marked as read from ${senderId} to ${userId} in tenant ${tenantId}`);
  }

  /**
   * Buscar conversas do usuário
   */
  async getConversations(userId: string, tenantId: string): Promise<any[]> {
    const conversations = await this.prisma.trainerClientChat.findMany({
      where: {
        tenantId,
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      },
      select: {
        senderId: true,
        receiverId: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            image: true,
            role: true
          }
        },
        message: true,
        createdAt: true,
        readAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Agrupar por usuário único
    const uniqueConversations = new Map<string, any>();
    
    for (const msg of conversations) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      const otherUser = msg.senderId === userId ? msg.receiver : msg.sender;
      
      if (!uniqueConversations.has(otherUserId)) {
        uniqueConversations.set(otherUserId, {
          userId: otherUserId,
          user: otherUser,
          lastMessage: msg.message,
          lastMessageDate: msg.createdAt,
          unreadCount: 0
        });
      }
    }

    return Array.from(uniqueConversations.values());
  }

  /**
   * Contar mensagens não lidas
   */
  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    return await this.prisma.trainerClientChat.count({
      where: {
        tenantId,
        receiverId: userId,
        readAt: null
      }
    });
  }
}

