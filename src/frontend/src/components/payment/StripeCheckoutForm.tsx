'use client';
import React from 'react';

import { useState } from 'react';
import {
  CardElement,
  Elements,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Stripe, StripeElements } from '@stripe/stripe-js';

interface StripeCheckoutFormProps {
  planId: string;
  amount: number;
  onSuccess: (subscriptionId: string) => void;
}

function CheckoutForm({ planId, amount, onSuccess }: StripeCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe não inicializado');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // 1. Criar subscription intent no backend
      const response = await fetch('/api/payments/stripe/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao criar assinatura');
      }

      const { clientSecret, subscriptionId } = await response.json();

      // 2. Confirmar pagamento com cartão
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Elemento de cartão não encontrado');
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          }
        }
      );

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent?.status === 'succeeded') {
        toast({
          title: 'Pagamento confirmado!',
          description: 'Sua assinatura foi ativada com sucesso.',
        });
        onSuccess(subscriptionId);
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao processar pagamento';
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Erro no pagamento',
        description: errorMessage,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border p-4 bg-card">
        <label className="text-sm font-medium mb-2 block">
          Informações do Cartão
        </label>
        <div className="border rounded-lg p-3">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || isProcessing}
      >
        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isProcessing ? 'Processando...' : `Confirmar Pagamento - R$ ${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

export { CheckoutForm as StripeCheckoutForm };

export function StripeCheckoutFormWrapper({ 
  stripePromise, 
  ...props 
}: { 
  stripePromise: Promise<Stripe | null>;
} & Omit<StripeCheckoutFormProps, 'onSuccess' | 'planId' | 'amount'>) {
  return (
    <Elements stripe={stripePromise}>
      <StripeCheckoutForm {...props} />
    </Elements>
  );
}

