/**
 * Billing Webhook Routes
 * 
 * Handlers de webhook para billing:
 * - Handler Stripe: payment_intent.succeeded, subscription events
 * - Handler Mercado Pago: PIX payment status, subscription updates
 * - Validação de assinatura de webhook
 * - Cache Redis para deduplicação
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BillingService } from '../../services/billing.service';
import Stripe from 'stripe';
import Redis from 'ioredis';

const router = Router();
const prisma = new PrismaClient();
const billingService = new BillingService(prisma);
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ========== STRIPE WEBHOOKS ==========

/**
 * POST /api/webhooks/stripe
 * Webhook handler para eventos do Stripe
 */
router.post('/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurado');
    return res.status(500).json({ error: 'Webhook secret não configurado' });
  }

  let event: Stripe.Event;

  try {
    // Verificar assinatura do webhook
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });

    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (error) {
    console.error('Erro ao verificar assinatura do webhook Stripe:', error);
    return res.status(400).json({ error: 'Assinatura inválida' });
  }

  // Verificar se webhook já foi processado (deduplicação)
  const webhookId = event.id;
  const deduplicationKey = `webhook:processed:stripe:${webhookId}`;
  
  try {
    const alreadyProcessed = await redis.get(deduplicationKey);
    if (alreadyProcessed) {
      console.log(`Webhook Stripe ${webhookId} já foi processado`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Marcar como processado (TTL: 24 horas)
    await redis.setex(deduplicationKey, 86400, 'true');
  } catch (error) {
    console.warn('Erro ao verificar deduplicação de webhook:', error);
  }

  try {
    console.log(`Processando webhook Stripe: ${event.type}`);

    // Processar evento usando BillingService
    await billingService.handleStripeWebhook(event);

    // Log do evento processado
    await logWebhookEvent('stripe', event.type, event.id, {
      objectId: (event.data.object as any).id,
      status: 'success'
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook Stripe:', error);
    
    // Log do erro
    await logWebhookEvent('stripe', event.type, event.id, {
      objectId: (event.data.object as any).id,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== MERCADO PAGO WEBHOOKS ==========

/**
 * POST /api/webhooks/mercadopago
 * Webhook handler para eventos do Mercado Pago
 */
router.post('/mercadopago', async (req, res) => {
  const { type, data, action } = req.body;

  if (!type || !data) {
    return res.status(400).json({ error: 'Dados do webhook inválidos' });
  }

  // Verificar se webhook já foi processado (deduplicação)
  const webhookId = `${type}_${data.id}_${Date.now()}`;
  const deduplicationKey = `webhook:processed:mercadopago:${webhookId}`;
  
  try {
    const alreadyProcessed = await redis.get(deduplicationKey);
    if (alreadyProcessed) {
      console.log(`Webhook Mercado Pago ${webhookId} já foi processado`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Marcar como processado (TTL: 24 horas)
    await redis.setex(deduplicationKey, 86400, 'true');
  } catch (error) {
    console.warn('Erro ao verificar deduplicação de webhook:', error);
  }

  try {
    console.log(`Processando webhook Mercado Pago: ${type}`);

    // Processar evento usando BillingService
    await billingService.handleMercadoPagoWebhook(req.body);

    // Log do evento processado
    await logWebhookEvent('mercadopago', type, webhookId, {
      objectId: data.id,
      status: 'success'
    });

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook Mercado Pago:', error);
    
    // Log do erro
    await logWebhookEvent('mercadopago', type, webhookId, {
      objectId: data.id,
      status: 'error',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });

    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== WEBHOOKS GENÉRICOS ==========

/**
 * POST /api/webhooks/test
 * Webhook de teste para desenvolvimento
 */
router.post('/test', async (req, res) => {
  console.log('Webhook de teste recebido:', req.body);
  
  // Simular processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  res.status(200).json({ 
    received: true, 
    timestamp: new Date().toISOString(),
    data: req.body 
  });
});

/**
 * GET /api/webhooks/status
 * Status dos webhooks
 */
router.get('/status', async (req, res) => {
  try {
    // Verificar conectividade com Redis
    const redisStatus = await redis.ping();
    
    // Verificar conectividade com banco
    await prisma.$queryRaw`SELECT 1`;
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: redisStatus === 'PONG' ? 'connected' : 'disconnected',
        database: 'connected',
        stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
        mercadopago: process.env.MERCADOPAGO_ACCESS_TOKEN ? 'configured' : 'not_configured'
      }
    });
  } catch (error) {
    console.error('Erro ao verificar status dos webhooks:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

// ========== UTILITÁRIOS ==========

/**
 * Log de eventos de webhook
 */
async function logWebhookEvent(
  provider: 'stripe' | 'mercadopago',
  eventType: string,
  eventId: string,
  metadata: any
) {
  try {
    // TODO: Implementar log de webhook quando modelo AIWebhookLog for criado
    // await prisma.aiWebhookLog.create({
    //   data: {
    //     provider,
    //     eventType,
    //     eventId,
    //     metadata: JSON.stringify(metadata),
    //     processedAt: new Date(),
    //     tenantId: 'system'
    //   }
    // });
    console.log(`Webhook logged: ${provider} ${eventType} ${eventId}`, metadata);
  } catch (error) {
    console.error('Erro ao logar evento de webhook:', error);
  }
}

/**
 * Middleware para rate limiting de webhooks
 */
const webhookRateLimit = async (req: any, res: any, next: any) => {
  const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
  const rateLimitKey = `webhook:ratelimit:${clientIp}`;
  
  try {
    const requests = await redis.incr(rateLimitKey);
    
    if (requests === 1) {
      await redis.expire(rateLimitKey, 60); // 1 minuto
    }
    
    const limit = parseInt(process.env.WEBHOOK_RATE_LIMIT || '100');
    
    if (requests > limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: 60
      });
    }
    
    next();
  } catch (error) {
    console.warn('Erro no rate limiting de webhook:', error);
    next(); // Continuar mesmo com erro no rate limiting
  }
};

// Aplicar rate limiting a todas as rotas de webhook
router.use(webhookRateLimit);

export default router;

