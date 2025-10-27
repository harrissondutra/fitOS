'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { useState } from 'react';
import { Loader2, TrendingDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface DowngradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DowngradeModal({ isOpen, onClose }: DowngradeModalProps) {
  const { subscription, mutate } = useSubscription();
  const { plans } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDowngrading, setIsDowngrading] = useState(false);

  if (!subscription || !plans) {
    return null;
  }

  const currentPlan = plans.find(p => p.id === subscription.planId);
  const selectedPlan = selectedPlanId ? plans.find(p => p.id === selectedPlanId) : null;

  // Filtrar planos menores que o atual
  const downgradePlans = plans.filter(plan => plan.price < (currentPlan?.price || 0));

  const handleDowngrade = async () => {
    if (!selectedPlanId || !isConfirmed) return;

    setIsDowngrading(true);
    try {
      const res = await fetch('/api/billing/downgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlanId
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao fazer downgrade');
      }

      await mutate();
      onClose();
    } catch (error) {
      console.error('Downgrade error:', error);
    } finally {
      setIsDowngrading(false);
    }
  };

  // Features que serão perdidas
  const lostFeatures = currentPlan
    ? currentPlan.features.filter(f => !selectedPlan?.features.includes(f))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Fazer Downgrade
          </DialogTitle>
          <DialogDescription>
            Atenção: downgrade será aplicado no próximo ciclo de cobrança
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Atenção</AlertTitle>
          <AlertDescription>
            Alguns recursos poderão ser perdidos com o downgrade
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-semibold">Plano Atual</h3>
          <div className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{currentPlan?.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(currentPlan?.price || 0, 'BRL')}/mês
                </p>
              </div>
            </div>
          </div>

          <h3 className="font-semibold">Escolher Novo Plano</h3>
          {downgradePlans.map((plan) => (
            <div
              key={plan.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedPlanId === plan.id
                  ? 'border-primary bg-primary/5'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setSelectedPlanId(plan.id)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{plan.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(plan.price, 'BRL')}/mês
                  </p>
                </div>
                <input
                  type="radio"
                  checked={selectedPlanId === plan.id}
                  onChange={() => setSelectedPlanId(plan.id)}
                />
              </div>
            </div>
          ))}
        </div>

        {lostFeatures.length > 0 && (
          <Alert variant="default">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Recursos que serão perdidos:</AlertTitle>
            <AlertDescription>
              <ul className="list-disc list-inside mt-2">
                {lostFeatures.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex items-start gap-2 border rounded-lg p-4">
          <Checkbox
            id="confirm-downgrade"
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <label htmlFor="confirm-downgrade" className="text-sm cursor-pointer">
            Entendo que o downgrade será aplicado no próximo ciclo de cobrança e que
            alguns recursos não estarão mais disponíveis
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDowngrading}>
            Cancelar
          </Button>
          <Button
            variant="secondary"
            onClick={handleDowngrade}
            disabled={!selectedPlanId || !isConfirmed || isDowngrading}
          >
            {isDowngrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Downgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

