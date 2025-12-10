'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Settings,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Tenant {
  id: string;
  name: string;
  tenantType: 'individual' | 'business';
  subdomain?: string;
  customDomain?: string;
  plan: string;
  status: string;
  isCustomPlan: boolean;
  customPlan?: {
    id: string;
    displayName: string;
  };
  stats: {
    userCounts: Record<string, number>;
    limits: Record<string, number>;
    features: Record<string, boolean>;
  };
  createdAt: string;
  updatedAt: string;
}

interface TenantsResponse {
  tenants: Tenant[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    tenantType: 'all',
    hasCustomPlan: 'all',
    status: 'all'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filters.tenantType && filters.tenantType !== 'all' && { tenantType: filters.tenantType }),
        ...(filters.hasCustomPlan && filters.hasCustomPlan !== 'all' && { hasCustomPlan: filters.hasCustomPlan }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status })
      });

      const response = await fetch(`/api/super-admin/tenants?${params}`);
      if (response.ok) {
        const data: TenantsResponse = await response.json();
        setTenants(data.tenants);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Inativo
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Suspenso
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const getPlanBadge = (tenant: Tenant) => {
    if (tenant.isCustomPlan && tenant.customPlan) {
      return (
        <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">
          {tenant.customPlan.displayName}
        </Badge>
      );
    }
    
    const planNames: Record<string, string> = {
      individual: 'Pessoa Física',
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise'
    };

    return (
      <Badge variant="outline" className="border-blue-200 text-blue-800 bg-blue-50">
        {planNames[tenant.plan] || tenant.plan}
      </Badge>
    );
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0; // Ilimitado
    return Math.round((current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">
            Gerencie todos os tenants do sistema FitOS
          </p>
        </div>
        <Button asChild>
          <Link href="/super-admin/tenants/new">
            <Plus className="h-4 w-4 mr-2" />
            Novo Tenant
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
          <CardDescription>
            Filtre os tenants por tipo, plano e status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Nome ou subdomain..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Tipo
              </label>
              <Select
                value={filters.tenantType}
                onValueChange={(value) => setFilters({...filters, tenantType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="individual">Pessoa Física</SelectItem>
                  <SelectItem value="business">Profissional</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Plano Customizado
              </label>
              <Select
                value={filters.hasCustomPlan}
                onValueChange={(value) => setFilters({...filters, hasCustomPlan: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os planos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os planos</SelectItem>
                  <SelectItem value="true">Com plano customizado</SelectItem>
                  <SelectItem value="false">Sem plano customizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhum tenant encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow 
                      key={tenant.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/super-admin/tenants/${tenant.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            {tenant.subdomain && (
                              <div className="text-sm text-muted-foreground">
                                {tenant.subdomain}.fitos.com
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {tenant.tenantType === 'individual' ? 'Pessoa Física' : 'Profissional'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPlanBadge(tenant)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(tenant.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Object.entries(tenant.stats.userCounts).map(([role, count]) => {
                            const limit = tenant.stats.limits[role];
                            const percentage = getUsagePercentage(count, limit);
                            return (
                              <div key={role} className="flex items-center space-x-2 text-sm">
                                <span className="capitalize min-w-[60px]">{role}:</span>
                                <span className="font-medium">{count}</span>
                                {limit !== -1 && (
                                  <>
                                    <span className="text-muted-foreground">/</span>
                                    <span className="text-muted-foreground">{limit}</span>
                                    <div className="w-16 bg-muted rounded-full h-2">
                                      <div
                                        className={`h-2 rounded-full ${getUsageColor(percentage)}`}
                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                      ></div>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href={`/super-admin/tenants/${tenant.id}`} onClick={(e) => e.stopPropagation()}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/super-admin/tenants/${tenant.id}/edit`} onClick={(e) => e.stopPropagation()}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/super-admin/tenants/${tenant.id}/custom-plan`} onClick={(e) => e.stopPropagation()}>
                                <Settings className="mr-2 h-4 w-4" />
                                Plano customizado
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                até{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                de{' '}
                <span className="font-medium">{pagination.total}</span> resultados
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <div className="flex items-center space-x-1">
                  {[...Array(pagination.pages)].map((_, i) => (
                    <Button
                      key={i + 1}
                      variant={pagination.page === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: i + 1 })}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}