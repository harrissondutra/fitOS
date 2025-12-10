'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Target, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

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
  client: {
    id: string;
    name: string;
  };
}

interface GoalsWidgetProps {
  clientId?: string;
  limit?: number;
}

export function GoalsWidget({ clientId, limit = 5 }: GoalsWidgetProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoals();
  }, [clientId]);

  const fetchGoals = async () => {
    try {
      const endpoint = clientId 
        ? `/api/goal-integration/client/${clientId}/goals`
        : '/api/client-goals';
      
      const response = await api.get(endpoint);
      
      if (response.data.success) {
        const goalsData = response.data.data || response.data.goals || [];
        setGoals(goalsData.slice(0, limit));
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status: string, isOnTrack: boolean) => {
    if (status === 'achieved') {
      return <CheckCircle2 className="h-4 w-4" />;
    }
    if (isOnTrack) {
      return <TrendingUp className="h-4 w-4" />;
    }
    return <AlertCircle className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Metas dos Clientes</CardTitle>
          <CardDescription>Acompanhamento de evolução</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas dos Clientes
        </CardTitle>
        <CardDescription>Acompanhamento de evolução</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma meta encontrada</p>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{goal.title}</h4>
                  {!clientId && (
                    <span className="text-sm text-muted-foreground">
                      {goal.client.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline" 
                    className={getStatusColor(goal.status)}
                  >
                    {getStatusIcon(goal.status, goal.isOnTrack)}
                    <span className="ml-1 capitalize">{goal.status}</span>
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {goal.current.toFixed(1)} {goal.unit} / {goal.target.toFixed(1)} {goal.unit}
                  </span>
                  <span className="font-semibold">{goal.progress.toFixed(0)}%</span>
                </div>
                <Progress value={goal.progress} className="h-2" />
              </div>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {format(new Date(goal.targetDate), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>
                {goal.daysRemaining > 0 && (
                  <span>
                    {goal.daysRemaining} dias restantes
                  </span>
                )}
              </div>
              
              {goal.description && (
                <p className="text-sm text-muted-foreground">{goal.description}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

