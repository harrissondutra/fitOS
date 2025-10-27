import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { getPrismaClient } from '../config/database';
import { cloudinaryCostTracker } from '../services/cloudinary-cost-tracker.service';
import { awsCostTracker } from '../services/aws-cost-tracker.service';
import { aiCostTrackingService } from '../services/ai-cost-tracking.service';
import crypto from 'crypto';

const prisma = getPrismaClient();

interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, any>;
  signature?: string;
  source: string;
}

interface WebhookConfig {
  enabled: boolean;
  rateLimit: number;
  rateLimitWindow: number;
  allowedSources: string[];
  signatureValidation: boolean;
}

export class WebhookService {
  private readonly config: WebhookConfig;
  private readonly ENABLED: boolean;
  private readonly rateLimitMap: Map<string, { count: number; resetTime: number }> = new Map();

  constructor() {
    // Usar variáveis de ambiente (ZERO hardcode)
    this.ENABLED = process.env.COST_TRACKING_ENABLED === 'true';
    
    this.config = {
      enabled: this.ENABLED,
      rateLimit: parseInt(process.env.WEBHOOK_RATE_LIMIT || '100'),
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60'),
      allowedSources: this.parseSources(process.env.WEBHOOK_ALLOWED_SOURCES || 'cloudinary,aws,stripe,mercadopago'),
      signatureValidation: process.env.WEBHOOK_SIGNATURE_VALIDATION === 'true',
    };
  }

