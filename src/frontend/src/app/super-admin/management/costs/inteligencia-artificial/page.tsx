'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Plus,
  RefreshCw,
  Zap,
  Settings
} from 'lucide-react';
import { useCosts, CostFilters } from '../_hooks/use-costs';
import { CostServiceCard } from '../_components/cost-service-card';
import { CostTrendsChart } from '../_components/cost-trends-chart';
import { CostEntryForm } from '../_components/cost-entry-form';
import { useToast } from '@/hooks/use-toast';
import { useAiProviders } from '@/app/super-admin/management/ai-agents/_hooks/use-ai-providers';
import { useServiceConfigs } from '@/app/super-admin/ai/services/_hooks/use-service-configs';
import { useAiConsumptionLogs } from '@/app/super-admin/management/ai-agents/_hooks/use-ai-consumption-logs';

export default function InteligenciaArtificialPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<CostFilters>({
    categoryId: 'ai', // Filtrar apenas IA
  });
  
  // Usar os mesmos hooks que as outras telas de IA
  const { providers, listProviders, loading: providersLoading } = useAiProviders();
  const { serviceConfigs, listServiceConfigs, loading: servicesLoading } = useServiceConfigs();
  const { 
    logs: consumptionLogs, 
    stats: consumptionStats, 
    loadStats: getAiConsumptionStats, 
    loadLogs: listAiConsumptionLogs,
    loading: logsLoading 
  } = useAiConsumptionLogs();
  
  const { getDashboard } = useCosts();
  const { toast } = useToast();

  // Carregar dados usando os mesmos hooks que as outras telas
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Carregar provedores e serviços usando os mesmos hooks
      await Promise.all([
        listProviders({}, { page: 1, limit: 1000 }), // Buscar todos
        listServiceConfigs({}, { page: 1, limit: 1000 }), // Buscar todos
        listAiConsumptionLogs({}, { page: 1, limit: 10000 }), // Buscar todos os logs
        getAiConsumptionStats(), // Buscar estatísticas de custos
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados de custos de IA:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      
      toast({
        title: 'Erro',
        description: `Não foi possível carregar os custos de IA: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [listProviders, listServiceConfigs, listAiConsumptionLogs, getAiConsumptionStats, toast]);

  // Processar dados quando carregarem
  useEffect(() => {
    if (providersLoading || servicesLoading || logsLoading) {
      setLoading(true);
      return;
    }

    setLoading(false);

    // Combinar dados de provedores, serviços e custos
    const servicesMap = new Map<string, any>();

    // Adicionar todos os serviços configurados
    serviceConfigs.forEach(config => {
      const provider = providers.find(p => p.id === config.providerId);
      if (!provider) return;

      const key = `${provider.provider}-${config.model}`;
      
      if (!servicesMap.has(key)) {
        servicesMap.set(key, {
          id: key,
          name: key,
          displayName: `${provider.displayName || provider.name} - ${config.model}`,
          categoryId: 'ai',
          category: {
            id: 'ai',
            name: 'ai',
            displayName: 'Inteligência Artificial',
            icon: 'Brain',
            color: '#8B5CF6',
          },
          costType: 'variable',
          captureType: 'usage_tracking',
          isActive: config.isActive,
          provider: provider.provider,
          providerId: provider.id,
          providerName: provider.displayName || provider.name,
          model: config.model,
          serviceType: config.serviceType,
          serviceName: config.serviceName,
          totalCost: 0,
          requestCount: 0,
          averageCost: 0,
          trend: 'stable' as const,
          metadata: {
            provider: provider.provider,
            providerId: provider.id,
            model: config.model,
            serviceType: config.serviceType,
            serviceName: config.serviceName,
          },
        });
      }
    });

    // Adicionar custos reais dos logs de consumo
    if (consumptionStats) {
      // Processar custos por provedor/modelo
      const costByProviderModel = new Map<string, { cost: number; count: number }>();
      
      consumptionLogs.forEach(log => {
        const key = `${log.provider}-${log.model}`;
        const existing = costByProviderModel.get(key) || { cost: 0, count: 0 };
        costByProviderModel.set(key, {
          cost: existing.cost + (log.cost || 0),
          count: existing.count + 1,
        });
      });

      // Atualizar serviços com custos reais
      costByProviderModel.forEach((costData, key) => {
        const service = servicesMap.get(key);
        if (service) {
          service.totalCost = costData.cost;
          service.requestCount = costData.count;
          service.averageCost = costData.count > 0 ? costData.cost / costData.count : 0;
        } else {
          // Adicionar serviço que tem custo mas pode não estar configurado
          const [providerName, model] = key.split('-');
          const provider = providers.find(p => p.provider === providerName);
          
          servicesMap.set(key, {
            id: key,
            name: key,
            displayName: `${provider?.displayName || providerName} - ${model}`,
            categoryId: 'ai',
            category: {
              id: 'ai',
              name: 'ai',
              displayName: 'Inteligência Artificial',
              icon: 'Brain',
              color: '#8B5CF6',
            },
            costType: 'variable',
            captureType: 'usage_tracking',
            isActive: true,
            provider: providerName,
            providerId: provider?.id,
            providerName: provider?.displayName || providerName,
            model: model,
            totalCost: costData.cost,
            requestCount: costData.count,
            averageCost: costData.count > 0 ? costData.cost / costData.count : 0,
            trend: 'stable' as const,
            metadata: {
              provider: providerName,
              model: model,
            },
          });
        }
      });
    }

    // Converter para array e ordenar por custo
    const servicesArray = Array.from(servicesMap.values())
      .sort((a, b) => b.totalCost - a.totalCost);

    setServices(servicesArray);

    // Calcular total de custos
    const totalCost = servicesArray.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const totalCostPreviousMonth = 0; // TODO: calcular mês anterior
    const costVariation = totalCostPreviousMonth > 0 
      ? ((totalCost - totalCostPreviousMonth) / totalCostPreviousMonth) * 100 
      : 0;

    // Criar dashboard
    setDashboard({
      totalCost,
      totalCostPreviousMonth,
      costVariation,
      projectedCost: totalCost, // TODO: calcular projeção
      categories: [{
        id: 'ai',
        name: 'ai',
        displayName: 'Inteligência Artificial',
        icon: 'Brain',
        color: '#8B5CF6',
        totalCost,
        percentage: 100,
        previousMonthCost: totalCostPreviousMonth,
        variation: costVariation,
        trend: costVariation > 0 ? 'up' as const : costVariation < 0 ? 'down' as const : 'stable' as const,
      }],
      topServices: servicesArray.slice(0, 5),
      alerts: [],
      trends: [],
      fixedVsVariable: {
        fixed: 0,
        variable: totalCost,
        fixedPercentage: 0,
        variablePercentage: 100,
      },
    });

    // Log para debug
    if (servicesArray.length > 0) {
      console.log('✅ Serviços de IA carregados:', servicesArray.length);
      console.log('Provedores:', providers.length);
      console.log('Configurações:', serviceConfigs.length);
      console.log('Custos totais:', consumptionStats?.total?.cost || totalCost);
      console.log('Logs de consumo:', consumptionLogs.length);
    } else {
      console.warn('⚠️ Nenhum serviço de IA encontrado');
      if (providers.length === 0) {
        console.warn('⚠️ Nenhum provedor cadastrado');
      }
      if (serviceConfigs.length === 0) {
        console.warn('⚠️ Nenhuma configuração de serviço cadastrada');
      }
    }
  }, [providers, serviceConfigs, consumptionLogs, consumptionStats, providersLoading, servicesLoading, logsLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
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

  // Filtrar dados de IA do dashboard
  const aiCategory = dashboard?.categories?.find((cat: any) => cat.name === 'ai');
  const aiTrends = dashboard?.trends?.map((trend: any) => ({
    ...trend,
    totalCost: trend.categories?.ai || 0,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-24" />
            ))}
          </div>
          
          {/* Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>

          {/* Service Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-2" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Inteligência Artificial</h1>
            <p className="text-muted-foreground">
              Custos e monitoramento de serviços de IA
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

      {/* Mensagem de erro */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <Activity className="h-5 w-5" />
              <div>
                <p className="font-semibold">Erro ao carregar dados</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total IA</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(aiCategory?.totalCost || 0)}
            </div>
            <div className="flex items-center text-sm">
              {getVariationIcon(aiCategory?.variation || 0)}
              <span className={`ml-1 ${getVariationColor(aiCategory?.variation || 0)}`}>
                {formatPercentage(aiCategory?.variation || 0)} vs mês anterior
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
            <CardTitle className="text-sm font-medium">Rastreamento</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {services.filter(s => s.captureType === 'usage_tracking').length}
            </div>
            <p className="text-xs text-muted-foreground">
              automático
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
              {(aiCategory?.percentage || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              dos custos totais
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
          {services.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Nenhum serviço de IA encontrado
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure provedores e modelos de IA em{' '}
                    <a 
                      href="/super-admin/ai/providers" 
                      className="text-primary hover:underline"
                    >
                      Provedores de IA
                    </a>
                    {' '}e{' '}
                    <a 
                      href="/super-admin/ai/services" 
                      className="text-primary hover:underline"
                    >
                      Serviços de IA
                    </a>
                    {' '}para ver os custos aqui.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <CostServiceCard
                  key={service.id}
                  service={{
                    ...service,
                    categoryName: 'Inteligência Artificial',
                  }}
                  onClick={() => {
                    // TODO: Navegar para página do serviço
                    console.log('Navigate to service:', service.name);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <CostTrendsChart data={aiTrends || []} height={400} />
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
                  <span className="font-medium">{aiCategory?.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo Mês Anterior:</span>
                  <span className="font-medium">
                    {formatCurrency(aiCategory?.previousMonthCost || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tendência:</span>
                  <div className="flex items-center gap-1">
                    {getVariationIcon(aiCategory?.variation || 0)}
                    <span className={`font-medium ${getVariationColor(aiCategory?.variation || 0)}`}>
                      {aiCategory?.trend === 'up' ? 'Crescendo' : 
                       aiCategory?.trend === 'down' ? 'Diminuindo' : 'Estável'}
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
                    <span className="text-sm">Automático</span>
                    <Badge variant="secondary">
                      {services.filter(s => s.captureType === 'usage_tracking').length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Manual</span>
                    <Badge variant="outline">
                      {services.filter(s => s.captureType === 'manual').length}
                    </Badge>
                  </div>
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
                categoryId: 'ai', // Pré-selecionar categoria IA
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
