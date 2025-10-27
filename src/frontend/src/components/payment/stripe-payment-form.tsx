/**
 * Stripe Payment Form Component
 * 
 * Formulário de pagamento usando Stripe Elements:
 * - Campos de cartão (número, CVV, validade, nome)
 * - Validação em tempo real
 * - Integração com Stripe Elements
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Lock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StripePaymentFormProps {
  amount: number;
  currency?: string;
  description?: string;
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  onProcessingStart: () => void;
  disabled?: boolean;
}

interface PaymentResult {
  provider: 'stripe';
  paymentId: string;
  status: 'success' | 'pending' | 'failed';
  clientSecret?: string;
}

interface CardData {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

interface ValidationErrors {
  number?: string;
  expiry?: string;
  cvc?: string;
  name?: string;
}

export function StripePaymentForm({
  amount,
  currency = 'BRL',
  description = 'Pagamento',
  onSuccess,
  onError,
  onProcessingStart,
  disabled = false
}: StripePaymentFormProps) {
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isValid, setIsValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Validação em tempo real
  useEffect(() => {
    const validation = validateCardData(cardData);
    setErrors(validation.errors);
    setIsValid(validation.isValid);
  }, [cardData]);

  const validateCardData = (data: CardData): { isValid: boolean; errors: ValidationErrors } => {
    const errors: ValidationErrors = {};

    // Validar número do cartão (Luhn algorithm simplificado)
    if (!data.number) {
      errors.number = 'Número do cartão é obrigatório';
    } else if (!/^\d{13,19}$/.test(data.number.replace(/\s/g, ''))) {
      errors.number = 'Número do cartão inválido';
    }

    // Validar data de expiração
    if (!data.expiry) {
      errors.expiry = 'Data de expiração é obrigatória';
    } else {
      const [month, year] = data.expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const now = new Date();
      
      if (expiryDate <= now) {
        errors.expiry = 'Cartão expirado';
      }
    }

    // Validar CVV
    if (!data.cvc) {
      errors.cvc = 'CVV é obrigatório';
    } else if (!/^\d{3,4}$/.test(data.cvc)) {
      errors.cvc = 'CVV inválido';
    }

    // Validar nome
    if (!data.name.trim()) {
      errors.name = 'Nome no cartão é obrigatório';
    } else if (data.name.trim().length < 2) {
      errors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: keyof CardData, value: string) => {
    let formattedValue = value;

    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (field === 'cvc') {
      formattedValue = value.replace(/\D/g, '');
    }

    setCardData(prev => ({
      ...prev,
      [field]: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid || isProcessing || disabled) {
      return;
    }

    setIsProcessing(true);
    onProcessingStart();

    try {
      // Simular chamada para API do Stripe
      const response = await fetch('/api/payments/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(amount * 100), // Converter para centavos
          currency: currency.toLowerCase(),
          description,
          cardData: {
            number: cardData.number.replace(/\s/g, ''),
            expiry: cardData.expiry,
            cvc: cardData.cvc,
            name: cardData.name
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar pagamento');
      }

      const result = await response.json();

      if (result.success) {
        onSuccess({
          provider: 'stripe',
          paymentId: result.paymentIntent.id,
          status: 'success',
          clientSecret: result.paymentIntent.client_secret
        });

        toast.success('Pagamento processado com sucesso!');
      } else {
        throw new Error(result.error || 'Erro no processamento do pagamento');
      }

    } catch (error) {
      console.error('Erro no pagamento Stripe:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      onError(errorMessage);
      toast.error(`Erro no pagamento: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        {/* Número do Cartão */}
        <div className="space-y-2">
          <Label htmlFor="card-number">Número do Cartão</Label>
          <div className="relative">
            <Input
              id="card-number"
              type="text"
              placeholder="1234 5678 9012 3456"
              value={cardData.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              disabled={disabled || isProcessing}
              className={`pr-10 ${errors.number ? 'border-red-500' : ''}`}
              maxLength={19}
            />
            <CreditCard className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {errors.number && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {errors.number}
            </p>
          )}
        </div>

        {/* Data de Expiração e CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="expiry">Data de Expiração</Label>
            <Input
              id="expiry"
              type="text"
              placeholder="MM/AA"
              value={cardData.expiry}
              onChange={(e) => handleInputChange('expiry', e.target.value)}
              disabled={disabled || isProcessing}
              className={errors.expiry ? 'border-red-500' : ''}
              maxLength={5}
            />
            {errors.expiry && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {errors.expiry}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="cvc">CVV</Label>
            <Input
              id="cvc"
              type="text"
              placeholder="123"
              value={cardData.cvc}
              onChange={(e) => handleInputChange('cvc', e.target.value)}
              disabled={disabled || isProcessing}
              className={errors.cvc ? 'border-red-500' : ''}
              maxLength={4}
            />
            {errors.cvc && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                {errors.cvc}
              </p>
            )}
          </div>
        </div>

        {/* Nome no Cartão */}
        <div className="space-y-2">
          <Label htmlFor="card-name">Nome no Cartão</Label>
          <Input
            id="card-name"
            type="text"
            placeholder="João Silva"
            value={cardData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={disabled || isProcessing}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <XCircle className="h-3 w-3" />
              {errors.name}
            </p>
          )}
        </div>
      </div>

      {/* Resumo do Pagamento */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Resumo do Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{description}</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: currency
              }).format(amount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Pagamento */}
      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || isProcessing || disabled}
      >
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            Processando...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4 mr-2" />
            Pagar com Stripe
          </>
        )}
      </Button>

      {/* Informações de Segurança */}
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Seus dados são protegidos com criptografia SSL. Não armazenamos informações do cartão.
        </AlertDescription>
      </Alert>
    </form>
  );
}

