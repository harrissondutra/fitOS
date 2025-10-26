'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Plus,
  RefreshCw,
  Settings,
  Workflow,
  Bot
} from 'lucide-react';
import { useCosts, CostFilters } from '../_hooks/use-costs';
import { CostServiceCard } from '../_components/cost-service-card';
import { CostTrendsChart } from '../_components/cost-trends-chart';
import { CostEntryForm } from '../_components/cost-entry-form';
import { useToast } from '@/hooks/use-toast';

export default function AutomacaoPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<CostFilters>({
    categoryId: 'automation', // Filtrar apenas automação
  });
  
  const { getDashboard, getServices } = useCosts();
  const { toast } = useToast();

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    
    // Usar dados mockados diretamente para garantir que sempre há dados
    const mockDashboard = {
      totalCost: 22.80,
      monthlyTrend: 0.8,
      services: [
        {
          id: 'cron-jobs',
          name: 'Cron Jobs',
          cost: 8.50,
          trend: 0.2,
          status: 'active',
          icon: Zap,
          description: 'Tarefas agendadas automatizadas'
        },
        {
          id: 'webhooks',
          name: 'Webhooks',
          cost: 6.30,
          trend: 1.1,
          status: 'active',
          icon: Zap,
          description: 'Notificações automáticas'
        },
        {
          id: 'api-calls',
          name: 'API Calls',
          cost: 8.00,
          trend: 0.5,
          status: 'active',
          icon: Zap,
          description: 'Chamadas de API automatizadas'
        }
      ],
      trends: [
        { date: '2024-01-01', totalCost: 20, categories: { automation: 20 } },
        { date: '2024-02-01', totalCost: 21, categories: { automation: 21 } },
        { date: '2024-03-01', totalCost: 22, categories: { automation: 22 } },
        { date: '2024-04-01', totalCost: 21, categories: { automation: 21 } },
        { date: '2024-05-01', totalCost: 23, categories: { automation: 23 } },
        { date: '2024-06-01', totalCost: 22, categories: { automation: 22 } }
      ]
    };
    
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setDashboard(mockDashboard);
    setServices(mockDashboard.services);
    
    toast({
      title: 'Modo Demonstração',
      description: 'Usando dados de exemplo para automação',
      variant: 'default',
    });
    
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [filters, loadData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getVariationIcon = (variation: number) => {
    if (variation > 0) return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (variation < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getVariationColor = (variation: number) => {
    if (variation > 0) return 'text-red-500';
    if (variation < 0) return 'text-green-500';
    return 'text-gray-500';
  };

  // Filtrar dados de automação do dashboard
  const automationCategory = dashboard?.categories?.find((cat: any) => cat.name === 'automation');
  const automationTrends = dashboard?.trends?.map((trend: any) => ({
    ...trend,
    totalCost: trend.categories?.automation || 0,
  })) || [];

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
          <div className="p-2 bg-cyan-100 dark:bg-cyan-900 rounded-lg">
            <Zap className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Automação</h1>
            <p className="text-muted-foreground">
              n8n, Make, Zapier e outras ferramentas de automação
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Custo
          </Button>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(automationCategory?.totalCost || 0)}
            </div>
            <div className="flex items-center text-sm">
              {getVariationIcon(automationCategory?.variation || 0)}
              <span className={`ml-1 ${getVariationColor(automationCategory?.variation || 0)}`}>
                {formatPercentage(automationCategory?.variation || 0)} vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter(s => s.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {services.length} serviços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrada Manual</CardTitle>
            <Workflow className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter(s => s.captureType === 'manual').length}
            </div>
            <p className="text-xs text-muted-foreground">
              serviços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">% do Total</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(automationCategory?.percentage || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              dos custos totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Serviços por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">n8n</CardTitle>
            <Workflow className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">n8n</div>
            <p className="text-xs text-muted-foreground">
              Self-hosted (entrada manual)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Make</CardTitle>
            <Bot className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Make (Integromat)</div>
            <p className="text-xs text-muted-foreground">
              Plano gratuito (entrada manual)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Zapier</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Zapier</div>
            <p className="text-xs text-muted-foreground">
              Plano gratuito (entrada manual)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="services" className="space-y-4">
        <TabsList>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <CostServiceCard
                key={service.id}
                service={{
                  ...service,
                  categoryName: 'Automação',
                }}
                onClick={() => {
                  // TODO: Navegar para página do serviço
                  console.log('Navigate to service:', service.name);
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <CostTrendsChart data={automationTrends} height={400} />
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações da Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="font-medium">{automationCategory?.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo Mês Anterior:</span>
                  <span className="font-medium">
                    {formatCurrency(automationCategory?.previousMonthCost || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tendência:</span>
                  <div className="flex items-center gap-1">
                    {getVariationIcon(automationCategory?.variation || 0)}
                    <span className={`font-medium ${getVariationColor(automationCategory?.variation || 0)}`}>
                      {automationCategory?.trend === 'up' ? 'Crescendo' : 
                       automationCategory?.trend === 'down' ? 'Diminuindo' : 'Estável'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Serviços por Tipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Manual</span>
                    <Badge variant="outline">
                      {services.filter(s => s.captureType === 'manual').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Automático</span>
                    <Badge variant="secondary">
                      {services.filter(s => s.captureType === 'usage_tracking').length}
                    </Badge>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Dica:</strong> Para serviços de automação, adicione manualmente 
                    os valores das assinaturas mensais ou custos de infraestrutura.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de adicionar custo */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CostEntryForm
              onSuccess={() => {
                setShowAddForm(false);
                loadData();
              }}
              onCancel={() => setShowAddForm(false)}
              initialData={{
                categoryId: 'automation', // Pré-selecionar categoria automação
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
