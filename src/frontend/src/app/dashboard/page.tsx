'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button'; // Added Button import
import { useAuth } from '@/hooks/use-auth';
import { useWorkouts } from '@/hooks/use-workouts';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  Dumbbell,
  Zap,
  Calendar,
  TrendingDown,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Award,
  Check,
  Circle,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
  Cell,
  LineChart, // Added LineChart import
  Line // Added Line import
} from 'recharts';
import { format, subDays, startOfWeek, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import './animations.css';

export default function DashboardPage() {
  const { user } = useAuth();

  // Estabilizar filtros com useMemo para evitar loop infinito de requisições
  const workoutFilters = useMemo(() => ({
    clientId: user?.id
  }), [user?.id]);

  // Buscar dados reais de workouts
  const { treinos: workouts, loading: workoutsLoading } = useWorkouts({
    filters: workoutFilters,
    enabled: !!user?.id
  });

  // Buscar dados reais de analytics
  const { analytics, loading: analyticsLoading } = useAnalytics({
    clientId: user?.id,
    enabled: !!user?.id
  });

  const loading = workoutsLoading || analyticsLoading;

  // Calcular estatísticas reais dos dados
  const dashboardStats = useMemo(() => {
    if (!workouts || !analytics) {
      return {
        workoutsTotal: 0,
        workoutsChange: 0,
        caloriesBurned: 0,
        caloriesChange: 0,
        trainingTime: 0,
        timeChange: 0,
        weightCurrent: 0,
        weightChange: 0,
        weightGoal: 0,
        streak: 0,
        completedDays: []
      };
    }

    // Total de treinos completados
    const completedWorkouts = workouts.filter((w: any) => w.completed);
    const totalWorkouts = completedWorkouts.length;

    // Calorias queimadas
    const totalCalories = completedWorkouts.reduce((sum: number, w: any) =>
      sum + (w.caloriesBurned || 0), 0
    );

    // Tempo total de treino (em minutos)
    const totalTime = completedWorkouts.reduce((sum: number, w: any) =>
      sum + (w.duration || 0), 0
    );

    // Calcular streak (sequência de dias consecutivos)
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);

    const workoutDates = new Set(
      completedWorkouts.map((w: any) =>
        format(new Date(w.completedAt || w.createdAt), 'yyyy-MM-dd')
      )
    );

    while (workoutDates.has(format(currentDate, 'yyyy-MM-dd'))) {
      streak++;
      currentDate = subDays(currentDate, 1);
    }

    // Dias completados na semana atual (0=Dom, 1=Seg, ..., 6=Sáb)
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Começa na segunda
    const completedDaysThisWeek = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = subDays(new Date(), new Date().getDay() - 1 - i);
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      if (workoutDates.has(dayStr)) {
        completedDaysThisWeek.push(i);
      }
    }

    // Peso atual e meta (do analytics ou user profile)
    const weightCurrent = (analytics as any)?.currentWeight || user?.profile?.weight || 0;
    const weightGoal = (analytics as any)?.goalWeight || user?.profile?.goalWeight || 0;
    const weightChange = (analytics as any)?.weightChange || 0;

    // Alterações percentuais (comparar com mês anterior)
    const lastMonthWorkouts = (analytics as any)?.lastMonthWorkouts || 0;
    const workoutsChange = lastMonthWorkouts > 0
      ? Math.round(((totalWorkouts - lastMonthWorkouts) / lastMonthWorkouts) * 100)
      : 0;

    const lastMonthCalories = (analytics as any)?.lastMonthCalories || 0;
    const caloriesChange = lastMonthCalories > 0
      ? Math.round(((totalCalories - lastMonthCalories) / lastMonthCalories) * 100)
      : 0;

    const lastMonthTime = (analytics as any)?.lastMonthTime || 0;
    const timeChange = lastMonthTime > 0
      ? Math.round(((totalTime - lastMonthTime) / lastMonthTime) * 100)
      : 0;

    return {
      workoutsTotal: totalWorkouts,
      workoutsChange,
      caloriesBurned: totalCalories,
      caloriesChange,
      trainingTime: totalTime,
      timeChange,
      weightCurrent,
      weightChange,
      weightGoal,
      streak,
      completedDays: completedDaysThisWeek
    };
  }, [workouts, analytics, user]);

  // Mensagem motivacional dinâmica
  const motivationalMessage = useMemo(() => {
    if (dashboardStats.streak >= 7) {
      return `🔥 Você está pegando fogo! ${dashboardStats.streak} dias seguidos!`;
    }
    if (dashboardStats.weightChange < 0) {
      return `🎯 Incrível! Você já perdeu ${Math.abs(dashboardStats.weightChange).toFixed(1)}kg!`;
    }
    if (dashboardStats.completedDays.length >= 5) {
      return "💪 Semana forte! Continue assim!";
    }
    return "👋 Pronto para mais um treino incrível?";
  }, [dashboardStats]);

  // Dados para gráfico de evolução de peso (últimos 30 dias do analytics)
  const weightData = useMemo(() => {
    if (!analytics?.weightHistory || analytics.weightHistory.length === 0) {
      // Se não houver dados, retornar array vazio
      return [];
    }

    return analytics.weightHistory.slice(-30).map((entry: any) => ({
      date: format(new Date(entry.date), 'dd/MM', { locale: ptBR }),
      weight: entry.weight
    }));
  }, [analytics]);

  // Dados para gráfico de treinos por semana (últimas 4 semanas)
  const workoutsData = useMemo(() => {
    if (!workouts || workouts.length === 0) {
      return [];
    }

    const weeks = [];
    const today = new Date();

    for (let i = 3; i >= 0; i--) {
      const weekStart = subDays(today, (i + 1) * 7);
      const weekEnd = subDays(today, i * 7);

      const weekWorkouts = workouts.filter((w: any) => {
        const workoutDate = new Date(w.completedAt || w.createdAt);
        return isAfter(workoutDate, weekStart) && isBefore(workoutDate, weekEnd) && w.completed;
      });

      weeks.push({
        week: `Sem ${4 - i}`,
        workouts: weekWorkouts.length
      });
    }

    return weeks;
  }, [workouts]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            Bem-vindo de volta, {user?.firstName || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground mt-1">{motivationalMessage}</p>
        </div>
        {dashboardStats.streak > 0 && (
          <Badge variant="outline" className="h-fit px-4 py-2 bg-orange-500/10 border-orange-500/20">
            <Flame className="w-4 h-4 mr-2 text-orange-500" />
            Sequência: {dashboardStats.streak} dias
          </Badge>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Treinos */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-pink-500/10 border-blue-200/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stagger-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-blue-500" />
              Treinos Completos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {dashboardStats.workoutsTotal}
            </div>
            {dashboardStats.workoutsChange !== 0 && (
              <Badge className={`mt-2 border-0 ${dashboardStats.workoutsChange > 0 ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                {dashboardStats.workoutsChange > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(dashboardStats.workoutsChange)}% vs mês passado
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Calorias */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-500/10 border-orange-200/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stagger-2">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              Calorias Queimadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {(dashboardStats.caloriesBurned / 1000).toFixed(1)}k
            </div>
            {dashboardStats.caloriesChange !== 0 && (
              <Badge className={`mt-2 border-0 ${dashboardStats.caloriesChange > 0 ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                {dashboardStats.caloriesChange > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(dashboardStats.caloriesChange)}% vs mês passado
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card 3: Tempo */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-teal-500/10 border-green-200/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stagger-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-3xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4 text-green-500" />
              Tempo de Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {Math.floor(dashboardStats.trainingTime / 60)}h
            </div>
            {dashboardStats.timeChange !== 0 && (
              <Badge className={`mt-2 border-0 ${dashboardStats.timeChange > 0 ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'}`}>
                {dashboardStats.timeChange > 0 ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                {Math.abs(dashboardStats.timeChange)}% vs mês passado
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Peso */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-rose-500/10 border-purple-200/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 stagger-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl" />
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-purple-500" />
              Peso Atual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {dashboardStats.weightCurrent > 0 ? `${dashboardStats.weightCurrent.toFixed(1)}kg` : '--'}
            </div>
            {dashboardStats.weightGoal > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Meta: {dashboardStats.weightGoal}kg {dashboardStats.weightChange !== 0 && `(${dashboardStats.weightChange > 0 ? '+' : ''}${dashboardStats.weightChange.toFixed(1)}kg)`}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {(weightData.length > 0 || workoutsData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weight Chart */}
          {weightData.length > 0 && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Evolução de Peso</CardTitle>
                <CardDescription>
                  Últimos {weightData.length} dias
                  {dashboardStats.weightGoal > 0 && ` • Meta: ${dashboardStats.weightGoal}kg`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={(analytics as any)?.weightHistory || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => format(new Date(value), 'dd/MM')}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelFormatter={(value) => format(new Date(value), "dd 'de' MMMM", { locale: ptBR })}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Workouts Chart */}
          {workoutsData.length > 0 && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Treinos por Semana</CardTitle>
                <CardDescription>Últimas 4 semanas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={workoutsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="opacity-50" />
                    <XAxis dataKey="week" stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar
                      dataKey="workouts"
                      radius={[8, 8, 0, 0]}
                      animationDuration={1000}
                    >
                      {workoutsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.workouts >= 5 ? "#10b981" : "#f59e0b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Weekly Streak */}
      {dashboardStats.completedDays.length > 0 && (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Sequência Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-around items-center">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, idx) => (
                <div key={day} className="flex flex-col items-center gap-2">
                  <span className="text-xs text-muted-foreground font-medium">{day}</span>
                  {dashboardStats.completedDays.includes(idx) ? (
                    <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center animate-bounce-in shadow-lg">
                      <Check className="w-6 h-6 text-white" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Circle className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 px-4 py-2">
                <TrendingUp className="w-4 h-4 mr-2" />
                {dashboardStats.completedDays.length}/7 treinos • Continue assim! 🔥
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {(dashboardStats.streak > 0 || dashboardStats.workoutsTotal > 0 || Math.abs(dashboardStats.weightChange) > 0) && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Conquistas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {dashboardStats.streak > 0 && (
                <Badge className="px-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:scale-110 transition-transform cursor-pointer whitespace-nowrap">
                  <Trophy className="w-4 h-4 mr-2" />
                  {dashboardStats.streak} dias seguidos
                </Badge>
              )}
              {dashboardStats.workoutsTotal > 0 && (
                <Badge className="px-4 py-3 bg-gradient-to-r from-blue-400 to-purple-500 text-white hover:scale-110 transition-transform cursor-pointer whitespace-nowrap">
                  <Award className="w-4 h-4 mr-2" />
                  {dashboardStats.workoutsTotal} treinos
                </Badge>
              )}
              {Math.abs(dashboardStats.weightChange) > 0 && (
                <Badge className="px-4 py-3 bg-gradient-to-r from-green-400 to-teal-500 text-white hover:scale-110 transition-transform cursor-pointer whitespace-nowrap">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  {Math.abs(dashboardStats.weightChange).toFixed(1)}kg {dashboardStats.weightChange < 0 ? 'perdidos' : 'ganhos'}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}