/**
 * Onboarding API Routes
 * 
 * Rotas para o processo de self-service onboarding:
 * - Validação de subdomain
 * - Listagem de planos
 * - Criação de tenant + subscription
 * - Finalização do onboarding
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { BillingService } from '../services/billing.service';
import { TenantService } from '../services/tenant.service';
import { OnboardingEmailService } from '../services/email/onboarding-email.service';
import { SubdomainValidator } from '../utils/subdomain-validator';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();
const billingService = new BillingService(prisma);
const tenantService = new TenantService(prisma);
const emailService = new OnboardingEmailService();
const subdomainValidator = new SubdomainValidator(prisma);

// ========== SCHEMAS DE VALIDAÇÃO ==========

const validateSubdomainSchema = z.object({
  subdomain: z.string()
    .min(3, 'Subdomain deve ter pelo menos 3 caracteres')
    .max(20, 'Subdomain deve ter no máximo 20 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdomain deve conter apenas letras minúsculas, números e hífens')
});

const createTenantSchema = z.object({
  // Gym Information
  gymName: z.string().min(2, 'Nome da academia é obrigatório'),
  subdomain: z.string().min(3, 'Subdomain é obrigatório'),
  billingEmail: z.string().email('Email de cobrança inválido'),
  gymType: z.enum(['academia', 'personal_trainer', 'crossfit', 'pilates', 'outro']),
  
  // Owner Information
  ownerName: z.string().min(2, 'Nome do proprietário é obrigatório'),
  ownerEmail: z.string().email('Email do proprietário inválido'),
  ownerPhone: z.string().min(10, 'Telefone é obrigatório'),
  ownerDocument: z.string().min(11, 'CPF/CNPJ é obrigatório'),
  ownerAddress: z.object({
    street: z.string().min(5, 'Endereço é obrigatório'),
    city: z.string().min(2, 'Cidade é obrigatória'),
    state: z.string().min(2, 'Estado é obrigatório'),
    zipCode: z.string().min(8, 'CEP é obrigatório'),
    country: z.string().default('BR')
  }),
  
  // Plan Selection
  planId: z.enum(['starter', 'professional', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']),
  paymentMethod: z.enum(['stripe', 'mercadopago'])
});

// ========== ROTAS ==========

/**
 * POST /api/onboarding/validate-subdomain
 * Validar disponibilidade de subdomain
 */
