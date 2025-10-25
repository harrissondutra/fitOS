// FitOS Push Notification Service
// Serviço para envio de notificações push

import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurar VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || '',
  privateKey: process.env.VAPID_PRIVATE_KEY || '',
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@fitos.com',
};

webpush.setVapidDetails(
  vapidKeys.subject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
  renotify?: boolean;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  // Enviar notificação para um usuário específico
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      if (!subscription) {
        console.log(`[Push Service] No subscription found for user ${userId}`);
        return false;
      }

      return await this.sendNotification(subscription, payload);
    } catch (error) {
      console.error('[Push Service] Error sending to user:', error);
      return false;
    }
  }

  // Enviar notificação para múltiplos usuários
  async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<number> {
    let successCount = 0;
    
    for (const userId of userIds) {
      const success = await this.sendToUser(userId, payload);
      if (success) successCount++;
    }
    
    return successCount;
  }

  // Enviar notificação para todos os usuários de um tenant
  async sendToTenant(tenantId: string, payload: PushNotificationPayload): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        where: { tenantId },
        select: { id: true },
      });

      const userIds = users.map(user => user.id);
      return await this.sendToUsers(userIds, payload);
    } catch (error) {
      console.error('[Push Service] Error sending to tenant:', error);
      return 0;
    }
  }

  // Enviar notificação para todos os usuários
  async sendToAll(payload: PushNotificationPayload): Promise<number> {
    try {
      const users = await prisma.user.findMany({
        select: { id: true },
      });

      const userIds = users.map(user => user.id);
      return await this.sendToUsers(userIds, payload);
    } catch (error) {
      console.error('[Push Service] Error sending to all:', error);
      return 0;
    }
  }

  // Salvar subscription do usuário
  async saveUserSubscription(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      // Salvar subscription no campo data do modelo Notification
      await prisma.notification.upsert({
        where: { 
          id: `push_subscription_${userId}` 
        },
        update: {
          data: {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            updatedAt: new Date(),
          },
        },
        create: {
          id: `push_subscription_${userId}`,
          userId,
          tenantId: 'system', // Usar um tenantId padrão para subscriptions
          type: 'push_subscription',
          title: 'Push Subscription',
          message: 'Push notification subscription',
          data: {
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
          },
        },
      });

      console.log(`[Push Service] Subscription saved for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[Push Service] Error saving subscription:', error);
      return false;
    }
  }

  // Remover subscription do usuário
  async removeUserSubscription(userId: string): Promise<boolean> {
    try {
      await prisma.notification.delete({
        where: { 
          id: `push_subscription_${userId}` 
        }
      });

      console.log(`[Push Service] Subscription removed for user ${userId}`);
      return true;
    } catch (error) {
      console.error('[Push Service] Error removing subscription:', error);
      return false;
    }
  }

  // Obter subscription do usuário
  private async getUserSubscription(userId: string): Promise<PushSubscription | null> {
    try {
      const subscription = await prisma.notification.findUnique({
        where: { 
          id: `push_subscription_${userId}` 
        }
      });

      if (!subscription || !subscription.data) return null;

      const data = subscription.data as any;
      return {
        endpoint: data.endpoint,
        keys: {
          p256dh: data.p256dh,
          auth: data.auth,
        },
      };
    } catch (error) {
      console.error('[Push Service] Error getting subscription:', error);
      return null;
    }
  }

  // Enviar notificação
  private async sendNotification(
    subscription: PushSubscription, 
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      const notificationPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        tag: payload.tag,
        renotify: payload.renotify || false,
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
      });

      await webpush.sendNotification(subscription, notificationPayload);
      console.log('[Push Service] Notification sent successfully');
      return true;
    } catch (error) {
      console.error('[Push Service] Error sending notification:', error);
      
      // Se a subscription for inválida, removê-la
      if ((error as any).statusCode === 410 || (error as any).statusCode === 404) {
        console.log('[Push Service] Removing invalid subscription');
        // Aqui você poderia implementar a remoção da subscription
      }
      
      return false;
    }
  }

  // Obter chave pública VAPID
  getVapidPublicKey(): string {
    return vapidKeys.publicKey;
  }

  // Enviar notificação de treino
  async sendWorkoutReminder(userId: string, workoutName: string, scheduledTime: Date): Promise<boolean> {
    const payload: PushNotificationPayload = {
      title: '💪 Lembrete de Treino',
      body: `Hora do treino: ${workoutName}`,
      data: {
        type: 'workout_reminder',
        workoutId: workoutName,
        scheduledTime: scheduledTime.toISOString(),
      },
      actions: [
        {
          action: 'start_workout',
          title: 'Iniciar Treino',
          icon: '/icons/action-play.png',
        },
        {
          action: 'snooze',
          title: 'Adiar 15min',
          icon: '/icons/action-snooze.png',
        },
      ],
      requireInteraction: true,
      tag: 'workout_reminder',
    };

    return await this.sendToUser(userId, payload);
  }

  // Enviar notificação de progresso
  async sendProgressUpdate(userId: string, achievement: string): Promise<boolean> {
    const payload: PushNotificationPayload = {
      title: '🎉 Parabéns!',
      body: achievement,
      data: {
        type: 'progress_update',
        achievement,
      },
      actions: [
        {
          action: 'view_progress',
          title: 'Ver Progresso',
          icon: '/icons/action-chart.png',
        },
      ],
      tag: 'progress_update',
    };

    return await this.sendToUser(userId, payload);
  }

  // Enviar notificação de mensagem
  async sendMessage(userId: string, senderName: string, message: string): Promise<boolean> {
    const payload: PushNotificationPayload = {
      title: `💬 ${senderName}`,
      body: message,
      data: {
        type: 'message',
        senderName,
        message,
      },
      actions: [
        {
          action: 'reply',
          title: 'Responder',
          icon: '/icons/action-reply.png',
        },
        {
          action: 'view_chat',
          title: 'Ver Chat',
          icon: '/icons/action-chat.png',
        },
      ],
      requireInteraction: true,
      tag: 'message',
    };

    return await this.sendToUser(userId, payload);
  }
}

export const pushNotificationService = new PushNotificationService();
