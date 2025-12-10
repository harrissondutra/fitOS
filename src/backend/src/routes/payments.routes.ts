/**
 * Payment API Routes
 * 
 * Rotas para processamento de pagamentos:
 * - Stripe: create-payment-intent, check-status, cancel-payment
 * - Mercado Pago: create-payment, check-status, cancel-payment
 */

import { Router } from 'express';
import { getPrismaClient } from '../config/database';
import { BillingService } from '../services/billing.service';
import { z } from 'zod';

const router = Router();
const prisma = getPrismaClient();
const billingService = new BillingService(prisma);

// ========== SCHEMAS DE VALIDAÇÃO ==========

const stripePaymentSchema = z.object({
  amount: z.number().min(1, 'Valor deve ser maior que zero'),
  currency: z.string().min(3, 'Moeda é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  cardData: z.object({
    number: z.string().min(13, 'Número do cartão inválido'),
    expiry: z.string().min(4, 'Data de expiração inválida'),
    cvc: z.string().min(3, 'CVV inválido'),
    name: z.string().min(2, 'Nome no cartão é obrigatório')
  })
});

const mercadoPagoPaymentSchema = z.object({
  amount: z.number().min(1, 'Valor deve ser maior que zero'),
  currency: z.string().min(3, 'Moeda é obrigatória'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  paymentMethod: z.enum(['pix', 'credit_card', 'debit_card', 'ticket'])
});

const checkStatusSchema = z.object({
  paymentId: z.string().min(1, 'ID do pagamento é obrigatório')
});

// ========== STRIPE ROUTES ==========

/**
 * POST /api/payments/stripe/create-payment-intent
 * Criar payment intent no Stripe
 */
router.post('/stripe/create-payment-intent', async (req, res) => {
  try {
    const data = stripePaymentSchema.parse(req.body);

    // Simular criação de payment intent (substituir por implementação real)
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_mock`,
      status: 'requires_payment_method',
      amount: Math.round(data.amount * 100), // Converter para centavos
      currency: data.currency.toLowerCase()
    };

    res.json({
      success: true,
      paymentIntent: mockPaymentIntent
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao criar payment intent Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/payments/stripe/check-status
 * Verificar status do payment intent
 */
router.post('/stripe/check-status', async (req, res) => {
  try {
    const { paymentId } = checkStatusSchema.parse(req.body);

    // Simular verificação de status (substituir por implementação real)
    const mockStatus = {
      id: paymentId,
      status: 'succeeded', // ou 'pending', 'failed'
      amount: 9990,
      currency: 'brl',
      client_secret: `pi_mock_${paymentId}_secret_mock`
    };

    res.json({
      success: true,
      status: mockStatus.status,
      paymentIntent: mockStatus
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao verificar status Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/payments/stripe/cancel-payment
 * Cancelar payment intent
 */
router.post('/stripe/cancel-payment', async (req, res) => {
  try {
    const { paymentId } = checkStatusSchema.parse(req.body);

    // Simular cancelamento (substituir por implementação real)
    const mockCancelled = {
      id: paymentId,
      status: 'canceled',
      cancelled_at: new Date().toISOString()
    };

    res.json({
      success: true,
      paymentIntent: mockCancelled
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao cancelar payment Stripe:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========== MERCADO PAGO ROUTES ==========

/**
 * POST /api/payments/mercadopago/create-payment
 * Criar pagamento no Mercado Pago
 */
router.post('/mercadopago/create-payment', async (req, res) => {
  try {
    const data = mercadoPagoPaymentSchema.parse(req.body);

    // Simular criação de pagamento (substituir por implementação real)
    const mockPayment = {
      id: `mp_mock_${Date.now()}`,
      status: data.paymentMethod === 'pix' ? 'pending' : 'approved',
      qrCode: data.paymentMethod === 'pix' ? `00020126580014br.gov.bcb.pix0136${Date.now()}` : undefined,
      qrCodeBase64: data.paymentMethod === 'pix' ? 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : undefined,
      expiresAt: data.paymentMethod === 'pix' ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : undefined,
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      payment_method_id: data.paymentMethod
    };

    res.json({
      success: true,
      payment: mockPayment
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao criar pagamento Mercado Pago:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/payments/mercadopago/check-status
 * Verificar status do pagamento
 */
router.post('/mercadopago/check-status', async (req, res) => {
  try {
    const { paymentId } = checkStatusSchema.parse(req.body);

    // Simular verificação de status (substituir por implementação real)
    const mockStatus = {
      id: paymentId,
      status: 'approved', // ou 'pending', 'rejected', 'cancelled'
      status_detail: 'accredited',
      transaction_amount: 99.90,
      date_created: new Date().toISOString(),
      date_approved: new Date().toISOString(),
      payment_method_id: 'pix',
      payment_type_id: 'bank_transfer'
    };

    res.json({
      success: true,
      status: mockStatus.status,
      payment: mockStatus
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao verificar status Mercado Pago:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/payments/mercadopago/cancel-payment
 * Cancelar pagamento
 */
router.post('/mercadopago/cancel-payment', async (req, res) => {
  try {
    const { paymentId } = checkStatusSchema.parse(req.body);

    // Simular cancelamento (substituir por implementação real)
    const mockCancelled = {
      id: paymentId,
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    };

    res.json({
      success: true,
      payment: mockCancelled
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Erro ao cancelar pagamento Mercado Pago:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

// ========== ROTAS GENÉRICAS ==========

/**
 * GET /api/payments/providers
 * Listar providers de pagamento disponíveis
 */
router.get('/providers', async (req, res) => {
  try {
    const providers = [
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Cartões internacionais',
        supportedMethods: ['credit_card', 'debit_card'],
        currencies: ['BRL', 'USD', 'EUR'],
        fees: {
          percentage: parseFloat(process.env.COST_STRIPE_FEE_PERCENTAGE || '2.9'),
          fixed: parseFloat(process.env.COST_STRIPE_FEE_FIXED || '0.30')
        },
        available: !!process.env.STRIPE_SECRET_KEY
      },
      {
        id: 'mercadopago',
        name: 'Mercado Pago',
        description: 'PIX, Boleto, Cartões nacionais',
        supportedMethods: ['pix', 'credit_card', 'debit_card', 'ticket'],
        currencies: ['BRL'],
        fees: {
          pix: parseFloat(process.env.COST_MERCADOPAGO_PIX_FEE || '2.99'),
          card: parseFloat(process.env.COST_MERCADOPAGO_CARD_FEE || '3.99')
        },
        available: !!process.env.MERCADOPAGO_ACCESS_TOKEN
      }
    ];

    res.json({
      success: true,
      providers: providers.filter(p => p.available)
    });

  } catch (error) {
    console.error('Erro ao listar providers:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * POST /api/payments/calculate-fees
 * Calcular taxas de pagamento
 */
router.post('/calculate-fees', async (req, res) => {
  try {
    const { amount, provider, method } = req.body;

    if (!amount || !provider) {
      return res.status(400).json({
        success: false,
        error: 'Amount e provider são obrigatórios'
      });
    }

    let fee = 0;
    let feeType = '';

    if (provider === 'stripe') {
      const percentage = parseFloat(process.env.COST_STRIPE_FEE_PERCENTAGE || '2.9');
      const fixed = parseFloat(process.env.COST_STRIPE_FEE_FIXED || '0.30');
      fee = (amount * percentage / 100) + fixed;
      feeType = `${percentage}% + R$ ${fixed.toFixed(2)}`;
    } else if (provider === 'mercadopago') {
      const feePercentage = method === 'pix' 
        ? parseFloat(process.env.COST_MERCADOPAGO_PIX_FEE || '2.99')
        : parseFloat(process.env.COST_MERCADOPAGO_CARD_FEE || '3.99');
      fee = amount * feePercentage / 100;
      feeType = `${feePercentage}%`;
    }

    res.json({
      success: true,
      fees: {
        amount: fee,
        type: feeType,
        netAmount: amount - fee
      }
    });

  } catch (error) {
    console.error('Erro ao calcular taxas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router;

