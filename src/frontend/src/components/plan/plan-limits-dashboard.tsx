import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlanLimits } from '@/shared/types';

// Tipo específico para usage stats do plan limits
interface PlanUsageStats {
  users: Record<string, number>;
  treinos: number;
  exercises: number;
  clients: number;
  storage: number;
  limits: PlanLimits;
}
import { 
  Users, 
  Dumbbell, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface LimitCardProps {
  title: string;
  icon: React.ReactNode;
  current: number;
  limit: number;
  unit: string;
  isNearLimit?: boolean;
  isAtLimit?: boolean;
}

function LimitCard({ title, icon, current, limit, unit, isNearLimit, isAtLimit }: LimitCardProps) {
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const getProgressColor = () => {
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (isAtLimit) return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (isNearLimit) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
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
              <CardDescription className="text-sm text-muted-foreground">
                {current} / {limit} {unit}
              </CardDescription>
            </div>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Usage</span>
            <span className="font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Progress value={percentage} className="h-2">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </Progress>
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Remaining: {Math.max(0, limit - current)} {unit}</span>
          {isAtLimit && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
          {isNearLimit && !isAtLimit && (
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Near Limit
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface PlanLimitsDashboardProps {
  planLimits: PlanLimits;
  usageStats: PlanUsageStats;
}

export function PlanLimitsDashboard({ planLimits, usageStats }: PlanLimitsDashboardProps) {
  const isNearLimit = (current: number, limit: number) => {
    return current >= limit * 0.8;
  };

  const isAtLimit = (current: number, limit: number) => {
    return current >= limit;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan Limits</h1>
          <p className="text-muted-foreground">Monitor your current usage and plan limits</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-sm">
            Current Plan
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <LimitCard
          title="Members"
          icon={<Users className="h-5 w-5" />}
          current={0}
          limit={planLimits.client}
          unit="clients"
          isNearLimit={false}
          isAtLimit={false}
        />
        
        <LimitCard
          title="Workouts"
          icon={<Dumbbell className="h-5 w-5" />}
          current={0}
          limit={planLimits.treinos}
          unit="treinos"
          isNearLimit={false}
          isAtLimit={false}
        />
        
        <LimitCard
          title="Storage"
          icon={<HardDrive className="h-5 w-5" />}
          current={0}
          limit={planLimits.storage}
          unit="MB"
          isNearLimit={false}
          isAtLimit={false}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Usage Trends
            </CardTitle>
            <CardDescription>Monthly usage patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-sm font-medium">
                  {usageStats.treinos + usageStats.exercises + usageStats.clients} activities
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Members</span>
                <span className="text-sm font-medium">
                  N/A
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Storage Used</span>
                <span className="text-sm font-medium">
                  N/A
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Plan Details
            </CardTitle>
            <CardDescription>Current plan information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan Name</span>
                <span className="text-sm font-medium">Current Plan</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Price</span>
                <span className="text-sm font-medium">
                  N/A
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Billing Cycle</span>
                <span className="text-sm font-medium">
                  Monthly
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
