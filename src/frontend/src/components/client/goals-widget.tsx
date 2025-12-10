'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: string;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'active' | 'achieved' | 'cancelled';
  progress: number;
  daysRemaining: number;
  isOnTrack: boolean;
}

export function ClientGoalsWidget() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchGoals();
    }
  }, [user]);

  const fetchGoals = async () => {
    if (!user?.id) return;
    
    try {
      const response = await api.get(`/api/goal-integration/client/${user.id}/goals`);
      
      if (response.data.success) {
        setGoals(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string, isOnTrack: boolean) => {
    if (status === 'achieved') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    }
    if (isOnTrack) {
      return <TrendingUp className="h-5 w-5 text-blue-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Minhas Metas</CardTitle>
          <CardDescription>Acompanhe sua evolução</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const achievedGoals = goals.filter(g => g.status === 'achieved');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Minhas Metas
        </CardTitle>
        <CardDescription>Acompanhe sua evolução</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeGoals.length === 0 && achievedGoals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Você ainda não tem metas definidas</p>
          </div>
        ) : (
          <>
            {activeGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Metas Ativas</h3>
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold">{goal.title}</h4>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                      {getStatusIcon(goal.status, goal.isOnTrack)}
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {goal.current.toFixed(1)} {goal.unit} de {goal.target.toFixed(1)} {goal.unit}
                        </span>
                        <span className="font-semibold">{goal.progress.toFixed(0)}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Meta: {format(new Date(goal.targetDate), "dd MMM yyyy", { locale: ptBR })}
                        </span>
                      </div>
                      {goal.daysRemaining > 0 && (
                        <span>
                          {goal.daysRemaining} dias restantes
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {achievedGoals.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Metas Concluídas</h3>
                {achievedGoals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <div className="flex-1">
                      <h4 className="font-semibold">{goal.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Alcançada em {format(new Date(goal.targetDate), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

