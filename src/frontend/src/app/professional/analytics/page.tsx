'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, Users, Clock, Target, Loader2 } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnalyticsData {
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    noShow: number;
    byDay: Array<{ date: string; count: number; completed: number }>;
    byType: Array<{ type: string; count: number }>;
  };
  bioimpedance: {
    totalMeasurements: number;
    averageWeight: number;
    averageBodyFat: number;
    progressData: Array<{ date: string; weight: number; bodyFat: number }>;
  };
  crm: {
    totalClients: number;
    activeClients: number;
    pipeline: Array<{ stage: string; count: number }>;
    conversions: Array<{ month: string; prospects: number; clients: number }>;
  };
  goals: {
    total: number;
    achieved: number;
    inProgress: number;
    overdue: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics?period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData.data);
      }
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getAttendanceRate = () => {
    if (!data?.appointments) return 0;
    const { completed, total } = data.appointments;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getGoalAchievementRate = () => {
    if (!data?.goals) return 0;
    const { achieved, total } = data.goals;
    return total > 0 ? Math.round((achieved / total) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Erro ao carregar dados de analytics</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Acompanhe métricas e performance do seu negócio
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Agendamentos</p>
                <p className="text-2xl font-bold">{data.appointments.total}</p>
                <p className="text-xs text-muted-foreground">
                  {getAttendanceRate()}% comparecimento
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clientes Ativos</p>
                <p className="text-2xl font-bold">{data.crm.activeClients}</p>
                <p className="text-xs text-muted-foreground">
                  de {data.crm.totalClients} total
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medições</p>
                <p className="text-2xl font-bold">{data.bioimpedance.totalMeasurements}</p>
                <p className="text-xs text-muted-foreground">
                  {data.bioimpedance.averageWeight.toFixed(1)}kg média
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Metas</p>
                <p className="text-2xl font-bold">{data.goals.achieved}</p>
                <p className="text-xs text-muted-foreground">
                  {getGoalAchievementRate()}% conquistadas
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments by Day */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Dia</CardTitle>
            <CardDescription>
              Evolução dos agendamentos nos últimos {period} dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.appointments.byDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="completed" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointments by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos por Tipo</CardTitle>
            <CardDescription>
              Distribuição dos tipos de agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.appointments.byType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.appointments.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bioimpedance Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Biométrica</CardTitle>
            <CardDescription>
              Progresso de peso e gordura corporal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.bioimpedance.progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => format(new Date(value), 'dd/MM', { locale: ptBR })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy', { locale: ptBR })}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Peso (kg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="bodyFat" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Gordura (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* CRM Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline CRM</CardTitle>
            <CardDescription>
              Distribuição de clientes por estágio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.crm.pipeline} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversions */}
        <Card>
          <CardHeader>
            <CardTitle>Conversões</CardTitle>
            <CardDescription>
              Evolução de prospects para clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.crm.conversions}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => format(new Date(value), 'MMM', { locale: ptBR })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => format(new Date(value), 'MMMM yyyy', { locale: ptBR })}
                />
                <Bar dataKey="prospects" fill="#8884d8" name="Prospects" />
                <Bar dataKey="clients" fill="#82ca9d" name="Clientes" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Goals Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status das Metas</CardTitle>
            <CardDescription>
              Distribuição das metas dos clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Conquistadas</Badge>
                  <span className="text-2xl font-bold">{data.goals.achieved}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {getGoalAchievementRate()}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Em Progresso</Badge>
                  <span className="text-2xl font-bold">{data.goals.inProgress}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.goals.total > 0 ? Math.round((data.goals.inProgress / data.goals.total) * 100) : 0}%
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">Atrasadas</Badge>
                  <span className="text-2xl font-bold">{data.goals.overdue}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {data.goals.total > 0 ? Math.round((data.goals.overdue / data.goals.total) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
