'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/use-subscription';
import { useState } from 'react';
import { Loader2, XCircle, AlertTriangle, Gift } from 'lucide-react';

interface CancelSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CancelSubscriptionModal({ isOpen, onClose }: CancelSubscriptionModalProps) {
  const { subscription, mutate } = useSubscription();
  const [reason, setReason] = useState<string>('');
  const [feedback, setFeedback] = useState('');
  const [password, setPassword] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!reason || !password) return;

    setIsCancelling(true);
    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          feedback
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao cancelar assinatura');
      }

      await mutate();
      onClose();
    } catch (error) {
      console.error('Cancel error:', error);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Cancelar Assinatura
          </DialogTitle>
          <DialogDescription>
            Cancelar sua assinatura do FitOS
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Sua assinatura será cancelada ao final do período atual.
            Você terá acesso completo até{' '}
            {subscription
              ? new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')
              : 'o fim do período'}
          </AlertDescription>
        </Alert>

        {/* Retenção */}
        <Alert variant="default">
          <Gift className="h-4 w-4" />
          <AlertTitle>Gostaria de manter sua assinatura?</AlertTitle>
          <AlertDescription>
            Oferecemos desconto de 50% nos próximos 3 meses para mantê-lo conosco.
            Caso tenha algum problema, estamos aqui para ajudar!
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="reason">Motivo do Cancelamento</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price">Muito caro</SelectItem>
                <SelectItem value="features">Faltam funcionalidades</SelectItem>
                <SelectItem value="competitor">Mudando para outro serviço</SelectItem>
                <SelectItem value="need">Não preciso mais</SelectItem>
                <SelectItem value="support">Problemas com suporte</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="feedback">Comentários (opcional)</Label>
            <Textarea
              id="feedback"
              placeholder="Conte-nos mais sobre sua experiência..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="password">Confirmar Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Digite sua senha para confirmar"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCancelling}>
            Manter Assinatura
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={!reason || !password || isCancelling}
          >
            {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancelar Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

