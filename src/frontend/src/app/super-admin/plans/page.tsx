'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  CreditCard, 
  Plus,
  Edit,
  Trash2,
  Eye,
  Settings,
  Crown,
  Building2,
  User,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanBadge, PlanTypeBadge } from '@/components/plan/plan-badge';
import { FeatureList } from '@/components/plan/feature-badge';
import { toastUtils } from '@/lib/toast-utils';

interface PlanConfig {
  id: string;
  plan: string;
  displayName: string;
  tenantType: 'individual' | 'business';
  isCustom: boolean;
  limits: Record<string, number>;
  price: number;
  extraSlotPrice: Record<string, number>;
  features: Record<string, boolean>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    tenants: number;
  };
}

interface PlansResponse {
  plans: PlanConfig[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tenantType: 'all',
    isCustom: 'all',
    isActive: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination?.page?.toString() || '1',
        limit: pagination?.limit?.toString() || '20',
        ...(filters.tenantType && filters.tenantType !== 'all' && { tenantType: filters.tenantType }),
        ...(filters.isCustom && filters.isCustom !== 'all' && { isCustom: filters.isCustom }),
        ...(filters.isActive && filters.isActive !== 'all' && { isActive: filters.isActive })
      });

      const response = await fetch(`/api/super-admin/plan-configs?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const result = await response.json();
        const data = result.data || result; // Suporte para ambos os formatos
        setPlans(data.plans || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
      } else {
        console.error('Failed to fetch plans:', response.status, response.statusText);
        if (response.status === 401) {
          console.error('Usuário não autenticado');
        } else if (response.status === 403) {
          console.error('Acesso negado - apenas super administradores');
        }
        setPlans([]);
        setPagination({
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        });
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination?.page, pagination?.limit]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleToggleActive = async (planId: string, isActive: boolean) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    try {
      const response = await fetch(`/api/super-admin/plan-configs/${planId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (response.ok) {
        fetchPlans();
        toastUtils.plan.activated(plan.displayName);
      } else {
        toastUtils.plan.error('atualizar');
      }
    } catch (error) {
      console.error('Error toggling plan:', error);
      toastUtils.plan.error('atualizar');
    }
  };

  const handleDelete = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!confirm('Tem certeza que deseja desativar este plano?')) return;

    try {
      const response = await fetch(`/api/super-admin/plan-configs/${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchPlans();
        toastUtils.plan.deactivated(plan.displayName);
      } else {
        toastUtils.plan.error('desativar');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toastUtils.plan.error('desativar');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatLimits = (limits: Record<string, number>) => {
    return Object.entries(limits)
      .filter(([_, value]) => value > 0)
      .map(([role, value]) => `${role}: ${value === -1 ? '∞' : value}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Planos</h1>
          <p className="text-muted-foreground">
            Gerencie planos base e customizados do sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/plans/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os planos por tipo de tenant, tipo de plano e status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tenantType">Tipo de Tenant</Label>
              <Select
                value={filters.tenantType}
                onValueChange={(value) => setFilters({ ...filters, tenantType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="business">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isCustom">Tipo de Plano</Label>
              <Select
                value={filters.isCustom}
                onValueChange={(value) => setFilters({ ...filters, isCustom: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="false">Base</SelectItem>
                  <SelectItem value="true">Customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Status</Label>
              <Select
                value={filters.isActive}
                onValueChange={(value) => setFilters({ ...filters, isActive: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Ativo</SelectItem>
                  <SelectItem value="false">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <PlanTypeBadge tenantType={plan.tenantType} size="sm" />
                    <PlanBadge plan={plan.plan} isCustom={plan.isCustom} size="sm" />
                  </div>
                  <div className="flex items-center space-x-1">
                    {plan.isActive ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <CardTitle className="text-xl">
                  {plan.displayName}
                </CardTitle>

                <div className="text-3xl font-bold text-primary">
                  {formatPrice(plan.price)}
                  <span className="text-sm font-normal text-muted-foreground">/mês</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Limites</h4>
                  <p className="text-sm text-muted-foreground">{formatLimits(plan.limits)}</p>
                </div>

                {Object.keys(plan.extraSlotPrice).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Slots Extras</h4>
                    <p className="text-sm text-muted-foreground">
                      {Object.entries(plan.extraSlotPrice)
                        .map(([role, price]) => `${role}: ${formatPrice(price)}`)
                        .join(', ')}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Features</h4>
                  <FeatureList features={plan.features} size="sm" />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{plan._count.tenants} tenants usando</span>
                  <Badge variant="secondary">
                    {plan.isCustom ? 'Customizado' : 'Base'}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/super-admin/plans/${plan.id}`}>
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" size="sm" className="flex-1">
                    <Link href={`/super-admin/plans/${plan.id}/edit`}>
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Link>
                  </Button>

                  <Button
                    onClick={() => handleToggleActive(plan.id, plan.isActive)}
                    variant={plan.isActive ? "destructive" : "default"}
                    size="sm"
                  >
                    {plan.isActive ? 'Desativar' : 'Ativar'}
                  </Button>

                  {plan.isCustom && (
                    <Button
                      onClick={() => handleDelete(plan.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum plano encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {Object.values(filters).some(f => f) 
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Comece criando seu primeiro plano.'
              }
            </p>
            <Button asChild>
              <Link href="/super-admin/plans/new">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination?.pages && pagination.pages > 1 && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setPagination({ ...pagination, page: (pagination?.page || 1) - 1 })}
                  disabled={!pagination?.page || pagination.page === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  onClick={() => setPagination({ ...pagination, page: (pagination?.page || 1) + 1 })}
                  disabled={!pagination?.page || !pagination?.pages || pagination.page === pagination.pages}
                  variant="outline"
                  size="sm"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Mostrando{' '}
                    <span className="font-medium text-foreground">
                      {((pagination?.page || 1) - 1) * (pagination?.limit || 20) + 1}
                    </span>{' '}
                    até{' '}
                    <span className="font-medium text-foreground">
                      {Math.min((pagination?.page || 1) * (pagination?.limit || 20), pagination?.total || 0)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium text-foreground">{pagination?.total || 0}</span> resultados
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => setPagination({ ...pagination, page: (pagination?.page || 1) - 1 })}
                    disabled={!pagination?.page || pagination.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(pagination?.pages || 0)].map((_, i) => (
                    <Button
                      key={i + 1}
                      onClick={() => setPagination({ ...pagination, page: i + 1 })}
                      variant={(pagination?.page || 1) === i + 1 ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setPagination({ ...pagination, page: (pagination?.page || 1) + 1 })}
                    disabled={!pagination?.page || !pagination?.pages || pagination.page === pagination.pages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
