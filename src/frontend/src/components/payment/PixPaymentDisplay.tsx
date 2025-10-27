'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Check, Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';

interface PixPaymentDisplayProps {
  paymentId: string;
  amount: number;
  onPaymentSuccess: (paymentId: string) => void;
}

type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export function PixPaymentDisplay({ 
  paymentId, 
  amount, 
  onPaymentSuccess 
}: PixPaymentDisplayProps) {
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState<string>('');
  const [pixCode, setPixCode] = useState<string>('');
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [copied, setCopied] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);

  // Fetch PIX payment data
  useEffect(() => {
    async function fetchPixData() {
      try {
        const response = await fetch(`/api/payments/mercadopago/pix/${paymentId}`);
        if (!response.ok) throw new Error('Falha ao buscar dados PIX');
        
        const data = await response.json();
        if (data.success) {
          setQrCode(data.data.qrCode || '');
          setPixCode(data.data.qrCodeBase64 || '');
          setStatus(data.data.status);
          setExpiresAt(new Date(data.data.expiresAt));
        }
      } catch (error) {
        console.error('Error fetching PIX data:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar PIX',
          description: 'Tente novamente mais tarde'
        });
      }
    }

    if (paymentId) {
      fetchPixData();
    }
  }, [paymentId, toast]);

  // Polling para verificar status do pagamento
  useEffect(() => {
    if (!isPolling || status !== 'pending') return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/mercadopago/pix/${paymentId}/status`);
        if (!response.ok) return;

        const data = await response.json();
        const currentStatus = data.data?.status;

        if (currentStatus !== status) {
          setStatus(currentStatus);
          
          if (currentStatus === 'approved') {
            setIsPolling(false);
            toast({
              title: 'Pagamento confirmado!',
              description: 'Seu PIX foi processado com sucesso.',
            });
            onPaymentSuccess(paymentId);
          } else if (currentStatus === 'rejected') {
            setIsPolling(false);
            toast({
              variant: 'destructive',
              title: 'Pagamento rejeitado',
              description: 'Verifique os dados e tente novamente.',
            });
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 5000); // Poll a cada 5 segundos

    return () => clearInterval(interval);
  }, [isPolling, status, paymentId, onPaymentSuccess, toast]);

  const handleCopyCode = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({
        title: 'Código copiado!',
        description: 'Código PIX copiado para a área de transferência.',
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <div className="flex flex-col items-center space-y-4">
        <div className="bg-white p-6 rounded-lg border-2 border-dashed border-gray-300 max-w-md w-full">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Escaneie o QR Code
          </h3>
          
          {qrCode ? (
            <div className="flex justify-center">
              <QRCodeSVG value={qrCode} size={256} />
            </div>
          ) : (
            <div className="flex justify-center items-center h-64">
              <Skeleton className="h-64 w-64" />
            </div>
          )}
        </div>

        {/* Copy Button */}
        {pixCode && (
          <Button
            onClick={handleCopyCode}
            variant="outline"
            className="w-full max-w-md"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Código copiado!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar código PIX
              </>
            )}
          </Button>
        )}
      </div>

      {/* Payment Info */}
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Valor:</span>
          <span className="font-semibold">R$ {amount.toFixed(2)}</span>
        </div>
        
        {status === 'pending' && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aguardando pagamento
              </span>
            </div>
            
            {expiresAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Expira em:</span>
                <span className="font-medium">
                  {Math.ceil((expiresAt.getTime() - Date.now()) / 60000)} min
                </span>
              </div>
            )}
          </>
        )}

        {status === 'approved' && (
          <Alert className="border-green-500 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Pagamento confirmado com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {status === 'rejected' && (
          <Alert variant="destructive">
            <AlertDescription>
              Pagamento não pôde ser processado. Tente novamente.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Instructions */}
      <Alert>
        <QrCode className="h-4 w-4" />
        <AlertDescription>
          <strong>Como pagar:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Abra o app do seu banco</li>
            <li>Escaneie o QR Code ou copie o código PIX</li>
            <li>Confirme o pagamento</li>
            <li>O status será atualizado automaticamente</li>
          </ol>
        </AlertDescription>
      </Alert>
    </div>
  );
}

