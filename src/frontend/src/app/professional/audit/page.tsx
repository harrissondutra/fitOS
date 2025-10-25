'use client';

import { useState, useEffect } from 'react';
import { Shield, User, Calendar, Activity, Target, MessageSquare, Filter, Search, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

const actionTypes = [
  { value: 'all', label: 'Todas as Ações' },
  { value: 'create', label: 'Criar' },
  { value: 'update', label: 'Atualizar' },
  { value: 'delete', label: 'Excluir' },
];

const entityTypes = [
  { value: 'all', label: 'Todas as Entidades' },
  { value: 'appointment', label: 'Agendamentos' },
  { value: 'bioimpedance', label: 'Bioimpedância' },
  { value: 'crm_client', label: 'Clientes CRM' },
  { value: 'goal', label: 'Metas' },
  { value: 'comment', label: 'Comentários' },
];

const actionIcons = {
  create: 'plus',
  update: 'edit',
  delete: 'trash',
  default: 'activity'
};

const entityIcons = {
  appointment: Calendar,
  bioimpedance: Activity,
  crm_client: User,
  goal: Target,
  comment: MessageSquare,
  default: Activity
};

const actionColors = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AuditPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'create' | 'update' | 'delete'>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = filter === 'all' || log.action === filter;
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    const matchesSearch = searchTerm === '' || 
      log.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesAction && matchesEntity && matchesSearch;
  });

  const getActionIcon = (action: string) => {
    return actionIcons[action as keyof typeof actionIcons] || actionIcons.default;
  };

  const getEntityIcon = (entityType: string) => {
    return entityIcons[entityType as keyof typeof entityIcons] || entityIcons.default;
  };

  const getActionColor = (action: string) => {
    return actionColors[action as keyof typeof actionColors] || actionColors.update;
  };

  const getActionLabel = (action: string) => {
    return actionTypes.find(t => t.value === action)?.label || action;
  };

  const getEntityLabel = (entityType: string) => {
    return entityTypes.find(t => t.value === entityType)?.label || entityType;
  };

  const formatChanges = (changes: any) => {
    if (!changes || typeof changes !== 'object') return 'Nenhuma alteração registrada';
    
    const { before, after } = changes;
    if (!before && !after) return 'Nenhuma alteração registrada';
    
    if (!before) return 'Registro criado';
    if (!after) return 'Registro excluído';
    
    const changesList = [];
    const beforeObj = typeof before === 'object' ? before : {};
    const afterObj = typeof after === 'object' ? after : {};
    
    const allKeys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
    
    for (const key of allKeys) {
      const beforeValue = beforeObj[key];
      const afterValue = afterObj[key];
      
      if (beforeValue !== afterValue) {
        changesList.push(`${key}: ${beforeValue} → ${afterValue}`);
      }
    }
    
    return changesList.length > 0 ? changesList.join(', ') : 'Nenhuma alteração registrada';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Log de Auditoria</h1>
          <p className="text-muted-foreground">
            Acompanhe todas as alterações realizadas no sistema
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Criações</p>
                <p className="text-2xl font-bold text-green-600">
                  {auditLogs.filter(l => l.action === 'create').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Atualizações</p>
                <p className="text-2xl font-bold text-blue-600">
                  {auditLogs.filter(l => l.action === 'update').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exclusões</p>
                <p className="text-2xl font-bold text-red-600">
                  {auditLogs.filter(l => l.action === 'delete').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por usuário, entidade ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                {actionTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por entidade" />
              </SelectTrigger>
              <SelectContent>
                {entityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs List */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                {filter === 'all' 
                  ? 'Os logs de auditoria aparecerão aqui quando houver alterações no sistema.'
                  : `Nenhum log de "${getActionLabel(filter)}" encontrado.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => {
            const EntityIcon = getEntityIcon(log.entityType);
            const actionColor = getActionColor(log.action);
            
            return (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${actionColor}`}>
                          <EntityIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {getActionLabel(log.action)} - {getEntityLabel(log.entityType)}
                            </h3>
                            <Badge className={actionColor}>
                              {log.action.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ID: {log.entityId} • {log.user.name} ({log.user.email})
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Log de Auditoria</DialogTitle>
                              <DialogDescription>
                                Informações completas sobre esta alteração
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Ação</label>
                                  <p className="text-sm text-muted-foreground">{getActionLabel(log.action)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Entidade</label>
                                  <p className="text-sm text-muted-foreground">{getEntityLabel(log.entityType)}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">ID da Entidade</label>
                                  <p className="text-sm text-muted-foreground">{log.entityId}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Usuário</label>
                                  <p className="text-sm text-muted-foreground">{log.user.name} ({log.user.email})</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Data/Hora</label>
                                  <p className="text-sm text-muted-foreground">
                                    {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: ptBR })}
                                  </p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">IP</label>
                                  <p className="text-sm text-muted-foreground">{log.ipAddress || 'N/A'}</p>
                                </div>
                              </div>
                              
                              <Separator />
                              
                              <div>
                                <label className="text-sm font-medium">Alterações</label>
                                <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                                  <pre className="text-sm whitespace-pre-wrap">
                                    {formatChanges(log.changes)}
                                  </pre>
                                </div>
                              </div>
                              
                              {log.userAgent && (
                                <div>
                                  <label className="text-sm font-medium">User Agent</label>
                                  <p className="text-sm text-muted-foreground break-all">{log.userAgent}</p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pl-11 space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <strong>Alterações:</strong> {formatChanges(log.changes)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{log.user.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                        
                        {log.ipAddress && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            <span>{log.ipAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