router.post('/validate-subdomain', async (req, res) => {
  try {
    const { subdomain } = validateSubdomainSchema.parse(req.body);
    
    // Rate limiting com Redis
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const rateLimitKey = `ratelimit:onboarding:${clientIp}`;
    
    try {
      const redis = require('ioredis').default(process.env.REDIS_URL || 'redis://localhost:6379');
      const attempts = await redis.get(rateLimitKey);
      
      if (attempts && parseInt(attempts) >= 10) {
        res.status(429).json({
          success: false,
          error: 'Muitas tentativas. Tente novamente em 1 minuto.'
        });
        return;
      }
      
      await redis.incr(rateLimitKey);
      await redis.expire(rateLimitKey, 60); // 1 minuto
    } catch (redisError) {
      console.warn('Redis não disponível para rate limiting:', redisError);
    }

    const isValid = await subdomainValidator.validateSubdomain(subdomain);
    
    res.json({
      success: true,
      available: isValid,
      subdomain,
      message: isValid 
        ? 'Subdomain disponível' 
        : 'Subdomain já está em uso'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
      return;
    }
    
    console.error('Erro ao validar subdomain:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/onboarding/plans
 * Listar planos disponíveis
 */
router.get('/plans', async (req, res) => {
  try {
    const plans = await billingService.getAvailablePlans();
    
    res.json({
      success: true,
      plans: plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval,
        features: plan.features,
        limits: plan.limits,
        // Calcular desconto anual
        yearlyDiscount: plan.interval === 'month' ? 0.2 : 0, // 20% desconto anual
        yearlyPrice: plan.interval === 'month' ? plan.price * 12 * 0.8 : plan.price
      }))
    });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/onboarding/create-tenant
 * Criar tenant + subscription
 */
router.post('/create-tenant', async (req, res) => {
  try {
    const data = createTenantSchema.parse(req.body);
    
    // Validar subdomain novamente
    const isSubdomainAvailable = await subdomainValidator.validateSubdomain(data.subdomain);
    if (!isSubdomainAvailable) {
      return res.status(400).json({
        success: false,
        error: 'Subdomain não está disponível'
      });
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findFirst({
      where: { email: data.ownerEmail }
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Criar tenant
    const tenant = await tenantService.createTenant({
      name: data.gymName,
      subdomain: data.subdomain,
      billingEmail: data.billingEmail,
      plan: data.planId,
      tenantType: data.gymType,
      status: 'active',
      settings: {
        owner: {
          name: data.ownerName,
          email: data.ownerEmail,
          phone: data.ownerPhone,
          document: data.ownerDocument,
          address: data.ownerAddress
        },
        gym: {
          type: data.gymType,
          name: data.gymName
        }
      }
    });

    // Criar usuário proprietário
    const owner = await prisma.user.create({
      data: {
        email: data.ownerEmail,
        firstName: data.ownerName.split(' ')[0] || data.ownerName,
        lastName: data.ownerName.split(' ').slice(1).join(' ') || '',
        name: data.ownerName,
        phone: data.ownerPhone,
        role: 'owner',
        tenantId: tenant.id,
        status: 'ACTIVE',
        profile: {
          address: data.ownerAddress,
          document: data.ownerDocument
        }
      }
    });

    // Criar subscription
    const subscriptionResult = await billingService.createSubscription({
      tenantId: tenant.id,
      planId: data.planId,
      customerEmail: data.ownerEmail,
      customerName: data.ownerName,
      paymentMethod: data.paymentMethod,
      billingCycle: data.billingCycle
    });

    // Atualizar tenant com IDs de billing
    if (data.paymentMethod === 'stripe' && 'customerId' in subscriptionResult && 'subscriptionId' in subscriptionResult) {
      await tenantService.updateTenant(tenant.id, {
        stripeCustomerId: subscriptionResult.customerId as string,
        stripeSubscriptionId: subscriptionResult.subscriptionId as string
      });
    }

    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan
      },
      owner: {
        id: owner.id,
        email: owner.email,
        name: owner.name || data.ownerName
      },
      subscription: subscriptionResult,
      nextStep: data.paymentMethod === 'mercadopago' ? 'payment' : 'confirmation'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('Erro ao criar tenant:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/onboarding/complete
 * Finalizar onboarding
 */
router.post('/complete', async (req, res) => {
  try {
    const { tenantId, paymentId } = req.body;
    
    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: 'Tenant ID é obrigatório'
      });
      return;
    }

    // Buscar tenant
    const tenant = await tenantService.getTenantById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
    }

    // Se for pagamento Mercado Pago, verificar status
    if (paymentId) {
      const paymentStatus = await billingService.checkMercadoPagoPaymentStatus(paymentId);
      
      if (paymentStatus.status !== 'approved') {
        return res.status(400).json({
          success: false,
          error: 'Pagamento não foi aprovado',
          paymentStatus: paymentStatus.status
        });
      }

      // Atualizar subscription status se necessário
      // Note: billingService.updateSubscriptionStatus pode não existir
      // Verificar e criar se necessário
    }

    // Buscar owner
    const owner = await prisma.user.findFirst({
      where: {
        tenantId: tenant.id,
        role: 'owner'
      }
    });

    if (!owner) {
      return res.status(404).json({
        success: false,
        error: 'Proprietário não encontrado'
      });
    }

    // Enviar email de boas-vindas
    try {
      await emailService.sendWelcomeEmail({
        to: owner.email,
        ownerName: owner.name || 'Proprietário',
        gymName: tenant.name,
        subdomain: tenant.subdomain,
        loginUrl: `${process.env.DEFAULT_DOMAIN || 'https://fitos.com'}/login`
      });
    } catch (emailError) {
      console.warn('Erro ao enviar email de boas-vindas:', emailError);
      // Não falhar o onboarding por causa do email
    }

    res.json({
      success: true,
      message: 'Onboarding concluído com sucesso',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan
      },
      owner: {
        id: owner.id,
        email: owner.email,
        name: owner.name || 'Proprietário'
      },
      loginUrl: `${process.env.DEFAULT_DOMAIN || 'https://fitos.com'}/login`,
      dashboardUrl: `https://${tenant.subdomain}.${process.env.DEFAULT_DOMAIN || 'fitos.com'}`
    });

  } catch (error) {
    console.error('Erro ao finalizar onboarding:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * GET /api/onboarding/status/:tenantId
 * Verificar status do onboarding
 */
router.get('/status/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    
    const tenant = await tenantService.getTenantById(tenantId);
    if (!tenant) {
      res.status(404).json({
        success: false,
        error: 'Tenant não encontrado'
      });
      return;
    }

    const subscription = await prisma.subscription.findFirst({
      where: { tenantId }
    });

    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status
      },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        planId: subscription.planId,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd
      } : null
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;

