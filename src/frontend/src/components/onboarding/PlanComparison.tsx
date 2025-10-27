'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X } from 'lucide-react';
import type { Plan } from '@/hooks/use-plans';
import { formatCurrency } from '@/lib/utils/currency';

interface PlanComparisonProps {
  plans: Plan[];
}

export function PlanComparison({ plans }: PlanComparisonProps) {
  // Features para comparar
  const comparisonFeatures = [
    'Usuários',
    'Clientes',
    'Armazenamento (GB)',
    'API Calls/mês',
    ...plans.flatMap(p => p.features)
  ].filter((f, i, arr) => arr.indexOf(f) === i); // Remove duplicatas

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">Recursos</TableHead>
            {plans.map((plan) => (
              <TableHead key={plan.id} className="text-center font-semibold">
                {plan.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Preços */}
          <TableRow className="bg-muted/50">
            <TableCell className="font-semibold">Preço</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan.id} className="text-center font-bold text-lg">
                {formatCurrency(plan.price)}
                <span className="text-sm text-muted-foreground font-normal">/{plan.interval === 'monthly' ? 'mês' : 'ano'}</span>
              </TableCell>
            ))}
          </TableRow>

          {/* Limites de Usuários */}
          <TableRow>
            <TableCell>Usuários</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan.id} className="text-center">
                {plan.limits.users === -1 ? 'Ilimitado' : plan.limits.users}
              </TableCell>
            ))}
          </TableRow>

          {/* Limites de Clientes */}
          <TableRow>
            <TableCell>Clientes</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan.id} className="text-center">
                {plan.limits.clients === -1 ? 'Ilimitado' : plan.limits.clients}
              </TableCell>
            ))}
          </TableRow>

          {/* Armazenamento */}
          <TableRow>
            <TableCell>Armazenamento</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan.id} className="text-center">
                {plan.limits.storageGB === -1 ? 'Ilimitado' : `${plan.limits.storageGB} GB`}
              </TableCell>
            ))}
          </TableRow>

          {/* API Calls */}
          <TableRow>
            <TableCell>API Calls</TableCell>
            {plans.map((plan) => (
              <TableCell key={plan.id} className="text-center">
                {plan.limits.apiCalls === -1 ? 'Ilimitado' : `${plan.limits.apiCalls}/mês`}
              </TableCell>
            ))}
          </TableRow>

          {/* Features individuais */}
          {plans.flatMap(p => p.features).filter((f, i, arr) => arr.indexOf(f) === i).map((feature) => (
            <TableRow key={feature}>
              <TableCell>{feature}</TableCell>
              {plans.map((plan) => (
                <TableCell key={plan.id} className="text-center">
                  {plan.features.includes(feature) ? (
                    <Check className="h-5 w-5 text-primary mx-auto" />
                  ) : (
                    <X className="h-5 w-5 text-muted-foreground mx-auto" />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

