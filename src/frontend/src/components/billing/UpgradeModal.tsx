'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { subscription, mutate } = useSubscription();
  const { plans, isLoading: plansLoading } = usePlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!subscription || !plans) {
    return null;
  }

  const currentPlan = plans.find(p => p.id === subscription.planId);
  const selectedPlan = selectedPlanId ? plans.find(p => p.id === selectedPlanId) : null;

  const handleUpgrade = async () => {
    if (!selectedPlanId) return;

    setIsUpgrading(true);
    try {
      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPlanId: selectedPlanId
        })
      });

      if (!res.ok) {
        throw new Error('Erro ao fazer upgrade');
      }

      await mutate();
      onClose();
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fazer Upgrade
          </DialogTitle>
          <DialogDescription>
            Escolha um plano superior para desbloquear mais recursos
          </DialogDescription>
        </DialogHeader>

        {plansLoading ? (
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {plans
              .filter(plan => plan.price > (currentPlan?.price || 0))
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedPlanId === plan.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{plan.name}</h3>
                      <Badge variant="outline" className="mt-1">
                        {formatCurrency(plan.price, 'BRL')}/{plan.interval === 'monthly' ? 'mês' : 'ano'}
                      </Badge>
                    </div>
                    <input
                      type="radio"
                      checked={selectedPlanId === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {plan.features.slice(0, 3).join(', ')}
                  </p>
                </div>
              ))}
          </div>
        )}

        {selectedPlan && (
          <Alert>
            <AlertDescription>
              <strong>Diferença de preço:</strong> {formatCurrency(
                selectedPlan.price - (currentPlan?.price || 0),
                'BRL'
              )}/mês
              <br />
              <strong>Valor prorata para hoje:</strong> {formatCurrency(
                ((selectedPlan.price - (currentPlan?.price || 0)) * 0.03), // Exemplo 3% do período
                'BRL'
              )}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUpgrading}>
            Cancelar
          </Button>
          <Button onClick={handleUpgrade} disabled={!selectedPlanId || isUpgrading}>
            {isUpgrading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Upgrade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

