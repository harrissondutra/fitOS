/**
 * PaymentCostTrackerService - Rastreamento de Custos de Pagamentos
 * 
 * Calcula e rastreia automaticamente as taxas de:
 * - Stripe: Taxa por transação (percentual + fixa)
 * - Mercado Pago: Taxa PIX e Cartão
 */

import { CostTrackerService } from './cost-tracker.service';
import { logger } from '../utils/logger';

export interface PaymentFeeData {
  provider: 'stripe' | 'mercadopago';
  paymentMethod: 'card' | 'pix' | 'debit_card' | 'credit_card' | 'ticket';
  amount: number; // Valor total da transação
  currency: string;
  paymentId: string;
  metadata?: any;
}

export class PaymentCostTrackerService {
  private costTracker: CostTrackerService;

  constructor() {
    this.costTracker = new CostTrackerService();
  }

  /**
   * Calcular taxa do Stripe
   * Taxa padrão: 2.9% + R$0.30 (ou valor configurado)
   */
  private calculateStripeFee(amount: number, currency: string): number {
    const feePercentage = parseFloat(process.env.COST_STRIPE_FEE_PERCENTAGE || '2.9');
    const feeFixed = parseFloat(process.env.COST_STRIPE_FEE_FIXED || '0.30');
    
    // Converter para BRL se necessário
    const amountInBRL = currency.toLowerCase() === 'usd' ? amount * 5 : amount;
    
    // Calcular taxa: percentual + fixa
    const fee = (amountInBRL * (feePercentage / 100)) + feeFixed;
    
    return fee;
  }

  /**
   * Calcular taxa do Mercado Pago
   * PIX: 2.99% (ou valor configurado)
   * Cartão: 3.99% (ou valor configurado)
   */
  private calculateMercadoPagoFee(
    amount: number,
    paymentMethod: 'pix' | 'card' | 'debit_card' | 'credit_card' | 'ticket'
  ): number {
    const isPix = paymentMethod === 'pix';
    const feePercentage = isPix
      ? parseFloat(process.env.COST_MERCADOPAGO_PIX_FEE || '2.99')
      : parseFloat(process.env.COST_MERCADOPAGO_CARD_FEE || '3.99');
    
    // Mercado Pago cobra apenas percentual (sem taxa fixa)
    const fee = amount * (feePercentage / 100);
    
    return fee;
  }

  /**
   * Rastrear custo de transação de pagamento
   */
  async trackPaymentFee(data: PaymentFeeData): Promise<void> {
    try {
      const { provider, paymentMethod, amount, currency, paymentId, metadata } = data;

      // Calcular taxa
      let fee = 0;
      let serviceName = '';

      if (provider === 'stripe') {
        fee = this.calculateStripeFee(amount, currency);
        serviceName = paymentMethod === 'card' ? 'stripe-card' : 'stripe-pix';
      } else if (provider === 'mercadopago') {
        fee = this.calculateMercadoPagoFee(amount, paymentMethod);
        serviceName = paymentMethod === 'pix' ? 'mercadopago-pix' : 'mercadopago-card';
      }

      if (fee <= 0) {
        logger.warn(`No fee calculated for payment ${paymentId}`);
        return;
      }

      // Rastrear usando CostTrackerService com custo já calculado
      await this.costTracker.trackUsageWithCost({
        categoryName: 'payment',
        serviceName,
        cost: fee,
        currency,
        usage: {
          quantity: 1,
          unit: 'transaction',
          metadata: {
            paymentId,
            amount,
            currency,
            fee,
            paymentMethod,
            provider,
            ...metadata,
          },
        },
      });

      logger.info(
        `Tracked payment fee: ${provider} ${paymentMethod} - Fee: ${fee.toFixed(2)} ${currency} for payment ${paymentId}`
      );
    } catch (error) {
      logger.error(`Error tracking payment fee for ${data.paymentId}:`, error);
      // Não lançar erro para não quebrar o fluxo de pagamento
    }
  }
}
