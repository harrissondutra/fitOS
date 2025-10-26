'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Plus,
  Download,
  RefreshCw,
  Target,
  Activity
} from 'lucide-react';
import { useCosts, CostFilters } from './_hooks/use-costs';
import { CostCategoryCard } from './_components/cost-category-card';
import { CostServiceCard } from './_components/cost-service-card';
import { CostTrendsChart } from './_components/cost-trends-chart';
import { CostDistributionChart } from './_components/cost-distribution-chart';
import { AlertList } from './_components/alert-list';
import { CostEntryForm } from './_components/cost-entry-form';
import { useToast } from '@/hooks/use-toast';

export default function CostsPage() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filters, setFilters] = useState<CostFilters>({});
  
  const { exportReport } = useCosts();
  const { toast } = useToast();

  // Carregar dashboard
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    
    // Simular carregamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Usar dados mockados diretamente
    const mockDashboard = {
        totalCost: 1250.50,
        totalCostPreviousMonth: 1100.00,
        costVariation: 13.7,
        projectedCost: 1400.00,
        categories: [
          {
            id: 'storage',
            name: 'storage',
            displayName: 'Armazenamento',
            icon: 'Database',
            color: '#3B82F6',
            totalCost: 450.30,
            percentage: 36.0,
            previousMonthCost: 400.00,
            variation: 12.6,
            trend: 'up' as const
          },
          {
            id: 'ai',
            name: 'ai',
            displayName: 'Inteligência Artificial',
            icon: 'Brain',
            color: '#8B5CF6',
            totalCost: 320.80,
            percentage: 25.7,
            previousMonthCost: 280.00,
            variation: 14.6,
            trend: 'up' as const
          },
          {
            id: 'database',
            name: 'database',
            displayName: 'Banco de Dados',
            icon: 'Database',
            color: '#10B981',
            totalCost: 280.40,
            percentage: 22.4,
            previousMonthCost: 300.00,
            variation: -6.5,
            trend: 'down' as const
          },
          {
            id: 'bandwidth',
            name: 'bandwidth',
            displayName: 'Largura de Banda',
            icon: 'Wifi',
            color: '#F59E0B',
            totalCost: 199.00,
            percentage: 15.9,
            previousMonthCost: 120.00,
            variation: 65.8,
            trend: 'up' as const
          }
        ],
        topServices: [
          {
            id: 'cloudinary',
            name: 'cloudinary',
            displayName: 'Cloudinary',
            categoryName: 'Armazenamento',
            totalCost: 450.30,
            percentage: 36.0,
            requestCount: 1250,
            averageCost: 0.36,
            trend: 'up' as const
          },
          {
            id: 'openai',
            name: 'openai',
            displayName: 'OpenAI GPT-4',
            categoryName: 'IA',
            totalCost: 320.80,
            percentage: 25.7,
            requestCount: 850,
            averageCost: 0.38,
            trend: 'up' as const
          },
          {
            id: 'postgresql',
            name: 'postgresql',
            displayName: 'PostgreSQL',
            categoryName: 'Banco de Dados',
            totalCost: 280.40,
            percentage: 22.4,
            requestCount: 5000,
            averageCost: 0.06,
            trend: 'down' as const
          }
        ],
        alerts: [
          {
            id: '1',
            type: 'budget',
            severity: 'warning',
            message: 'Custo de IA próximo do limite mensal',
            currentAmount: 320.80,
            limitAmount: 400.00,
            percentage: 80.2,
            createdAt: new Date().toISOString()
          }
        ],
        trends: [
          { date: '2024-01-01', totalCost: 800, categories: { storage: 300, ai: 200, database: 200, bandwidth: 100 } },
          { date: '2024-02-01', totalCost: 950, categories: { storage: 350, ai: 250, database: 250, bandwidth: 100 } },
          { date: '2024-03-01', totalCost: 1100, categories: { storage: 400, ai: 300, database: 300, bandwidth: 100 } },
          { date: '2024-04-01', totalCost: 1050, categories: { storage: 380, ai: 280, database: 290, bandwidth: 100 } },
          { date: '2024-05-01', totalCost: 1200, categories: { storage: 420, ai: 320, database: 330, bandwidth: 130 } },
          { date: '2024-06-01', totalCost: 1250, categories: { storage: 450, ai: 320, database: 280, bandwidth: 200 } }
        ],
        fixedVsVariable: {
          fixed: 500.00,
          variable: 750.50,
          fixedPercentage: 40.0,
          variablePercentage: 60.0
        }
      };
      
    setDashboard(mockDashboard);
    
    toast({
      title: 'Modo Demonstração',
      description: 'Usando dados de exemplo para o dashboard principal',
      variant: 'default',
    });
    
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    loadDashboard();
  }, [filters, loadDashboard]);

  // Exportar relatório
  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await exportReport(format, filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: 'Sucesso',
        description: 'Relatório exportado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao exportar relatório',
        variant: 'destructive',
      });
    }
  };

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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-20" />
            ))}
          </div>
          
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Category Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-32 mb-2" />
                  <Skeleton className="h-3 w-48 mb-2" />
                  <Skeleton className="h-2 w-full mb-2" />
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

  if (!dashboard) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar dados</h3>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar o dashboard de custos.
        </p>
        <Button onClick={loadDashboard}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Custos</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie todos os custos da aplicação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={() => handleExport('json')}>
            <Download className="h-4 w-4 mr-2" />
            JSON
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.totalCost)}
            </div>
            <div className="flex items-center text-sm">
              {getVariationIcon(dashboard.costVariation)}
              <span className={`ml-1 ${getVariationColor(dashboard.costVariation)}`}>
                {formatPercentage(dashboard.costVariation)} vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projeção do Mês</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.projectedCost)}
            </div>
            <p className="text-xs text-muted-foreground">
              Baseado no uso atual
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Fixos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(dashboard.fixedVsVariable.fixed)}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard.fixedVsVariable.fixedPercentage.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard.alerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CostDistributionChart data={dashboard.categories} />
            <CostTrendsChart data={dashboard?.trends || []} />
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.categories.map((category: any) => (
              <CostCategoryCard
                key={category.id}
                category={category}
                onClick={() => {
                  // TODO: Navegar para página da categoria
                  console.log('Navigate to category:', category.name);
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboard.topServices.map((service: any) => (
              <CostServiceCard
                key={service.id}
                service={service}
                onClick={() => {
                  // TODO: Navegar para página do serviço
                  console.log('Navigate to service:', service.name);
                }}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertList
            alerts={dashboard.alerts}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de adicionar custo */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CostEntryForm
              onSuccess={() => {
                setShowAddForm(false);
                loadDashboard();
              }}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
