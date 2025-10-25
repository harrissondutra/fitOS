import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TenantAnalytics, TrainerAnalytics, ClientAnalytics, GlobalAnalytics } from '@/shared/types';
import { 
  Users, 
  Dumbbell, 
  TrendingUp,
  Calendar,
  Target,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  description?: string;
}

function KPICard({ title, value, change, icon, description }: KPICardProps) {
  const getChangeColor = (change?: number) => {
    if (!change) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  const getChangeIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? '↗' : '↘';
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-none dark:hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {description && (
                <CardDescription className="text-sm text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && (
            <div className={`text-sm ${getChangeColor(change)}`}>
              <span className="font-medium">
                {getChangeIcon(change)} {Math.abs(change)}%
              </span>
              <span className="text-muted-foreground ml-1">vs last month</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface AnalyticsDashboardProps {
  analytics: TenantAnalytics | TrainerAnalytics | ClientAnalytics | GlobalAnalytics | null;
  type: 'tenant' | 'trainer' | 'client' | 'global';
  loading?: boolean;
  error?: string | null;
}

export function AnalyticsDashboard({ analytics, type, loading = false, error = null }: AnalyticsDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Error loading analytics</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No analytics data</h3>
            <p className="text-muted-foreground">No analytics data available.</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const getTitle = () => {
    switch (type) {
      case 'tenant':
        return 'Tenant Analytics';
      case 'trainer':
        return 'Trainer Analytics';
      case 'client':
        return 'Member Analytics';
      case 'global':
        return 'Global Analytics';
      default:
        return 'Analytics';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'tenant':
        return 'Overview of your organization\'s performance';
      case 'trainer':
        return 'Your training performance and client metrics';
      case 'client':
        return 'Your personal progress and achievements';
      case 'global':
        return 'System-wide analytics and insights';
      default:
        return 'Analytics dashboard';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{getTitle()}</h1>
          <p className="text-muted-foreground">{getDescription()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Members"
          value={type === 'tenant' ? (analytics as TenantAnalytics).totalClients || 0 :
                  type === 'trainer' ? (analytics as TrainerAnalytics).assignedClients || 0 :
                  type === 'client' ? 1 : (analytics as GlobalAnalytics).totalClients || 0}
          change={type === 'tenant' ? (analytics as TenantAnalytics).clientGrowth?.[0]?.count : undefined}
          icon={<Users className="h-5 w-5" />}
          description="Active clients"
        />
        
        <KPICard
          title="Total Workouts"
          value={type === 'tenant' ? (analytics as TenantAnalytics).totalWorkouts || 0 :
                 type === 'trainer' ? (analytics as TrainerAnalytics).totalWorkouts || 0 :
                 type === 'client' ? (analytics as ClientAnalytics).totalWorkouts || 0 : (analytics as GlobalAnalytics).totalWorkouts || 0}
          change={type === 'tenant' ? (analytics as TenantAnalytics).treinoTrends?.[0]?.count : undefined}
          icon={<Dumbbell className="h-5 w-5" />}
          description="Completed treinos"
        />
        
        <KPICard
          title="Completion Rate"
          value={`${type === 'tenant' ? (analytics as TenantAnalytics).completionRate || 0 :
                   type === 'trainer' ? (analytics as TrainerAnalytics).completionRate || 0 :
                   type === 'client' ? (analytics as ClientAnalytics).completionRate || 0 : 0}%`}
          change={undefined}
          icon={<Activity className="h-5 w-5" />}
          description="Workout completion"
        />
        
        <KPICard
          title="Retention Rate"
          value={`${type === 'tenant' ? (analytics as TenantAnalytics).retentionRate || 0 : 0}%`}
          change={undefined}
          icon={<Target className="h-5 w-5" />}
          description="Member retention"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Workout Trends
            </CardTitle>
            <CardDescription>Weekly treino completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {type === 'tenant' && (analytics as TenantAnalytics).treinoTrends && (analytics as TenantAnalytics).treinoTrends.length > 0 ? (
                (analytics as TenantAnalytics).treinoTrends.slice(0, 4).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{trend.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{trend.count} treinos</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No treino data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Member Distribution
            </CardTitle>
            <CardDescription>Members by status and type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {type === 'tenant' && (analytics as TenantAnalytics).topExerciseTypes && (analytics as TenantAnalytics).topExerciseTypes.length > 0 ? (
                (analytics as TenantAnalytics).topExerciseTypes.slice(0, 5).map((exercise, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{exercise.type}</span>
                        <p className="text-xs text-muted-foreground">{exercise.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{exercise.count} uses</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No exercise data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {type === 'tenant' && (analytics as TenantAnalytics).topExerciseTypes && (analytics as TenantAnalytics).topExerciseTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-primary" />
              Top Exercises
            </CardTitle>
            <CardDescription>Most popular exercises this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analytics as TenantAnalytics).topExerciseTypes.slice(0, 5).map((exercise, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{exercise.type}</span>
                      <p className="text-xs text-muted-foreground">{exercise.percentage}% of total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{exercise.count} uses</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