  /**
   * Middleware para processar webhooks de custos
   */
  webhookMiddleware() {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        // Verificar rate limiting
        if (!this.checkRateLimit(req.ip || 'unknown')) {
          res.status(429).json({
            error: 'Rate limit exceeded',
            retryAfter: this.config.rateLimitWindow,
          });
          return;
        }

        // Verificar se webhooks estão habilitados
        if (!this.config.enabled) {
          res.status(503).json({
            error: 'Webhooks are disabled',
          });
          return;
        }

        // Determinar fonte do webhook
        const source = this.determineWebhookSource(req);
        if (!this.config.allowedSources.includes(source)) {
          res.status(403).json({
            error: 'Webhook source not allowed',
          });
          return;
        }

        // Validar assinatura se necessário
        if (this.config.signatureValidation && !this.validateSignature(req, source)) {
          res.status(401).json({
            error: 'Invalid signature',
          });
          return;
        }

        // Processar webhook baseado na fonte
        const result = await this.processWebhook(source, req.body, req.headers);

        // Salvar webhook no banco
        await this.saveWebhookLog({
          source,
          event: result.event,
          payload: req.body,
          headers: req.headers,
          ip: req.ip || 'unknown',
          success: result.success,
          error: result.error,
        });

        if (result.success) {
          res.status(200).json({
            success: true,
            message: 'Webhook processed successfully',
            event: result.event,
          });
        } else {
          res.status(400).json({
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        logger.error('Webhook processing failed:', error);
        res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    };
  }

  /**
   * Processa webhook baseado na fonte
   */
  private async processWebhook(
    source: string,
    payload: any,
    headers: Record<string, any>
  ): Promise<{ success: boolean; event: string; error?: string }> {
    try {
      switch (source) {
        case 'cloudinary':
          return await this.processCloudinaryWebhook(payload, headers);
        case 'aws':
          return await this.processAWSWebhook(payload, headers);
        case 'stripe':
          return await this.processStripeWebhook(payload, headers);
        case 'mercadopago':
          return await this.processMercadoPagoWebhook(payload, headers);
        case 'ai':
          return await this.processAIWebhook(payload, headers);
        default:
          return {
            success: false,
            event: 'unknown',
            error: `Unknown webhook source: ${source}`,
          };
      }
    } catch (error) {
      logger.error(`Failed to process ${source} webhook:`, error);
      return {
        success: false,
        event: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processa webhook do Cloudinary
   */
  private async processCloudinaryWebhook(
    payload: any,
    headers: Record<string, any>
  ): Promise<{ success: boolean; event: string; error?: string }> {
    try {
      // Cloudinary envia eventos de uso via webhook
      if (payload.event === 'usage_update') {
        // Forçar atualização dos dados do Cloudinary
        await cloudinaryCostTracker.forceRefresh();
        
        return {
          success: true,
          event: 'usage_update',
        };
      }

      return {
        success: false,
        event: payload.event || 'unknown',
        error: 'Unsupported Cloudinary event',
      };
    } catch (error) {
      return {
        success: false,
        event: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processa webhook do AWS
   */
  private async processAWSWebhook(
    payload: any,
    headers: Record<string, any>
  ): Promise<{ success: boolean; event: string; error?: string }> {
    try {
      // AWS Cost Explorer ou Billing Alerts
      if (payload.event === 'cost_alert' || payload.event === 'billing_alert') {
        // Forçar atualização dos dados do AWS
        await awsCostTracker.forceRefresh();
        
        return {
          success: true,
          event: 'cost_alert',
        };
      }

      return {
        success: false,
        event: payload.event || 'unknown',
        error: 'Unsupported AWS event',
      };
    } catch (error) {
      return {
        success: false,
        event: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processa webhook do Stripe
   */
  private async processStripeWebhook(
    payload: any,
    headers: Record<string, any>
  ): Promise<{ success: boolean; event: string; error?: string }> {
    try {
      const event = payload.type || payload.event;
      
      // Eventos de pagamento do Stripe
      if (event === 'payment_intent.succeeded' || event === 'charge.succeeded') {
        const amount = payload.data?.object?.amount || 0;
        const currency = payload.data?.object?.currency || 'usd';
        
        // Calcular taxa do Stripe
        const feePercentage = parseFloat(process.env.COST_STRIPE_FEE_PERCENTAGE || '2.9');
        const feeFixed = parseFloat(process.env.COST_STRIPE_FEE_FIXED || '0.30');
        const stripeFee = (amount / 100) * (feePercentage / 100) + feeFixed;
        
        // Salvar custo de taxa
        await this.savePaymentCost('stripe', stripeFee, currency, {
          paymentId: payload.data?.object?.id,
          amount: amount / 100,
          event,
        });
        
        return {
          success: true,
          event: 'payment_succeeded',
        };
      }

      return {
        success: false,
        event: event || 'unknown',
        error: 'Unsupported Stripe event',
      };
    } catch (error) {
      return {
        success: false,
        event: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processa webhook do Mercado Pago
   */
  private async processMercadoPagoWebhook(
    payload: any,
    headers: Record<string, any>
  ): Promise<{ success: boolean; event: string; error?: string }> {
    try {
      const event = payload.action || payload.event;
      
      // Eventos de pagamento do Mercado Pago
      if (event === 'payment.created' || event === 'payment.approved') {
        const amount = payload.data?.amount || 0;
        const currency = payload.data?.currency_id || 'brl';
        
        // Calcular taxa do Mercado Pago
        const paymentMethod = payload.data?.payment_method_id;
        let feePercentage = 0;
        
        if (paymentMethod === 'pix') {
          feePercentage = parseFloat(process.env.COST_MERCADOPAGO_PIX_FEE || '2.99');
        } else {
          feePercentage = parseFloat(process.env.COST_MERCADOPAGO_CARD_FEE || '3.99');
        }
        
        const mercadoPagoFee = amount * (feePercentage / 100);
        
        // Salvar custo de taxa
        await this.savePaymentCost('mercadopago', mercadoPagoFee, currency, {
          paymentId: payload.data?.id,
          amount,
          paymentMethod,
          event,
        });
        
        return {
          success: true,
          event: 'payment_approved',
        };
      }

      return {
        success: false,
        event: event || 'unknown',
        error: 'Unsupported Mercado Pago event',
      };
    } catch (error) {
      return {
        success: false,
        event: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Processa webhook de IA
   */
  private async processAIWebhook(
    payload: any,
    headers: Record<string, any>
  ): Promise<{ success: boolean; event: string; error?: string }> {
    try {
      const event = payload.event || 'ai_usage';
      
      if (event === 'ai_usage' && payload.usage) {
        const { model, provider, inputTokens, outputTokens, clientId } = payload.usage;
        
        // Registrar uso de IA
        await aiCostTrackingService.trackUsage({
          clientId: clientId || 'webhook',
          model,
          provider,
          inputTokens,
          outputTokens,
          isCacheHit: payload.usage.isCacheHit || false,
          metadata: {
            source: 'webhook',
            timestamp: payload.timestamp,
          },
        });
        
        return {
          success: true,
          event: 'ai_usage',
        };
      }

      return {
        success: false,
        event: event || 'unknown',
        error: 'Unsupported AI event',
      };
    } catch (error) {
      return {
        success: false,
        event: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Determina a fonte do webhook baseado nos headers e payload
   */
  private determineWebhookSource(req: Request): string {
    const userAgent = req.get('User-Agent') || '';
    const contentType = req.get('Content-Type') || '';
    
    // Verificar headers específicos
    if (req.get('X-Cloudinary-Signature')) return 'cloudinary';
    if (req.get('Stripe-Signature')) return 'stripe';
    if (req.get('X-MercadoPago-Signature')) return 'mercadopago';
    if (req.get('X-AWS-Signature')) return 'aws';
    if (req.get('X-AI-Provider')) return 'ai';
    
    // Verificar User-Agent
    if (userAgent.includes('Cloudinary')) return 'cloudinary';
    if (userAgent.includes('Stripe')) return 'stripe';
    if (userAgent.includes('MercadoPago')) return 'mercadopago';
    if (userAgent.includes('AWS')) return 'aws';
    
    // Verificar payload
    if (req.body?.event?.includes('cloudinary')) return 'cloudinary';
    if (req.body?.type?.includes('stripe')) return 'stripe';
    if (req.body?.action?.includes('payment')) return 'mercadopago';
    if (req.body?.event?.includes('aws')) return 'aws';
    if (req.body?.event?.includes('ai')) return 'ai';
    
    return 'unknown';
  }

  /**
   * Valida assinatura do webhook
   */
  private validateSignature(req: Request, source: string): boolean {
    try {
      const signature = req.get('X-Signature') || req.get('Stripe-Signature') || req.get('X-Cloudinary-Signature');
      if (!signature) return false;

      const secret = this.getWebhookSecret(source);
      if (!secret) return true; // Se não há secret configurado, aceitar

      const payload = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.warn('Signature validation failed:', error);
      return false;
    }
  }

  /**
   * Obtém secret do webhook baseado na fonte
   */
  private getWebhookSecret(source: string): string | null {
    switch (source) {
      case 'stripe':
        return process.env.STRIPE_WEBHOOK_SECRET || null;
      case 'cloudinary':
        return process.env.CLOUDINARY_WEBHOOK_SECRET || null;
      case 'mercadopago':
        return process.env.MERCADOPAGO_WEBHOOK_SECRET || null;
      case 'aws':
        return process.env.AWS_WEBHOOK_SECRET || null;
      default:
        return null;
    }
  }

  /**
   * Verifica rate limiting
   */
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - (this.config.rateLimitWindow * 1000);
    
    const current = this.rateLimitMap.get(ip);
    
    if (!current || current.resetTime < windowStart) {
      this.rateLimitMap.set(ip, { count: 1, resetTime: now });
      return true;
    }
    
    if (current.count >= this.config.rateLimit) {
      return false;
    }
    
    current.count++;
    return true;
  }

  /**
   * Salva custo de pagamento
   */
  private async savePaymentCost(
    provider: string,
    fee: number,
    currency: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      await prisma.costEntry.create({
        data: {
          categoryId: 'payment',
          serviceId: provider,
          amount: fee,
          currency,
          entryType: 'webhook',
          metadata,
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to save payment cost:', error);
      throw error;
    }
  }

  /**
   * Salva log do webhook
   */
  private async saveWebhookLog(data: {
    source: string;
    event: string;
    payload: any;
    headers: Record<string, any>;
    ip: string;
    success: boolean;
    error?: string;
  }): Promise<void> {
    try {
      // Usar AiWebhookLog como proxy para webhook logs
      await prisma.aiWebhookLog.create({
        data: {
          providerId: 'webhook-service',
          direction: 'inbound',
          requestUrl: data.source,
          requestMethod: 'POST',
          requestHeaders: data.headers,
          requestBody: data.payload,
          responseStatus: data.success ? 200 : 400,
          responseBody: { success: data.success, error: data.error },
          error: data.error,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Failed to save webhook log:', error);
      // Não relançar erro para não quebrar o processamento principal
    }
  }

  /**
   * Parse de fontes permitidas
   */
  private parseSources(sourcesStr: string): string[] {
    return sourcesStr
      .split(',')
      .map(source => source.trim())
      .filter(source => source.length > 0);
  }

  /**
   * Obtém estatísticas de webhooks
   */
  async getWebhookStats(
    startDate: Date,
    endDate: Date,
    source?: string
  ): Promise<{
    totalWebhooks: number;
    successRate: number;
    webhooksBySource: Record<string, number>;
    webhooksByEvent: Record<string, number>;
    errorRate: number;
  }> {
    try {
      const where: any = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (source) where.requestUrl = source;

      const webhooks = await prisma.aiWebhookLog.findMany({
        where,
        orderBy: { createdAt: 'asc' },
      });

      const totalWebhooks = webhooks.length;
      const successfulWebhooks = webhooks.filter(w => w.responseStatus && w.responseStatus < 400).length;
      const successRate = totalWebhooks > 0 ? (successfulWebhooks / totalWebhooks) * 100 : 0;
      const errorRate = 100 - successRate;

      const webhooksBySource = webhooks.reduce((acc, webhook) => {
        const source = webhook.requestUrl || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const webhooksByEvent = webhooks.reduce((acc, webhook) => {
        const event = webhook.requestMethod || 'unknown';
        acc[event] = (acc[event] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalWebhooks,
        successRate,
        webhooksBySource,
        webhooksByEvent,
        errorRate,
      };
    } catch (error) {
      logger.error('Failed to get webhook stats:', error);
      throw error;
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): WebhookConfig {
    return { ...this.config };
  }
}

// Exportar instância singleton
export const webhookService = new WebhookService();
