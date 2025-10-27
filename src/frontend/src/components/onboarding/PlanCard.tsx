'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import type { Plan } from '@/hooks/use-plans';
import { formatCurrency } from '@/lib/utils/currency';

interface PlanCardProps {
  plan: Plan;
  onSelect: (planId: string) => void;
  isSelected?: boolean;
}

export function PlanCard({ plan, onSelect, isSelected = false }: PlanCardProps) {
  return (
    <Card 
      className={`relative transition-all hover:shadow-lg ${
        plan.highlight ? 'border-primary shadow-md scale-105' : ''
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Badge "Mais Popular" */}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant="default" className="px-3 py-1">
            Mais Popular
          </Badge>
        </div>
      )}

      <CardHeader className="space-y-4 pb-6">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
          <CardDescription className="text-base">
            Plano {plan.interval === 'monthly' ? 'mensal' : 'anual'}
          </CardDescription>
        </div>

        {/* Preço */}
        <div className="space-y-1">
          <div className="text-3xl font-bold text-primary">
            {formatCurrency(plan.price)}
          </div>
          <div className="text-sm text-muted-foreground">
            /{plan.interval === 'monthly' ? 'mês' : 'ano'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Limites */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Usuários</span>
            <span className="font-medium">{plan.limits.users === -1 ? 'Ilimitado' : plan.limits.users}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Clientes</span>
            <span className="font-medium">{plan.limits.clients === -1 ? 'Ilimitado' : plan.limits.clients}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Armazenamento</span>
            <span className="font-medium">{plan.limits.storageGB === -1 ? 'Ilimitado' : `${plan.limits.storageGB} GB`}</span>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 border-t pt-4">
          <h4 className="font-semibold text-sm mb-2">Recursos inclusos:</h4>
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={plan.highlight ? 'default' : 'outline'}
          onClick={() => onSelect(plan.id)}
        >
          {isSelected ? 'Selecionado' : 'Escolher Plano'}
        </Button>
      </CardFooter>
    </Card>
  );
}

