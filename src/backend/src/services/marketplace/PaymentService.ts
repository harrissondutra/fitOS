import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
// import { stripeService } from '../../integrations/stripe';
// import { mercadoPagoService } from '../../integrations/mercadopago';
// import { notificationsService } from '../../integrations/notifications';

const prisma = new PrismaClient();

export class PaymentService {
  private stripe: Stripe;
  private mercadoPagoAccessToken: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
    this.mercadoPagoAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!;
  }

  /**
   * Criar Payment Intent do Stripe para um pedido
   */
  async createStripePaymentIntent(orderId: string, amount: number, currency: string = 'BRL') {
    try {
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
        include: {
          listing: {
            include: {
              // seller: {
              //   include: {
              //     user: true
              //   }
              // }
            }
          },
          // buyer: true
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Calcular comissão do fitOS (exemplo: 5%)
      const commissionRate = 0.05;
      const commission = Math.round(amount * commissionRate);
      const sellerAmount = amount - commission;

      // Usar integração mock se Stripe não estiver configurado
      if (process.env.NODE_ENV === 'development') { // Mock: use mock in development
        // const paymentIntent = await stripeService.createPaymentIntent({
        //   amount: Math.round(amount * 100),
        //   currency: currency.toLowerCase(),
        //   customer: order.buyer.id,
        //   metadata: {
        //     orderId,
        //     sellerId: order.listing.seller.userId,
        //     commission: commission.toString(),
        //     sellerAmount: sellerAmount.toString()
        //   },
        //   transfer_data: {
        //     destination: order.listing.seller.userId,
        //     amount: Math.round(sellerAmount * 100)
        //   }
        // });
        const paymentIntent = { id: 'mock_payment_intent', client_secret: 'mock_secret' };

        return {
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
          commission,
          sellerAmount
        };
      }

      // Usar Stripe real se configurado
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency: currency.toLowerCase(),
        metadata: {
          orderId,
          sellerId: 'mock-seller-id', // order.listing.seller.userId,
          commission: commission.toString(),
          sellerAmount: sellerAmount.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        commission,
        sellerAmount
      };
    } catch (error) {
      console.error('Erro ao criar Payment Intent:', error);
      throw error;
    }
  }

  /**
   * Criar preferência de pagamento do MercadoPago
   */
  async createMercadoPagoPreference(orderId: string, amount: number) {
    try {
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
        include: {
          listing: {
            include: {
              // seller: {
              //   include: {
              //     user: true
              //   }
              // }
            }
          },
          // buyer: true
        }
      });

      if (!order) {
        throw new Error('Pedido não encontrado');
      }

      // Calcular comissão do fitOS
      const commissionRate = 0.05;
      const commission = Math.round(amount * commissionRate);
      const sellerAmount = amount - commission;

      const preference = {
        items: [
          {
            title: 'Mock Listing Title', // order.listing.title,
            quantity: 1, // order.quantity,
            unit_price: 100, // order.listing.price,
            currency_id: 'BRL'
          }
        ],
        payer: {
          name: 'Mock Buyer Name', // order.buyer.name,
          email: 'mock@buyer.com' // order.buyer.email
        },
        external_reference: orderId,
        metadata: {
          orderId,
          sellerId: 'mock-seller-id', // order.listing.seller.userId,
          commission: commission.toString(),
          sellerAmount: sellerAmount.toString()
        },
        back_urls: {
          success: `${process.env.FRONTEND_URL}/marketplace/orders/${orderId}/success`,
          failure: `${process.env.FRONTEND_URL}/marketplace/orders/${orderId}/failure`,
          pending: `${process.env.FRONTEND_URL}/marketplace/orders/${orderId}/pending`
        },
        auto_return: 'approved'
      };

      // Aqui você faria a chamada para a API do MercadoPago
      // const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.mercadoPagoAccessToken}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(preference)
      // });

      return {
        preferenceId: 'mock_preference_id', // response.data.id
        initPoint: 'mock_init_point', // response.data.init_point
        commission,
        sellerAmount
      };
    } catch (error) {
      console.error('Erro ao criar preferência MercadoPago:', error);
      throw error;
    }
  }

  /**
   * Processar split payment após confirmação
   */
  async processSplitPayment(paymentIntentId: string, sellerStripeAccountId: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status !== 'succeeded') {
        throw new Error('Pagamento não foi processado com sucesso');
      }

      const { orderId, sellerAmount, commission } = paymentIntent.metadata;

      // Transferir valor para o vendedor (menos comissão)
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(parseFloat(sellerAmount) * 100),
        currency: 'brl',
        destination: sellerStripeAccountId,
        transfer_group: orderId,
        metadata: {
          orderId,
          type: 'seller_payment'
        }
      });

      // Registrar comissão do fitOS - Mock
      // await prisma.marketplaceAnalytics.create({
      //   data: {
      //     // type: 'COMMISSION_EARNED',
      //     value: parseFloat(commission),
      //     metadata: {
      //       orderId,
      //       paymentIntentId,
      //       transferId: transfer.id
      //     }
      //   }
      // });

      return {
        transferId: transfer.id,
        sellerAmount: parseFloat(sellerAmount),
        commission: parseFloat(commission)
      };
    } catch (error) {
      console.error('Erro ao processar split payment:', error);
      throw error;
    }
  }

  /**
   * Processar webhook do Stripe
   */
  async handleStripeWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          console.log(`Evento não tratado: ${event.type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook Stripe:', error);
      throw error;
    }
  }

  /**
   * Processar webhook do MercadoPago
   */
  async handleMercadoPagoWebhook(data: any) {
    try {
      const { type, data: webhookData } = data;

      switch (type) {
        case 'payment':
          await this.handleMercadoPagoPayment(webhookData);
          break;
        default:
          console.log(`Evento MercadoPago não tratado: ${type}`);
      }
    } catch (error) {
      console.error('Erro ao processar webhook MercadoPago:', error);
      throw error;
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const { orderId } = paymentIntent.metadata;
    
    await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentIntentId: paymentIntent.id,
        // paidAt: new Date()
      }
    });

    // Aqui você pode adicionar lógica para notificar vendedor e comprador
    console.log(`Pagamento confirmado para pedido ${orderId}`);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const { orderId } = paymentIntent.metadata;
    
    await prisma.marketplaceOrder.update({
      where: { id: orderId },
      data: {
        status: 'PAYMENT_FAILED',
        paymentIntentId: paymentIntent.id
      }
    });

    console.log(`Pagamento falhou para pedido ${orderId}`);
  }

  private async handleMercadoPagoPayment(paymentData: any) {
    // Implementar lógica similar ao Stripe para MercadoPago
    console.log('Processando pagamento MercadoPago:', paymentData);
  }

  /**
   * Liberar pagamento em escrow após confirmação de entrega
   */
  async releaseEscrowPayment(orderId: string) {
    try {
      const order = await prisma.marketplaceOrder.findUnique({
        where: { id: orderId },
        include: {
          listing: {
            include: {
              // seller: {
              //   include: {
              //     user: true
              //   }
              // }
            }
          }
        }
      });

      if (!order || order.status !== 'DELIVERED') {
        throw new Error('Pedido não está em status de entrega confirmada');
      }

      // Aqui você implementaria a lógica para liberar o pagamento
      // que estava em escrow para o vendedor

      await prisma.marketplaceOrder.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED',
          // completedAt: new Date()
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao liberar pagamento em escrow:', error);
      throw error;
    }
  }
}


