'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Activity,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Calendar
} from 'lucide-react';

interface ExecutiveKPIs {
  costPerUser: number;
  costPerRequest: number;
  costPerFeature: number;
  burnRate: number;
  runway: number;
  costEfficiencyScore: number;
  totalMonthlyCost: number;
  activeUsers: number;
  totalRequests: number;
  costTrend: 'up' | 'down' | 'stable';
  efficiencyTrend: 'up' | 'down' | 'stable';
}

interface CostHistory {
  month: string;
  kpis: ExecutiveKPIs;
}

export function ExecutiveDashboard() {
  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
  const [history, setHistory] = useState<CostHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12');

  const fetchExecutiveData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simular chamada para API de KPIs executivos
      const response = await fetch(`/api/super-admin/costs/executive-kpis?months=${selectedPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setKpis(data.current);
        setHistory(data.history || []);
      } else {
        // Dados mock para desenvolvimento
        setKpis({
          costPerUser: 2.45,
          costPerRequest: 0.0032,
          costPerFeature: 125.50,
          burnRate: 8500,
          runway: 18.5,
          costEfficiencyScore: 87.3,
          totalMonthlyCost: 12500,
          activeUsers: 5100,
          totalRequests: 3900000,
          costTrend: 'down',
          efficiencyTrend: 'up'
        });
        
        setHistory([
          {
            month: '2024-01',
            kpis: {
              costPerUser: 2.65,
              costPerRequest: 0.0035,
              costPerFeature: 135.20,
              burnRate: 9200,
              runway: 16.2,
              costEfficiencyScore: 82.1,
              totalMonthlyCost: 13200,
              activeUsers: 4980,
              totalRequests: 3750000,
              costTrend: 'up',
              efficiencyTrend: 'down'
            }
          },
          {
            month: '2024-02',
            kpis: {
              costPerUser: 2.52,
              costPerRequest: 0.0033,
              costPerFeature: 128.80,
              burnRate: 8800,
              runway: 17.1,
              costEfficiencyScore: 84.7,
              totalMonthlyCost: 12800,
              activeUsers: 5050,
              totalRequests: 3820000,
              costTrend: 'down',
              efficiencyTrend: 'up'
            }
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching executive data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchExecutiveData();
  }, [fetchExecutiveData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-600';
      case 'down':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-3 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Visão estratégica dos custos e performance da plataforma
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Calendar className="h-4 w-4 mr-1" />
            Últimos {selectedPeriod} meses
          </Badge>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo por Usuário</CardTitle>
            {getTrendIcon(kpis?.costTrend || 'stable')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.costPerUser || 0)}</div>
            <p className={`text-xs ${getTrendColor(kpis?.costTrend || 'stable')}`}>
              {kpis?.costTrend === 'down' ? 'Redução de 7.5%' : 
               kpis?.costTrend === 'up' ? 'Aumento de 3.2%' : 'Estável'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo por Requisição</CardTitle>
            {getTrendIcon(kpis?.costTrend || 'stable')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.costPerRequest || 0)}</div>
            <p className={`text-xs ${getTrendColor(kpis?.costTrend || 'stable')}`}>
              {kpis?.costTrend === 'down' ? 'Otimização de 8.6%' : 
               kpis?.costTrend === 'up' ? 'Aumento de 2.1%' : 'Estável'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burn Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.burnRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              por mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Runway</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.runway || 0} meses</div>
            <p className="text-xs text-muted-foreground">
              tempo restante
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Eficiência</CardTitle>
            {getTrendIcon(kpis?.efficiencyTrend || 'stable')}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.costEfficiencyScore || 0}%</div>
            <p className={`text-xs ${getTrendColor(kpis?.efficiencyTrend || 'stable')}`}>
              {kpis?.efficiencyTrend === 'up' ? 'Melhoria de 3.2%' : 
               kpis?.efficiencyTrend === 'down' ? 'Redução de 1.8%' : 'Estável'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis?.activeUsers || 0)}</div>
            <p className="text-xs text-muted-foreground">
              usuários únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(kpis?.totalRequests || 0)}</div>
            <p className="text-xs text-muted-foreground">
              este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.totalMonthlyCost || 0)}</div>
            <p className="text-xs text-muted-foreground">
              todos os serviços
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análises Detalhadas */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="efficiency">Eficiência</TabsTrigger>
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Evolução dos Custos
                </CardTitle>
                <CardDescription>
                  Tendência dos custos principais nos últimos meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {history.slice(0, 6).map((item, index) => (
                    <div key={item.month} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="text-sm font-medium">{item.month}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {formatCurrency(item.kpis.totalMonthlyCost)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          CPU: {formatCurrency(item.kpis.costPerUser)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Distribuição de Custos
                </CardTitle>
                <CardDescription>
                  Breakdown por categoria de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-500 rounded" />
                      <span className="text-sm">IA & ML</span>
                    </div>
                    <span className="text-sm font-semibold">45%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded" />
                      <span className="text-sm">Armazenamento</span>
                    </div>
                    <span className="text-sm font-semibold">25%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded" />
                      <span className="text-sm">Banco de Dados</span>
                    </div>
                    <span className="text-sm font-semibold">20%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-500 rounded" />
                      <span className="text-sm">Outros</span>
                    </div>
                    <span className="text-sm font-semibold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Eficiência</CardTitle>
              <CardDescription>
                Métricas de performance e otimização de custos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {kpis?.costEfficiencyScore || 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Score Geral</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatCurrency(kpis?.costPerFeature || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Custo por Feature</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {kpis?.runway || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Meses de Runway</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previsões e Alertas</CardTitle>
              <CardDescription>
                Projeções baseadas em tendências atuais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-semibold">Alerta de Burn Rate</div>
                    <div className="text-sm text-muted-foreground">
                      Projeção indica aumento de 15% nos próximos 3 meses
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-semibold">Oportunidade de Otimização</div>
                    <div className="text-sm text-muted-foreground">
                      Redução potencial de 20% com otimização de cache
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
