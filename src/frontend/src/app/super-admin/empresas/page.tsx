'use client';

import React, { useState, useEffect, useCallback } from 'react';

// Configurações para evitar problemas de SSR com useAuth
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
import Link from 'next/link';
import { 
  Building2, 
  Eye, 
  Edit, 
  Trash2, 
  Power, 
  Ban, 
  CreditCard,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
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
import { toastUtils } from '@/lib/toast-utils';
import { EmpresaForm } from '@/components/super-admin/empresas/empresa-form';
import { Plus } from 'lucide-react';

interface Empresa {
  id: string;
  name: string;
  tenantType: 'individual' | 'business';
  subdomain?: string;
  customDomain?: string;
  plan: string;
  status: 'active' | 'inactive' | 'suspended';
  billingEmail: string;
  createdAt: string;
  updatedAt: string;
  _count: { 
    users: number; 
    members: number; 
  };
  stats?: {
    userCounts: Record<string, number>;
    limits: Record<string, number>;
    features: Record<string, boolean>;
    isCustomPlan: boolean;
  };
}

interface EmpresasResponse {
  tenants: Empresa[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
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

  const fetchEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(filters.tenantType && filters.tenantType !== 'all' && { tenantType: filters.tenantType }),
        ...(filters.hasCustomPlan && filters.hasCustomPlan !== 'all' && { hasCustomPlan: filters.hasCustomPlan }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status })
      });

      console.log('Fetching empresas with params:', params.toString());
      
      const accessToken = localStorage.getItem('accessToken');
      console.log('Empresas: Access token:', accessToken ? 'existe' : 'não existe');
      
      if (!accessToken) {
        setError('Token de acesso não encontrado. Faça login novamente.');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/super-admin/tenants?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        
        // Check if data structure is correct
        if (!data || !data.data) {
          console.error('Invalid response structure:', data);
          setError('Estrutura de resposta inválida do servidor.');
          setEmpresas([]);
          return;
        }
        
        const result: EmpresasResponse = data.data;
        
        // Validate result structure
        if (!result || !Array.isArray(result.tenants) || !result.pagination) {
          console.error('Invalid result structure:', result);
          setError('Dados de empresas inválidos recebidos do servidor.');
          setEmpresas([]);
          return;
        }
        
        setEmpresas(result.tenants);
        setPagination(result.pagination);
      } else {
        // Try to get error details from response
        let errorMessage = `Erro ao buscar empresas: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = errorData.error.message;
          }
        } catch (e) {
          // If we can't parse the error response, use the status-based message
        }
        
        if (response.status === 401) {
          setError('Usuário não autenticado. Faça login para continuar.');
        } else if (response.status === 403) {
          setError('Acesso negado. Apenas super administradores podem acessar esta funcionalidade.');
        } else if (response.status === 500) {
          setError('Erro interno do servidor. Tente novamente em alguns minutos.');
        } else {
          setError(errorMessage);
        }
        setEmpresas([]);
      }
    } catch (error) {
      console.error('Error fetching empresas:', error);
      setError('Erro de conexão. Verifique sua internet e tente novamente.');
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  }, [search, filters, pagination.page, pagination.limit]);

  const retryFetch = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    fetchEmpresas();
  }, [fetchEmpresas]);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  const handleToggleStatus = async (id: string, newStatus: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toastUtils.user.statusError('Token de acesso não encontrado');
        return;
      }

      const response = await fetch(`/api/super-admin/tenants/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchEmpresas();
        const statusText = newStatus === 'active' ? 'ativada' : newStatus === 'inactive' ? 'inativada' : 'suspensa';
        toastUtils.user.statusChanged('Empresa', statusText as any);
      } else {
        const error = await response.json();
        toastUtils.user.statusError(error.error?.message);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toastUtils.user.statusError();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        toastUtils.user.deleteError('Token de acesso não encontrado');
        return;
      }

      const response = await fetch(`/api/super-admin/tenants/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        fetchEmpresas();
        toastUtils.user.deleted('Empresa');
      } else {
        const error = await response.json();
        toastUtils.user.deleteError(error.error?.message);
      }
    } catch (error) {
      console.error('Error deleting empresa:', error);
      toastUtils.user.deleteError();
    }
  };

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

  const getPlanBadge = (empresa: Empresa) => {
    if (empresa.stats?.isCustomPlan) {
      return (
        <Badge variant="outline" className="border-orange-200 text-orange-800 bg-orange-50">
          Plano Customizado
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
        {planNames[empresa.plan] || empresa.plan}
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
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Empresas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as empresas e clientes cadastrados no FitOS
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Criar Empresa
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
            Filtre as empresas por tipo, plano e status
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
                  <SelectItem value="business">Empresa</SelectItem>
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

              {/* Error Message */}
              {error && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="h-5 w-5" />
                        <p className="font-medium">{error}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={retryFetch}
                        disabled={loading}
                      >
                        Tentar Novamente
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Se você é um super administrador, faça login para acessar esta funcionalidade.
                      {retryCount > 0 && ` (Tentativa ${retryCount})`}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Empresas Table */}
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
                  <TableHead>Empresa</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usuários</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {empresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Nenhuma empresa encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  empresas.map((empresa) => (
                    <TableRow
                      key={empresa.id}
                      onClick={() => {
                        setSelectedEmpresa(empresa);
                        setEditDialogOpen(true);
                      }}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{empresa.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {empresa.billingEmail}
                            </div>
                            {empresa.subdomain && (
                              <div className="text-sm text-muted-foreground">
                                {empresa.subdomain}.fitos.com
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {empresa.tenantType === 'individual' ? 'Pessoa Física' : 'Empresa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPlanBadge(empresa)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(empresa.status)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {empresa.stats?.userCounts && Object.entries(empresa.stats.userCounts).map(([role, count]) => {
                            const limit = empresa.stats?.limits?.[role] || -1;
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
                          {new Date(empresa.createdAt).toLocaleDateString('pt-BR')}
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
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/super-admin/empresas/${empresa.id}`;
                              }}
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEmpresa(empresa);
                                setEditDialogOpen(true);
                              }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(empresa.id, 
                                empresa.status === 'active' ? 'inactive' : 'active');
                              }}
                            >
                              <Power className="mr-2 h-4 w-4" />
                              {empresa.status === 'active' ? 'Inativar' : 'Ativar'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleStatus(empresa.id, 'suspended');
                              }}
                              className="text-orange-600"
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspender
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleDelete(empresa.id); }}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
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

      {/* Dialog de Criar Empresa */}
      <EmpresaForm
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchEmpresas();
          setCreateDialogOpen(false);
        }}
      />

      {/* Dialog de Editar Empresa */}
      <EmpresaForm
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedEmpresa(null);
          }
        }}
        empresa={selectedEmpresa || undefined}
        onSuccess={() => {
          fetchEmpresas();
          setEditDialogOpen(false);
          setSelectedEmpresa(null);
        }}
      />
    </div>
  );
}
