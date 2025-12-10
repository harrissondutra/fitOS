'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Target, TrendingUp, Calendar, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '@/lib/api';
import { GoalsWidget } from '@/components/trainer/goals-widget';

interface GoalAnalytics {
  totalGoals: number;
  activeGoals: number;
  achievedGoals: number;
  averageProgress: number;
  goalsByType: Record<string, number>;
  topClients: Array<{ name: string; goalsCount: number; averageProgress: number }>;
  recentAchievements: Array<{ id: string; title: string; clientName: string; achievedDate: string }>;
}

export default function TrainerGoalsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<GoalAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState('all');
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchClients();
    fetchAnalytics();
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/trainer/clients');
      if (response.data.success && response.data.data) {
        setClients(response.data.data.map((client: any) => ({
          id: client.id,
          name: client.name
        })));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Buscar goals diretamente para calcular analytics
      const response = await api.get('/api/client-goals');
      
      if (response.data.success && response.data.goals) {
        let goals = response.data.goals;
        
        // Filtrar por cliente se selecionado
        if (selectedClient !== 'all') {
          goals = goals.filter((g: any) => g.clientId === selectedClient);
        }

        // Calcular estatísticas
        const totalGoals = goals.length;
        const activeGoals = goals.filter((g: any) => g.status === 'active').length;
        const achievedGoals = goals.filter((g: any) => g.status === 'achieved').length;
        
        const totalProgress = goals
          .filter((g: any) => g.status === 'active')
          .reduce((sum: number, g: any) => {
            const progress = ((g.current / g.target) * 100);
            return sum + progress;
          }, 0);
        
        const averageProgress = activeGoals > 0 ? totalProgress / activeGoals : 0;

        // Goals por tipo
        const goalsByType: Record<string, number> = {};
        goals.forEach((goal: any) => {
          goalsByType[goal.type] = (goalsByType[goal.type] || 0) + 1;
        });

        // Top clientes
        const clientsMap: Record<string, { goals: any[] }> = {};
        goals.forEach((goal: any) => {
          if (!clientsMap[goal.client.name]) {
            clientsMap[goal.client.name] = { goals: [] };
          }
          clientsMap[goal.client.name].goals.push(goal);
        });

        const topClients = Object.entries(clientsMap)
          .map(([name, data]) => {
            const activeClientGoals = data.goals.filter((g: any) => g.status === 'active');
            const avgProgress = activeClientGoals.length > 0
              ? activeClientGoals.reduce((sum: number, g: any) => sum + ((g.current / g.target) * 100), 0) / activeClientGoals.length
              : 0;
            
            return {
              name,
              goalsCount: data.goals.length,
              averageProgress: avgProgress
            };
          })
          .sort((a, b) => b.goalsCount - a.goalsCount)
          .slice(0, 5);

        // Conquistas recentes
        const recentAchievements = goals
          .filter((g: any) => g.status === 'achieved' && g.achievedAt)
          .sort((a: any, b: any) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
          .slice(0, 5)
          .map((goal: any) => ({
            id: goal.id,
            title: goal.title,
            clientName: goal.client.name,
            achievedDate: goal.achievedAt
          }));

        setAnalytics({
          totalGoals,
          activeGoals,
          achievedGoals,
          averageProgress,
          goalsByType,
          topClients,
          recentAchievements
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analytics de Metas</h1>
            <p className="text-muted-foreground">Acompanhe a evolução dos clientes</p>
          </div>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Analytics de Metas</h1>
            <p className="text-muted-foreground">Acompanhe a evolução dos clientes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os clientes</SelectItem>
              {clients.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {analytics && (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.totalGoals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas Ativas</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.activeGoals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.achievedGoals}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.averageProgress.toFixed(0)}%</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Metas por Tipo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(analytics.goalsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type.replace('_', ' ')}</span>
                      <Badge>{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topClients.map((client, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{client.name}</span>
                        <span className="text-sm text-muted-foreground">{client.goalsCount} metas</span>
                      </div>
                      <Progress value={client.averageProgress} className="h-2" />
                      <span className="text-xs text-muted-foreground">{client.averageProgress.toFixed(0)}% de progresso médio</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {analytics.recentAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conquistas Recentes</CardTitle>
                <CardDescription>Metas alcançadas recentemente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentAchievements.map((achievement) => (
                    <div key={achievement.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950">
                      <div>
                        <h4 className="font-semibold">{achievement.title}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.clientName}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        {format(new Date(achievement.achievedDate), "dd MMM yyyy", { locale: ptBR })}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <GoalsWidget limit={10} />
    </div>
  );
}

