'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Eye
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface PlatformOverviewData {
  tenants: {
    total: number;
    active: number;
    trial: number;
    churned: number;
    growthRate: number;
  };
  users: {
    total: number;
    byRole: Record<string, number>;
  };
  revenue: {
    mrr: number;
    arr: number;
    churnRate: number;
    ltv: number;
    byPlan: Array<{ plan: string; mrr: number; tenantCount: number }>;
  };
  health: {
    avgScore: number;
    healthy: number;
    atRisk: number;
    critical: number;
  };
  engagement: {
    activeUsers: number;
    inactiveUsers: number;
    avgScore: number;
    highEngagement: number;
  };
  topTenants: Array<{
    id: string;
    name: string;
    plan: string;
    mrr: number;
    userCount: number;
  }>;
  platformHealth: {
    score: number;
    status: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function PlatformOverview() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<PlatformOverviewData | null>(null);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/platform/overview');
      const data = await response.json();
      
      if (data.success) {
        setOverview(data.data);
      }
    } catch (error) {
      console.error('Error fetching platform data:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'good': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'fair': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-muted-foreground">
            Visão geral da plataforma e métricas principais
          </p>
        </div>
        <Button onClick={fetchPlatformData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Atualizar
        </Button>
      </div>

      {/* Platform Health Status */}
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                {getStatusIcon(overview?.platformHealth?.status || 'fair')}
                <span className="ml-2">Platform Health</span>
              </CardTitle>
              <CardDescription>Status geral da plataforma</CardDescription>
            </div>
            <Badge className={getStatusColor(overview?.platformHealth?.status || 'fair')}>
              {overview?.platformHealth?.status || 'fair'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-3xl font-bold">{overview?.platformHealth?.score || 0}</div>
              <p className="text-sm text-muted-foreground">Score de 0-100</p>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-4">
              <div 
                className="bg-blue-600 h-4 rounded-full" 
                style={{ width: `${overview?.platformHealth?.score || 0}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.tenants?.total || 0}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(overview?.tenants?.growthRate || 0)}
              <span className={`ml-1 ${getGrowthColor(overview?.tenants?.growthRate || 0)}`}>
                {formatPercentage(overview?.tenants?.growthRate || 0)} vs mês anterior
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.users?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.engagement?.activeUsers || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview?.revenue?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              ARR: {formatCurrency(overview?.revenue?.arr || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.health?.avgScore || 0}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.health?.healthy || 0} saudáveis
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tenants por Status</CardTitle>
            <CardDescription>Distribuição de tenants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Ativos</span>
                <span className="font-medium">{overview?.tenants?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Trial</span>
                <span className="font-medium">{overview?.tenants?.trial || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Churned</span>
                <span className="font-medium text-red-600">{overview?.tenants?.churned || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Health Distribution</CardTitle>
            <CardDescription>Distribuição de saúde</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Saudáveis</span>
                <span className="font-medium">{overview?.health?.healthy || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-yellow-600">Em Risco</span>
                <span className="font-medium">{overview?.health?.atRisk || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600">Críticos</span>
                <span className="font-medium">{overview?.health?.critical || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <CardDescription>Métricas de engajamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-600">Ativos</span>
                <span className="font-medium">{overview?.engagement?.activeUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-red-600">Inativos</span>
                <span className="font-medium">{overview?.engagement?.inactiveUsers || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Score Médio</span>
                <span className="font-medium">{overview?.engagement?.avgScore || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Users por Role</CardTitle>
            <CardDescription>Distribuição de usuários por função</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(overview?.users?.byRole || {}).map(([name, value]) => ({ name, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(overview?.users?.byRole || {}).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue por Plano</CardTitle>
            <CardDescription>Distribuição de receita por plano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview?.revenue?.byPlan || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip formatter={(value) => [formatCurrency(value as number), 'MRR']} />
                <Bar dataKey="mrr" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Tenants */}
      <Card>
        <CardHeader>
          <CardTitle>Top Tenants por Receita</CardTitle>
          <CardDescription>Tenants com maior receita mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>MRR</TableHead>
                <TableHead>Usuários</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview?.topTenants?.map((tenant, index) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "outline"}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{tenant.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tenant.plan}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatCurrency(tenant.mrr)}</TableCell>
                  <TableCell>{tenant.userCount}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
          <CardDescription>Métricas financeiras principais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(overview?.revenue?.mrr || 0)}</div>
              <p className="text-sm text-muted-foreground">MRR</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(overview?.revenue?.arr || 0)}</div>
              <p className="text-sm text-muted-foreground">ARR</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatPercentage(overview?.revenue?.churnRate || 0)}</div>
              <p className="text-sm text-muted-foreground">Churn Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(overview?.revenue?.ltv || 0)}</div>
              <p className="text-sm text-muted-foreground">LTV</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



