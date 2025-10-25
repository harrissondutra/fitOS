'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export default function InteligenciaArtificialPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<CostFilters>({
    categoryId: 'ai', // Filtrar apenas IA
  });
  
  const { getDashboard, getServices } = useCosts();
  const { toast } = useToast();

  // Carregar dados
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboardData, servicesData] = await Promise.all([
        getDashboard(filters),
        getServices('ai'), // Buscar apenas serviços de IA
      ]);
      
      setDashboard(dashboardData);
      setServices(servicesData);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao carregar dados de IA',
        variant: 'destructive',
      });
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

  // Filtrar dados de IA do dashboard
  const aiCategory = dashboard?.categories?.find((cat: any) => cat.name === 'ai');
  const aiTrends = dashboard?.trends?.map((trend: any) => ({
    ...trend,
    totalCost: trend.categories?.ai || 0,
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
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <CostTrendsChart data={aiTrends} height={400} />
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
