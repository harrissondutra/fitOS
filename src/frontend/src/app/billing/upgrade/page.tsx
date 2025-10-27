'use client';

import { usePlans } from '@/hooks/use-plans';
import { useSubscription } from '@/hooks/use-subscription';
import { usePermissions } from '@/hooks/use-permissions';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/currency';
import Link from 'next/link';

export default function UpgradePage() {
  const router = useRouter();
  const { plans, isLoading } = usePlans();
  const { subscription } = useSubscription();
  const { hasPermission } = usePermissions();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (!hasPermission(['SUPER_ADMIN', 'OWNER', 'ADMIN'])) {
    return (
      <div className="container mx-auto py-12">
        <p className="text-center text-muted-foreground">
          Você não tem permissão para acessar esta página
        </p>
      </div>
    );
  }

  if (isLoading || !plans || !subscription) {
    return <div className="container mx-auto py-12">Carregando...</div>;
  }

  const currentPlan = plans.find(p => p.id === subscription.planId);
  const upgradePlans = plans.filter(plan => plan.price > (currentPlan?.price || 0));

  return (
    <div className="container mx-auto py-12 space-y-6">
      <Link href="/billing">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold">Fazer Upgrade</h1>
        <p className="text-muted-foreground">
          Escolha um plano superior para desbloquear mais recursos
        </p>
      </div>

      {/* Plano Atual */}
      {currentPlan && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>{currentPlan.name}</CardDescription>
              </div>
              <Badge variant="outline">Atual</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-3xl font-bold">
                {formatCurrency(currentPlan.price, 'BRL')}
              </span>
              <span className="text-muted-foreground">
                /{currentPlan.interval === 'monthly' ? 'mês' : 'ano'}
              </span>
            </div>
            <ul className="space-y-2">
              {currentPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Planos Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {upgradePlans.map((plan) => (
          <Card
            key={plan.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPlanId === plan.id
                ? 'border-primary ring-2 ring-primary'
                : ''
            }`}
            onClick={() => setSelectedPlanId(plan.id)}
          >
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                {plan.name}
                {plan.highlight && (
                  <Badge variant="default">Mais Popular</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Ideal para {plan.id === 'professional' ? 'academias' : 'rede de academias'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <span className="text-4xl font-bold">
                  {formatCurrency(plan.price, 'BRL')}
                </span>
                <span className="text-muted-foreground">
                  /{plan.interval === 'monthly' ? 'mês' : 'ano'}
                </span>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={selectedPlanId === plan.id ? 'default' : 'outline'}
                onClick={() => {
                  setSelectedPlanId(plan.id);
                  setShowUpgradeModal(true);
                }}
              >
                {selectedPlanId === plan.id ? 'Selecionado' : 'Selecionar Plano'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </div>
  );
}

