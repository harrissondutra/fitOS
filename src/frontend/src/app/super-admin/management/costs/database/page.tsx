'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Plus,
  RefreshCw,
  Settings,
  Database,
  Zap
} from 'lucide-react';
import { useCosts, CostFilters } from '../_hooks/use-costs';
import { CostServiceCard } from '../_components/cost-service-card';
import { CostTrendsChart } from '../_components/cost-trends-chart';
import { CostEntryForm } from '../_components/cost-entry-form';
import { useToast } from '@/hooks/use-toast';

export default function DatabasePage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<CostFilters>({
    categoryId: 'database', // Filtrar apenas database
  });
  
  const { getDashboard, getServices } = useCosts();
  const { toast } = useToast();

    // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      // Buscar dados reais do banco de dados
      const [dashboardData, servicesData] = await Promise.all([
        getDashboard(filters),
        getServices({ category: 'database', ...filters })
      ]);

      // Processar dados do dashboard
      const databaseCategory = dashboardData?.categories?.find(
        (cat: any) => cat.name === 'database' || cat.id === 'database'
      );

      // Processar serviços de database
      const processedServices = (servicesData || []).map((service: any) => ({
        id: service.id,
        name: service.name,
        cost: service.totalCost || 0,
        trend: service.monthlyTrend || 0,
        status: service.isActive ? 'active' : 'inactive',
        icon: service.name?.toLowerCase().includes('redis') ? Zap :
              service.name?.toLowerCase().includes('postgres') || service.name?.toLowerCase().includes('database') ? Database :
              Database,
        description: service.description || ''
      }));

      // Processar trends de database
      const processedTrends = (dashboardData?.trends || []).map((trend: any) => ({
        date: trend.date,
        totalCost: trend.categories?.database || 0,
        categories: { database: trend.categories?.database || 0 }
      }));

      setDashboard({
        totalCost: databaseCategory?.totalCost || 0,
        monthlyTrend: databaseCategory?.variation || 0,
        services: processedServices,
        trends: processedTrends,
        categories: dashboardData?.categories || []
      });

      setServices(processedServices);
    } catch (error) {
      console.error('Error loading database costs:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Não foi possível carregar os custos de database',
        variant: 'destructive',
      });
      
      // Fallback para dados vazios em caso de erro
      setDashboard({
        totalCost: 0,
        monthlyTrend: 0,
        services: [],
        trends: [],
        categories: []
      });
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [getDashboard, getServices, filters, toast]);

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

  // Filtrar dados de database do dashboard
  const databaseCategory = dashboard?.categories?.find((cat: any) => cat.name === 'database');
  const databaseTrends = dashboard?.trends?.map((trend: any) => ({
    ...trend,
    totalCost: trend.categories?.database || 0,
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
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
            <Server className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Database & Cache</h1>
            <p className="text-muted-foreground">
              PostgreSQL, Redis e outros serviços de banco de dados
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
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(databaseCategory?.totalCost || 0)}
            </div>
            <div className="flex items-center text-sm">
              {getVariationIcon(databaseCategory?.variation || 0)}
              <span className={`ml-1 ${getVariationColor(databaseCategory?.variation || 0)}`}>
                {formatPercentage(databaseCategory?.variation || 0)} vs mês anterior
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
            <Database className="h-4 w-4 text-muted-foreground" />
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
              {(databaseCategory?.percentage || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              dos custos totais
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Serviços por tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PostgreSQL</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">PostgreSQL</div>
            <p className="text-xs text-muted-foreground">
              Entrada manual (baseado na fatura do provedor)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis</CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Redis</div>
            <p className="text-xs text-muted-foreground">
              Entrada manual (baseado na fatura do provedor)
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
                  categoryName: 'Database & Cache',
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
          <CostTrendsChart data={databaseTrends} height={400} />
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
                  <span className="font-medium">{databaseCategory?.displayName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Custo Mês Anterior:</span>
                  <span className="font-medium">
                    {formatCurrency(databaseCategory?.previousMonthCost || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tendência:</span>
                  <div className="flex items-center gap-1">
                    {getVariationIcon(databaseCategory?.variation || 0)}
                    <span className={`font-medium ${getVariationColor(databaseCategory?.variation || 0)}`}>
                      {databaseCategory?.trend === 'up' ? 'Crescendo' : 
                       databaseCategory?.trend === 'down' ? 'Diminuindo' : 'Estável'}
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
                    💡 <strong>Dica:</strong> Para serviços de database, adicione manualmente 
                    os valores baseados nas faturas mensais do seu provedor de cloud.
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
                categoryId: 'database', // Pré-selecionar categoria database
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
