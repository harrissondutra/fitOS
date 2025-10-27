'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubscription } from '@/hooks/use-subscription';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CreditCard, TrendingUp, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/currency';

export default function BillingPage() {
  const { subscription, isLoading, error } = useSubscription();
  const { hasPermission } = usePermissions();
  const router = useRouter();

  // Verificar permissões (SUPER_ADMIN, OWNER, ADMIN)
  if (!hasPermission(['SUPER_ADMIN', 'OWNER', 'ADMIN'])) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="container mx-auto py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar assinatura: {error?.message || 'Assinatura não encontrada'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const usagePercentage = {
    users: (subscription.usage.users / subscription.usage.usersLimit) * 100,
    clients: (subscription.usage.clients / subscription.usage.clientsLimit) * 100,
    storage: (subscription.usage.storageGB / subscription.usage.storageLimitGB) * 100
  };

  return (
    <div className="container mx-auto py-12 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Assinatura</h1>
          <p className="text-muted-foreground">Gerencie sua assinatura e formas de pagamento</p>
        </div>
        <Badge
          variant={
            subscription.status === 'active' 
              ? 'default' 
              : subscription.status === 'past_due'
              ? 'destructive'
              : 'secondary'
          }
        >
          {subscription.status}
        </Badge>
      </div>

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Assinatura Atual</CardTitle>
          <CardDescription>{subscription.planName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Price & Billing Period */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Valor</p>
              <p className="text-2xl font-bold">
                {formatCurrency(subscription.price, 'BRL')}
              </p>
              <p className="text-sm text-muted-foreground">
                / {subscription.billingPeriod === 'monthly' ? 'mês' : 'ano'}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Período Atual</p>
              <p className="text-sm">
                {new Date(subscription.currentPeriodStart).toLocaleDateString('pt-BR')} - {' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge
                variant={subscription.status === 'active' ? 'default' : 'destructive'}
              >
                {subscription.status === 'active' ? 'Ativa' : 'Pendente'}
              </Badge>
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-4">
            <h3 className="font-semibold">Uso da Assinatura</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Usuários
                  </span>
                  <span>
                    {subscription.usage.users} / {subscription.usage.usersLimit}
                  </span>
                </div>
                <Progress value={usagePercentage.users} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Clientes
                  </span>
                  <span>
                    {subscription.usage.clients} / {subscription.usage.clientsLimit}
                  </span>
                </div>
                <Progress value={usagePercentage.clients} />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Armazenamento</span>
                  <span>
                    {subscription.usage.storageGB} GB / {subscription.usage.storageLimitGB} GB
                  </span>
                </div>
                <Progress value={usagePercentage.storage} />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button onClick={() => router.push('/billing/upgrade')}>
              <TrendingUp className="mr-2 h-4 w-4" />
              Fazer Upgrade
            </Button>
            <Button variant="outline" onClick={() => router.push('/billing/payment-methods')}>
              <CreditCard className="mr-2 h-4 w-4" />
              Gerenciar Pagamentos
            </Button>
            <Button variant="outline" onClick={() => router.push('/billing/invoices')}>
              Ver Faturas
            </Button>
            {!subscription.cancelAtPeriodEnd && (
              <Button variant="destructive" onClick={() => router.push('/billing/cancel')}>
                Cancelar Assinatura
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

