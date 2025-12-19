/**
 * BillingService - Gerenciamento Completo de Assinaturas e Pagamentos
 * 
 * Integração Dual:
 * - STRIPE: Assinaturas recorrentes (subscriptions)
 * - MERCADO PAGO: Pagamentos únicos (PIX, Boleto, Cartão)
 * 
 * Cache Redis implementado para otimização de performance
 */

import Stripe from 'stripe';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { PrismaClient } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';
import Redis from 'ioredis';
import { PaymentCostTrackerService } from './payment-cost-tracker.service';
import { emailService } from './email';

interface BillingConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  mercadoPagoAccessToken: string;
  stripeFeePercentage: number;
  stripeFeeFixed: number;
  mercadoPagoPixFee: number;
  mercadoPagoCardFee: number;
}

import { PlansConfig, SubscriptionPlan } from '../config/plans.config';

interface CreateSubscriptionData {
  tenantId: string;
  planId: string;
  customerEmail: string;
  customerName: string;
  paymentMethod: 'stripe' | 'mercadopago';
  billingCycle: 'monthly' | 'yearly';
}

interface PaymentIntentResult {
  id: string;
  clientSecret?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt: Date;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
}

export class BillingService {
  private stripe: Stripe;
  private mercadoPago: MercadoPagoConfig;
  private payment: Payment;
  private preference: Preference;
  private redis: Redis;
  private config: BillingConfig;
  private useStripeMock: boolean;
  private useMercadoPagoMock: boolean;
  private paymentCostTracker: PaymentCostTrackerService;
  private plansConfig: PlansConfig;

  constructor(private prisma: PrismaClient | PrismaTenantWrapper) {
    this.config = {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
      stripeFeePercentage: parseFloat(process.env.COST_STRIPE_FEE_PERCENTAGE || '2.9'),
      stripeFeeFixed: parseFloat(process.env.COST_STRIPE_FEE_FIXED || '0.30'),
      mercadoPagoPixFee: parseFloat(process.env.COST_MERCADOPAGO_PIX_FEE || '2.99'),
      mercadoPagoCardFee: parseFloat(process.env.COST_MERCADOPAGO_CARD_FEE || '3.99'),
    };

    // Configurar mocks independentemente
    this.useStripeMock = !this.config.stripeSecretKey || this.config.stripeSecretKey.includes('test_mock');
    this.useMercadoPagoMock = !this.config.mercadoPagoAccessToken || this.config.mercadoPagoAccessToken.includes('USR_mock');

    // Initialize Redis
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Initialize Payment Cost Tracker
    this.paymentCostTracker = new PaymentCostTrackerService();

    // Initialize Plans Config
    this.plansConfig = new PlansConfig();

    if (!this.useStripeMock) {
      this.stripe = new Stripe(this.config.stripeSecretKey, {
        apiVersion: '2023-10-16',
      });
    } else {
      console.log('⚠️  BillingService: Stripe usando dados mockados');
    }

    if (!this.useMercadoPagoMock) {
      this.mercadoPago = new MercadoPagoConfig({
        accessToken: this.config.mercadoPagoAccessToken,
      });
      this.payment = new Payment(this.mercadoPago);
      this.preference = new Preference(this.mercadoPago);
    } else {
      console.log('⚠️  BillingService: Mercado Pago usando dados mockados');
    }
  }

  // ========== PLANOS E CONFIGURAÇÕES ==========

  /**
   * Obter planos disponíveis (delegar para PlansConfig)
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    return this.plansConfig.getAllPlans();
  }

  /**
   * Obter plano específico
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    return this.plansConfig.getPlanById(planId);
  }

  // ========== STRIPE - ASSINATURAS RECORRENTES ==========

  /**
   * Criar assinatura Stripe
   */
  async createStripeSubscription(data: CreateSubscriptionData): Promise<{
    subscriptionId: string;
    clientSecret: string;
    customerId: string;
  }> {
    if (this.useStripeMock) {
      return {
        subscriptionId: `sub_mock_${Date.now()}`,
        clientSecret: `pi_mock_${Date.now()}_secret_mock`,
        customerId: `cus_mock_${Date.now()}`
      };
    }

    try {
      // Criar ou buscar customer
      let customer: Stripe.Customer;
      const existingCustomers = await this.stripe.customers.list({
        email: data.customerEmail,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        customer = existingCustomers.data[0];
      } else {
        customer = await this.stripe.customers.create({
          email: data.customerEmail,
          name: data.customerName,
          metadata: {
            tenantId: data.tenantId
          }
        });
      }

      // Criar ou buscar subscription price
      const plan = await this.getPlanById(data.planId);
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      let priceId = '';

      // Tentar usar Price ID configurado
      if (plan.stripePriceId) {
        priceId = data.billingCycle === 'yearly' ? plan.stripePriceId.yearly : plan.stripePriceId.monthly;
      }

      // Se não tiver ID configurado, criar dinamicamente (fallback)
      if (!priceId) {
        console.warn(`⚠️ Warning: No Stripe Price ID found for plan ${plan.id} (${data.billingCycle}). Creating dynamic price.`);
        const price = await this.stripe.prices.create({
          unit_amount: Math.round((data.billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly) * 100), // Converter para centavos
          currency: plan.currency.toLowerCase(),
          recurring: {
            interval: data.billingCycle === 'monthly' ? 'month' : 'year'
          },
          product_data: {
            name: `${plan.name} (${data.billingCycle === 'yearly' ? 'Anual' : 'Mensal'})`
          }
        });
        priceId = price.id;
      }

      // Criar subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customer.id,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      };

      if ((plan as any).trialPeriodDays) {
        subscriptionParams.trial_period_days = (plan as any).trialPeriodDays;
      }

      const subscription = await this.stripe.subscriptions.create(subscriptionParams);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || '', // Pode ser vazio se estiver em trial
        customerId: customer.id
      };
    } catch (error) {
      console.error('Erro ao criar assinatura Stripe:', error);
      throw new Error('Falha ao criar assinatura');
    }
  }

