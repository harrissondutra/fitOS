'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  Search, 
  Filter, 
  Play, 
  Square, 
  RotateCcw, 
  Trash2, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Server,
  Cloud,
  Package2,
  Rocket,
  Container as ContainerIcon,
  Power
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DatabaseInstance {
  id: string;
  serverId: string | null;
  tenantId: string;
  tenantName: string;
  serverName: string | null;
  serverHost: string | null;
  provider: string | null;
  externalHost: string | null;
  databaseType: 'postgresql' | 'mysql' | 'redis';
  databaseName: string;
  containerName: string | null;
  port: number;
  username: string;
  schemaName: string | null;
  status: 'active' | 'inactive' | 'error';
  createdAt: string;
  updatedAt: string;
}

interface DatabaseContainer {
  containerName: string;
  image: string;
  host: string;
  hostPort?: number;
  dbName?: string;
  username?: string;
  password?: string;
  databaseType: 'postgresql' | 'mysql' | 'redis';
  isManaged: boolean;
  instanceId?: string;
  serverId?: string;
  serverName?: string;
}

interface DatabaseListProps {
  onCreateClick?: () => void;
  refreshTrigger?: number;
}

export function DatabaseList({ onCreateClick, refreshTrigger }: DatabaseListProps) {
  const [databases, setDatabases] = useState<{
    managed: DatabaseInstance[];
    discovered: DatabaseContainer[];
  }>({ managed: [], discovered: [] });
  const [tenants, setTenants] = useState<Array<{ id: string; name: string; plan: string }>>([]);
  const [loadingTenants, setLoadingTenants] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    serverId: '',
    tenantId: '',
    databaseType: '',
    status: ''
  });
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedManaged, setSelectedManaged] = useState<DatabaseInstance | null>(null);
  const [selectedDiscovered, setSelectedDiscovered] = useState<DatabaseContainer | null>(null);

  const fetchDatabases = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.serverId) params.append('serverId', filters.serverId);
      if (filters.tenantId) params.append('tenantId', filters.tenantId);
      if (filters.databaseType) params.append('databaseType', filters.databaseType);
      if (filters.status) params.append('status', filters.status);

      // Obter token de autenticação
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`/api/super-admin/database?${params.toString()}`, {
        headers,
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = 'Failed to fetch databases';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = res.status === 503 || res.status === 502 
            ? 'Servidor backend não está disponível. Verifique se o backend está rodando.'
            : `Erro ao carregar bancos de dados: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor. Verifique se o backend está rodando corretamente.');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch databases');
      }

      setDatabases(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load databases';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabases();
    fetchTenants();
  }, [filters.serverId, filters.tenantId, filters.databaseType, filters.status, refreshTrigger]);

  // Listener para atualizar quando houver sincronização de provedores externos
  useEffect(() => {
    const handleSyncComplete = () => {
      fetchDatabases();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('database-sync-completed', handleSyncComplete);
      
      return () => {
        window.removeEventListener('database-sync-completed', handleSyncComplete);
      };
    }
  }, []);

  const fetchTenants = async () => {
    try {
      setLoadingTenants(true);
      
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/super-admin/database/tenants', {
        headers,
      });
      
      if (!res.ok) {
        const text = await res.text();
        let errorMessage = 'Failed to fetch tenants';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = res.status === 503 || res.status === 502 
            ? 'Servidor backend não está disponível'
            : `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tenants');
      }

      setTenants(data.data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar tenants';
      console.error(errorMessage);
    } finally {
      setLoadingTenants(false);
    }
  };

  const handleContainerAction = async (action: 'start' | 'stop' | 'restart', instanceId: string) => {
    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`/api/super-admin/database/${instanceId}/${action}`, {
        method: 'POST',
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Failed to ${action} container`;
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = res.status === 503 || res.status === 502 
            ? 'Servidor backend não está disponível'
            : `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || `Failed to ${action} container`);
      }

      toast.success(`Container ${action === 'start' ? 'iniciado' : action === 'stop' ? 'parado' : 'reiniciado'} com sucesso`);
      await fetchDatabases(); // Atualizar lista após ação
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Erro ao ${action === 'start' ? 'iniciar' : action === 'stop' ? 'parar' : 'reiniciar'} container`;
      toast.error(errorMessage);
    }
  };

  const handleActivateNeonBranch = async (containerName: string) => {
    try {
      // containerName tem formato "branchId|projectId" para Neon
      const [branchId, projectId] = containerName.split('|');
      
      if (!branchId || !projectId) {
        throw new Error('Dados de branch inválidos');
      }

      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      const res = await fetch(`/api/super-admin/provider-auth/neon/${projectId}/${branchId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(errorData.error || 'Erro ao ativar branch');
      }

      const data = await res.json();
      toast.success(data.message || 'Branch ativada com sucesso!');
      
      // Recarregar lista após alguns segundos para pegar novo estado
      setTimeout(() => {
        fetchDatabases();
      }, 3000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao ativar branch');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este banco de dados? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch(`/api/super-admin/database/${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const text = await res.text();
        let errorMessage = 'Failed to delete database';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = res.status === 503 || res.status === 502 
            ? 'Servidor backend não está disponível'
            : `Erro ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Resposta inválida do servidor');
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to delete database');
      }

      toast.success('Banco de dados deletado com sucesso');
      await fetchDatabases(); // Atualizar lista após deletar
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar banco de dados';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Ativo</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Square className="h-3 w-3 mr-1" />Inativo</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Erro</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      postgresql: 'bg-blue-500',
      mysql: 'bg-orange-500',
      redis: 'bg-red-500'
    };
    return <Badge className={colors[type] || 'bg-gray-500'}>{type.toUpperCase()}</Badge>;
  };

  // Obter ícone e nome do provedor externo
  const getProviderInfo = (provider: string | null) => {
    if (!provider || provider === 'vps_ssh') {
      return { icon: Server, name: 'VPS/Docker', badge: 'bg-purple-500', badgeText: 'VPS' };
    }

    const providerMap: Record<string, { icon: any, name: string, badge: string, badgeText: string }> = {
      railway: { icon: ContainerIcon, name: 'Railway', badge: 'bg-indigo-500', badgeText: 'Railway' },
      supabase: { icon: Database, name: 'Supabase', badge: 'bg-green-500', badgeText: 'Supabase' },
      neon: { icon: Cloud, name: 'Neon', badge: 'bg-cyan-500', badgeText: 'Neon' },
      aiven: { icon: Cloud, name: 'Aiven', badge: 'bg-orange-500', badgeText: 'Aiven' },
      render: { icon: Cloud, name: 'Render', badge: 'bg-blue-500', badgeText: 'Render' },
      clever_cloud: { icon: Cloud, name: 'Clever Cloud', badge: 'bg-pink-500', badgeText: 'Clever' },
      redis_cloud: { icon: Database, name: 'Redis Cloud', badge: 'bg-red-500', badgeText: 'Redis Cloud' },
      upstash: { icon: Database, name: 'Upstash', badge: 'bg-emerald-500', badgeText: 'Upstash' },
      aws_elasticache: { icon: Cloud, name: 'AWS ElastiCache', badge: 'bg-yellow-500', badgeText: 'AWS' },
      gcp_cloud_sql: { icon: Cloud, name: 'GCP Cloud SQL', badge: 'bg-blue-600', badgeText: 'GCP SQL' },
      gcp_memorystore: { icon: Cloud, name: 'GCP Memorystore', badge: 'bg-blue-600', badgeText: 'GCP' },
    };

    return providerMap[provider.toLowerCase()] || { 
      icon: Cloud, 
      name: provider, 
      badge: 'bg-gray-500', 
      badgeText: provider 
    };
  };

  // Badge de provedor (VPS vs External)
  const getProviderBadge = (provider: string | null) => {
    const info = getProviderInfo(provider);
    const IconComponent = info.icon;
    return (
      <Badge className={info.badge} variant="default">
        <IconComponent className="h-3 w-3 mr-1" />
        {info.badgeText}
      </Badge>
    );
  };

  const filteredManaged = databases.managed.filter(db => {
    // Filtro de busca geral
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = 
        (db.containerName?.toLowerCase().includes(searchLower)) ||
        db.databaseName.toLowerCase().includes(searchLower) ||
        (db.serverName?.toLowerCase().includes(searchLower)) ||
        (db.serverHost?.toLowerCase().includes(searchLower)) ||
        (db.provider?.toLowerCase().includes(searchLower)) ||
        (db.externalHost?.toLowerCase().includes(searchLower));
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    return true;
  });

  const filteredDiscovered = databases.discovered.filter(db => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        db.containerName.toLowerCase().includes(searchLower) ||
        (db.dbName && db.dbName.toLowerCase().includes(searchLower)) ||
        db.host.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Database className="h-5 w-5" />
              Bancos de Dados
            </CardTitle>
            <CardDescription className="text-sm">
              {filteredManaged.length + filteredDiscovered.length} de {databases.managed.length + databases.discovered.length} banco(s) encontrado(s)
              {(filters.search || filters.tenantId || filters.databaseType || filters.status) && (
                <span className="text-muted-foreground text-xs">
                  {' • '}Filtros aplicados
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchDatabases}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            {onCreateClick && (
              <Button onClick={onCreateClick}>
                Criar Banco
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative md:col-span-2 lg:col-span-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar (nome, banco, servidor, provedor)..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="pl-8"
            />
          </div>
          <Select 
            value={filters.tenantId || 'all'} 
            onValueChange={(value) => setFilters({ ...filters, tenantId: value === 'all' ? '' : value })}
            disabled={loadingTenants}
          >
            <SelectTrigger>
              <SelectValue placeholder={loadingTenants ? "Carregando tenants..." : "Selecione tenant"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as tenants</SelectItem>
              {tenants.map((tenant) => (
                <SelectItem key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.plan})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filters.databaseType || 'all'} onValueChange={(value) => setFilters({ ...filters, databaseType: value === 'all' ? '' : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="postgresql">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="redis">Redis</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
              <SelectItem value="error">Erro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela de Bancos Gerenciados */}
        {filteredManaged.length > 0 && (
          <div className="space-y-2">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Banco / Container</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Porta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredManaged.map((db) => {
                    const providerInfo = getProviderInfo(db.provider);
                    const ProviderIcon = providerInfo.icon;
                    const isExternal = db.provider && db.provider !== 'vps_ssh';
                    
                    return (
                      <TableRow
                        key={db.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedManaged(db);
                          setSelectedDiscovered(null);
                          setDetailsOpen(true);
                        }}
                      >
                        <TableCell className="font-medium">
                          <div>
                            {isExternal ? (
                              <div className="flex items-center gap-2">
                                <ProviderIcon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div>{db.databaseName || 'N/A'}</div>
                                  {db.externalHost && (
                                    <div className="text-xs text-muted-foreground">{db.externalHost}</div>
                                  )}
                                  {db.containerName && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {db.containerName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div>{db.containerName || 'N/A'}</div>
                                {db.databaseName && (
                                  <div className="text-xs text-muted-foreground">DB: {db.databaseName}</div>
                                )}
                                {db.schemaName && (
                                  <div className="text-xs text-muted-foreground">Schema: {db.schemaName}</div>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(db.databaseType)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getProviderBadge(db.provider)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{db.tenantName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">{db.tenantId}</div>
                        </TableCell>
                        <TableCell>
                          {isExternal ? (
                            <div className="font-medium">{db.externalHost || 'N/A'}</div>
                          ) : (
                            <>
                              <div className="font-medium">{db.serverName || 'N/A'}</div>
                              <div className="text-xs text-muted-foreground">{db.serverHost || 'N/A'}</div>
                            </>
                          )}
                        </TableCell>
                        <TableCell>{db.port}</TableCell>
                        <TableCell>{getStatusBadge(db.status)}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            {/* Ações de Docker apenas para VPS SSH */}
                            {(!db.provider || db.provider === 'vps_ssh') && (
                              <>
                                {db.status === 'inactive' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleContainerAction('start', db.id);
                                    }}
                                  >
                                    <Play className="h-4 w-4" />
                                  </Button>
                                )}
                                {db.status === 'active' && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContainerAction('stop', db.id);
                                      }}
                                    >
                                      <Square className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleContainerAction('restart', db.id);
                                      }}
                                    >
                                      <RotateCcw className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                            
                            {/* Botão de ativar para Neon branches suspensas */}
                            {isExternal && db.provider === 'neon' && db.status === 'inactive' && db.containerName && db.containerName.includes('|') && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateNeonBranch(db.containerName!);
                                }}
                                title="Ativar branch no Neon"
                              >
                                <Power className="h-4 w-4 text-amber-600" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(db.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Tabela de Bancos Descobertos */}
        {filteredDiscovered.length > 0 && (
          <div className="space-y-2">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Container</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscovered.map((db, idx) => (
                    <TableRow
                      key={`discovered-${idx}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedDiscovered(db);
                        setSelectedManaged(null);
                        setDetailsOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">
                        <div className="space-y-1">
                          <div>{db.containerName}</div>
                          <div className="text-xs text-muted-foreground space-x-2">
                            {db.dbName && <span>DB: {db.dbName}</span>}
                            {db.serverName && <span>• {db.serverName}</span>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(db.databaseType)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{db.host}</div>
                          {db.hostPort && (
                            <div className="text-xs text-muted-foreground">Porta: {db.hostPort}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {db.isManaged ? (
                          <Badge variant="default">Gerenciado</Badge>
                        ) : (
                          <Badge variant="outline">Descoberto</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {filteredManaged.length === 0 && filteredDiscovered.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum banco de dados encontrado. {onCreateClick && 'Crie um novo banco para começar.'}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* Dialog de Detalhes */}
    <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Banco</DialogTitle>
          <DialogDescription>
            Informações e ações rápidas para o banco selecionado
          </DialogDescription>
        </DialogHeader>

        {selectedManaged && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {selectedManaged.containerName && (
                <div>
                  <div className="text-muted-foreground">Container</div>
                  <div className="font-medium">{selectedManaged.containerName}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Tipo</div>
                <div>{getTypeBadge(selectedManaged.databaseType)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Banco</div>
                <div className="font-mono">{selectedManaged.databaseName || '-'}</div>
              </div>
              {selectedManaged.schemaName && (
                <div>
                  <div className="text-muted-foreground">Schema</div>
                  <div className="font-mono">{selectedManaged.schemaName || '-'}</div>
                </div>
              )}
              {selectedManaged.provider && selectedManaged.provider !== 'vps_ssh' ? (
                <>
                  <div>
                    <div className="text-muted-foreground">Provedor</div>
                    <div className="flex items-center gap-2">
                      {getProviderBadge(selectedManaged.provider)}
                    </div>
                  </div>
                  {selectedManaged.containerName && (
                    <div>
                      <div className="text-muted-foreground">Projeto/Serviço</div>
                      <Badge variant="outline">{selectedManaged.containerName}</Badge>
                    </div>
                  )}
                  <div>
                    <div className="text-muted-foreground">Host</div>
                    <div>{selectedManaged.externalHost || 'N/A'}</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-muted-foreground">Servidor</div>
                  <div>{selectedManaged.serverName || 'N/A'} • {selectedManaged.serverHost || 'N/A'}</div>
                </div>
              )}
              <div>
                <div className="text-muted-foreground">Tenant</div>
                <div>{selectedManaged.tenantName} • {selectedManaged.tenantId}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Porta</div>
                <div>{selectedManaged.port}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Status</div>
                <div>{getStatusBadge(selectedManaged.status)}</div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              {/* Ações de Docker apenas para VPS SSH */}
              {(!selectedManaged.provider || selectedManaged.provider === 'vps_ssh') && (
                <>
                  {selectedManaged.status === 'inactive' && (
                    <Button variant="default" size="sm" onClick={() => handleContainerAction('start', selectedManaged.id)}>Iniciar</Button>
                  )}
                  {selectedManaged.status === 'active' && (
                    <>
                      <Button variant="outline" size="sm" onClick={() => handleContainerAction('stop', selectedManaged.id)}>Parar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleContainerAction('restart', selectedManaged.id)}>Reiniciar</Button>
                    </>
                  )}
                </>
              )}
              <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedManaged.id)}>Excluir</Button>
            </div>
          </div>
        )}

        {selectedDiscovered && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-muted-foreground">Container</div>
                <div className="font-medium">{selectedDiscovered.containerName}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tipo</div>
                <div>{getTypeBadge(selectedDiscovered.databaseType)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Servidor</div>
                <div>{selectedDiscovered.serverName || '-'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Host</div>
                <div>{selectedDiscovered.host} • {selectedDiscovered.hostPort || '-'}</div>
              </div>
              {selectedDiscovered.dbName && (
                <div>
                  <div className="text-muted-foreground">Banco</div>
                  <div className="font-mono">{selectedDiscovered.dbName}</div>
                </div>
              )}
            </div>
            <Alert>
              <AlertDescription>
                Este container não está gerenciado pelo sistema. Você pode cadastrá-lo na aba de criação.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}

