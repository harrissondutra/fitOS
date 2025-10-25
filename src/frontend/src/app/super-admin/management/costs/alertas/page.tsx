'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  Search
} from 'lucide-react';
import { useCosts } from '../_hooks/use-costs';
import { CostAlert } from '@/types/costs';
import { AlertList } from '../_components/alert-list';
import { useToast } from '@/hooks/use-toast';

export default function AlertasPage() {
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const { getAlerts, acknowledgeAlert, deleteAlert } = useCosts();
  const { toast } = useToast();

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAlerts();
      setAlerts(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar alertas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [getAlerts, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'Atenção';
      case 'CRITICAL':
        return 'Crítico';
      case 'LIMIT_REACHED':
        return 'Limite Atingido';
      default:
        return type;
    }
  };

  // Função para determinar o status do alerta
  const getAlertStatus = (alert: CostAlert) => {
    if (alert.resolvedAt) return 'resolved';
    if (alert.acknowledgedAt) return 'acknowledged';
    return 'active';
  };

  // Filtrar alertas por status
  const activeAlerts = alerts.filter(alert => getAlertStatus(alert) === 'active');
  const acknowledgedAlerts = alerts.filter(alert => getAlertStatus(alert) === 'acknowledged');
  const resolvedAlerts = alerts.filter(alert => getAlertStatus(alert) === 'resolved');

  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 'active':
        return activeAlerts;
      case 'acknowledged':
        return acknowledgedAlerts;
      case 'resolved':
        return resolvedAlerts;
      default:
        return alerts;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Alertas</h1>
            <p className="text-muted-foreground">
              Monitore alertas de custos e limites de orçamento
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo dos alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              alertas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              requerem atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reconhecidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{acknowledgedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              em análise
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              finalizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de filtros */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({alerts.length})</TabsTrigger>
          <TabsTrigger value="active">Ativos ({activeAlerts.length})</TabsTrigger>
          <TabsTrigger value="acknowledged">Reconhecidos ({acknowledgedAlerts.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolvidos ({resolvedAlerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {getFilteredAlerts().length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {activeTab === 'all' ? 'Nenhum alerta encontrado' : 
                   activeTab === 'active' ? 'Nenhum alerta ativo' :
                   activeTab === 'acknowledged' ? 'Nenhum alerta reconhecido' :
                   'Nenhum alerta resolvido'}
                </h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'all' ? 'Não há alertas no sistema no momento.' :
                   activeTab === 'active' ? 'Todos os custos estão dentro dos limites.' :
                   activeTab === 'acknowledged' ? 'Nenhum alerta foi reconhecido ainda.' :
                   'Nenhum alerta foi resolvido ainda.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {getFilteredAlerts().map((alert) => (
                <Card key={alert.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getSeverityIcon(alert.severity)}
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">
                              {getAlertTypeLabel(alert.alertType)}
                            </h3>
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                             <Badge variant="outline">
                               {getAlertStatus(alert)}
                             </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {alert.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                              Valor atual: {formatCurrency(alert.currentCost)}
                            </span>
                            {alert.limit && (
                              <span>
                                Limite: {formatCurrency(alert.limit)}
                              </span>
                            )}
                            {alert.percentage && (
                              <span>
                                {alert.percentage.toFixed(1)}% do limite
                              </span>
                            )}
                            <span>
                              {formatDate(alert.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                         {getAlertStatus(alert) === 'active' && (
                          <Button
                            size="sm"
                            onClick={() => {
                              acknowledgeAlert(alert.id).then(() => {
                                loadData();
                                toast({
                                  title: 'Sucesso',
                                  description: 'Alerta reconhecido com sucesso',
                                });
                              });
                            }}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Reconhecer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            deleteAlert(alert.id).then(() => {
                              loadData();
                              toast({
                                title: 'Sucesso',
                                description: 'Alerta removido com sucesso',
                              });
                            });
                          }}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