  /**
   * Buscar detalhes da assinatura Stripe
   */
  async getStripeSubscriptionDetails(subscriptionId: string) {
    if (this.useStripeMock) {
      return {
        id: subscriptionId,
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        cancel_at_period_end: false,
        plan: {
          amount: 9990,
          currency: 'brl',
          interval: 'month'
        },
        customer: {
          id: 'cus_mock',
          email: 'cliente@exemplo.com',
          name: 'Cliente Mockado'
        }
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'latest_invoice', 'default_payment_method']
      });

      return subscription;
    } catch (error) {
      console.error('Erro ao buscar assinatura Stripe:', error);
      throw new Error('Assinatura não encontrada');
    }
  }

  /**
   * Cancelar assinatura Stripe
   */
  async cancelStripeSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    if (this.useStripeMock) {
      return {
        id: subscriptionId,
        cancel_at_period_end: cancelAtPeriodEnd,
        status: 'active'
      };
    }

    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd
      });

      return subscription;
    } catch (error) {
      console.error('Erro ao cancelar assinatura Stripe:', error);
      throw new Error('Falha ao cancelar assinatura');
    }
  }

  // ========== MERCADO PAGO - PAGAMENTOS ÚNICOS ==========

  /**
   * Criar pagamento PIX
   */
  async createPIXPayment(tenantId: string, amount: number, description: string): Promise<PaymentIntentResult> {
    if (this.useMercadoPagoMock) {
      const mockPaymentId = `mp_pix_${Date.now()}`;
      return {
        id: mockPaymentId,
        qrCode: '00020126580014br.gov.bcb.pix0136' + mockPaymentId,
        qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        status: 'pending'
      };
    }

    try {
      const preference = await this.preference.create({
        body: {
          items: [
            {
              id: `item-${Date.now()}`,
              title: description,
              quantity: 1,
              unit_price: amount,
              currency_id: 'BRL'
            }
          ],
          payment_methods: {
            excluded_payment_types: [
              { id: 'credit_card' },
              { id: 'debit_card' },
              { id: 'ticket' }
            ],
            installments: 1
          },
          notification_url: `${process.env.BETTER_AUTH_BASE_URL}/api/webhooks/mercadopago`,
          external_reference: tenantId,
          expires: true,
          expiration_date_from: new Date().toISOString(),
          expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }
      });

      // Cache do payment intent
      const cacheKey = `payment:intent:${preference.id}`;
      await this.redis.setex(cacheKey, 1800, JSON.stringify({
        tenantId,
        amount,
        description,
        status: 'pending'
      }));

      return {
        id: preference.id!,
        qrCode: '',
        qrCodeBase64: '',
        expiresAt: new Date(preference.expiration_date_to!),
        status: 'pending'
      };
    } catch (error) {
      console.error('Erro ao criar pagamento PIX:', error);
      throw new Error('Falha ao criar pagamento PIX');
    }
  }

  /**
   * Verificar status do pagamento Mercado Pago
   */
  async checkMercadoPagoPaymentStatus(paymentId: string) {
    if (this.useMercadoPagoMock) {
      return {
        id: paymentId,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 99.90,
        date_created: new Date(),
        date_approved: new Date(),
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer'
      };
    }

    try {
      const payment = await this.payment.get({ id: paymentId });
      return payment;
    } catch (error) {
      console.error('Erro ao verificar status do pagamento:', error);
      throw new Error('Falha ao verificar status do pagamento');
    }
  }

  // ========== GERENCIAMENTO DE ASSINATURAS ==========

  /**
   * Criar nova assinatura (Stripe ou Mercado Pago)
   */
  async createSubscription(data: CreateSubscriptionData) {
    const plan = await this.getPlanById(data.planId);
    if (!plan) {
      throw new Error('Plano não encontrado');
    }

    if (data.paymentMethod === 'stripe') {
      return await this.createStripeSubscription(data);
    } else {
      // Para Mercado Pago, criar pagamento único
      const price = data.billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;
      const payment = await this.createPIXPayment(
        data.tenantId,
        price,
        `Assinatura ${plan.name} - ${data.billingCycle}`
      );

      // Criar registro no banco
      await (this.prisma as any).subscription.create({
        data: {
          tenantId: data.tenantId,
          planId: data.planId,
          status: 'pending',
          mercadoPagoId: payment.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (data.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
          metadata: {}
        }
      });

      return {
        paymentId: payment.id,
        qrCode: payment.qrCode,
        qrCodeBase64: payment.qrCodeBase64,
        expiresAt: payment.expiresAt
      };
    }
  }

  /**
   * Atualizar status da assinatura
   */
  async updateSubscriptionStatus(subscriptionId: string, status: string, provider: 'stripe' | 'mercadopago') {
    const whereClause = provider === 'stripe'
      ? { stripeSubscriptionId: subscriptionId }
      : { mercadoPagoId: subscriptionId };

    const subscription = await (this.prisma as any).subscription.findFirst({
      where: whereClause
    });

    if (!subscription) {
      throw new Error('Assinatura não encontrada');
    }

    const updatedSubscription = await (this.prisma as any).subscription.update({
      where: { id: subscription.id },
      data: {
        status,
        updatedAt: new Date()
      }
    });

    // Invalidar cache do tenant
    await this.invalidateTenantCache(subscription.tenantId);

    return updatedSubscription;
  }

  /**
   * Sincronizar assinatura com Stripe manualmente
   */
  async syncSubscription(tenantId: string) {
    const subscription = await (this.prisma as any).subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      // Se não tiver ID do Stripe, talvez seja MP ou não exista
      if (subscription?.mercadoPagoId && !this.useMercadoPagoMock) {
        // TODO: Implementar sync do mercado pago se necessário
        return subscription;
      }
      if (!subscription) throw new Error('Assinatura não encontrada');
      return subscription;
    }

    if (this.useStripeMock) {
      return subscription;
    }

    try {
      const stripeSubscription = await this.stripe.subscriptions.retrieve(subscription.stripeSubscriptionId);

      const updated = await (this.prisma as any).subscription.update({
        where: { id: subscription.id },
        data: {
          status: stripeSubscription.status,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
          updatedAt: new Date()
        }
      });

      if (updated.status === 'active') {
        await this.activateTenantSubscription(tenantId, subscription.planId);
      }

      return updated;
    } catch (error) {
      console.error('Erro ao sincronizar assinatura:', error);
      throw new Error('Falha ao sincronizar com Stripe');
    }
  }

  // ========== CACHE MANAGEMENT ==========

  /**
   * Invalidar cache do tenant
   */
  private async invalidateTenantCache(tenantId: string) {
    try {
      const keys = await this.redis.keys(`tenant:${tenantId}:*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.warn('Erro ao invalidar cache do tenant:', error);
    }
  }

  /**
   * Ativar assinatura do tenant
   */
  private async activateTenantSubscription(tenantId: string, planId: string) {
    try {
      // Atualizar Tenant
      await (this.prisma as any).tenant.update({
        where: { id: tenantId },
        data: {
          plan: planId,
          status: 'ACTIVE',
          subscriptionStatus: 'ACTIVE'
        }
      });

      // Invalidar cache
      await this.invalidateTenantCache(tenantId);

      console.log(`Tenant ${tenantId} activated with plan ${planId}`);
    } catch (error) {
      console.error(`Erro ao ativar tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidar cache de planos
   */
  async invalidatePlansCache() {
    try {
      await this.redis.del('billing:plans:all');
    } catch (error) {
      console.warn('Erro ao invalidar cache de planos:', error);
    }
  }

  // ========== WEBHOOK HANDLERS ==========

  /**
   * Processar webhook Stripe
   */
  async handleStripeWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handleStripePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'checkout.session.completed':
          await this.handleStripeCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'invoice.payment_succeeded':
          await this.handleStripeInvoiceSuccess(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handleStripeInvoiceFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleStripeSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleStripeSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        case 'charge.refunded':
          await this.handleStripeChargeRefunded(event.data.object as Stripe.Charge);
          break;
        case 'customer.updated':
          await this.handleStripeCustomerUpdated(event.data.object as Stripe.Customer);
          break;
        case 'customer.subscription.trial_will_end':
          await this.handleStripeTrialWillEnd(event.data.object as Stripe.Subscription);
          break;
        case 'charge.dispute.created':
          await this.handleStripeChargeDisputeCreated(event.data.object as Stripe.Dispute);
          break;
        case 'charge.dispute.closed':
          await this.handleStripeChargeDisputeClosed(event.data.object as Stripe.Dispute);
          break;
        case 'invoice.upcoming':
          console.log(`Próxima fatura gerada para ${event.data.object.customer}`);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar webhook Stripe:', error);
      throw error;
    }
  }

  /**
   * Processar webhook Mercado Pago
   */
  async handleMercadoPagoWebhook(data: any) {
    try {
      if (data.type === 'payment') {
        const payment = await this.checkMercadoPagoPaymentStatus(data.data.id);

        if (payment.status === 'approved') {
          await this.handleMercadoPagoPaymentSuccess(payment);
        } else if (payment.status === 'rejected') {
          await this.handleMercadoPagoPaymentFailed(payment);
        }
      }
    } catch (error) {
      console.error('Erro ao processar webhook Mercado Pago:', error);
      throw error;
    }
  }

  // ========== WEBHOOK HANDLERS PRIVADOS ==========

  private async handleStripeCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log('Finalizando Checkout Session:', session.id);
    const { planId, interval } = session.metadata || {};
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || 'Cliente';
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (!email || !planId) {
      console.error('Dados incompletos no webhook checkout.session.completed');
      return;
    }

    try {
      // Encontrar ou criar usuário
      let user = await (this.prisma as any).user.findUnique({ where: { email } });
      let tenantId = '';

      if (!user) {
        // Criar tenant e usuário juntos
        console.log('Criando novo usuário e tenant via webhook:', email);
        const newTenant = await (this.prisma as any).tenant.create({
          data: {
            name: `Assinatura de ${name.split(' ')[0]}`,
            subdomain: email.split('@')[0] + '-' + Date.now().toString(36).substring(0, 8),
            billingEmail: email,
            users: {
              create: {
                email,
                name,
                password: '', // Sem senha, redefinir depois
                role: 'OWNER' // Admin do tenant
              }
            }
          },
          include: {
            users: true
          }
        });
        tenantId = newTenant.id;
        // user = newTenant.users[0]; // (Opcional se precisar do objeto user depois)
      } else {
        // Usuário existe
        if (user.tenantId) {
          // Já tem tenant. Usar o existente.
          // TODO: Talvez verificar se o tenant está ativo?
          tenantId = user.tenantId;
          console.log(`Usuário já possui tenant: ${tenantId}`);
        } else {
          // Usuário existe mas não tem tenant. Criar um.
          console.log('Usuário existente sem tenant. Criando tenant...');
          const newTenant = await (this.prisma as any).tenant.create({
            data: {
              name: `Workspace de ${name.split(' ')[0]}`,
              subdomain: email.split('@')[0] + '-' + Date.now().toString(36).substring(0, 8),
              billingEmail: email,
              users: {
                connect: { id: user.id }
              }
            }
          });
          tenantId = newTenant.id;

          // Garantir que o usuário seja OWNER
          await (this.prisma as any).user.update({
            where: { id: user.id },
            data: { role: 'OWNER' }
          });
        }
      }

      console.log(`Vinculando assinatura ${stripeSubscriptionId} ao tenant ${tenantId}`);

      // Garantir que o plano existe no banco
      const dbPlan = await (this.prisma as any).subscriptionPlan.findUnique({
        where: { id: planId }
      });

      if (!dbPlan) {
        console.log(`Plano ${planId} não encontrado no banco. Criando automaticamente...`);
        await (this.prisma as any).subscriptionPlan.create({
          data: {
            id: planId,
            name: planId.charAt(0).toUpperCase() + planId.slice(1),
            displayName: planId.charAt(0).toUpperCase() + planId.slice(1),
            price: 0, // Preço será atualizado via sincronização ou config
            interval: interval || 'monthly',
            isActive: true
          }
        });
      }

      // Atualizar customer ID no tenant
      await (this.prisma as any).tenant.update({
        where: { id: tenantId },
        data: { stripeCustomerId: stripeCustomerId }
      });

      const subscriptionData = {
        tenantId: tenantId,
        planId: planId,
        status: 'active',
        stripeSubscriptionId: stripeSubscriptionId,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
        metadata: {
          billingCycle: interval === 'yearly' ? 'yearly' : 'monthly',
          provider: 'stripe'
        }
      };

      const existingSub = await (this.prisma as any).subscription.findFirst({
        where: { tenantId }
      });

      if (existingSub) {
        await (this.prisma as any).subscription.update({
          where: { id: existingSub.id },
          data: subscriptionData
        });
      } else {
        await (this.prisma as any).subscription.create({
          data: subscriptionData
        });
      }

      // Notificar Admin
      try {
        await emailService.sendAdminNotification({
          name: name,
          email: email,
          plan: planId,
          interval: interval || 'monthly',
          amount: 'R$ ' + ((dbPlan?.price || 0)).toFixed(2) // Assumindo preço no plano
        });
        console.log('Admin notificado sobre nova assinatura');
      } catch (err) {
        console.error('Erro ao notificar admin:', err);
      }

      // Enviar email de boas-vindas ao usuário
      try {
        // Gerar token de login se necessário ou apenas link para login
        const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
        await emailService.sendWelcomeEmail(email, name.split(' ')[0], loginUrl);
        console.log('Email de boas-vindas enviado para:', email);
      } catch (err) {
        console.error('Erro ao enviar email de boas-vindas:', err);
      }

      console.log('Assinatura e Tenant processados com sucesso via Webhook');

    } catch (e) {
      console.error('Erro ao processar checkout.session.completed:', e);
      throw e;
    }
  }

  private async handleStripePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Implementar lógica de sucesso do pagamento
    console.log('Pagamento Stripe aprovado:', paymentIntent.id);

    // Rastrear custo da taxa de pagamento
    try {
      const paymentMethod = paymentIntent.payment_method_types?.[0] || 'card';
      const amount = (paymentIntent.amount || 0) / 100; // Converter de centavos para valor real
      const currency = paymentIntent.currency?.toUpperCase() || 'BRL';

      await this.paymentCostTracker.trackPaymentFee({
        provider: 'stripe',
        paymentMethod: paymentMethod === 'card' ? 'card' : 'card', // Stripe geralmente usa card
        amount,
        currency,
        paymentId: paymentIntent.id,
        metadata: {
          customerId: paymentIntent.customer,
          description: paymentIntent.description,
          metadata: paymentIntent.metadata,
        },
      });
    } catch (error) {
      console.error('Erro ao rastrear custo de pagamento Stripe:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }

  private async handleStripeInvoiceSuccess(invoice: Stripe.Invoice) {
    // Implementar lógica de fatura paga
    console.log('Fatura Stripe paga:', invoice.id);

    try {
      const subscriptionId = invoice.subscription as string;
      if (subscriptionId) {
        // Buscar assinatura local
        const subscription = await (this.prisma as any).subscription.findFirst({
          where: { stripeSubscriptionId: subscriptionId }
        });

        if (subscription) {
          // Atualizar assinatura
          await (this.prisma as any).subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'active',
              currentPeriodStart: new Date(invoice.period_start * 1000),
              currentPeriodEnd: new Date(invoice.period_end * 1000),
              updatedAt: new Date()
            }
          });

          // Ativar tenant
          await this.activateTenantSubscription(subscription.tenantId, subscription.planId);
        }
      }
    } catch (error) {
      console.error('Erro ao processar sucesso de fatura Stripe:', error);
    }

    // Rastrear custo da taxa da fatura (se não foi rastreado no payment_intent)
    try {
      if (invoice.amount_paid && invoice.currency) {
        const amount = invoice.amount_paid / 100; // Converter de centavos
        const currency = invoice.currency.toUpperCase();

        // Verificar se já foi rastreado via payment_intent
        // Se não houver payment_intent, rastrear pela fatura
        if (!invoice.payment_intent) {
          await this.paymentCostTracker.trackPaymentFee({
            provider: 'stripe',
            paymentMethod: 'card',
            amount,
            currency,
            paymentId: invoice.id,
            metadata: {
              customerId: invoice.customer,
              subscriptionId: invoice.subscription,
              invoiceNumber: invoice.number,
            },
          });
        }
      }
    } catch (error) {
      console.error('Erro ao rastrear custo de fatura Stripe:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }

  private async handleStripeInvoiceFailed(invoice: Stripe.Invoice) {
    // Implementar lógica de falha no pagamento
    console.log('Falha no pagamento Stripe:', invoice.id);
  }

  private async handleStripeSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Implementar lógica de atualização da assinatura
    console.log(`Assinatura Stripe atualizada: ${subscription.id} - Status: ${subscription.status}`);

    try {
      const localSubscription = await (this.prisma as any).subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id }
      });

      if (localSubscription) {
        await (this.prisma as any).subscription.update({
          where: { id: localSubscription.id },
          data: {
            status: subscription.status,
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updatedAt: new Date()
          }
        });

        // Se ativa ou em trial, garantir que tenant está ativo
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await this.activateTenantSubscription(localSubscription.tenantId, localSubscription.planId);
        }
      } else if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Se a assinatura não existe localmente mas está ativa/trialing, 
        // significa que foi criada via Elements e precisamos provisionar o tenant agora.
        console.log('Nova assinatura detectada via webhook (Elementos). Provisionando...');

        // Buscar cliente para obter email e nome
        const customer = await this.stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;

        await this.handleNewSubscriptionProvisioning({
          email: customer.email!,
          name: customer.name || customer.email!.split('@')[0],
          planId: subscription.metadata.planId,
          interval: subscription.metadata.interval,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: customer.id,
          status: subscription.status
        });
      }
    } catch (error) {
      console.error('Erro ao processar atualização de assinatura Stripe:', error);
    }
  }

  /**
   * Helper para provisionar tenant, usuário e assinatura quando uma nova assinatura é confirmada
   */
  private async handleNewSubscriptionProvisioning(data: {
    email: string;
    name: string;
    planId: string;
    interval: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string;
    status: string;
  }) {
    const { email, name, planId, interval, stripeSubscriptionId, stripeCustomerId, status } = data;

    try {
      // 1. Encontrar ou criar usuário
      let user = await (this.prisma as any).user.findUnique({ where: { email } });
      let tenantId = '';

      if (!user) {
        console.log('Criando novo usuário e tenant para assinatura:', email);
        const newTenant = await (this.prisma as any).tenant.create({
          data: {
            name: `Assinatura de ${name.split(' ')[0]}`,
            subdomain: email.split('@')[0] + '-' + Math.random().toString(36).substring(0, 5),
            billingEmail: email,
            stripeCustomerId: stripeCustomerId,
            users: {
              create: {
                email,
                name,
                password: '', // Sem senha, redefinir depois
                role: 'OWNER'
              }
            }
          }
        });
        tenantId = newTenant.id;

        // SINCRO COM DASHBOARD DO STRIPE: Atualizar cliente com informações do Tenant
        try {
          await this.stripe.customers.update(stripeCustomerId, {
            name: name,
            metadata: {
              tenantId: tenantId,
              subdomain: newTenant.subdomain,
              userEmail: email,
              provisionedAt: new Date().toISOString()
            }
          });
        } catch (err) {
          console.error('Erro ao sincronizar metadados do cliente no Stripe:', err);
        }
      } else {
        if (!user.tenantId) {
          const newTenant = await (this.prisma as any).tenant.create({
            data: {
              name: `Workspace de ${name.split(' ')[0]}`,
              subdomain: email.split('@')[0] + '-' + Math.random().toString(36).substring(0, 5),
              billingEmail: email,
              stripeCustomerId: stripeCustomerId,
            }
          });
          tenantId = newTenant.id;
          await (this.prisma as any).user.update({
            where: { id: user.id },
            data: { tenantId, role: 'OWNER' }
          });
        } else {
          tenantId = user.tenantId;
          // Atualizar stripeCustomerId no tenant se necessário
          const updatedTenant = await (this.prisma as any).tenant.update({
            where: { id: tenantId },
            data: { stripeCustomerId }
          });

          // SINCRO COM DASHBOARD DO STRIPE: Atualizar cliente existente
          try {
            await this.stripe.customers.update(stripeCustomerId, {
              metadata: {
                tenantId: tenantId,
                subdomain: updatedTenant.subdomain,
                updatedAt: new Date().toISOString()
              }
            });
          } catch (err) {
            console.error('Erro ao sincronizar metadados do cliente existente no Stripe:', err);
          }
        }
      }

      // 2. Criar ou atualizar assinatura local
      const plan = await (this.prisma as any).subscriptionPlan.findFirst({
        where: { id: planId }
      });

      if (!plan) {
        // Garantir que o plano existe (fallback de segurança)
        await (this.prisma as any).subscriptionPlan.create({
          data: {
            id: planId,
            name: planId.toUpperCase(),
            displayName: planId.charAt(0).toUpperCase() + planId.slice(1),
            price: 0,
            interval: interval || 'monthly'
          }
        });
      }

      await (this.prisma as any).subscription.create({
        data: {
          tenantId,
          planId,
          status: status,
          provider: 'stripe',
          stripeSubscriptionId: stripeSubscriptionId,
          billingCycle: interval === 'yearly' ? 'yearly' : 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + (interval === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000),
          metadata: {
            billingCycle: interval === 'yearly' ? 'yearly' : 'monthly',
            provider: 'stripe'
          }
        }
      });

      // 3. Ativar tenant
      await this.activateTenantSubscription(tenantId, planId);

      // 4. NOTIFICAÇÃO DE GESTÃO (Administrativa)
      try {
        await emailService.sendAdminNotification({
          email,
          name,
          plan: planId,
          interval: interval,
          amount: interval === 'yearly' ? 'R$ 799,20+' : 'R$ 99,90+' // Valores base aproximados
        });
        console.log('Notificação administrativa enviada para:', email);
      } catch (err) {
        console.error('Erro ao enviar notificação administrativa:', err);
      }

    } catch (e) {
      console.error('Erro no provisionamento de nova assinatura:', e);
      throw e;
    }
  }

  private async handleStripeSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Implementar lógica de cancelamento da assinatura
    console.log('Assinatura Stripe cancelada:', subscription.id);
  }

  private async handleMercadoPagoPaymentSuccess(payment: any) {
    // Implementar lógica de sucesso do pagamento Mercado Pago
    console.log('Pagamento Mercado Pago aprovado:', payment.id);

    try {
      // Buscar assinatura pelo ID do pagamento (armazenado como mercadoPagoId)
      const subscription = await (this.prisma as any).subscription.findFirst({
        where: { mercadoPagoId: payment.id.toString() }
      });

      if (subscription) {
        await (this.prisma as any).subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'active',
            updatedAt: new Date()
          }
        });

        await this.activateTenantSubscription(subscription.tenantId, subscription.planId);
      }
    } catch (error) {
      console.error('Erro ao processar sucesso de pagamento Mercado Pago:', error);
    }

    // Rastrear custo da taxa de pagamento
    try {
      const paymentMethodType = payment.payment_method_id || payment.payment_type_id || 'pix';
      const amount = payment.transaction_amount || 0;
      const currency = payment.currency_id?.toUpperCase() || 'BRL';

      // Determinar método de pagamento
      let paymentMethod: 'pix' | 'card' | 'debit_card' | 'credit_card' | 'ticket' = 'pix';
      if (paymentMethodType === 'pix' || paymentMethodType === 'bank_transfer') {
        paymentMethod = 'pix';
      } else if (paymentMethodType === 'credit_card') {
        paymentMethod = 'credit_card';
      } else if (paymentMethodType === 'debit_card') {
        paymentMethod = 'debit_card';
      } else if (paymentMethodType === 'ticket') {
        paymentMethod = 'ticket';
      } else {
        paymentMethod = 'card'; // Fallback
      }

      await this.paymentCostTracker.trackPaymentFee({
        provider: 'mercadopago',
        paymentMethod,
        amount,
        currency,
        paymentId: payment.id?.toString() || payment.id,
        metadata: {
          status: payment.status,
          statusDetail: payment.status_detail,
          externalReference: payment.external_reference,
          dateCreated: payment.date_created,
          dateApproved: payment.date_approved,
        },
      });
    } catch (error) {
      console.error('Erro ao rastrear custo de pagamento Mercado Pago:', error);
      // Não lançar erro para não quebrar o fluxo
    }
  }

  private async handleMercadoPagoPaymentFailed(payment: any) {
    console.log('Falha no pagamento Mercado Pago:', payment.id);
  }

  // ========== NOVOS HANDLERS DE COBERTURA 100% ==========

  private async handleStripeChargeRefunded(charge: Stripe.Charge) {
    console.log(`Reembolso Stripe processado: ${charge.id}, Valor: ${charge.amount_refunded}`);

    try {
      const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
      if (!customerId) return;

      // Buscar usuário para notificar
      const user = await (this.prisma as any).user.findFirst({
        where: { tenant: { stripeCustomerId: customerId } }
      });

      if (user && user.email) {
        const amount = (charge.amount_refunded / 100).toLocaleString('pt-BR', { style: 'currency', currency: charge.currency });
        await emailService.sendRefundIssuedEmail(user.email, user.name, amount);
        console.log(`Notificação de reembolso enviada para ${user.email}`);
      }
    } catch (e) {
      console.error('Erro ao processar reembolso:', e);
    }
  }

  private async handleStripeCustomerUpdated(stripeCustomer: Stripe.Customer) {
    console.log(`Cliente Stripe atualizado: ${stripeCustomer.id}`);

    // Opcional: Sincronizar dados de volta para o Tenant se a fonte da verdade for o Stripe
    // Por enquanto, apenas logamos, pois geralmente o app é a fonte da verdade.
  }

  private async handleStripeTrialWillEnd(subscription: Stripe.Subscription) {
    console.log(`Periodo de teste acabando para ${subscription.id}`);

    try {
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
      if (!customerId) return;

      const user = await (this.prisma as any).user.findFirst({
        where: { tenant: { stripeCustomerId: customerId } }
      });

      if (user && user.email) {
        const endDate = new Date(subscription.trial_end! * 1000).toLocaleDateString('pt-BR');
        const planName = subscription.items?.data[0]?.price?.product || 'Plano Pro'; // Simplificação

        await emailService.sendTrialEndingEmail(user.email, user.name, (planName as string), endDate);
        console.log(`Aviso de fim de trial enviado para ${user.email}`);
      }
    } catch (e) {
      console.error('Erro ao processar fim de trial:', e);
    }
  }

  private async handleStripeChargeDisputeCreated(dispute: Stripe.Dispute) {
    console.warn(`⚠️ DISPUTA CRIADA: ${dispute.id} - Motivo: ${dispute.reason}`);

    // Notificar Admin imediatamente
    const adminEmail = process.env.CONTACT_SALES_EMAIL || 'sistudofitness@gmail.com';
    await emailService.sendEmail({
      to: adminEmail,
      subject: `⚠️ ALERTA DE CHARGEBACK: ${dispute.amount / 100} ${dispute.currency}`,
      text: `Uma disputa foi aberta. ID: ${dispute.id}. Motivo: ${dispute.reason}. Verifique o painel do Stripe imediatamente.`
    });
  }

  private async handleStripeChargeDisputeClosed(dispute: Stripe.Dispute) {
    console.log(`Disputa fechada: ${dispute.id} - Status: ${dispute.status}`);
  }

  // ========== SUBSCRIPTION MANAGEMENT ==========

  /**
   * Obter assinatura do tenant
   */
  async getSubscription(tenantId: string) {
    const subscription = await (this.prisma as any).subscription.findFirst({
      where: { tenantId },
      include: {
        plan: true
      }
    });

    if (!subscription) {
      return null;
    }

    const planLimits = subscription.plan?.limits as any;

    return {
      id: subscription.id,
      status: subscription.status,
      planId: subscription.planId,
      planName: subscription.plan?.name || '',
      price: subscription.plan?.price || 0,
      billingPeriod: subscription.plan?.interval || 'monthly',
      currentPeriodStart: subscription.currentPeriodStart,
      currentPeriodEnd: subscription.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      usage: {
        users: 0, // TODO: Implementar contagem real
        usersLimit: planLimits?.users || 0,
        clients: 0, // TODO: Implementar contagem real
        clientsLimit: planLimits?.clients || 0,
        storageGB: 0, // TODO: Implementar contagem real
        storageLimitGB: planLimits?.storage || 0
      }
    };
  }

  /**
   * Upgrade de plano
   */
  async upgradePlan(tenantId: string, newPlanId: string, billingCycle?: string, userId?: string) {
    // Buscar plano atual
    const currentSubscription = await (this.prisma as any).subscription.findFirst({
      where: { tenantId },
      include: { plan: true }
    });

    if (!currentSubscription) {
      throw new Error('Subscription not found');
    }

    // Buscar novo plano do banco (já temos getPlanById que busca dos planos estáticos)
    const newPlan = await this.getPlanById(newPlanId);

    if (!newPlan) {
      throw new Error('Plan not found');
    }

    // Calcular prorata
    // TODO: Implementar cálculo de prorata

    // Atualizar assinatura
    const updatedSubscription = await (this.prisma as any).subscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId: newPlanId,
        updatedAt: new Date()
      }
    });

    // Invalidar cache
    await this.invalidateTenantCache(tenantId);

    return updatedSubscription;
  }

  /**
   * Downgrade de plano
   */
  async downgradePlan(tenantId: string, newPlanId: string, userId?: string) {
    return await this.upgradePlan(tenantId, newPlanId, undefined, userId);
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(tenantId: string, reason: string, feedback?: string, userId?: string) {
    const subscription = await (this.prisma as any).subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Marcar para cancelar ao final do período
    const updatedSubscription = await (this.prisma as any).subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        updatedAt: new Date()
      }
    });

    // Invalidar cache
    await this.invalidateTenantCache(tenantId);

    return updatedSubscription;
  }

  /**
   * Obter faturas do tenant
   */
  async getInvoices(tenantId: string, options: { page: number; limit: number }) {
    const skip = (options.page - 1) * options.limit;

    // TODO: Implementar quando modelo Invoice tiver tenantId
    const [invoices, total] = await Promise.all([
      this.prisma.$queryRaw`SELECT * FROM invoices WHERE tenant_id = ${tenantId} LIMIT ${options.limit} OFFSET ${skip}` as Promise<any[]>,
      this.prisma.$queryRaw`SELECT COUNT(*) FROM invoices WHERE tenant_id = ${tenantId}` as Promise<[{ count: bigint }]>
    ]);

    return {
      items: invoices,
      total: Number(total[0].count),
      page: options.page,
      limit: options.limit,
      hasMore: skip + invoices.length < Number(total[0].count)
    };
  }

  /**
   * Obter métodos de pagamento do tenant
   */
  async getPaymentMethods(tenantId: string) {
    const subscription = await (this.prisma as any).subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription) {
      return [];
    }

    // TODO: Buscar métodos reais do Stripe/Mercado Pago
    return [];
  }
}

