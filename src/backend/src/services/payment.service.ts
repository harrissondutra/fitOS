/**
 * PaymentService - Integração Dual de Pagamentos (VERSÃO MOCKADA)
 * 
 * STRIPE: Usado exclusivamente para assinaturas recorrentes (subscriptions)
 * MERCADO PAGO: Usado para pagamentos únicos/avulsos (PIX, Boleto, Cartão)
 * 
 * NOTA: Esta versão usa dados mockados para desenvolvimento.
 * Para produção, descomentar as importações e implementações reais.
 */

// import Stripe from 'stripe';
// import { MercadoPagoConfig, Payment } from 'mercadopago';

interface StripeSubscriptionDetails {
  subscription: {
    id: string;
    status: 'active' | 'canceled' | 'past_due' | 'trialing';
    current_period_start: Date;
    current_period_end: Date;
    cancel_at_period_end: boolean;
    plan: {
      amount: number;
      currency: string;
      interval: string;
    };
  };
  customer: {
    id: string;
    email: string;
    name: string;
  };
  invoices: Array<{
    id: string;
    amount_paid: number;
    status: string;
    created: Date;
  }>;
  upcomingInvoice: {
    amount_due: number;
    due_date: Date;
  } | null;
}

interface MercadoPagoPaymentDetails {
  id: string;
  status: 'approved' | 'pending' | 'rejected' | 'cancelled';
  status_detail: string;
  transaction_amount: number;
  date_created: Date;
  date_approved?: Date;
  payment_method_id: string;
  payment_type_id: string;
}

export class PaymentService {
  private useMockData: boolean;

  constructor() {
    // Usar mock enquanto não houver credenciais configuradas
    this.useMockData = !process.env.STRIPE_SECRET_KEY || !process.env.MERCADOPAGO_ACCESS_TOKEN;
    
    if (this.useMockData) {
      console.log('⚠️  PaymentService: Usando dados mockados (configure STRIPE_SECRET_KEY e MERCADOPAGO_ACCESS_TOKEN para usar dados reais)');
    }
  }

  // ========== STRIPE - ASSINATURAS RECORRENTES (MOCKADO) ==========

  /**
   * Buscar detalhes completos de uma assinatura Stripe (mockado)
   */
  async getStripeSubscriptionDetails(subscriptionId: string): Promise<StripeSubscriptionDetails> {
    if (this.useMockData) {
      // Retornar dados mockados
      return {
        subscription: {
          id: subscriptionId,
          status: 'active',
          current_period_start: new Date('2024-01-01'),
          current_period_end: new Date('2024-02-01'),
          cancel_at_period_end: false,
          plan: {
            amount: 9900, // R$ 99,00 em centavos
            currency: 'BRL',
            interval: 'month'
          }
        },
        customer: {
          id: 'cus_mock_' + subscriptionId.substring(0, 8),
          email: 'cliente@exemplo.com',
          name: 'Cliente Mockado'
        },
        invoices: [
          {
            id: 'in_mock_1',
            amount_paid: 9900,
            status: 'paid',
            created: new Date('2024-01-01')
          },
          {
            id: 'in_mock_2',
            amount_paid: 9900,
            status: 'paid',
            created: new Date('2023-12-01')
          },
          {
            id: 'in_mock_3',
            amount_paid: 9900,
            status: 'paid',
            created: new Date('2023-11-01')
          }
        ],
        upcomingInvoice: {
          amount_due: 9900,
          due_date: new Date('2024-02-01')
        }
      };
    }

    // TODO: Implementação real do Stripe
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-11-20.acacia' });
    // const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    //   expand: ['customer', 'latest_invoice', 'default_payment_method']
    // });
    // ...

    throw new Error('Stripe não configurado');
  }

  /**
   * Buscar próxima fatura da assinatura
   */
  async getUpcomingInvoice(subscriptionId: string) {
    if (this.useMockData) {
      return {
        amount_due: 9900,
        due_date: new Date('2024-02-01')
      };
    }

    // TODO: Implementação real
    throw new Error('Stripe não configurado');
  }

  /**
   * Cancelar assinatura Stripe (mockado)
   */
  async cancelStripeSubscription(subscriptionId: string, cancelAtPeriodEnd = true) {
    if (this.useMockData) {
      console.log(`[MOCK] Cancelando assinatura ${subscriptionId} (cancel_at_period_end: ${cancelAtPeriodEnd})`);
      return {
        id: subscriptionId,
        cancel_at_period_end: cancelAtPeriodEnd,
        status: 'active'
      };
    }

    // TODO: Implementação real
    throw new Error('Stripe não configurado');
  }

  // ========== MERCADO PAGO - PAGAMENTOS ÚNICOS (MOCKADO) ==========

  /**
   * Buscar detalhes de um pagamento Mercado Pago (mockado)
   */
  async getMercadoPagoPaymentDetails(paymentId: string): Promise<MercadoPagoPaymentDetails> {
    if (this.useMockData) {
      return {
        id: paymentId,
        status: 'approved',
        status_detail: 'accredited',
        transaction_amount: 99.90,
        date_created: new Date('2024-01-15'),
        date_approved: new Date('2024-01-15'),
        payment_method_id: 'pix',
        payment_type_id: 'bank_transfer'
      };
    }

    // TODO: Implementação real
    // const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! });
    // const payment = new Payment(client);
    // return await payment.get({ id: paymentId });

    throw new Error('Mercado Pago não configurado');
  }

  /**
   * Listar pagamentos de um tenant (mockado)
   */
  async getMercadoPagoPaymentsByTenant(tenantId: string): Promise<MercadoPagoPaymentDetails[]> {
    if (this.useMockData) {
      return [
        {
          id: 'mp_mock_1',
          status: 'approved',
          status_detail: 'accredited',
          transaction_amount: 99.90,
          date_created: new Date('2024-01-15'),
          date_approved: new Date('2024-01-15'),
          payment_method_id: 'pix',
          payment_type_id: 'bank_transfer'
        },
        {
          id: 'mp_mock_2',
          status: 'approved',
          status_detail: 'accredited',
          transaction_amount: 149.90,
          date_created: new Date('2023-12-10'),
          date_approved: new Date('2023-12-10'),
          payment_method_id: 'account_money',
          payment_type_id: 'account_money'
        },
        {
          id: 'mp_mock_3',
          status: 'pending',
          status_detail: 'pending_waiting_payment',
          transaction_amount: 199.90,
          date_created: new Date('2024-01-20'),
          payment_method_id: 'bolbradesco',
          payment_type_id: 'ticket'
        }
      ];
    }

    // TODO: Buscar do banco de dados os IDs e então buscar do Mercado Pago
    throw new Error('Mercado Pago não configurado');
  }

  /**
   * Criar pagamento PIX (mockado)
   */
  async createPIXPayment(tenantId: string, amount: number, description: string) {
    if (this.useMockData) {
      const mockPaymentId = `mp_pix_${Date.now()}`;
      return {
        id: mockPaymentId,
        qrCode: '00020126580014br.gov.bcb.pix0136' + mockPaymentId,
        qrCodeBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        expiresAt: new Date(Date.now() + 30 * 60 * 1000)
      };
    }

    // TODO: Implementação real
    throw new Error('Mercado Pago não configurado');
  }

  /**
   * Verificar status de pagamento (mockado)
   */
  async checkPaymentStatus(paymentId: string) {
    if (this.useMockData) {
      return {
        status: 'approved',
        statusDetail: 'accredited',
        amount: 99.90,
        paidAt: new Date()
      };
    }

    // TODO: Implementação real
    throw new Error('Mercado Pago não configurado');
  }
}
