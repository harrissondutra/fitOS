'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Target, TrendingUp, Clock, AlertCircle, CheckCircle, XCircle, Plus, Filter, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface DashboardStats {
  appointments: {
    total: number;
    today: number;
    thisWeek: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  clients: {
    total: number;
    active: number;
    atRisk: number;
    newThisMonth: number;
  };
  tasks: {
    total: number;
    pending: number;
    overdue: number;
    completed: number;
  };
  bioimpedance: {
    totalMeasurements: number;
    thisMonth: number;
    averageBMI: number;
    clientsWithGoals: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'appointment' | 'task' | 'measurement' | 'interaction';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'overdue' | 'cancelled';
  clientName: string;
}

interface UpcomingAppointment {
  id: string;
  title: string;
  clientName: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  isVirtual: boolean;
  status: 'scheduled' | 'confirmed' | 'pending';
}

interface OverdueTask {
  id: string;
  title: string;
  clientName: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  type: 'follow_up' | 'call' | 'email' | 'meeting';
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ProfessionalDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedTab, setSelectedTab] = useState('overview');

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?range=${timeRange}`);
      const data = await response.json();
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [timeRange]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadRecentActivity(),
        loadUpcomingAppointments(),
        loadOverdueTasks()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadStats]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);


  const loadRecentActivity = async () => {
    try {
      const response = await fetch('/api/dashboard/activity?limit=10');
      const data = await response.json();
      if (data.activities) {
        setRecentActivity(data.activities);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades recentes:', error);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/upcoming?limit=5');
      const data = await response.json();
      if (data.appointments) {
        setUpcomingAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Erro ao carregar próximos agendamentos:', error);
    }
  };

  const loadOverdueTasks = async () => {
    try {
      const response = await fetch('/api/crm/tasks/overdue?limit=5');
      const data = await response.json();
      if (data.tasks) {
        setOverdueTasks(data.tasks);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas vencidas:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'normal': return 'Normal';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return <Calendar className="h-4 w-4" />;
      case 'task': return <Target className="h-4 w-4" />;
      case 'measurement': return <TrendingUp className="h-4 w-4" />;
      case 'interaction': return <Users className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'appointment': return 'Agendamento';
      case 'task': return 'Tarefa';
      case 'measurement': return 'Medição';
      case 'interaction': return 'Interação';
      default: return 'Atividade';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Profissional</h1>
          <p className="text-muted-foreground">
            Visão geral das suas atividades e métricas
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agendamentos Hoje</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.appointments.today}</div>
              <p className="text-xs text-muted-foreground">
                {stats.appointments.thisWeek} esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clients.active}</div>
              <p className="text-xs text-muted-foreground">
                {stats.clients.total} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.tasks.pending}</div>
              <p className="text-xs text-muted-foreground">
                {stats.tasks.overdue} vencidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medições Este Mês</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.bioimpedance.thisMonth}</div>
              <p className="text-xs text-muted-foreground">
                IMC médio: {stats.bioimpedance.averageBMI.toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
                <CardDescription>
                  Últimas atividades registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma atividade recente
                    </p>
                  ) : (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              {activity.title}
                            </p>
                            <Badge className={getStatusColor(activity.status)}>
                              {getStatusText(activity.status)}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {activity.clientName} • {getActivityText(activity.type)}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {format(new Date(activity.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle>Próximos Agendamentos</CardTitle>
                <CardDescription>
                  Agendamentos dos próximos dias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum agendamento próximo
                    </p>
                  ) : (
                    upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              {appointment.title}
                            </p>
                            <Badge variant="outline">
                              {appointment.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {appointment.clientName}
                          </p>
                          <p className="text-xs text-muted-foreground/70">
                            {format(new Date(appointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })} 
                            ({appointment.duration} min)
                          </p>
                          {appointment.location && (
                            <p className="text-xs text-muted-foreground/70">
                              📍 {appointment.location}
                            </p>
                          )}
                          {appointment.isVirtual && (
                            <Badge variant="secondary" className="text-xs">
                              Virtual
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Tasks Alert */}
          {overdueTasks.length > 0 && (
            <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Atenção:</strong> Você tem {overdueTasks.length} tarefa(s) vencida(s) que precisam de atenção imediata.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Appointments Tab */}
        <TabsContent value="appointments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Agendamentos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Concluídos</span>
                    <span className="font-medium">{stats?.appointments.completed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cancelados</span>
                    <span className="font-medium">{stats?.appointments.cancelled || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Não Compareceram</span>
                    <span className="font-medium">{stats?.appointments.noShow || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taxa de Comparecimento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {stats?.appointments.total ? 
                    ((stats.appointments.completed / stats.appointments.total) * 100).toFixed(1) : 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Últimos {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : '90 dias'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Agenda
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Clients Tab */}
        <TabsContent value="clients" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Ativos</span>
                    <span className="font-medium text-green-600">{stats?.clients.active || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Em Risco</span>
                    <span className="font-medium text-orange-600">{stats?.clients.atRisk || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Novos Este Mês</span>
                    <span className="font-medium text-blue-600">{stats?.clients.newThisMonth || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clientes com Metas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {stats?.bioimpedance.clientsWithGoals || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Clientes com objetivos definidos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cliente
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Ver CRM
                </Button>
                <Button variant="outline" className="w-full" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Metas
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tarefas Vencidas</CardTitle>
                <CardDescription>
                  Tarefas que precisam de atenção imediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overdueTasks.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma tarefa vencida
                  </p>
                ) : (
                  <div className="space-y-3">
                    {overdueTasks.map((task) => (
                      <div key={task.id} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <p className="text-xs text-muted-foreground">
                              {task.clientName}
                            </p>
                            <p className="text-xs text-red-600">
                              Venceu em {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                            </p>
                          </div>
                          <Badge className={getPriorityColor(task.priority)}>
                            {getPriorityText(task.priority)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Tarefas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Total</span>
                    <span className="font-medium">{stats?.tasks.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pendentes</span>
                    <span className="font-medium text-yellow-600">{stats?.tasks.pending || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Vencidas</span>
                    <span className="font-medium text-red-600">{stats?.tasks.overdue || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Concluídas</span>
                    <span className="font-medium text-green-600">{stats?.tasks.completed || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Agendamentos</CardTitle>
                <CardDescription>
                  Agendamentos por período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="appointments" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status de Clientes</CardTitle>
                <CardDescription>
                  Distribuição por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Ativos', value: stats?.clients.active || 0 },
                          { name: 'Em Risco', value: stats?.clients.atRisk || 0 },
                          { name: 'Inativos', value: (stats?.clients.total || 0) - (stats?.clients.active || 0) - (stats?.clients.atRisk || 0) }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[0, 1, 2].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
