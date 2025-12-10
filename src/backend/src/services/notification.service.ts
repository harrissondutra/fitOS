import { logger } from '../utils/logger';

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  channels?: ('email' | 'push' | 'whatsapp')[];
  metadata?: any;
}

export class NotificationService {
  /**
   * Enviar notificação multi-canal
   */
  async sendNotification(data: NotificationData): Promise<void> {
    const channels = data.channels || ['push'];

    // Log para auditoria
    logger.info('Sending notification', {
      userId: data.userId,
      title: data.title,
      channels,
      type: data.type
    });

    // Por enquanto, apenas logamos
    // TODO: Implementar integração com:
    // - Email (SendGrid ou Resend)
    // - Push Notifications (FCM ou VAPID)
    // - WhatsApp (Twilio ou Evolution API)

    for (const channel of channels) {
      switch (channel) {
        case 'email':
          await this.sendEmail(data);
          break;
        case 'push':
          await this.sendPush(data);
          break;
        case 'whatsapp':
          await this.sendWhatsApp(data);
          break;
      }
    }
  }

  /**
   * Enviar email
   */
  private async sendEmail(data: NotificationData): Promise<void> {
    // TODO: Implementar integração com SendGrid ou Resend
    logger.info('Email notification sent', { userId: data.userId, subject: data.title });
  }

  /**
   * Enviar push notification
   */
  private async sendPush(data: NotificationData): Promise<void> {
    // TODO: Implementar integração com FCM ou VAPID
    logger.info('Push notification sent', { userId: data.userId, title: data.title });
  }

  /**
   * Enviar WhatsApp
   */
  private async sendWhatsApp(data: NotificationData): Promise<void> {
    // TODO: Implementar integração com Twilio ou Evolution API
    logger.info('WhatsApp notification sent', { userId: data.userId, message: data.message });
  }

  /**
   * Notificar novo treino atribuído
   */
  async notifyNewWorkout(userId: string, trainerName: string, workoutName: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Novo Treino Atribuído',
      message: `${trainerName} atribuiu um novo treino: ${workoutName}`,
      type: 'info',
      channels: ['push', 'email'],
      metadata: { type: 'workout_assigned', workoutName }
    });
  }

  /**
   * Notificar treino completado
   */
  async notifyWorkoutCompleted(userId: string, trainerId: string, workoutName: string): Promise<void> {
    await this.sendNotification({
      userId: trainerId,
      title: 'Treino Completado',
      message: `Um cliente completou o treino: ${workoutName}`,
      type: 'success',
      channels: ['push', 'email'],
      metadata: { type: 'workout_completed', workoutName }
    });
  }

  /**
   * Notificar nova avaliação física agendada
   */
  async notifyAssessmentScheduled(userId: string, trainerName: string, date: Date): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Avaliação Física Agendada',
      message: `${trainerName} agendou uma avaliação física para ${date.toLocaleDateString('pt-BR')}`,
      type: 'info',
      channels: ['push', 'email', 'whatsapp'],
      metadata: { type: 'assessment_scheduled', date }
    });
  }

  /**
   * Notificar nova mensagem
   */
  async notifyNewMessage(userId: string, senderName: string, message: string): Promise<void> {
    await this.sendNotification({
      userId,
      title: 'Nova Mensagem',
      message: `${senderName}: ${message.substring(0, 50)}...`,
      type: 'info',
      channels: ['push', 'whatsapp'],
      metadata: { type: 'new_message', senderName }
    });
  }
}

export const notificationService = new NotificationService();
