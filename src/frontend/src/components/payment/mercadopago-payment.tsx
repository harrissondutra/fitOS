/**
 * Mercado Pago Payment Component
 * 
 * Componente para pagamentos via Mercado Pago:
 * - Opções: PIX, Cartão, Boleto
 * - Radio buttons para seleção
 * - Integração com PIX Payment Display
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PixPaymentDisplay } from './pix-payment-display';
import { Smartphone, CreditCard, FileText, QrCode } from 'lucide-react';

interface MercadoPagoPaymentProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  onProcessingStart: () => void;
  disabled?: boolean;
}

interface PaymentResult {
  provider: 'mercadopago';
  paymentId: string;
  status: 'success' | 'pending' | 'failed';
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: Date;
}

type PaymentMethod = 'pix' | 'credit_card' | 'debit_card' | 'ticket';

const paymentMethods = [
  {
    id: 'pix' as PaymentMethod,
    name: 'PIX',
    description: 'Pagamento instantâneo via PIX',
    icon: QrCode,
    badge: 'Recomendado',
    badgeVariant: 'default' as const,
    processingTime: 'Instantâneo'
  },
  {
    id: 'credit_card' as PaymentMethod,
    name: 'Cartão de Crédito',
    description: 'Visa, Mastercard, Elo, American Express',
    icon: CreditCard,
    badge: 'Aprovado em até 2 dias',
    badgeVariant: 'secondary' as const,
    processingTime: 'Até 2 dias úteis'
  },
  {
    id: 'debit_card' as PaymentMethod,
    name: 'Cartão de Débito',
    description: 'Débito em conta corrente',
    icon: CreditCard,
    badge: 'Aprovado em até 1 dia',
    badgeVariant: 'secondary' as const,
    processingTime: 'Até 1 dia útil'
  },
  {
    id: 'ticket' as PaymentMethod,
    name: 'Boleto Bancário',
    description: 'Pagamento via boleto bancário',
    icon: FileText,
    badge: 'Aprovado em até 3 dias',
    badgeVariant: 'outline' as const,
    processingTime: 'Até 3 dias úteis'
  }
];

export function MercadoPagoPayment({
  amount,
  currency = 'BRL',
  description = 'Pagamento',
  onSuccess,
  onError,
  onProcessingStart,
  disabled = false
}: MercadoPagoPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResult | null>(null);

  const handleMethodChange = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentData(null); // Reset payment data when method changes
  };

  const handlePaymentSuccess = (result: PaymentResult) => {
    setIsProcessing(false);
    setPaymentData(result);
    onSuccess(result);
  };

  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    onError(error);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    onProcessingStart();
  };

  const handleCreatePayment = async () => {
    if (isProcessing || disabled) return;

    setIsProcessing(true);
    onProcessingStart();

    try {
      const response = await fetch('/api/payments/mercadopago/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          paymentMethod: selectedMethod
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar pagamento');
      }

      const result = await response.json();

      if (result.success) {
        const paymentResult: PaymentResult = {
          provider: 'mercadopago',
          paymentId: result.payment.id,
          status: result.payment.status === 'approved' ? 'success' : 'pending',
          qrCode: result.payment.qrCode,
          qrCodeBase64: result.payment.qrCodeBase64,
          expiresAt: result.payment.expiresAt ? new Date(result.payment.expiresAt) : undefined
        };

        setPaymentData(paymentResult);
        onSuccess(paymentResult);
      } else {
        throw new Error(result.error || 'Erro ao criar pagamento');
      }

    } catch (error) {
      console.error('Erro no pagamento Mercado Pago:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção do Método de Pagamento */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-600" />
          <h3 className="font-medium">Escolha a forma de pagamento</h3>
        </div>

        <RadioGroup value={selectedMethod} onValueChange={handleMethodChange}>
          <div className="grid gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div key={method.id} className="relative">
                  <Label
                    htmlFor={method.id}
                    className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                      selectedMethod === method.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                    <div className="flex items-center space-x-3 flex-1">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          <Badge variant={method.badgeVariant} className="text-xs">
                            {method.badge}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {method.processingTime}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Resumo do Pagamento */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resumo do Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{description}</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: currency
                }).format(amount)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Método selecionado:</span>
              <span className="font-medium">
                {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Pagamento */}
      <Button
        onClick={handleCreatePayment}
        className="w-full"
        disabled={isProcessing || disabled}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Criando pagamento...
          </>
        ) : (
          <>
            <Smartphone className="h-4 w-4 mr-2" />
            Pagar com Mercado Pago
          </>
        )}
      </Button>

      {/* Display do PIX */}
      {paymentData && selectedMethod === 'pix' && paymentData.qrCode && (
        <PixPaymentDisplay
          qrCode={paymentData.qrCode}
          qrCodeBase64={paymentData.qrCodeBase64}
          amount={amount}
          currency={currency}
          expiresAt={paymentData.expiresAt}
          onPaymentConfirmed={() => {
            onSuccess({
              ...paymentData,
              status: 'success'
            });
          }}
        />
      )}

      {/* Informações de Segurança */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Pagamentos processados com segurança pelo Mercado Pago</p>
        <p>Seus dados estão protegidos com criptografia SSL</p>
      </div>
    </div>
  );
}

