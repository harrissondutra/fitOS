import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Initialize Twilio client
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export interface WhatsAppMessage {
  to: string;
  from: string;
  body: string;
  mediaUrl?: string;
  templateName?: string;
  templateParams?: Record<string, string>;
  priority?: 'high' | 'normal' | 'low';
  scheduledAt?: Date;
}

export interface WhatsAppTemplate {
  name: string;
  category: 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';
  language: string;
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    buttons?: Array<{
      type: 'URL' | 'PHONE_NUMBER' | 'QUICK_REPLY';
      text: string;
      url?: string;
      phone_number?: string;
    }>;
  }>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'PENDING_DELETION';
}

export interface WhatsAppWebhook {
  messageId: string;
  from: string;
  to: string;
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'interactive';
  body?: string;
  mediaUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export class WhatsAppService {
  private static instance: WhatsAppService;

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Send a text message via WhatsApp
   */
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      logger.info('Sending WhatsApp message', { to: message.to, body: message.body });

      const twilioMessage = await twilioClient.messages.create({
        body: message.body,
        from: `whatsapp:${message.from}`,
        to: `whatsapp:${message.to}`,
        mediaUrl: message.mediaUrl,
        statusCallback: `${process.env.API_BASE_URL}/webhooks/whatsapp/status`,
      });

      // Save message to database
      await this.saveMessage({
        messageId: twilioMessage.sid,
        from: message.from,
        to: message.to,
        body: message.body,
        mediaUrl: message.mediaUrl,
        status: 'sent',
        sentAt: new Date(),
        tenantId: message.tenantId || null,
      });

      logger.info('WhatsApp message sent successfully', { messageId: twilioMessage.sid });
      return { success: true, messageId: twilioMessage.sid };
    } catch (error) {
      logger.error('Failed to send WhatsApp message', { error: error.message, to: message.to });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send a template message via WhatsApp
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: Record<string, string>,
    tenantId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      logger.info('Sending WhatsApp template message', { to, templateName });

      // Get template from database
      const template = await prisma.whatsAppTemplate.findFirst({
        where: { name: templateName, status: 'APPROVED' },
      });

      if (!template) {
        throw new Error(`Template ${templateName} not found or not approved`);
      }

      // Replace template parameters
      let body = template.body;
      Object.entries(templateParams).forEach(([key, value]) => {
        body = body.replace(`{{${key}}}`, value);
      });

      const twilioMessage = await twilioClient.messages.create({
        body: body,
        from: `whatsapp:${process.env.WHATSAPP_FROM_NUMBER}`,
        to: `whatsapp:${to}`,
        statusCallback: `${process.env.API_BASE_URL}/webhooks/whatsapp/status`,
      });

      // Save message to database
      await this.saveMessage({
        messageId: twilioMessage.sid,
        from: process.env.WHATSAPP_FROM_NUMBER!,
        to: to,
        body: body,
        templateName: templateName,
        status: 'sent',
        sentAt: new Date(),
        tenantId: tenantId || null,
      });

      logger.info('WhatsApp template message sent successfully', { messageId: twilioMessage.sid });
      return { success: true, messageId: twilioMessage.sid };
    } catch (error) {
      logger.error('Failed to send WhatsApp template message', { error: error.message, to });
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(
    messages: WhatsAppMessage[],
    tenantId?: string
  ): Promise<{ success: boolean; results: Array<{ success: boolean; messageId?: string; error?: string }> }> {
    try {
      logger.info('Sending bulk WhatsApp messages', { count: messages.length });

      const results = await Promise.allSettled(
        messages.map(message => this.sendMessage({ ...message, tenantId }))
      );

      const processedResults = results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return { success: false, error: result.reason.message };
        }
      });

      const successCount = processedResults.filter(r => r.success).length;
      logger.info('Bulk WhatsApp messages completed', { 
        total: messages.length, 
        success: successCount, 
        failed: messages.length - successCount 
      });

