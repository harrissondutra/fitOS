'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2,
  Settings,
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  Zap,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Calendar
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function CRMPipelinePage() {
  const pipelines = [
    {
      id: 1,
      name: "Pipeline Nutricional",
      description: "Pipeline principal para consultas nutricionais",
      stages: [
        { name: "Lead", deals: 5, value: 25000, conversion: 20 },
        { name: "Qualificado", deals: 3, value: 15000, conversion: 40 },
        { name: "Proposta", deals: 2, value: 10000, conversion: 60 },
        { name: "Negociação", deals: 1, value: 5000, conversion: 80 },
        { name: "Fechado", deals: 8, value: 40000, conversion: 100 }
      ],
      totalValue: 95000,
      totalDeals: 19,
      conversionRate: 42,
      avgDealSize: 5000,
      avgCycleTime: 18,
      isActive: true,
      createdAt: "15/01/2024"
    },
    {
      id: 2,
      name: "Pipeline Empresarial",
      description: "Pipeline para consultorias empresariais",
      stages: [
        { name: "Lead", deals: 2, value: 30000, conversion: 15 },
        { name: "Qualificado", deals: 1, value: 15000, conversion: 35 },
        { name: "Proposta", deals: 1, value: 15000, conversion: 55 },
        { name: "Negociação", deals: 0, value: 0, conversion: 75 },
        { name: "Fechado", deals: 3, value: 45000, conversion: 100 }
      ],
      totalValue: 105000,
      totalDeals: 7,
      conversionRate: 43,
      avgDealSize: 15000,
      avgCycleTime: 25,
      isActive: true,
      createdAt: "20/01/2024"
    },
    {
      id: 3,
      name: "Pipeline Esportivo",
      description: "Pipeline para atletas e academias",
      stages: [
        { name: "Lead", deals: 3, value: 12000, conversion: 25 },
        { name: "Qualificado", deals: 2, value: 8000, conversion: 45 },
        { name: "Proposta", deals: 1, value: 4000, conversion: 65 },
        { name: "Negociação", deals: 1, value: 4000, conversion: 85 },
        { name: "Fechado", deals: 5, value: 20000, conversion: 100 }
      ],
      totalValue: 48000,
      totalDeals: 12,
      conversionRate: 42,
      avgDealSize: 4000,
      avgCycleTime: 15,
      isActive: false,
      createdAt: "10/01/2024"
    }
  ];

  const recentActivities = [
    {
      id: 1,
      type: "deal_moved",
      description: "Lead 'Consultoria Empresarial' movido para Qualificado",
      pipeline: "Pipeline Empresarial",
      timestamp: "2 horas atrás",
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      id: 2,
      type: "deal_closed",
      description: "Deal 'Plano Individual' fechado por R$ 3.000",
      pipeline: "Pipeline Nutricional",
      timestamp: "4 horas atrás",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      id: 3,
      type: "deal_created",
      description: "Novo lead 'Academia FitLife' adicionado",
      pipeline: "Pipeline Esportivo",
      timestamp: "1 dia atrás",
      icon: Plus,
      color: "text-purple-600"
    },
    {
      id: 4,
      type: "deal_stalled",
      description: "Deal 'Restaurante Sabor' sem atividade há 5 dias",
      pipeline: "Pipeline Nutricional",
      timestamp: "2 dias atrás",
      icon: AlertCircle,
      color: "text-yellow-600"
    }
  ];

  const getConversionColor = (rate: number) => {
    if (rate >= 50) return 'text-green-600';
    if (rate >= 30) return 'text-blue-600';
    if (rate >= 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Pipelines</h1>
          <p className="text-muted-foreground">
            Gerencie seus pipelines de vendas e acompanhe a performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Pipeline
          </Button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pipelines</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelines.length}</div>
            <p className="text-xs text-muted-foreground">
              {pipelines.filter(p => p.isActive).length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pipelines.reduce((sum, p) => sum + p.totalValue, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Pipeline ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(pipelines.reduce((sum, p) => sum + p.conversionRate, 0) / pipelines.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conversão média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(pipelines.reduce((sum, p) => sum + p.avgCycleTime, 0) / pipelines.length)} dias
            </div>
            <p className="text-xs text-muted-foreground">
              Ciclo de vendas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pipelines List */}
      <div className="space-y-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {pipeline.name}
                    {pipeline.isActive ? (
                      <Badge className="ml-2 bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge className="ml-2 bg-gray-100 text-gray-800">Inativo</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{pipeline.description}</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Ver Relatórios
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Zap className="mr-2 h-4 w-4" />
                        Automações
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Pipeline Stages */}
                <div className="grid gap-4 md:grid-cols-5">
                  {pipeline.stages.map((stage, index) => (
                    <div key={index} className="text-center p-3 border rounded-lg">
                      <div className="font-semibold text-sm mb-2">{stage.name}</div>
                      <div className="text-lg font-bold text-blue-600">{stage.deals}</div>
                      <div className="text-xs text-muted-foreground mb-1">deals</div>
                      <div className="text-sm font-medium text-green-600">
                        {formatCurrency(stage.value)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stage.conversion}% conversão
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pipeline Metrics */}
                <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Valor Total</div>
                    <div className="text-lg font-bold">{formatCurrency(pipeline.totalValue)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Total de Deals</div>
                    <div className="text-lg font-bold">{pipeline.totalDeals}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
                    <div className={`text-lg font-bold ${getConversionColor(pipeline.conversionRate)}`}>
                      {pipeline.conversionRate}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Ticket Médio</div>
                    <div className="text-lg font-bold">{formatCurrency(pipeline.avgDealSize)}</div>
                  </div>
                </div>

                {/* Conversion Funnel */}
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Funil de Conversão</h4>
                  <div className="space-y-2">
                    {pipeline.stages.map((stage, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{stage.name}</span>
                          <span>{stage.deals} deals • {formatCurrency(stage.value)}</span>
                        </div>
                        <Progress value={stage.conversion} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>
            Últimas movimentações nos pipelines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{activity.description}</div>
                  <div className="text-sm text-muted-foreground">
                    {activity.pipeline} • {activity.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Novo Pipeline
            </CardTitle>
            <CardDescription>
              Crie um novo pipeline de vendas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Pipeline</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Relatórios Avançados
            </CardTitle>
            <CardDescription>
              Análise detalhada de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Ver Relatórios</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              Automações
            </CardTitle>
            <CardDescription>
              Configure automações do pipeline
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

