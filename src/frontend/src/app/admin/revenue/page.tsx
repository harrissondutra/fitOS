'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users,
  AlertTriangle,
  RefreshCw,
  Download,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface RevenueMetrics {
  mrr: number;
  arr: number;
  churnRate: number;
  newRevenue: number;
  expansionRevenue: number;
  contractionRevenue: number;
  netRevenue: number;
  ltv: number;
  cac: number;
  ltvCacRatio: number;
  growthRate: number;
  revenueChurn: number;
}

interface RevenueTrend {
  date: string;
  mrr: number;
  arr: number;
  churnRate: number;
  newRevenue: number;
  expansionRevenue: number;
  contractionRevenue: number;
}

interface RevenueByPlan {
  plan: string;
  mrr: number;
  tenantCount: number;
}

interface CohortAnalysis {
  cohortMonth: string;
  cohortSize: number;
  month0: number;
  month1: number;
  month2: number;
  month3: number;
  month6: number;
  month12: number;
}

interface RevenueForecast {
  month: string;
  predictedMrr: number;
  predictedArr: number;
  confidence: number;
  factors: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function RevenueDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [trends, setTrends] = useState<RevenueTrend[]>([]);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [cohortAnalysis, setCohortAnalysis] = useState<CohortAnalysis[]>([]);
  const [forecast, setForecast] = useState<RevenueForecast[]>([]);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/revenue/dashboard');
      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics);
        setTrends(data.data.trends);
        setRevenueByPlan(data.data.revenueByPlan);
        setCohortAnalysis(data.data.cohortAnalysis);
        setForecast(data.data.forecast);
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGrowthIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <TrendingUp className="h-4 w-4 text-gray-600" />;
  };

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
          <p className="text-muted-foreground">
            Análise completa de receita e métricas financeiras
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchRevenueData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.mrr || 0)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(metrics?.growthRate || 0)}
              <span className={`ml-1 ${getGrowthColor(metrics?.growthRate || 0)}`}>
                {formatPercentage(metrics?.growthRate || 0)} vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.arr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency((metrics?.mrr || 0) * 12)} projetado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(metrics?.churnRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics?.ltv || 0)}</div>
            <p className="text-xs text-muted-foreground">
              LTV/CAC: {(metrics?.ltvCacRatio || 0).toFixed(1)}x
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Receita Nova</CardTitle>
            <CardDescription>Novos clientes este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(metrics?.newRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Expansão</CardTitle>
            <CardDescription>Upgrades este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(metrics?.expansionRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contração</CardTitle>
            <CardDescription>Downgrades este mês</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(metrics?.contractionRevenue || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>MRR Trend</CardTitle>
            <CardDescription>Evolução do MRR ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'MRR']} />
                <Line type="monotone" dataKey="mrr" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
            <CardDescription>Distribuição de receita por plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueByPlan}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percent }) => `${plan} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="mrr"
                >
                  {revenueByPlan.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'MRR']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="plans">Por Plano</TabsTrigger>
          <TabsTrigger value="cohorts">Análise de Coorte</TabsTrigger>
          <TabsTrigger value="forecast">Previsão</TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Receita</CardTitle>
              <CardDescription>Detalhamento mensal das métricas de receita</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>ARR</TableHead>
                    <TableHead>Churn Rate</TableHead>
                    <TableHead>Nova Receita</TableHead>
                    <TableHead>Expansão</TableHead>
                    <TableHead>Contração</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trends.map((trend) => (
                    <TableRow key={trend.date}>
                      <TableCell className="font-medium">{trend.date}</TableCell>
                      <TableCell>{formatCurrency(trend.mrr)}</TableCell>
                      <TableCell>{formatCurrency(trend.arr)}</TableCell>
                      <TableCell>{formatPercentage(trend.churnRate)}</TableCell>
                      <TableCell className="text-green-600">{formatCurrency(trend.newRevenue)}</TableCell>
                      <TableCell className="text-blue-600">{formatCurrency(trend.expansionRevenue)}</TableCell>
                      <TableCell className="text-red-600">{formatCurrency(trend.contractionRevenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Receita por Plano</CardTitle>
              <CardDescription>Distribuição de receita e clientes por plano</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>% do Total</TableHead>
                    <TableHead>Clientes</TableHead>
                    <TableHead>MRR por Cliente</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueByPlan.map((plan) => {
                    const totalMrr = revenueByPlan.reduce((sum, p) => sum + p.mrr, 0);
                    const percentage = totalMrr > 0 ? (plan.mrr / totalMrr) * 100 : 0;
                    const mrrPerCustomer = plan.tenantCount > 0 ? plan.mrr / plan.tenantCount : 0;
                    
                    return (
                      <TableRow key={plan.plan}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{plan.plan}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(plan.mrr)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm">{percentage.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{plan.tenantCount}</TableCell>
                        <TableCell>{formatCurrency(mrrPerCustomer)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cohort Analysis Tab */}
        <TabsContent value="cohorts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Coorte de Retenção</CardTitle>
              <CardDescription>Taxa de retenção por coorte de clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coorte</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Mês 0</TableHead>
                    <TableHead>Mês 1</TableHead>
                    <TableHead>Mês 2</TableHead>
                    <TableHead>Mês 3</TableHead>
                    <TableHead>Mês 6</TableHead>
                    <TableHead>Mês 12</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cohortAnalysis.map((cohort) => (
                    <TableRow key={cohort.cohortMonth}>
                      <TableCell className="font-medium">{cohort.cohortMonth}</TableCell>
                      <TableCell>{cohort.cohortSize}</TableCell>
                      <TableCell>{cohort.month0.toFixed(1)}%</TableCell>
                      <TableCell>{cohort.month1.toFixed(1)}%</TableCell>
                      <TableCell>{cohort.month2.toFixed(1)}%</TableCell>
                      <TableCell>{cohort.month3.toFixed(1)}%</TableCell>
                      <TableCell>{cohort.month6.toFixed(1)}%</TableCell>
                      <TableCell>{cohort.month12.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecast Tab */}
        <TabsContent value="forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Previsão de Receita</CardTitle>
              <CardDescription>Projeções baseadas em tendências históricas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead>MRR Previsto</TableHead>
                    <TableHead>ARR Previsto</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead>Fatores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{formatCurrency(item.predictedMrr)}</TableCell>
                      <TableCell>{formatCurrency(item.predictedArr)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${item.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm">{item.confidence.toFixed(0)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}






