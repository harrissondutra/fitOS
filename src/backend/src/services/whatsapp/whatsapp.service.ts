import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../../config/database';
import twilio from 'twilio';
import { logger } from '../../utils/logger';
import { whatsAppConfigManager } from '../../config/whatsapp.config';
import { CostTrackerService } from '../cost-tracker.service';

const prisma = getPrismaClient();

export interface WhatsAppMessage {
  to: string;
  from?: string;
  body: string;
  tenantId?: string;
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
  private costTracker: CostTrackerService;

  constructor() {
    this.costTracker = new CostTrackerService();
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  /**
   * Send a text message via WhatsApp
   * ⭐ USA CONFIGURAÇÃO CENTRAL - não cria config própria
   */
  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      logger.info('Sending WhatsApp message', { to: message.to, body: message.body });

      // ✅ Obter config central - NÃO criar config própria
      if (!message.tenantId) {
        throw new Error('TenantId é obrigatório para enviar mensagem WhatsApp');
      }

      const config = await whatsAppConfigManager.getConfig(message.tenantId);
      
      if (!config || !config.isActive) {
        throw new Error('WhatsApp não configurado para este tenant');
      }

      // Criar client temporário com config central
      const twilioClient = twilio(config.apiKey, config.apiSecret);

      const twilioMessage = await twilioClient.messages.create({
        body: message.body,
        from: `whatsapp:${config.phoneNumber}`, // ✅ Usa config central
        to: `whatsapp:${message.to}`,
            // Media URL not supported in simplified interface
        statusCallback: `${process.env.API_BASE_URL}/webhooks/whatsapp/status`,
      });

            // Save message to database com schema correto
      await this.saveMessage({
        phone: message.to,
        messageContent: message.body,
        status: 'sent',
        sentAt: new Date(),
        tenantId: message.tenantId,
      });

      // Rastrear custo do envio de mensagem
      try {
        await this.costTracker.trackUsage({
          categoryName: 'communication',
          serviceName: 'whatsapp',
          usage: {
            quantity: 1,
            unit: 'message',
            metadata: {
              to: message.to,
              messageId: twilioMessage.sid,
              type: 'text',
              provider: config.provider,
            },
          },
          tenantId: message.tenantId,
        });
      } catch (error) {
        logger.warn('Failed to track WhatsApp usage cost:', error);
        // Não lançar erro para não quebrar o fluxo
      }

      logger.info('WhatsApp message sent successfully', { messageId: twilioMessage.sid });                                                                      
      return { success: true, messageId: twilioMessage.sid };
    } catch (error: any) {
      logger.error('Failed to send WhatsApp message', { error: error?.message || 'Unknown error', to: message.to });
      return { success: false, error: error?.message || 'Unknown error' };
    }
  }

  /**
   * Send a template message via WhatsApp
   * ⭐ USA CONFIGURAÇÃO CENTRAL
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    templateParams: Record<string, string>,
    tenantId?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      logger.info('Sending WhatsApp template message', { to, templateName });

      if (!tenantId) {
        throw new Error('TenantId é obrigatório');
      }

      // ✅ Obter config central
      const config = await whatsAppConfigManager.getConfig(tenantId);
      
      if (!config || !config.isActive) {
        throw new Error('WhatsApp não configurado para este tenant');
      }

      // Get template from database
      const template = await prisma.whatsAppTemplate.findFirst({
        where: { 
          tenantId,
          name: templateName 
        },
      });

      if (!template) {
        throw new Error(`Template ${templateName} not found`);
      }

      // Replace template parameters
      let body = template.content;
      Object.entries(templateParams).forEach(([key, value]) => {
        body = body.replace(`{{${key}}}`, value);
      });

      // Criar client temporário com config central
      const twilioClient = twilio(config.apiKey, config.apiSecret);

      const twilioMessage = await twilioClient.messages.create({
        body: body,
        from: `whatsapp:${config.phoneNumber}`, // ✅ Usa config central
        to: `whatsapp:${to}`,
        statusCallback: `${process.env.API_BASE_URL}/webhooks/whatsapp/status`,
      });

            // Save message to database com schema correto
      await this.saveMessage({
        phone: to,
        messageContent: body,
        status: 'sent',
        sentAt: new Date(),
        tenantId: tenantId,
      });

      // Rastrear custo do envio de mensagem template
      try {
        await this.costTracker.trackUsage({
          categoryName: 'communication',
          serviceName: 'whatsapp',
          usage: {
            quantity: 1,
            unit: 'message',
            metadata: {
              to,
              messageId: twilioMessage.sid,
              type: 'template',
              templateName,
              provider: config.provider,
            },
          },
          tenantId,
        });
      } catch (error) {
        logger.warn('Failed to track WhatsApp template usage cost:', error);
        // Não lançar erro para não quebrar o fluxo
      }

      logger.info('WhatsApp template message sent successfully', { messageId: twilioMessage.sid });                                                             
      return { success: true, messageId: twilioMessage.sid };
    } catch (error: any) {
      logger.error('Failed to send WhatsApp template message', { error: error?.message || 'Unknown error', to });
      return { success: false, error: error?.message || 'Unknown error' };
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
          tenantId: tenantId || 'default-tenant',
          templateId: 'default-template', // TODO: Use actual template ID
          phone: message.to,
          scheduledFor: scheduledAt,
          status: 'SCHEDULED',
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
          scheduledFor: { lte: now },
        },
        take: 100, // Process in batches
      });

      logger.info('Processing scheduled WhatsApp messages', { count: scheduledMessages.length });

      for (const scheduledMessage of scheduledMessages) {
        try {
          // Get template from database
          const template = await prisma.whatsAppTemplate.findUnique({
            where: { id: scheduledMessage.templateId }
          });
          
          const result = await this.sendMessage({
            to: scheduledMessage.phone,
            body: template?.content || 'Mensagem agendada',
            tenantId: scheduledMessage.tenantId,
          });

          if (result.success) {
            await prisma.whatsAppScheduledMessage.update({
              where: { id: scheduledMessage.id },
              data: { 
                status: 'SENT',
              },
            });
          } else {
            await prisma.whatsAppScheduledMessage.update({
              where: { id: scheduledMessage.id },
              data: { 
                status: 'FAILED',
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
        where: { id: webhook.messageId },
        data: { 
          status: webhook.status,
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
          tenantId: 'default-tenant', // TODO: Get from webhook
          phone: webhook.from,
          message: webhook.body || '',
          status: webhook.status,
        },
      });

      // Auto-reply logic based on keywords
      const autoReply = await this.getAutoReply(webhook.body);
      if (autoReply) {
        await this.sendMessage({
          to: webhook.from,
          body: autoReply,
          tenantId: 'default-tenant',
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
   * ✅ Usa schema correto: phone, message (não to, body)
   */
  private async saveMessage(data: {
    phone: string;
    messageContent: string;
    status: string;
    sentAt: Date;
    tenantId: string;
  }): Promise<void> {
    await prisma.whatsAppMessage.create({
      data: {
        tenantId: data.tenantId,
        phone: data.phone,
        message: data.messageContent,
        status: data.status,
        sentAt: data.sentAt,
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
  async createTemplate(template: WhatsAppTemplate, tenantId?: string): Promise<{ success: boolean; templateId?: string; error?: string }> {
    try {
      logger.info('Creating WhatsApp template', { name: template.name });

      const createdTemplate = await prisma.whatsAppTemplate.create({
        data: {
          tenantId: tenantId || 'default-tenant',
          name: template.name,
          content: JSON.stringify(template.components),
          variables: template.components as any,
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
        category: 'UTILITY' as const,
        language: 'pt_BR',
        components: JSON.parse(template.content),
        status: 'APPROVED' as const,
      }));
    } catch (error) {
      logger.error('Failed to get WhatsApp templates', { error: error.message });
      return [];
    }
  }
}

export default WhatsAppService;
