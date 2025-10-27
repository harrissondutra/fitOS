/**
 * Payment Step
 * 
 * Step 4 do onboarding:
 * - Dual provider selection (Stripe ou Mercado Pago)
 * - Integração com componente PaymentDualProvider
 * - Processamento do pagamento
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { PaymentDualProvider } from '@/components/payment/payment-dual-provider';
import { CreditCard, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentStepProps {
  data: {
    planId: 'starter' | 'professional' | 'enterprise';
    billingCycle: 'monthly' | 'yearly';
    paymentMethod: 'stripe' | 'mercadopago';
  };
  onDataChange: (data: Partial<any>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
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

const planPrices = {
  starter: { monthly: 99.90, yearly: 799.20 },
  professional: { monthly: 199.90, yearly: 1599.20 },
  enterprise: { monthly: 399.90, yearly: 3199.20 }
};

export function PaymentStep({ data, onDataChange, onPrevious, onNext, isLoading }: PaymentStepProps) {
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const selectedPlan = planPrices[data.planId];
  const amount = data.billingCycle === 'yearly' ? selectedPlan.yearly : selectedPlan.monthly;
  const planName = data.planId.charAt(0).toUpperCase() + data.planId.slice(1);

  const handlePaymentSuccess = (result: PaymentResult) => {
    setPaymentResult(result);
    setPaymentError(null);
    
    if (result.status === 'success') {
      toast.success('Pagamento processado com sucesso!');
      // Avançar automaticamente para o próximo passo
      setTimeout(() => {
        onNext();
      }, 2000);
    } else if (result.status === 'pending') {
      toast.info('Pagamento pendente. Aguarde a confirmação...');
    }
  };

  const handlePaymentError = (error: string) => {
    setPaymentError(error);
    setPaymentResult(null);
    toast.error(`Erro no pagamento: ${error}`);
  };

  const handleProcessingStart = () => {
    setIsProcessing(true);
    setPaymentError(null);
  };

  const handleRetryPayment = () => {
    setPaymentResult(null);
    setPaymentError(null);
    setIsProcessing(false);
  };

  const handleSkipPayment = () => {
    // Para desenvolvimento/teste - permitir pular o pagamento
    toast.info('Pagamento pulado (modo desenvolvimento)');
    onNext();
  };

  const getPaymentStatusMessage = () => {
    if (!paymentResult) return null;

    switch (paymentResult.status) {
      case 'success':
        return {
          type: 'success' as const,
          title: 'Pagamento Aprovado!',
          message: 'Seu pagamento foi processado com sucesso. Redirecionando...',
          icon: CheckCircle
        };
      case 'pending':
        return {
          type: 'info' as const,
          title: 'Pagamento Pendente',
          message: 'Aguardando confirmação do pagamento. Você será notificado quando for aprovado.',
          icon: Loader2
        };
      case 'failed':
        return {
          type: 'error' as const,
          title: 'Pagamento Falhou',
          message: 'Não foi possível processar o pagamento. Tente novamente.',
          icon: AlertCircle
        };
      default:
        return null;
    }
  };

  const statusMessage = getPaymentStatusMessage();

  return (
    <div className="space-y-6">
      {/* Resumo do Pedido */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Resumo do Pedido
          </CardTitle>
          <CardDescription>
            Confirme os detalhes antes de finalizar o pagamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Plano:</span>
              <div className="font-medium">{planName}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Ciclo:</span>
              <div className="font-medium">
                {data.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Método:</span>
              <div className="font-medium">
                {data.paymentMethod === 'stripe' ? 'Stripe' : 'Mercado Pago'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Valor:</span>
              <div className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(amount)}
              </div>
            </div>
          </div>

          {data.billingCycle === 'yearly' && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Você está economizando 20% com o plano anual!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Status do Pagamento */}
      {statusMessage && (
        <Alert className={
          statusMessage.type === 'success' ? 'border-green-200 bg-green-50' :
          statusMessage.type === 'error' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }>
          <statusMessage.icon className={`h-4 w-4 ${
            statusMessage.type === 'success' ? 'text-green-600' :
            statusMessage.type === 'error' ? 'text-red-600' :
            'text-blue-600'
          } ${statusMessage.type === 'info' ? 'animate-spin' : ''}`} />
          <AlertDescription className={
            statusMessage.type === 'success' ? 'text-green-700' :
            statusMessage.type === 'error' ? 'text-red-700' :
            'text-blue-700'
          }>
            <div className="font-medium">{statusMessage.title}</div>
            <div className="text-sm mt-1">{statusMessage.message}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Erro de Pagamento */}
      {paymentError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            <div className="font-medium">Erro no Pagamento</div>
            <div className="text-sm mt-1">{paymentError}</div>
          </AlertDescription>
        </Alert>
      )}

      {/* Componente de Pagamento */}
      {!paymentResult && (
        <PaymentDualProvider
          amount={amount}
          currency="BRL"
          description={`Assinatura ${planName} - ${data.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}`}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          className="w-full"
        />
      )}

      {/* Ações após Pagamento */}
      {paymentResult && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {paymentResult.status === 'success' && (
                <div className="text-center space-y-2">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-green-700">
                    Pagamento Confirmado!
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sua conta está sendo criada. Você será redirecionado em instantes...
                  </p>
                </div>
              )}

              {paymentResult.status === 'pending' && (
                <div className="text-center space-y-2">
                  <Loader2 className="h-12 w-12 text-blue-500 mx-auto animate-spin" />
                  <h3 className="text-lg font-semibold text-blue-700">
                    Aguardando Pagamento
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Verificando o status do seu pagamento...
                  </p>
                </div>
              )}

              {paymentResult.status === 'failed' && (
                <div className="text-center space-y-4">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-red-700">
                    Pagamento Falhou
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Não foi possível processar seu pagamento. Tente novamente.
                  </p>
                  <Button onClick={handleRetryPayment} variant="outline">
                    Tentar Novamente
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Informações de Segurança */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h4 className="font-medium">Pagamento Seguro</h4>
            <p className="text-sm text-muted-foreground">
              Seus dados são protegidos com criptografia SSL de 256 bits.
              <br />
              Não armazenamos informações de cartão de crédito.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading || isProcessing}
        >
          Voltar
        </Button>

        <div className="flex gap-2">
          {/* Botão para desenvolvimento - pular pagamento */}
          {process.env.NODE_ENV === 'development' && (
            <Button
              variant="outline"
              onClick={handleSkipPayment}
              disabled={isLoading || isProcessing}
            >
              Pular Pagamento (Dev)
            </Button>
          )}

          {paymentResult?.status === 'failed' && (
            <Button
              onClick={handleRetryPayment}
              disabled={isLoading || isProcessing}
            >
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

