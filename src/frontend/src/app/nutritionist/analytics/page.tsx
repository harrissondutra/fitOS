'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  UtensilsCrossed,
  Target,
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  MessageSquare,
  FileText,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsPage() {
  const overviewStats = [
    {
      title: "Clientes Ativos",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Consultas Este Mês",
      value: "156",
      change: "+8%",
      trend: "up",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "Planos Criados",
      value: "89",
      change: "+15%",
      trend: "up",
      icon: UtensilsCrossed,
      color: "text-purple-600"
    },
    {
      title: "Taxa de Sucesso",
      value: "94%",
      change: "+3%",
      trend: "up",
      icon: Target,
      color: "text-emerald-600"
    }
  ];

  const clientMetrics = [
    {
      metric: "Adesão ao Plano",
      value: 87,
      target: 90,
      status: "good",
      trend: "+5%"
    },
    {
      metric: "Satisfação dos Clientes",
      value: 4.8,
      target: 5.0,
      status: "good",
      trend: "+0.2"
    },
    {
      metric: "Retenção de Clientes",
      value: 92,
      target: 95,
      status: "warning",
      trend: "+2%"
    },
    {
      metric: "Consultas Concluídas",
      value: 94,
      target: 95,
      status: "good",
      trend: "+1%"
    }
  ];

  const topClients = [
    {
      name: "Maria Silva",
      progress: 95,
      adherence: 98,
      consultations: 12,
      rating: 5.0,
      status: "excellent"
    },
    {
      name: "João Santos",
      progress: 88,
      adherence: 92,
      consultations: 10,
      rating: 4.9,
      status: "excellent"
    },
    {
      name: "Ana Costa",
      progress: 75,
      adherence: 85,
      consultations: 8,
      rating: 4.7,
      status: "good"
    },
    {
      name: "Carlos Lima",
      progress: 60,
      adherence: 70,
      consultations: 6,
      rating: 4.5,
      status: "needs_attention"
    }
  ];

  const consultationTrends = [
    { month: "Jan", consultations: 45, revenue: 4500 },
    { month: "Fev", consultations: 52, revenue: 5200 },
    { month: "Mar", consultations: 48, revenue: 4800 },
    { month: "Abr", consultations: 61, revenue: 6100 },
    { month: "Mai", consultations: 58, revenue: 5800 },
    { month: "Jun", consultations: 67, revenue: 6700 }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'warning':
        return 'text-yellow-600';
      case 'needs_attention':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'needs_attention':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Relatórios</h1>
          <p className="text-muted-foreground">
            Métricas e insights da sua prática nutricional
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {overviewStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="consultations">Consultas</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Métricas Principais
                </CardTitle>
                <CardDescription>
                  Indicadores de performance da prática
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clientMetrics.map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{metric.metric}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold">{metric.value}{typeof metric.value === 'number' && metric.value <= 5 ? '' : '%'}</span>
                        <Badge variant="outline" className="text-xs">
                          {metric.trend}
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={typeof metric.value === 'number' && metric.value <= 5 ? metric.value * 20 : metric.value} 
                      className="h-2" 
                    />
                    <div className="text-xs text-muted-foreground">
                      Meta: {metric.target}{typeof metric.target === 'number' && metric.target <= 5 ? '' : '%'}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Top Performing Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Top Clientes
                </CardTitle>
                <CardDescription>
                  Clientes com melhor performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topClients.map((client, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(client.status)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{client.name}</span>
                        <div className="flex items-center space-x-2">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-sm">{client.rating}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progresso</span>
                          <span>{client.progress}%</span>
                        </div>
                        <Progress value={client.progress} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Adesão: {client.adherence}%</span>
                        <span>{client.consultations} consultas</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Clientes</CardTitle>
                <CardDescription>
                  Por status e categoria
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clientes Ativos</span>
                    <Badge className="bg-green-100 text-green-800">18 (75%)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Precisam Atenção</span>
                    <Badge className="bg-yellow-100 text-yellow-800">4 (17%)</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Inativos</span>
                    <Badge className="bg-red-100 text-red-800">2 (8%)</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Retenção</CardTitle>
                <CardDescription>
                  Evolução mensal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">92%</h3>
                  <p className="text-muted-foreground">
                    Taxa de retenção atual
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Consultas</CardTitle>
              <CardDescription>
                Evolução mensal das consultas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {consultationTrends.map((trend, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{trend.month}</div>
                      <div className="text-sm text-muted-foreground">
                        {trend.consultations} consultas
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">R$ {trend.revenue.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">
                        Receita
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Receita Mensal
                </CardTitle>
                <CardDescription>
                  R$ 6.700 este mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">R$ 6.700</div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">+12% vs mês anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fontes de Receita</CardTitle>
                <CardDescription>
                  Distribuição por tipo de serviço
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consultas Presenciais</span>
                    <Badge className="bg-blue-100 text-blue-800">60%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Consultas Online</span>
                    <Badge className="bg-green-100 text-green-800">25%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Planos Alimentares</span>
                    <Badge className="bg-purple-100 text-purple-800">15%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Relatórios Rápidos
          </CardTitle>
          <CardDescription>
            Gere relatórios específicos para análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col">
              <Users className="w-6 h-6 mb-2" />
              Relatório de Clientes
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Calendar className="w-6 h-6 mb-2" />
              Relatório de Consultas
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <DollarSign className="w-6 h-6 mb-2" />
              Relatório Financeiro
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
