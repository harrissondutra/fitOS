/**
 * Payment Dual Provider Component
 * 
 * Componente principal para seleção entre Stripe e Mercado Pago
 * - Tabs para seleção de provider
 * - Display condicional de formulários
 * - Integração com ambos os sistemas de pagamento
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StripePaymentForm } from './stripe-payment-form';
import { MercadoPagoPayment } from './mercadopago-payment';
import { CreditCard, Smartphone, DollarSign } from 'lucide-react';

interface PaymentDualProviderProps {
  amount: number;
  currency?: string;
  description?: string;
  onPaymentSuccess: (result: PaymentResult) => void;
  onPaymentError: (error: string) => void;
  className?: string;
}

interface PaymentResult {
  provider: 'stripe' | 'mercadopago';
  paymentId: string;
  status: 'success' | 'pending' | 'failed';
  clientSecret?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: Date;
}

export function PaymentDualProvider({
  amount,
  currency = 'BRL',
  description = 'Pagamento',
  onPaymentSuccess,
  onPaymentError,
  className
}: PaymentDualProviderProps) {
  const [selectedProvider, setSelectedProvider] = useState<'stripe' | 'mercadopago'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentSuccess = (result: PaymentResult) => {
    setIsProcessing(false);
    onPaymentSuccess(result);
  };

  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    onPaymentError(error);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Escolha a forma de pagamento
          </CardTitle>
          <CardDescription>
            Selecione entre Stripe (cartões internacionais) ou Mercado Pago (PIX, Boleto, cartões nacionais)
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as 'stripe' | 'mercadopago')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="stripe" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Stripe
                <Badge variant="secondary" className="ml-1">Internacional</Badge>
              </TabsTrigger>
              <TabsTrigger value="mercadopago" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mercado Pago
                <Badge variant="secondary" className="ml-1">Brasil</Badge>
              </TabsTrigger>
            </TabsList>

            <Separator className="my-4" />

            <TabsContent value="stripe" className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Stripe</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Aceita cartões de crédito e débito internacionais (Visa, Mastercard, American Express)
                </p>
                
                <StripePaymentForm
                  amount={amount}
                  currency={currency}
                  description={description}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onProcessingStart={handleProcessingStart}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>

            <TabsContent value="mercadopago" className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">Mercado Pago</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Aceita PIX, Boleto, cartões nacionais e outras formas de pagamento populares no Brasil
                </p>
                
                <MercadoPagoPayment
                  amount={amount}
                  currency={currency}
                  description={description}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onProcessingStart={handleProcessingStart}
                  disabled={isProcessing}
                />
              </div>
            </TabsContent>
          </Tabs>

          {isProcessing && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Processando pagamento...
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