      return { success: true, results: processedResults };
    } catch (error) {
      logger.error('Failed to send bulk WhatsApp messages', { error: error.message });
      return { success: false, results: [] };
    }
  }

  /**
   * Schedule a message for later delivery
   */
  async scheduleMessage(
    message: WhatsAppMessage,
    scheduledAt: Date,
    tenantId?: string
  ): Promise<{ success: boolean; scheduledMessageId?: string; error?: string }> {
    try {
      logger.info('Scheduling WhatsApp message', { to: message.to, scheduledAt });

      // Save scheduled message to database
      const scheduledMessage = await prisma.whatsAppScheduledMessage.create({
        data: {
          to: message.to,
          from: message.from,
          body: message.body,
          mediaUrl: message.mediaUrl,
          templateName: message.templateName,
          templateParams: message.templateParams,
          scheduledAt: scheduledAt,
          status: 'SCHEDULED',
          tenantId: tenantId || null,
        },
      });

      logger.info('WhatsApp message scheduled successfully', { scheduledMessageId: scheduledMessage.id });
      return { success: true, scheduledMessageId: scheduledMessage.id.toString() };
    } catch (error) {
      logger.error('Failed to schedule WhatsApp message', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Process scheduled messages
   */
  async processScheduledMessages(): Promise<void> {
    try {
      const now = new Date();
      const scheduledMessages = await prisma.whatsAppScheduledMessage.findMany({
        where: {
          status: 'SCHEDULED',
          scheduledAt: { lte: now },
        },
        take: 100, // Process in batches
      });

      logger.info('Processing scheduled WhatsApp messages', { count: scheduledMessages.length });

      for (const scheduledMessage of scheduledMessages) {
        try {
          const result = await this.sendMessage({
            to: scheduledMessage.to,
            from: scheduledMessage.from,
            body: scheduledMessage.body,
            mediaUrl: scheduledMessage.mediaUrl,
            templateName: scheduledMessage.templateName,
            templateParams: scheduledMessage.templateParams,
          });

          if (result.success) {
            await prisma.whatsAppScheduledMessage.update({
              where: { id: scheduledMessage.id },
              data: { 
                status: 'SENT',
                sentAt: new Date(),
                messageId: result.messageId,
              },
            });
          } else {
            await prisma.whatsAppScheduledMessage.update({
              where: { id: scheduledMessage.id },
              data: { 
                status: 'FAILED',
                error: result.error,
              },
            });
          }
        } catch (error) {
          logger.error('Failed to process scheduled message', { 
            scheduledMessageId: scheduledMessage.id, 
            error: error.message 
          });
          
          await prisma.whatsAppScheduledMessage.update({
            where: { id: scheduledMessage.id },
            data: { 
              status: 'FAILED',
              error: error.message,
            },
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process scheduled messages', { error: error.message });
    }
  }

  /**
   * Handle incoming webhook from Twilio
   */
  async handleWebhook(webhook: WhatsAppWebhook): Promise<void> {
    try {
      logger.info('Processing WhatsApp webhook', { messageId: webhook.messageId });

      // Update message status
      await prisma.whatsAppMessage.updateMany({
        where: { messageId: webhook.messageId },
        data: { 
          status: webhook.status,
          updatedAt: new Date(),
        },
      });

      // Handle different message types
      if (webhook.type === 'text' && webhook.body) {
        await this.handleIncomingMessage(webhook);
      }

      logger.info('WhatsApp webhook processed successfully', { messageId: webhook.messageId });
    } catch (error) {
      logger.error('Failed to process WhatsApp webhook', { error: error.message });
    }
  }

  /**
   * Handle incoming text messages
   */
  private async handleIncomingMessage(webhook: WhatsAppWebhook): Promise<void> {
    try {
      // Save incoming message
      await prisma.whatsAppMessage.create({
        data: {
          messageId: webhook.messageId,
          from: webhook.from,
          to: webhook.to,
          body: webhook.body,
          type: webhook.type,
          status: webhook.status,
          receivedAt: new Date(),
          tenantId: null, // Will be determined by phone number lookup
        },
      });

      // Auto-reply logic based on keywords
      const autoReply = await this.getAutoReply(webhook.body);
      if (autoReply) {
        await this.sendMessage({
          to: webhook.from,
          from: webhook.to,
          body: autoReply,
        });
      }
    } catch (error) {
      logger.error('Failed to handle incoming message', { error: error.message });
    }
  }

  /**
   * Get auto-reply based on message content
   */
  private async getAutoReply(messageBody: string): Promise<string | null> {
    const lowerBody = messageBody.toLowerCase();

    // Simple keyword-based auto-replies
    if (lowerBody.includes('oi') || lowerBody.includes('olá') || lowerBody.includes('hello')) {
      return 'Olá! Como posso ajudá-lo hoje?';
    }

    if (lowerBody.includes('consulta') || lowerBody.includes('agendar')) {
      return 'Para agendar uma consulta, acesse nosso site ou ligue para (11) 99999-9999.';
    }

    if (lowerBody.includes('horário') || lowerBody.includes('funcionamento')) {
      return 'Nosso horário de funcionamento é de segunda a sexta, das 8h às 18h.';
    }

    if (lowerBody.includes('preço') || lowerBody.includes('valor') || lowerBody.includes('custo')) {
      return 'Para informações sobre preços, entre em contato conosco pelo telefone (11) 99999-9999.';
    }

    return null;
  }

  /**
   * Save message to database
   */
  private async saveMessage(data: {
    messageId: string;
    from: string;
    to: string;
    body: string;
    mediaUrl?: string;
    templateName?: string;
    status: string;
    sentAt: Date;
    tenantId?: string;
  }): Promise<void> {
    await prisma.whatsAppMessage.create({
      data: {
        messageId: data.messageId,
        from: data.from,
        to: data.to,
        body: data.body,
        mediaUrl: data.mediaUrl,
        templateName: data.templateName,
        status: data.status,
        sentAt: data.sentAt,
        tenantId: data.tenantId,
      },
    });
  }

  /**
   * Get message statistics
   */
  async getMessageStats(tenantId?: string, startDate?: Date, endDate?: Date): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalRead: number;
    totalFailed: number;
    deliveryRate: number;
    readRate: number;
  }> {
    try {
      const whereClause: any = {};
      if (tenantId) whereClause.tenantId = tenantId;
      if (startDate) whereClause.sentAt = { gte: startDate };
      if (endDate) whereClause.sentAt = { ...whereClause.sentAt, lte: endDate };

      const messages = await prisma.whatsAppMessage.findMany({
        where: whereClause,
        select: { status: true },
      });

      const stats = {
        totalSent: messages.length,
        totalDelivered: messages.filter(m => m.status === 'delivered').length,
        totalRead: messages.filter(m => m.status === 'read').length,
        totalFailed: messages.filter(m => m.status === 'failed').length,
        deliveryRate: 0,
        readRate: 0,
      };

      stats.deliveryRate = stats.totalSent > 0 ? Math.round((stats.totalDelivered / stats.totalSent) * 100) : 0;
      stats.readRate = stats.totalDelivered > 0 ? Math.round((stats.totalRead / stats.totalDelivered) * 100) : 0;

      return stats;
    } catch (error) {
      logger.error('Failed to get message stats', { error: error.message });
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalFailed: 0,
        deliveryRate: 0,
        readRate: 0,
      };
    }
  }

  /**
   * Create WhatsApp template
   */
  async createTemplate(template: WhatsAppTemplate): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      logger.info('Creating WhatsApp template', { name: template.name });

      const createdTemplate = await prisma.whatsAppTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          language: template.language,
          components: template.components,
          status: template.status,
        },
      });

      logger.info('WhatsApp template created successfully', { templateId: createdTemplate.id });
      return { success: true, templateId: createdTemplate.id.toString() };
    } catch (error) {
      logger.error('Failed to create WhatsApp template', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get WhatsApp templates
   */
  async getTemplates(status?: string): Promise<WhatsAppTemplate[]> {
    try {
      const whereClause: any = {};
      if (status) whereClause.status = status;

      const templates = await prisma.whatsAppTemplate.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      return templates.map(template => ({
        name: template.name,
        category: template.category as 'UTILITY' | 'MARKETING' | 'AUTHENTICATION',
        language: template.language,
        components: template.components as any,
        status: template.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAUSED' | 'PENDING_DELETION',
      }));
    } catch (error) {
      logger.error('Failed to get WhatsApp templates', { error: error.message });
      return [];
    }
  }
}

export default WhatsAppService;
