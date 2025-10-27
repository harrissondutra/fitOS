/**
 * PIX Payment Display Component
 * 
 * Componente para exibição do pagamento PIX:
 * - QR Code para escaneamento
 * - Código PIX para copiar
 * - Countdown timer (30min)
 * - Polling de status (a cada 5s)
 * - Auto-redirect quando pago
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { QrCode, Copy, CheckCircle, Clock, Smartphone, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PixPaymentDisplayProps {
  qrCode: string;
  qrCodeBase64?: string;
  amount: number;
  currency?: string;
  expiresAt?: Date;
  onPaymentConfirmed: () => void;
  className?: string;
}

interface PaymentStatus {
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message: string;
  isPolling: boolean;
}

export function PixPaymentDisplay({
  qrCode,
  qrCodeBase64,
  amount,
  currency = 'BRL',
  expiresAt,
  onPaymentConfirmed,
  className
}: PixPaymentDisplayProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'pending',
    message: 'Aguardando pagamento...',
    isPolling: false
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedQr, setCopiedQr] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calcular tempo restante
  useEffect(() => {
    if (!expiresAt) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const expiry = expiresAt.getTime();
      const difference = expiry - now;

      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
        setPaymentStatus({
          status: 'cancelled',
          message: 'Tempo expirado. Gere um novo PIX.',
          isPolling: false
        });
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [expiresAt]);

  // Polling de status do pagamento
  useEffect(() => {
    if (paymentStatus.status === 'pending' && timeLeft > 0) {
      setPaymentStatus(prev => ({ ...prev, isPolling: true }));
      
      pollingIntervalRef.current = setInterval(async () => {
        try {
          // Simular verificação de status (substituir por chamada real à API)
          const response = await fetch('/api/payments/mercadopago/check-status', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              qrCode,
              amount
            }),
          });

          if (response.ok) {
            const result = await response.json();
            
            if (result.status === 'approved') {
              setPaymentStatus({
                status: 'approved',
                message: 'Pagamento aprovado!',
                isPolling: false
              });
              
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
              
              toast.success('Pagamento PIX confirmado!');
              onPaymentConfirmed();
            } else if (result.status === 'rejected') {
              setPaymentStatus({
                status: 'rejected',
                message: 'Pagamento rejeitado.',
                isPolling: false
              });
              
              if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
              }
            }
          }
        } catch (error) {
          console.warn('Erro ao verificar status do pagamento:', error);
        }
      }, 5000); // Verificar a cada 5 segundos
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [qrCode, amount, timeLeft, onPaymentConfirmed]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (text: string, type: 'code' | 'qr') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'code') {
        setCopiedCode(true);
        toast.success('Código PIX copiado!');
        setTimeout(() => setCopiedCode(false), 2000);
      } else {
        setCopiedQr(true);
        toast.success('QR Code copiado!');
        setTimeout(() => setCopiedQr(false), 2000);
      }
    } catch (error) {
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'cancelled':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <CreditCard className="h-4 w-4" />;
      case 'cancelled':
        return <Clock className="h-4 w-4" />;
      default:
        return <Smartphone className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          Pagamento PIX
        </CardTitle>
        <CardDescription>
          Escaneie o QR Code ou copie o código PIX para pagar
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Status do Pagamento */}
        <Alert className={getStatusColor(paymentStatus.status)}>
          <div className="flex items-center gap-2">
            {getStatusIcon(paymentStatus.status)}
            <AlertDescription className="font-medium">
              {paymentStatus.message}
            </AlertDescription>
          </div>
          {paymentStatus.isPolling && (
            <div className="mt-2 flex items-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
              <span className="text-xs">Verificando pagamento...</span>
            </div>
          )}
        </Alert>

        {/* Timer */}
        {timeLeft > 0 && (
          <div className="flex items-center justify-center gap-2 p-3 bg-muted rounded-lg">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-mono">
              Tempo restante: {formatTime(timeLeft)}
            </span>
          </div>
        )}

        {/* QR Code */}
        {qrCodeBase64 && paymentStatus.status === 'pending' && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="font-medium mb-2">Escaneie o QR Code</h3>
              <div className="inline-block p-4 bg-white rounded-lg border-2 border-dashed border-muted-foreground/25">
                <img
                  src={`data:image/png;base64,${qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-48 h-48"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Abra o app do seu banco e escaneie o código
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(qrCodeBase64, 'qr')}
                className="flex-1"
              >
                {copiedQr ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    QR Code Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar QR Code
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <Separator />

        {/* Código PIX */}
        {paymentStatus.status === 'pending' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Ou copie o código PIX</h3>
              <div className="relative">
                <div className="p-3 bg-muted rounded-lg border font-mono text-sm break-all">
                  {qrCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(qrCode, 'code')}
                  className="absolute top-2 right-2"
                >
                  {copiedCode ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Informações do Pagamento */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Valor:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: currency
              }).format(amount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Método:</span>
            <Badge variant="secondary">PIX</Badge>
          </div>
          {expiresAt && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expira em:</span>
              <span className="text-sm">
                {expiresAt.toLocaleString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        {/* Instruções */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Abra o app do seu banco</p>
          <p>• Escaneie o QR Code ou cole o código PIX</p>
          <p>• Confirme o pagamento</p>
          <p>• Aguarde a confirmação automática</p>
        </div>
      </CardContent>
    </Card>
  );
}

