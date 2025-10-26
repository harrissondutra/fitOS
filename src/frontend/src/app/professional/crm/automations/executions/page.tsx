'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Zap, 
  Play, 
  Pause,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Mail,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  RefreshCw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Target
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function WorkflowExecutionsPage() {
  const executions = [
    {
      id: '1',
      workflowName: 'Follow-up de Leads',
      status: 'completed',
      startedAt: '10/02/2024 14:30',
      completedAt: '10/02/2024 14:32',
      duration: '2 min',
      trigger: 'Novo Lead: João Silva',
      actionsExecuted: 3,
      successRate: 100,
      errorMessage: null,
      logs: [
        { timestamp: '14:30:15', action: 'Lead detectado', status: 'success' },
        { timestamp: '14:30:45', action: 'Email enviado', status: 'success' },
        { timestamp: '14:31:30', action: 'WhatsApp enviado', status: 'success' }
      ]
    },
    {
      id: '2',
      workflowName: 'Lembrete de Consultas',
      status: 'completed',
      startedAt: '10/02/2024 09:00',
      completedAt: '10/02/2024 09:01',
      duration: '1 min',
      trigger: 'Consulta: Maria Santos - 11/02/2024 10:00',
      actionsExecuted: 2,
      successRate: 100,
      errorMessage: null,
      logs: [
        { timestamp: '09:00:00', action: 'Lembrete enviado', status: 'success' },
        { timestamp: '09:00:30', action: 'Confirmação solicitada', status: 'success' }
      ]
    },
    {
      id: '3',
      workflowName: 'Follow-up Pós-Consulta',
      status: 'failed',
      startedAt: '09/02/2024 16:00',
      completedAt: '09/02/2024 16:05',
      duration: '5 min',
      trigger: 'Consulta concluída: Carlos Lima',
      actionsExecuted: 1,
      successRate: 50,
      errorMessage: 'Erro ao enviar email: Endereço inválido',
      logs: [
        { timestamp: '16:00:00', action: 'Feedback solicitado', status: 'success' },
        { timestamp: '16:04:30', action: 'Email de agradecimento', status: 'failed' }
      ]
    },
    {
      id: '4',
      workflowName: 'Onboarding de Clientes',
      status: 'running',
      startedAt: '10/02/2024 15:45',
      completedAt: null,
      duration: '15 min',
      trigger: 'Novo cliente: Ana Costa',
      actionsExecuted: 2,
      successRate: 100,
      errorMessage: null,
      logs: [
        { timestamp: '15:45:00', action: 'Email de boas-vindas', status: 'success' },
        { timestamp: '15:45:30', action: 'Guia enviado', status: 'success' },
        { timestamp: '15:46:00', action: 'Aguardando 1 dia...', status: 'pending' }
      ]
    },
    {
      id: '5',
      workflowName: 'Recuperação de Churn',
      status: 'completed',
      startedAt: '08/02/2024 10:00',
      completedAt: '08/02/2024 10:15',
      duration: '15 min',
      trigger: 'Cliente inativo: Pedro Santos (45 dias)',
      actionsExecuted: 4,
      successRate: 100,
      errorMessage: null,
      logs: [
        { timestamp: '10:00:00', action: 'Email de reengajamento', status: 'success' },
        { timestamp: '10:05:00', action: 'Oferta especial enviada', status: 'success' },
        { timestamp: '10:10:00', action: 'Follow-up WhatsApp', status: 'success' },
        { timestamp: '10:15:00', action: 'Contato telefônico', status: 'success' }
      ]
    },
    {
      id: '6',
      workflowName: 'Upsell de Serviços',
      status: 'completed',
      startedAt: '07/02/2024 14:00',
      completedAt: '07/02/2024 14:08',
      duration: '8 min',
      trigger: 'Cliente satisfeito: Lucia Oliveira (4 meses)',
      actionsExecuted: 3,
      successRate: 100,
      errorMessage: null,
      logs: [
        { timestamp: '14:00:00', action: 'Oferta enviada', status: 'success' },
        { timestamp: '14:05:00', action: 'Follow-up realizado', status: 'success' },
        { timestamp: '14:08:00', action: 'Consulta agendada', status: 'success' }
      ]
    }
  ];

  const workflowStats = [
    {
      name: 'Follow-up de Leads',
      totalExecutions: 156,
      successRate: 94,
      avgDuration: '2.5 min',
      lastExecution: '10/02/2024 14:30',
      status: 'active'
    },
    {
      name: 'Lembrete de Consultas',
      totalExecutions: 89,
      successRate: 98,
      avgDuration: '1.2 min',
      lastExecution: '10/02/2024 09:00',
      status: 'active'
    },
    {
      name: 'Follow-up Pós-Consulta',
      totalExecutions: 67,
      successRate: 87,
      avgDuration: '3.8 min',
      lastExecution: '09/02/2024 16:00',
      status: 'active'
    },
    {
      name: 'Onboarding de Clientes',
      totalExecutions: 34,
      successRate: 92,
      avgDuration: '12.5 min',
      lastExecution: '10/02/2024 15:45',
      status: 'active'
    },
    {
      name: 'Recuperação de Churn',
      totalExecutions: 23,
      successRate: 78,
      avgDuration: '14.2 min',
      lastExecution: '08/02/2024 10:00',
      status: 'inactive'
    },
    {
      name: 'Upsell de Serviços',
      totalExecutions: 12,
      successRate: 83,
      avgDuration: '8.7 min',
      lastExecution: '07/02/2024 14:00',
      status: 'active'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      case 'running':
        return <Play className="w-3 h-3" />;
      case 'pending':
        return <Clock className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter(e => e.status === 'completed').length;
  const failedExecutions = executions.filter(e => e.status === 'failed').length;
  const runningExecutions = executions.filter(e => e.status === 'running').length;
  const avgSuccessRate = Math.round(executions.reduce((sum, e) => sum + e.successRate, 0) / executions.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Execuções de Workflow</h1>
          <p className="text-muted-foreground">
            Monitore e analise as execuções dos seus workflows
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Play className="w-4 h-4 mr-2" />
            Executar Todos
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Execuções</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgSuccessRate}%</div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Ativas</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedExecutions}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar execuções, workflows, triggers..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todos os Status</option>
                <option>Completado</option>
                <option>Falhou</option>
                <option>Executando</option>
                <option>Pendente</option>
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todos os Workflows</option>
                <option>Follow-up de Leads</option>
                <option>Lembrete de Consultas</option>
                <option>Follow-up Pós-Consulta</option>
                <option>Onboarding de Clientes</option>
                <option>Recuperação de Churn</option>
                <option>Upsell de Serviços</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executions Tabs */}
      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recentes ({executions.length})</TabsTrigger>
          <TabsTrigger value="running">Executando ({runningExecutions})</TabsTrigger>
          <TabsTrigger value="failed">Falhas ({failedExecutions})</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Taxa de Sucesso</TableHead>
                    <TableHead>Iniciado</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{execution.workflowName}</div>
                          <div className="text-sm text-muted-foreground">
                            {execution.actionsExecuted} ações executadas
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(execution.status)}>
                          {getStatusIcon(execution.status)}
                          <span className="ml-1 capitalize">{execution.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.trigger}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.duration}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={execution.successRate} className="w-16 h-2" />
                          <span className="text-sm">{execution.successRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.startedAt}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Re-executar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="mr-2 h-4 w-4" />
                              Analisar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="running" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Tempo Decorrido</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Próxima Ação</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.filter(e => e.status === 'running').map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <div className="font-medium">{execution.workflowName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.trigger}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.duration}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={75} className="w-16 h-2" />
                          <span className="text-sm">75%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">Aguardando 1 dia...</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pause className="mr-2 h-4 w-4" />
                              Pausar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Cancelar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Falhou em</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {executions.filter(e => e.status === 'failed').map((execution) => (
                    <TableRow key={execution.id}>
                      <TableCell>
                        <div className="font-medium">{execution.workflowName}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.trigger}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-red-600">{execution.errorMessage}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.duration}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{execution.completedAt}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Logs
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Re-executar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <AlertCircle className="mr-2 h-4 w-4" />
                              Reportar Bug
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {workflowStats.map((stat) => (
              <Card key={stat.name}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stat.name}</span>
                    <Badge className={stat.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {stat.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-sm text-muted-foreground">Total de Execuções</div>
                      <div className="text-2xl font-bold">{stat.totalExecutions}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                      <div className="text-2xl font-bold">{stat.successRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Duração Média</div>
                      <div className="text-lg font-semibold">{stat.avgDuration}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Última Execução</div>
                      <div className="text-sm">{stat.lastExecution}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="w-5 h-5 mr-2 text-blue-600" />
              Executar Todos
            </CardTitle>
            <CardDescription>
              Execute todos os workflows ativos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Executar Todos</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Relatórios
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
              <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
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
