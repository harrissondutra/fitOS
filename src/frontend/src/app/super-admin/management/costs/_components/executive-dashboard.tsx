'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  TrendingDown, 
  Target, 
  Zap,
  DollarSign,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface ExecutiveKPIs {
  costPerUser: number;
  costPerRequest: number;
  costPerFeature: {
    featureName: string;
    cost: number;
    percentage: number;
  }[];
  burnRate: number;
  runway: number;
  monthlyRecurringCost: number;
  variableCostRatio: number;
  costEfficiencyScore: number;
  wastePercentage: number;
  optimizationPotential: number;
  vsLastMonth: {
    costChange: number;
    efficiencyChange: number;
  };
  vsTarget: {
    costDiff: number;
    status: 'on_track' | 'over_budget' | 'under_budget';
  };
}

interface ExecutiveKPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: number;
  progress?: number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'critical';
}

function ExecutiveKPICard({ 
  title, 
  value, 
  subtitle, 
  change, 
  progress, 
  icon: Icon, 
  trend,
  status = 'good'
}: ExecutiveKPICardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend) {
      case 'up': return <TrendingDown className="h-4 w-4 text-red-500 rotate-180" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
      case 'stable': return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${getStatusColor()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center space-x-1 mt-2">
            {getTrendIcon()}
            <span className={`text-xs ${change >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {progress.toFixed(0)}% efficiency
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ExecutiveDashboardProps {
  tenantId?: string;
  refreshInterval?: number;
}

export function ExecutiveDashboard({ tenantId, refreshInterval = 300000 }: ExecutiveDashboardProps) {
  const [kpis, setKpis] = useState<ExecutiveKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      
      // Simular chamada à API (substituir pela implementação real)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados para demonstração
      const mockKPIs: ExecutiveKPIs = {
        costPerUser: 45.50,
        costPerRequest: 0.008,
        costPerFeature: [
          { featureName: 'AI Services', cost: 2500, percentage: 45 },
          { featureName: 'Storage', cost: 1200, percentage: 22 },
          { featureName: 'Database', cost: 800, percentage: 15 },
          { featureName: 'Payments', cost: 600, percentage: 11 },
          { featureName: 'Communication', cost: 400, percentage: 7 },
        ],
        burnRate: 180.50,
        runway: 8.5,
        monthlyRecurringCost: 3200,
        variableCostRatio: 65,
        costEfficiencyScore: 78,
        wastePercentage: 12,
        optimizationPotential: 650,
        vsLastMonth: {
          costChange: 8.5,
          efficiencyChange: 2.3,
        },
        vsTarget: {
          costDiff: -200,
          status: 'on_track',
        },
      };
      
      setKpis(mockKPIs);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKPIs();
    
    if (refreshInterval > 0) {
      const interval = setInterval(loadKPIs, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tenantId, refreshInterval]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getBudgetStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'over_budget': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'under_budget': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'text-green-600';
      case 'over_budget': return 'text-red-600';
      case 'under_budget': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>

        {/* KPIs Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Breakdown Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-2 w-20" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!kpis) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Erro ao carregar KPIs</h3>
        <p className="text-muted-foreground mb-4">
          Não foi possível carregar os indicadores executivos.
        </p>
        <Button onClick={loadKPIs}>
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
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Executivo</h1>
          <p className="text-muted-foreground">
            Indicadores-chave de performance e eficiência de custos
            {lastUpdated && (
              <span className="ml-2 text-sm">
                • Atualizado em {lastUpdated.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </p>
        </div>
        <Button variant="outline" onClick={loadKPIs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ExecutiveKPICard
          title="Cost Per User"
          value={formatCurrency(kpis.costPerUser)}
          change={kpis.vsLastMonth.costChange}
          icon={Users}
          trend={kpis.vsLastMonth.costChange > 0 ? 'up' : 'down'}
          status={kpis.costPerUser > 50 ? 'warning' : 'good'}
        />
        
        <ExecutiveKPICard
          title="Burn Rate"
          value={`${formatCurrency(kpis.burnRate)}/dia`}
          subtitle={`Runway: ${kpis.runway.toFixed(1)} meses`}
          icon={TrendingDown}
          status={kpis.runway < 6 ? 'critical' : kpis.runway < 12 ? 'warning' : 'good'}
        />
        
        <ExecutiveKPICard
          title="Efficiency Score"
          value={`${kpis.costEfficiencyScore}/100`}
          progress={kpis.costEfficiencyScore}
          change={kpis.vsLastMonth.efficiencyChange}
          icon={Target}
          status={kpis.costEfficiencyScore > 80 ? 'good' : kpis.costEfficiencyScore > 60 ? 'warning' : 'critical'}
        />
        
        <ExecutiveKPICard
          title="Optimization Potential"
          value={formatCurrency(kpis.optimizationPotential)}
          subtitle={`${kpis.wastePercentage.toFixed(1)}% de desperdício`}
          icon={Zap}
          status={kpis.wastePercentage > 15 ? 'critical' : kpis.wastePercentage > 10 ? 'warning' : 'good'}
        />
      </div>

      {/* Status do Orçamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {getBudgetStatusIcon(kpis.vsTarget.status)}
            <span>Status do Orçamento</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-lg font-semibold ${getBudgetStatusColor(kpis.vsTarget.status)}`}>
                {kpis.vsTarget.status === 'on_track' ? 'No Prazo' : 
                 kpis.vsTarget.status === 'over_budget' ? 'Acima do Orçamento' : 
                 'Abaixo do Orçamento'}
              </p>
              <p className="text-sm text-muted-foreground">
                Diferença: {formatCurrency(kpis.vsTarget.costDiff)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Custos Variáveis</p>
              <p className="text-lg font-semibold">{kpis.variableCostRatio.toFixed(1)}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown por Feature */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Custos por Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kpis.costPerFeature.map((feature, index) => (
              <div key={feature.featureName} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="font-medium">{feature.featureName}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-muted-foreground">
                    {feature.percentage.toFixed(1)}%
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(feature.cost)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos Recorrentes</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.monthlyRecurringCost)}</div>
            <p className="text-xs text-muted-foreground">
              Custos fixos mensais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Per Request</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis.costPerRequest)}</div>
            <p className="text-xs text-muted-foreground">
              Custo médio por requisição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.costEfficiencyScore.toFixed(0)}/100</div>
            <p className="text-xs text-muted-foreground">
              Score de eficiência geral
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
