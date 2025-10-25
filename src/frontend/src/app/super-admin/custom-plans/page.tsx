'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Crown,
  Plus,
  Edit,
  Eye,
  Copy,
  Trash2,
  Search,
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
import { Skeleton } from '@/components/ui/skeleton';
import { PlanTypeBadge } from '@/components/plan/plan-badge';
import { FeatureList } from '@/components/plan/feature-badge';
import { toastUtils } from '@/lib/toast-utils';

interface CustomPlan {
  id: string;
  plan: string;
  displayName: string;
  tenantType: 'individual' | 'business';
  tenantId: string;
  tenantName: string;
  limits: Record<string, number>;
  price: number;
  extraSlotPrice: Record<string, number>;
  features: Record<string, boolean>;
  contractTerms?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  _count: {
    tenants: number;
  };
}

interface CustomPlansResponse {
  plans: CustomPlan[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function CustomPlansPage() {
  const [plans, setPlans] = useState<CustomPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    tenantType: 'all',
    isActive: 'all',
    createdBy: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchCustomPlans = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (pagination?.page || 1).toString(),
        limit: (pagination?.limit || 20).toString(),
        isCustom: 'true',
        ...(search && { search }),
        ...(filters.tenantType && filters.tenantType !== 'all' && { tenantType: filters.tenantType }),
        ...(filters.isActive && filters.isActive !== 'all' && { isActive: filters.isActive }),
        ...(filters.createdBy && filters.createdBy !== 'all' && { createdBy: filters.createdBy })
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
        // Ensure pagination has all required properties with fallbacks
        setPagination({
          page: data.pagination?.page || 1,
          limit: data.pagination?.limit || 20,
          total: data.pagination?.total || 0,
          pages: data.pagination?.pages || 0
        });
      } else {
        console.error('Failed to fetch custom plans:', response.status, response.statusText);
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
      console.error('Error fetching custom plans:', error);
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
  }, [search, filters, pagination?.page, pagination?.limit]);

  useEffect(() => {
    fetchCustomPlans();
  }, [fetchCustomPlans]);

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
        fetchCustomPlans();
        toastUtils.plan.activated(plan.displayName);
      } else {
        toastUtils.plan.error('atualizar');
      }
    } catch (error) {
      toastUtils.plan.error('atualizar');
    }
  };

  const handleDuplicate = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    try {
      const response = await fetch(`/api/super-admin/custom-plans/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      if (response.ok) {
        fetchCustomPlans();
        toastUtils.plan.duplicated(plan.displayName);
      } else {
        toastUtils.plan.error('duplicar');
      }
    } catch (error) {
      toastUtils.plan.error('duplicar');
    }
  };

  const handleDelete = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    if (!confirm('Tem certeza que deseja desativar este plano customizado?')) return;

    try {
      const response = await fetch(`/api/super-admin/plan-configs/${planId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchCustomPlans();
        toastUtils.plan.deactivated(plan.displayName);
      } else {
        toastUtils.plan.error('desativar');
      }
    } catch (error) {
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
      .filter(([, value]) => value > 0)
      .map(([role, value]) => `${role}: ${value === -1 ? '∞' : value}`)
      .join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Planos Customizados</h1>
          <p className="text-muted-foreground">
            Gerencie planos personalizados criados para tenants específicos
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/tenants">
            <Plus className="h-4 w-4 mr-2" />
            Criar Novo Plano
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtre os planos customizados por tipo de tenant, status e criador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Nome do plano ou tenant..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="createdBy">Criado por</Label>
              <Select
                value={filters.createdBy}
                onValueChange={(value) => setFilters({ ...filters, createdBy: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="super-admin">Super Admin</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card>
        {loading ? (
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        ) : (
          <div className="divide-y divide-border">
            {plans?.map((plan) => (
              <Card key={plan.id} className="border-0 rounded-none">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Crown className="h-8 w-8 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-lg font-medium text-foreground">
                            {plan.displayName}
                          </h3>
                          <PlanTypeBadge tenantType={plan.tenantType} size="sm" />
                          {plan.isActive ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Tenant: {plan.tenantName}</span>
                          <span>Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>
                          <span>Por: {plan.createdBy}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatPrice(plan.price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan._count.tenants} tenant(s) usando
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatLimits(plan.limits)}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/super-admin/plan-configs/${plan.id}`} title="Ver detalhes">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/super-admin/plan-configs/${plan.id}/edit`} title="Editar">
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          onClick={() => handleDuplicate(plan.id)}
                          variant="ghost"
                          size="sm"
                          title="Duplicar"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleToggleActive(plan.id, plan.isActive)}
                          variant={plan.isActive ? "destructive" : "default"}
                          size="sm"
                          title={plan.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {plan.isActive ? (
                            <XCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          onClick={() => handleDelete(plan.id)}
                          variant="destructive"
                          size="sm"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Features */}
                  <div className="mt-4">
                    <FeatureList features={plan.features} size="sm" />
                  </div>

                  {/* Contract Terms */}
                  {plan.contractTerms && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-md">
                      <h4 className="text-sm font-medium text-foreground mb-1">
                        Condições Especiais
                      </h4>
                      <p className="text-sm text-muted-foreground">{plan.contractTerms}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Empty State */}
      {!loading && (!plans || plans.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhum plano customizado encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {Object.values(filters).some(f => f !== 'all') || search
                ? 'Tente ajustar os filtros para ver mais resultados.'
                : 'Comece criando seu primeiro plano customizado.'
              }
            </p>
            <Button asChild>
              <Link href="/super-admin/tenants">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
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
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    até{' '}
                    <span className="font-medium text-foreground">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    de{' '}
                    <span className="font-medium text-foreground">{pagination.total}</span> resultados
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(pagination.pages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      onClick={() => setPagination({ ...pagination, page: i + 1 })}
                      variant={pagination.page === i + 1 ? "default" : "outline"}
                      size="sm"
                      className="w-10"
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page === pagination.pages}
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
