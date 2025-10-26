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
  MessageSquare,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Target,
  Filter,
  Search,
  Download,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  PieChart,
  LineChart,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

export default function WhatsAppAnalyticsPage() {
  const messageStats = [
    {
      date: '01/02',
      sent: 45,
      delivered: 43,
      read: 38,
      failed: 2,
      deliveryRate: 96,
      readRate: 88
    },
    {
      date: '02/02',
      sent: 52,
      delivered: 50,
      read: 44,
      failed: 2,
      deliveryRate: 96,
      readRate: 88
    },
    {
      date: '03/02',
      sent: 38,
      delivered: 36,
      read: 32,
      failed: 2,
      deliveryRate: 95,
      readRate: 89
    },
    {
      date: '04/02',
      sent: 61,
      delivered: 58,
      read: 51,
      failed: 3,
      deliveryRate: 95,
      readRate: 88
    },
    {
      date: '05/02',
      sent: 47,
      delivered: 45,
      read: 40,
      failed: 2,
      deliveryRate: 96,
      readRate: 89
    },
    {
      date: '06/02',
      sent: 55,
      delivered: 52,
      read: 46,
      failed: 3,
      deliveryRate: 95,
      readRate: 88
    },
    {
      date: '07/02',
      sent: 43,
      delivered: 41,
      read: 36,
      failed: 2,
      deliveryRate: 95,
      readRate: 88
    },
    {
      date: '08/02',
      sent: 49,
      delivered: 47,
      read: 42,
      failed: 2,
      deliveryRate: 96,
      readRate: 89
    },
    {
      date: '09/02',
      sent: 56,
      delivered: 53,
      read: 47,
      failed: 3,
      deliveryRate: 95,
      readRate: 89
    },
    {
      date: '10/02',
      sent: 41,
      delivered: 39,
      read: 35,
      failed: 2,
      deliveryRate: 95,
      readRate: 90
    }
  ];

  const templateStats = [
    {
      name: 'welcome_message',
      sent: 156,
      delivered: 154,
      read: 89,
      failed: 2,
      deliveryRate: 99,
      readRate: 58,
      category: 'UTILITY'
    },
    {
      name: 'appointment_reminder',
      sent: 89,
      delivered: 88,
      read: 67,
      failed: 1,
      deliveryRate: 99,
      readRate: 76,
      category: 'UTILITY'
    },
    {
      name: 'follow_up',
      sent: 67,
      delivered: 66,
      read: 45,
      failed: 1,
      deliveryRate: 99,
      readRate: 68,
      category: 'UTILITY'
    },
    {
      name: 'promotional_offer',
      sent: 45,
      delivered: 44,
      read: 28,
      failed: 1,
      deliveryRate: 98,
      readRate: 64,
      category: 'MARKETING'
    },
    {
      name: 'password_recovery',
      sent: 12,
      delivered: 12,
      read: 8,
      failed: 0,
      deliveryRate: 100,
      readRate: 67,
      category: 'AUTHENTICATION'
    }
  ];

  const deviceStats = [
    { device: 'Mobile', opens: 45, percentage: 52 },
    { device: 'Desktop', opens: 32, percentage: 37 },
    { device: 'Tablet', opens: 9, percentage: 11 }
  ];

  const timeStats = [
    { hour: '08:00', messages: 12, opens: 10 },
    { hour: '09:00', messages: 18, opens: 15 },
    { hour: '10:00', messages: 25, opens: 22 },
    { hour: '11:00', messages: 22, opens: 19 },
    { hour: '12:00', messages: 15, opens: 12 },
    { hour: '13:00', messages: 8, opens: 6 },
    { hour: '14:00', messages: 20, opens: 17 },
    { hour: '15:00', messages: 28, opens: 24 },
    { hour: '16:00', messages: 30, opens: 26 },
    { hour: '17:00', messages: 25, opens: 21 },
    { hour: '18:00', messages: 18, opens: 15 },
    { hour: '19:00', messages: 12, opens: 10 }
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'UTILITY':
        return 'bg-blue-100 text-blue-800';
      case 'MARKETING':
        return 'bg-green-100 text-green-800';
      case 'AUTHENTICATION':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalSent = messageStats.reduce((sum, day) => sum + day.sent, 0);
  const totalDelivered = messageStats.reduce((sum, day) => sum + day.delivered, 0);
  const totalRead = messageStats.reduce((sum, day) => sum + day.read, 0);
  const totalFailed = messageStats.reduce((sum, day) => sum + day.failed, 0);
  const avgDeliveryRate = Math.round(messageStats.reduce((sum, day) => sum + day.deliveryRate, 0) / messageStats.length);
  const avgReadRate = Math.round(messageStats.reduce((sum, day) => sum + day.readRate, 0) / messageStats.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics do WhatsApp</h1>
          <p className="text-muted-foreground">
            Análise detalhada das suas mensagens do WhatsApp Business
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
            <CardTitle className="text-sm font-medium">Mensagens Enviadas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDeliveryRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(2)}
              <span className="ml-1">+2% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgReadRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(5)}
              <span className="ml-1">+5% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFailed}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {getTrendIcon(-1)}
              <span className="ml-1">-1% vs mês anterior</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="devices">Dispositivos</TabsTrigger>
          <TabsTrigger value="time">Horários</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="w-5 h-5 mr-2" />
                  Performance Diária
                </CardTitle>
                <CardDescription>
                  Métricas dos últimos 10 dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messageStats.slice(-5).map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="text-sm">{day.date}</div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-blue-600">{day.sent}</span> enviados
                        </div>
                        <div className="text-sm">
                          <span className="text-green-600">{day.delivered}</span> entregues
                        </div>
                        <div className="text-sm">
                          <span className="text-purple-600">{day.read}</span> lidos
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

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left p-4">Template</th>
                      <th className="text-left p-4">Categoria</th>
                      <th className="text-left p-4">Enviados</th>
                      <th className="text-left p-4">Taxa Entrega</th>
                      <th className="text-left p-4">Taxa Leitura</th>
                      <th className="text-left p-4">Falhas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateStats.map((template, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-4">
                          <div className="font-medium">{template.name}</div>
                        </td>
                        <td className="p-4">
                          <Badge className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{template.sent}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{template.deliveryRate}%</div>
                            <div className="text-sm text-muted-foreground">
                              ({template.delivered} entregues)
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <div className="font-medium">{template.readRate}%</div>
                            <div className="text-sm text-muted-foreground">
                              ({template.read} lidos)
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-red-600">{template.failed}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Dispositivo</CardTitle>
              <CardDescription>
                Como suas mensagens são abertas em diferentes dispositivos
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

        <TabsContent value="time" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise por Horário</CardTitle>
              <CardDescription>
                Melhores horários para enviar mensagens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeStats.map((time, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="text-sm font-medium">{time.hour}</div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Mensagens</div>
                        <div className="font-bold text-blue-600">{time.messages}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Aberturas</div>
                        <div className="font-bold text-green-600">{time.opens}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Taxa Abertura</div>
                        <div className="font-bold">
                          {Math.round((time.opens / time.messages) * 100)}%
                        </div>
                      </div>
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
                {messageStats.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="text-sm font-medium">{day.date}</div>
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Enviados</div>
                        <div className="font-bold text-blue-600">{day.sent}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Entregues</div>
                        <div className="font-bold text-green-600">{day.delivered}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Lidos</div>
                        <div className="font-bold text-purple-600">{day.read}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Taxa Entrega</div>
                        <div className="font-bold">
                          {day.deliveryRate}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Taxa Leitura</div>
                        <div className="font-bold">
                          {day.readRate}%
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
