'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Mail,
  Eye,
  Target,
  Users,
  Clock,
  Calendar,
  Filter,
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  PieChart,
  LineChart
} from 'lucide-react';

export default function MarketingAnalyticsPage() {
  const campaignStats = [
    {
      id: '1',
      name: 'Boas-vindas Novos Clientes',
      sent: 156,
      delivered: 154,
      opened: 89,
      clicked: 23,
      unsubscribed: 2,
      bounced: 2,
      openRate: 58,
      clickRate: 15,
      unsubscribeRate: 1.3,
      bounceRate: 1.3,
      revenue: 4500,
      lastSent: '10/02/2024'
    },
    {
      id: '2',
      name: 'Lembrete de Consulta',
      sent: 89,
      delivered: 88,
      opened: 67,
      clicked: 12,
      unsubscribed: 1,
      bounced: 1,
      openRate: 76,
      clickRate: 14,
      unsubscribeRate: 1.1,
      bounceRate: 1.1,
      revenue: 2300,
      lastSent: '09/02/2024'
    },
    {
      id: '3',
      name: 'Oferta Especial - Fevereiro',
      sent: 45,
      delivered: 44,
      opened: 28,
      clicked: 8,
      unsubscribed: 2,
      bounced: 1,
      openRate: 64,
      clickRate: 18,
      unsubscribeRate: 4.4,
      bounceRate: 2.2,
      revenue: 1200,
      lastSent: '08/02/2024'
    },
    {
      id: '4',
      name: 'Follow-up Pós-Consulta',
      sent: 67,
      delivered: 66,
      opened: 45,
      clicked: 12,
      unsubscribed: 1,
      bounced: 1,
      openRate: 68,
      clickRate: 18,
      unsubscribeRate: 1.5,
      bounceRate: 1.5,
      revenue: 1800,
      lastSent: '07/02/2024'
    }
  ];

  const timeSeriesData = [
    { date: '01/02', sent: 45, opened: 28, clicked: 8 },
    { date: '02/02', sent: 52, opened: 34, clicked: 12 },
    { date: '03/02', sent: 38, opened: 25, clicked: 7 },
    { date: '04/02', sent: 61, opened: 42, clicked: 15 },
    { date: '05/02', sent: 47, opened: 31, clicked: 9 },
    { date: '06/02', sent: 55, opened: 38, clicked: 11 },
    { date: '07/02', sent: 43, opened: 29, clicked: 8 },
    { date: '08/02', sent: 49, opened: 33, clicked: 10 },
    { date: '09/02', sent: 56, opened: 39, clicked: 13 },
    { date: '10/02', sent: 41, opened: 28, clicked: 7 }
  ];

  const audienceSegments = [
    {
      name: 'Novos Clientes',
      size: 156,
      openRate: 58,
      clickRate: 15,
      revenue: 4500,
      growth: 12
    },
    {
      name: 'Clientes Ativos',
      size: 89,
      openRate: 76,
      clickRate: 14,
      revenue: 2300,
      growth: 8
    },
    {
      name: 'Clientes Inativos',
      size: 45,
      openRate: 64,
      clickRate: 18,
      revenue: 1200,
      growth: -5
    },
    {
      name: 'Clientes VIP',
      size: 67,
      openRate: 68,
      clickRate: 18,
      revenue: 1800,
      growth: 15
    }
  ];

  const deviceStats = [
    { device: 'Desktop', opens: 45, percentage: 52 },
    { device: 'Mobile', opens: 32, percentage: 37 },
    { device: 'Tablet', opens: 9, percentage: 11 }
  ];

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-600" />;
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const totalSent = campaignStats.reduce((sum, c) => sum + c.sent, 0);
  const totalOpened = campaignStats.reduce((sum, c) => sum + c.opened, 0);
  const totalClicked = campaignStats.reduce((sum, c) => sum + c.clicked, 0);
  const totalRevenue = campaignStats.reduce((sum, c) => sum + c.revenue, 0);
  const avgOpenRate = Math.round(campaignStats.reduce((sum, c) => sum + c.openRate, 0) / campaignStats.length);
  const avgClickRate = Math.round(campaignStats.reduce((sum, c) => sum + c.clickRate, 0) / campaignStats.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Marketing</h1>
          <p className="text-muted-foreground">
            Análise detalhada das suas campanhas de email
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button>
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatório Completo
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSent}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(12)}
              <span className="ml-1">+12% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgOpenRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(5)}
              <span className="ml-1">+5% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClickRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(3)}
              <span className="ml-1">+3% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Gerada</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(18)}
              <span className="ml-1">+18% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="audience">Audiência</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Performance Geral
                </CardTitle>
                <CardDescription>
                  Métricas dos últimos 10 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timeSeriesData.slice(-5).map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm">{data.date}</div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-blue-600">{data.sent}</span> enviados
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600">{data.opened}</span> abertos
                        </div>
                        <div className="text-sm">
                          <span className="text-purple-600">{data.clicked}</span> cliques
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Abertura por Dispositivo
                </CardTitle>
                <CardDescription>
                  Últimos 30 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {deviceStats.map((device, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{device.device}</span>
                        <span className="text-sm text-muted-foreground">{device.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">Campanha</th>
                      <th className="text-left p-4">Enviados</th>
                      <th className="text-left p-4">Taxa Abertura</th>
                      <th className="text-left p-4">Taxa Clique</th>
                      <th className="text-left p-4">Receita</th>
                      <th className="text-left p-4">Último Envio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaignStats.map((campaign) => (
                      <tr key={campaign.id} className="border-b">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {campaign.delivered} entregues
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{campaign.sent}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{campaign.openRate}%</div>
                            <div className="text-sm text-muted-foreground">
                              ({campaign.opened} abertos)
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{campaign.clickRate}%</div>
                            <div className="text-sm text-muted-foreground">
                              ({campaign.clicked} cliques)
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-green-600">
                            R$ {campaign.revenue.toLocaleString()}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">{campaign.lastSent}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {audienceSegments.map((segment, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{segment.name}</span>
                    <Badge className={getTrendColor(segment.growth)}>
                      {getTrendIcon(segment.growth)}
                      <span className="ml-1">{segment.growth > 0 ? '+' : ''}{segment.growth}%</span>
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Tamanho</div>
                      <div className="text-2xl font-bold">{segment.size}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa Abertura</div>
                      <div className="text-2xl font-bold">{segment.openRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa Clique</div>
                      <div className="text-2xl font-bold">{segment.clickRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Receita</div>
                      <div className="text-2xl font-bold text-green-600">
                        R$ {segment.revenue.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Dispositivo</CardTitle>
              <CardDescription>
                Como seus emails são abertos em diferentes dispositivos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {deviceStats.map((device, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-600 rounded"></div>
                        <span className="font-medium">{device.device}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {device.opens} aberturas ({device.percentage}%)
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full"
                        style={{ width: `${device.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências Temporais</CardTitle>
              <CardDescription>
                Evolução das métricas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeSeriesData.map((data, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="text-sm font-medium">{data.date}</div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Enviados</div>
                        <div className="font-bold text-blue-600">{data.sent}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Abertos</div>
                        <div className="font-bold text-green-600">{data.opened}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Cliques</div>
                        <div className="font-bold text-purple-600">{data.clicked}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Taxa Abertura</div>
                        <div className="font-bold">
                          {Math.round((data.opened / data.sent) * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2 text-blue-600" />
              Exportar Dados
            </CardTitle>
            <CardDescription>
              Baixe relatórios detalhados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Exportar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Relatório Personalizado
            </CardTitle>
            <CardDescription>
              Crie relatórios sob medida
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Criar Relatório</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="w-5 h-5 mr-2 text-purple-600" />
              Monitoramento
            </CardTitle>
            <CardDescription>
              Configure alertas e notificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Configurar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

