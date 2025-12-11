'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useWorkouts } from '@/hooks/use-workouts';
import { useAnalytics } from '@/hooks/use-analytics';
import { PushNotificationSetup } from '@/components/pwa/PushNotificationSetup';
import {
  Dumbbell,
  Zap,
  Clock,
  TrendingDown,
  TrendingUp,
  Activity,
  Flame,
  User,
  MoreHorizontal
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
  LineChart,
  Line
} from 'recharts';
import { format, subDays, startOfWeek, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user } = useAuth();

  const workoutFilters = useMemo(() => ({
    clientId: user?.id
  }), [user?.id]);

  const { treinos: workouts, loading: workoutsLoading } = useWorkouts({
    filters: workoutFilters,
    enabled: !!user?.id
  });

  const { analytics, loading: analyticsLoading } = useAnalytics({
    clientId: user?.id,
    enabled: !!user?.id
  });

  const loading = workoutsLoading || analyticsLoading;

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
        streak: 0,
        completedDays: []
      };
    }

    const completedWorkouts = workouts.filter((w: any) => w.completed);
    const totalWorkouts = completedWorkouts.length;

    const totalCalories = completedWorkouts.reduce((sum: number, w: any) =>
      sum + (w.caloriesBurned || 0), 0
    );

    const totalTime = completedWorkouts.reduce((sum: number, w: any) =>
      sum + (w.duration || 0), 0
    );

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

    const completedDaysThisWeek = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = subDays(new Date(), new Date().getDay() - 1 - i); // Adjust if needed for Sunday star? Using user's logic roughly
      const dayStr = format(dayDate, 'yyyy-MM-dd');
      if (workoutDates.has(dayStr)) {
        completedDaysThisWeek.push(i);
      }
    }

    const weightCurrent = (analytics as any)?.currentWeight || user?.profile?.weight || 0;
    const weightChange = (analytics as any)?.weightChange || 0;

    const lastMonthWorkouts = (analytics as any)?.lastMonthWorkouts || 0;
    const workoutsChange = lastMonthWorkouts > 0
      ? Math.round(((totalWorkouts - lastMonthWorkouts) / lastMonthWorkouts) * 100)
      : 0;

    return {
      workoutsTotal: totalWorkouts,
      workoutsChange,
      caloriesBurned: totalCalories,
      caloriesChange: 0,
      trainingTime: totalTime,
      timeChange: 0,
      weightCurrent,
      weightChange,
      streak,
      completedDays: completedDaysThisWeek
    };
  }, [workouts, analytics, user]);

  const weightData = useMemo(() => {
    if (!analytics?.weightHistory || analytics.weightHistory.length === 0) return [];
    return analytics.weightHistory.slice(-10).map((entry: any) => ({
      date: format(new Date(entry.date), 'dd/MM'),
      weight: entry.weight
    }));
  }, [analytics]);

  const workoutsData = useMemo(() => {
    if (!workouts || workouts.length === 0) return [];
    const weeks = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const dayDate = subDays(today, i);
      const dayStr = format(dayDate, 'EEE', { locale: ptBR });

      // Count workouts for this day
      const dayWorkouts = workouts.filter((w: any) => {
        const wDate = new Date(w.completedAt || w.createdAt);
        return format(wDate, 'yyyy-MM-dd') === format(dayDate, 'yyyy-MM-dd') && w.completed;
      }).length;
      weeks.push({ day: dayStr, workouts: dayWorkouts });
    }
    return weeks;
  }, [workouts]);


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8 w-full h-full">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-40 rounded-3xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-full min-h-screen bg-gray-50/50 dark:bg-black/5">
      <motion.div
        className="max-w-[1920px] mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Push Notification Setup */}
        <div className="w-full">
          <PushNotificationSetup onDismiss={() => { }} />
        </div>

        {/* Header Clean */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Visão Geral
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Olá, {user?.firstName}. Aqui está o seu progresso hoje.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-full px-4 py-2 border shadow-sm flex items-center gap-2">
              <Flame className="w-5 h-5 text-primary fill-primary" />
              <span className="font-semibold">{dashboardStats.streak} dias de sequência</span>
            </div>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-gray-200">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Treinos */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Treinos Realizados</CardTitle>
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Dumbbell className="w-5 h-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
                  {dashboardStats.workoutsTotal}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  {dashboardStats.workoutsChange > 0 ? (
                    <span className="text-primary font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-1" />+{dashboardStats.workoutsChange}%
                    </span>
                  ) : (
                    <span className="text-gray-400 flex items-center">
                      <TrendingDown className="w-3 h-3 mr-1" />0%
                    </span>
                  )}
                  <span className="opacity-80">vs mês passado</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 2: Calorias */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Calorias (kcal)</CardTitle>
                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
                  {(dashboardStats.caloriesBurned).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <span className="text-orange-500 font-bold flex items-center">
                    <Activity className="w-3 h-3 mr-1" /> Ativo
                  </span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 3: Tempo */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Total</CardTitle>
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
                  {Math.floor(dashboardStats.trainingTime / 60)}<span className="text-xl font-normal text-muted-foreground ml-1">h</span>
                  {(dashboardStats.trainingTime % 60)}<span className="text-xl font-normal text-muted-foreground ml-1">m</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Horas dedicadas a você
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Card 4: Peso */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-gray-900 group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Peso Atual</CardTitle>
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <User className="w-5 h-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold tracking-tighter text-gray-900 dark:text-white">
                  {dashboardStats.weightCurrent > 0 ? dashboardStats.weightCurrent : '--'}<span className="text-xl font-normal text-muted-foreground ml-1">kg</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  {dashboardStats.weightChange !== 0 && (
                    <span className={`font-bold flex items-center ${dashboardStats.weightChange < 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {dashboardStats.weightChange > 0 ? '+' : ''}{dashboardStats.weightChange}kg
                    </span>
                  )}
                  <span>desde o início</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

          {/* Main Activity Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-gray-900 h-full">
              <CardHeader>
                <CardTitle>Atividade Semanal</CardTitle>
                <CardDescription>Número de treinos finalizados nos últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={workoutsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9ca3af', fontSize: 12 }}
                      />
                      <Tooltip
                        cursor={{ fill: '#f3f4f6' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar
                        dataKey="workouts"
                        fill="#10B981"
                        radius={[8, 8, 8, 8]}
                        barSize={40}
                        animationDuration={1500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Evolution Line Chart */}
          <motion.div variants={itemVariants} className="lg:col-span-1">
            <Card className="rounded-[2rem] border-none shadow-sm bg-white dark:bg-gray-900 h-full">
              <CardHeader>
                <CardTitle>Evolução de Peso</CardTitle>
                <CardDescription>Seu progresso recente</CardDescription>
              </CardHeader>
              <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                  {weightData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightData}>
                        <defs>
                          <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" hide />
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="weight"
                          stroke="#10B981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorWeight)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                      <Activity className="w-12 h-12 mb-2" />
                      <p className="text-sm">Sem dados de peso ainda</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}