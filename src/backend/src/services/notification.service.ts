import { PrismaClient } from '@prisma/client';
import { WebSocketService } from './websocket.service';

const prisma = new PrismaClient();

export interface CreateNotificationData {
  userId: string;
  tenantId: string;
  type: 'appointment' | 'crm_task' | 'bioimpedance' | 'comment' | 'reminder' | 'system';
  title: string;
  message: string;
  data?: any;
}

export interface NotificationFilters {
  userId: string;
  tenantId: string;
  type?: string;
  read?: boolean;
  limit?: number;
  offset?: number;
}

export class NotificationService {
  private wsService: WebSocketService;

  constructor() {
    this.wsService = new WebSocketService();
  }

  /**
   * Cria nova notificação
   */
  async create(data: CreateNotificationData): Promise<{
    success: boolean;
    notification?: any;
    error?: string;
  }> {
    try {
      const notification = await prisma.notification.create({
        data: {
          ...data,
          data: data.data || {}
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Envia notificação em tempo real via WebSocket
      await this.wsService.sendToUser(data.userId, {
        type: 'notification',
        data: notification
      });

      return { success: true, notification };
    } catch (error: any) {
      console.error('Erro ao criar notificação:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista notificações do usuário
   */
  async getNotifications(filters: NotificationFilters): Promise<{
    success: boolean;
    notifications?: any[];
    total?: number;
    unreadCount?: number;
    error?: string;
  }> {
    try {
      const where: any = {
        userId: filters.userId,
        tenantId: filters.tenantId
      };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.read !== undefined) {
        where.read = filters.read;
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            tenant: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 20,
          skip: filters.offset || 0
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({
          where: {
            userId: filters.userId,
            tenantId: filters.tenantId,
            read: false
          }
        })
      ]);

      return { success: true, notifications, total, unreadCount };
    } catch (error: any) {
      console.error('Erro ao listar notificações:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId: userId
        },
        data: { read: true }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao marcar notificação como lida:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId: string, tenantId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await prisma.notification.updateMany({
        where: {
          userId,
          tenantId,
          read: false
        },
        data: { read: true }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao marcar todas as notificações como lidas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove notificação
   */
  async deleteNotification(notificationId: string, userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId: userId
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao deletar notificação:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove notificações antigas (mais de 30 dias)
   */
  async cleanupOldNotifications(): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          },
          read: true
        }
      });

      return { success: true, deletedCount: result.count };
    } catch (error: any) {
      console.error('Erro ao limpar notificações antigas:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria notificação de agendamento
   */
  async createAppointmentNotification(
    userId: string,
    tenantId: string,
    appointment: any,
    action: 'created' | 'updated' | 'cancelled'
  ): Promise<void> {
    const messages = {
      created: `Novo agendamento: ${appointment.title} - ${appointment.scheduledAt.toLocaleString()}`,
      updated: `Agendamento atualizado: ${appointment.title}`,
      cancelled: `Agendamento cancelado: ${appointment.title}`
    };

    await this.create({
      userId,
      tenantId,
      type: 'appointment',
      title: `Agendamento ${action === 'created' ? 'Criado' : action === 'updated' ? 'Atualizado' : 'Cancelado'}`,
      message: messages[action],
      data: {
        appointmentId: appointment.id,
        action,
        scheduledAt: appointment.scheduledAt
      }
    });
  }

  /**
   * Cria notificação de tarefa CRM
   */
  async createCRMTaskNotification(
    userId: string,
    tenantId: string,
    task: any,
    action: 'created' | 'due_soon' | 'overdue'
  ): Promise<void> {
    const messages = {
      created: `Nova tarefa CRM: ${task.title}`,
      due_soon: `Tarefa próxima do vencimento: ${task.title}`,
      overdue: `Tarefa em atraso: ${task.title}`
    };

    await this.create({
      userId,
      tenantId,
      type: 'crm_task',
      title: `Tarefa CRM ${action === 'created' ? 'Criada' : action === 'due_soon' ? 'Próxima do Vencimento' : 'Em Atraso'}`,
      message: messages[action],
      data: {
        taskId: task.id,
        action,
        dueDate: task.dueDate
      }
    });
  }

  /**
   * Cria notificação de medição biométrica
   */
  async createBioimpedanceNotification(
    userId: string,
    tenantId: string,
    measurement: any,
    memberName: string
  ): Promise<void> {
    await this.create({
      userId,
      tenantId,
      type: 'bioimpedance',
      title: 'Nova Medição Biométrica',
      message: `Nova medição registrada para ${memberName}`,
      data: {
        measurementId: measurement.id,
        memberId: measurement.memberId,
        measuredAt: measurement.measuredAt
      }
    });
  }

  /**
   * Cria notificação de comentário
   */
  async createCommentNotification(
    userId: string,
    tenantId: string,
    comment: any,
    appointmentTitle: string
  ): Promise<void> {
    await this.create({
      userId,
      tenantId,
      type: 'comment',
      title: 'Novo Comentário',
      message: `Novo comentário em: ${appointmentTitle}`,
      data: {
        commentId: comment.id,
        appointmentId: comment.appointmentId,
        authorId: comment.userId
      }
    });
  }

  /**
   * Cria notificação de lembrete
   */
  async createReminderNotification(
    userId: string,
    tenantId: string,
    reminder: any,
    appointmentTitle: string
  ): Promise<void> {
    await this.create({
      userId,
      tenantId,
      type: 'reminder',
      title: 'Lembrete de Agendamento',
      message: `Lembrete: ${appointmentTitle} - ${reminder.scheduledFor.toLocaleString()}`,
      data: {
        reminderId: reminder.id,
        appointmentId: reminder.appointmentId,
        type: reminder.type
      }
    });
  }

  /**
   * Cria notificação do sistema
   */
  async createSystemNotification(
    userId: string,
    tenantId: string,
    title: string,
    message: string,
    data?: any
  ): Promise<void> {
    await this.create({
      userId,
      tenantId,
      type: 'system',
      title,
      message,
      data
    });
  }

  /**
   * Obtém estatísticas de notificações
   */
  async getNotificationStats(userId: string, tenantId: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const [
        total,
        unread,
        byType
      ] = await Promise.all([
        prisma.notification.count({
          where: { userId, tenantId }
        }),
        prisma.notification.count({
          where: { userId, tenantId, read: false }
        }),
        prisma.notification.groupBy({
          by: ['type'],
          where: { userId, tenantId },
          _count: { type: true }
        })
      ]);

      return {
        success: true,
        stats: {
          total,
          unread,
          byType: byType.reduce((acc, item) => {
            acc[item.type] = item._count.type;
            return acc;
          }, {} as any)
        }
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas de notificações:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new NotificationService();
