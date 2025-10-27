/**
 * Payment Hook
 * 
 * Hook para gerenciar estado de pagamento:
 * - Polling de status
 * - Handlers de sucesso/erro
 * - Gerenciamento de estado global
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface PaymentState {
  isProcessing: boolean;
  status: 'idle' | 'pending' | 'success' | 'error';
  paymentId?: string;
  provider?: 'stripe' | 'mercadopago';
  error?: string;
  qrCode?: string;
  qrCodeBase64?: string;
  expiresAt?: Date;
  clientSecret?: string;
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

interface UsePaymentOptions {
  onSuccess?: (result: PaymentResult) => void;
  onError?: (error: string) => void;
  autoPoll?: boolean;
  pollInterval?: number;
}

export function usePayment(options: UsePaymentOptions = {}) {
  const {
    onSuccess,
    onError,
    autoPoll = true,
    pollInterval = 5000
  } = options;

  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    status: 'idle'
  });

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Limpar intervalos
  const clearIntervals = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Iniciar polling de status
  const startPolling = useCallback(async (paymentId: string, provider: 'stripe' | 'mercadopago') => {
    if (!autoPoll) return;

    const pollStatus = async () => {
      try {
        const endpoint = provider === 'stripe' 
          ? '/api/payments/stripe/check-status'
          : '/api/payments/mercadopago/check-status';

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentId }),
        });

        if (response.ok) {
          const result = await response.json();
          
          if (result.status === 'success' || result.status === 'approved') {
            setPaymentState(prev => ({
              ...prev,
              status: 'success',
              isProcessing: false
            }));
            
            clearIntervals();
            
            const paymentResult: PaymentResult = {
              provider,
              paymentId,
              status: 'success',
              clientSecret: result.clientSecret,
              qrCode: result.qrCode,
              qrCodeBase64: result.qrCodeBase64,
              expiresAt: result.expiresAt ? new Date(result.expiresAt) : undefined
            };

            onSuccess?.(paymentResult);
            toast.success('Pagamento confirmado!');
            
          } else if (result.status === 'failed' || result.status === 'rejected') {
            setPaymentState(prev => ({
              ...prev,
              status: 'error',
              isProcessing: false,
              error: result.message || 'Pagamento falhou'
            }));
            
            clearIntervals();
            onError?.(result.message || 'Pagamento falhou');
            toast.error('Pagamento falhou');
          }
        }
      } catch (error) {
        console.warn('Erro ao verificar status do pagamento:', error);
      }
    };

    // Polling imediato
    await pollStatus();

    // Polling periódico
    pollingIntervalRef.current = setInterval(pollStatus, pollInterval);

    // Timeout de segurança (5 minutos)
    timeoutRef.current = setTimeout(() => {
      setPaymentState(prev => ({
        ...prev,
        status: 'error',
        isProcessing: false,
        error: 'Timeout - Pagamento não confirmado'
      }));
      clearIntervals();
      onError?.('Timeout - Pagamento não confirmado');
    }, 5 * 60 * 1000);

  }, [autoPoll, pollInterval, onSuccess, onError, clearIntervals]);

  // Processar pagamento
  const processPayment = useCallback(async (
    provider: 'stripe' | 'mercadopago',
    paymentData: any
  ) => {
    setPaymentState({
      isProcessing: true,
      status: 'pending'
    });

    try {
      const endpoint = provider === 'stripe'
        ? '/api/payments/stripe/create-payment-intent'
        : '/api/payments/mercadopago/create-payment';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        throw new Error('Falha ao processar pagamento');
      }

      const result = await response.json();

      if (result.success) {
        const paymentResult: PaymentResult = {
          provider,
          paymentId: result.payment.id || result.paymentIntent.id,
          status: result.payment.status === 'approved' || result.paymentIntent.status === 'succeeded' 
            ? 'success' 
            : 'pending',
          clientSecret: result.paymentIntent?.client_secret,
          qrCode: result.payment?.qrCode,
          qrCodeBase64: result.payment?.qrCodeBase64,
          expiresAt: result.payment?.expiresAt ? new Date(result.payment.expiresAt) : undefined
        };

        setPaymentState(prev => ({
          ...prev,
          paymentId: paymentResult.paymentId,
          provider: paymentResult.provider,
          qrCode: paymentResult.qrCode,
          qrCodeBase64: paymentResult.qrCodeBase64,
          expiresAt: paymentResult.expiresAt,
          clientSecret: paymentResult.clientSecret
        }));

        // Se for pagamento instantâneo (Stripe aprovado), chamar sucesso imediatamente
        if (paymentResult.status === 'success') {
          setPaymentState(prev => ({
            ...prev,
            status: 'success',
            isProcessing: false
          }));
          onSuccess?.(paymentResult);
          toast.success('Pagamento processado com sucesso!');
        } else {
          // Se for pagamento pendente (PIX), iniciar polling
          await startPolling(paymentResult.paymentId, provider);
        }

        return paymentResult;
      } else {
        throw new Error(result.error || 'Erro no processamento do pagamento');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setPaymentState(prev => ({
        ...prev,
        status: 'error',
        isProcessing: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      toast.error(`Erro no pagamento: ${errorMessage}`);
      throw error;
    }
  }, [onSuccess, onError, startPolling]);

  // Cancelar pagamento
  const cancelPayment = useCallback(async () => {
    if (!paymentState.paymentId || !paymentState.provider) return;

    try {
      const endpoint = paymentState.provider === 'stripe'
        ? '/api/payments/stripe/cancel-payment'
        : '/api/payments/mercadopago/cancel-payment';

      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: paymentState.paymentId }),
      });

      setPaymentState({
        isProcessing: false,
        status: 'idle'
      });

      clearIntervals();
      toast.info('Pagamento cancelado');

    } catch (error) {
      console.error('Erro ao cancelar pagamento:', error);
    }
  }, [paymentState.paymentId, paymentState.provider, clearIntervals]);

  // Resetar estado
  const resetPayment = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      status: 'idle'
    });
    clearIntervals();
  }, [clearIntervals]);

  // Verificar status manualmente
  const checkStatus = useCallback(async () => {
    if (!paymentState.paymentId || !paymentState.provider) return;

    try {
      const endpoint = paymentState.provider === 'stripe'
        ? '/api/payments/stripe/check-status'
        : '/api/payments/mercadopago/check-status';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId: paymentState.paymentId }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.status === 'success' || result.status === 'approved') {
          setPaymentState(prev => ({
            ...prev,
            status: 'success',
            isProcessing: false
          }));
          
          clearIntervals();
          onSuccess?.({
            provider: paymentState.provider,
            paymentId: paymentState.paymentId!,
            status: 'success'
          });
        }
      }
    } catch (error) {
      console.warn('Erro ao verificar status:', error);
    }
  }, [paymentState.paymentId, paymentState.provider, onSuccess, clearIntervals]);

  // Cleanup
  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, [clearIntervals]);

  return {
    // Estado
    ...paymentState,
    
    // Ações
    processPayment,
    cancelPayment,
    resetPayment,
    checkStatus,
    startPolling,
    
    // Helpers
    isIdle: paymentState.status === 'idle',
    isPending: paymentState.status === 'pending',
    isSuccess: paymentState.status === 'success',
    isError: paymentState.status === 'error',
    hasError: !!paymentState.error,
    
    // Dados do pagamento
    paymentId: paymentState.paymentId,
    provider: paymentState.provider,
    qrCode: paymentState.qrCode,
    qrCodeBase64: paymentState.qrCodeBase64,
    expiresAt: paymentState.expiresAt,
    clientSecret: paymentState.clientSecret,
    error: paymentState.error
  };
}

