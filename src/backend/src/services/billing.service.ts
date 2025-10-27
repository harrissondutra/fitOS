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
import Redis from 'ioredis';

interface BillingConfig {
  stripeSecretKey: string;
  stripeWebhookSecret: string;
  mercadoPagoAccessToken: string;
  stripeFeePercentage: number;
  stripeFeeFixed: number;
  mercadoPagoPixFee: number;
  mercadoPagoCardFee: number;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users: number;
    clients: number;
    storage: number; // GB
    apiCalls: number;
  };
}

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
  private useMockData: boolean;

  constructor(private prisma: PrismaClient) {
    this.config = {
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
      stripeFeePercentage: parseFloat(process.env.COST_STRIPE_FEE_PERCENTAGE || '2.9'),
      stripeFeeFixed: parseFloat(process.env.COST_STRIPE_FEE_FIXED || '0.30'),
      mercadoPagoPixFee: parseFloat(process.env.COST_MERCADOPAGO_PIX_FEE || '2.99'),
      mercadoPagoCardFee: parseFloat(process.env.COST_MERCADOPAGO_CARD_FEE || '3.99'),
    };

    this.useMockData = !this.config.stripeSecretKey || !this.config.mercadoPagoAccessToken;

    // Initialize Redis
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    if (!this.useMockData) {
      // Initialize Stripe
      this.stripe = new Stripe(this.config.stripeSecretKey, {
        apiVersion: '2023-10-16',
      });

      // Initialize Mercado Pago
      this.mercadoPago = new MercadoPagoConfig({
        accessToken: this.config.mercadoPagoAccessToken,
      });
      this.payment = new Payment(this.mercadoPago);
      this.preference = new Preference(this.mercadoPago);
    }

    if (this.useMockData) {
      console.log('⚠️  BillingService: Usando dados mockados para desenvolvimento');
    }
  }

  // ========== PLANOS E CONFIGURAÇÕES ==========

  /**
   * Obter planos disponíveis (com cache Redis)
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    const cacheKey = 'billing:plans:all';
    
    try {
      // Tentar buscar do cache primeiro
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Erro ao buscar planos do cache Redis:', error);
    }

    const plans: SubscriptionPlan[] = [
      {
        id: 'starter',
        name: 'Starter',
        price: 99.90,
        currency: 'BRL',
        interval: 'month',
        features: [
          'Até 50 clientes',
          '5 usuários',
          '10GB de armazenamento',
          'Suporte por email',
          'Relatórios básicos'
        ],
        limits: {
          users: 5,
          clients: 50,
          storage: 10,
          apiCalls: 1000
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        price: 199.90,
        currency: 'BRL',
        interval: 'month',
        features: [
          'Até 200 clientes',
          '15 usuários',
          '50GB de armazenamento',
          'Suporte prioritário',
          'Relatórios avançados',
          'Integração WhatsApp',
          'CRM básico'
        ],
        limits: {
          users: 15,
          clients: 200,
          storage: 50,
          apiCalls: 5000
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 399.90,
        currency: 'BRL',
        interval: 'month',
        features: [
          'Clientes ilimitados',
          'Usuários ilimitados',
          '200GB de armazenamento',
          'Suporte 24/7',
          'Relatórios personalizados',
          'Integração completa',
          'CRM avançado',
          'API personalizada'
        ],
        limits: {
          users: -1, // ilimitado
          clients: -1, // ilimitado
          storage: 200,
          apiCalls: -1 // ilimitado
        }
      }
    ];

    // Cache por 1 hora
    try {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(plans));
    } catch (error) {
      console.warn('Erro ao cachear planos no Redis:', error);
    }

    return plans;
  }

  /**
   * Obter plano específico
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const plans = await this.getAvailablePlans();
    return plans.find(plan => plan.id === planId) || null;
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
    if (this.useMockData) {
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

      // Criar price
      const plan = await this.getPlanById(data.planId);
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      const price = await this.stripe.prices.create({
        unit_amount: Math.round(plan.price * 100), // Converter para centavos
        currency: plan.currency.toLowerCase(),
        recurring: {
          interval: plan.interval === 'month' ? 'month' : 'year'
        },
        product_data: {
          name: plan.name
        }
      });

      // Criar subscription
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent']
      });

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret!,
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
    if (this.useMockData) {
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
    if (this.useMockData) {
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
    if (this.useMockData) {
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
    if (this.useMockData) {
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
      const payment = await this.createPIXPayment(
        data.tenantId,
        plan.price,
        `Assinatura ${plan.name} - ${data.billingCycle}`
      );

      // Criar registro no banco
      await this.prisma.subscription.create({
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
    
    const subscription = await this.prisma.subscription.findFirst({
      where: whereClause
    });

    if (!subscription) {
      throw new Error('Assinatura não encontrada');
    }

    const updatedSubscription = await this.prisma.subscription.update({
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

  private async handleStripePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    // Implementar lógica de sucesso do pagamento
    console.log('Pagamento Stripe aprovado:', paymentIntent.id);
  }

  private async handleStripeInvoiceSuccess(invoice: Stripe.Invoice) {
    // Implementar lógica de fatura paga
    console.log('Fatura Stripe paga:', invoice.id);
  }

  private async handleStripeInvoiceFailed(invoice: Stripe.Invoice) {
    // Implementar lógica de falha no pagamento
    console.log('Falha no pagamento Stripe:', invoice.id);
  }

  private async handleStripeSubscriptionUpdated(subscription: Stripe.Subscription) {
    // Implementar lógica de atualização da assinatura
    console.log('Assinatura Stripe atualizada:', subscription.id);
  }

  private async handleStripeSubscriptionDeleted(subscription: Stripe.Subscription) {
    // Implementar lógica de cancelamento da assinatura
    console.log('Assinatura Stripe cancelada:', subscription.id);
  }

  private async handleMercadoPagoPaymentSuccess(payment: any) {
    // Implementar lógica de sucesso do pagamento Mercado Pago
    console.log('Pagamento Mercado Pago aprovado:', payment.id);
  }

  private async handleMercadoPagoPaymentFailed(payment: any) {
    // Implementar lógica de falha no pagamento Mercado Pago
    console.log('Falha no pagamento Mercado Pago:', payment.id);
  }

  // ========== SUBSCRIPTION MANAGEMENT ==========

  /**
   * Obter assinatura do tenant
   */
  async getSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findFirst({
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
    const currentSubscription = await this.prisma.subscription.findFirst({
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
    const updatedSubscription = await this.prisma.subscription.update({
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
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Marcar para cancelar ao final do período
    const updatedSubscription = await this.prisma.subscription.update({
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
    const subscription = await this.prisma.subscription.findFirst({
      where: { tenantId }
    });

    if (!subscription) {
      return [];
    }

    // TODO: Buscar métodos reais do Stripe/Mercado Pago
    return [];
  }
}

