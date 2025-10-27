'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Calendar, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BoletoPaymentDisplayProps {
  paymentId: string;
  amount: number;
  barcode: string;
  dueDate: string;
  downloadUrl: string;
}

type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export function BoletoPaymentDisplay({ 
  paymentId, 
  amount, 
  barcode, 
  dueDate,
  downloadUrl 
}: BoletoPaymentDisplayProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<PaymentStatus>('pending');
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      // Fazer download do PDF
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Falha ao baixar boleto');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boleto-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Boleto baixado',
        description: 'Boleto baixado com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao baixar boleto',
        description: 'Tente novamente mais tarde',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyBarcode = () => {
    if (barcode) {
      navigator.clipboard.writeText(barcode);
      toast({
        title: 'Código de barras copiado!',
        description: 'Código copiado para a área de transferência.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Info */}
      <div className="bg-muted p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Valor:</span>
          <span className="text-lg font-bold">R$ {amount.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Vencimento:
          </span>
          <span className="font-medium">{new Date(dueDate).toLocaleDateString('pt-BR')}</span>
        </div>

        {status === 'pending' && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Aguardando pagamento
            </span>
          </div>
        )}

        {status === 'approved' && (
          <Alert className="border-green-500 bg-green-50">
            <AlertDescription className="text-green-800">
              Boleto pago com sucesso!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Barcode */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm font-medium mb-2">Código de Barras</p>
          <div className="font-mono text-sm break-all bg-muted p-3 rounded">
            {barcode}
          </div>
          
          <Button
            onClick={handleCopyBarcode}
            variant="outline"
            className="mt-3 w-full"
          >
            Copiar código de barras
          </Button>
        </div>

        {/* Download Button */}
        <Button
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="w-full"
          variant="default"
        >
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Baixando...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Baixar Boleto (PDF)
            </>
          )}
        </Button>
      </div>

      {/* Instructions */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Como pagar o boleto:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
            <li>Baixe o boleto em PDF ou copie o código de barras</li>
            <li>Acesse o site ou app do seu banco</li>
            <li>Selecione "Pagar Boleto" ou "Código de Barras"</li>
            <li>Pague até a data de vencimento</li>
            <li>A compensação pode levar até 3 dias úteis</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Warning */}
      <Alert variant="default">
        <AlertDescription>
          <strong>Atenção:</strong> O boleto vence em{' '}
          {new Date(dueDate).toLocaleDateString('pt-BR')}. Após o vencimento, 
          entre em contato conosco para gerar uma nova cobrança.
        </AlertDescription>
      </Alert>
    </div>
  );
}

