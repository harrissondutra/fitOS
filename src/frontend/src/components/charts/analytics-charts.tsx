'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart,
  BarChart,
  LineChart,
  PieChart,
  RadialChart,
  MultiLineChart,
  StackedAreaChart,
  COLORS,
} from './chart-components';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Dumbbell, 
  Target, 
  Calendar,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon
} from 'lucide-react';

// Analytics-specific chart components

// Member Growth Chart
interface MemberGrowthChartProps {
  data: Array<{
    month: string;
    newMembers: number;
    totalMembers: number;
    activeMembers: number;
  }>;
  title?: string;
  description?: string;
}

function MemberGrowthChart({ 
  data, 
  title = "Member Growth", 
  description = "Monthly client growth and activity trends" 
}: MemberGrowthChartProps) {
  return (
    <AreaChart
      data={data}
      dataKey="newMembers"
      xAxisKey="month"
      title={title}
      description={description}
      height={300}
      color={COLORS.primary}
      gradient={true}
    />
  );
}

// Workout Completion Chart
interface WorkoutCompletionChartProps {
  data: Array<{
    week: string;
    completed: number;
    total: number;
    completionRate: number;
  }>;
  title?: string;
  description?: string;
}

function WorkoutCompletionChart({ 
  data, 
  title = "Workout Completion", 
  description = "Weekly workout completion rates" 
}: WorkoutCompletionChartProps) {
  return (
    <BarChart
      data={data}
      dataKey="completed"
      xAxisKey="week"
      title={title}
      description={description}
      height={300}
      color={COLORS.secondary}
    />
  );
}

// Progress Trend Chart
interface ProgressTrendChartProps {
  data: Array<{
    date: string;
    weight: number;
    strength: number;
    endurance: number;
  }>;
  title?: string;
  description?: string;
}

function ProgressTrendChart({ 
  data, 
  title = "Progress Trend", 
  description = "Member progress over time" 
}: ProgressTrendChartProps) {
  const lines = [
    { dataKey: 'weight', name: 'Weight (kg)', color: COLORS.primary, strokeWidth: 2 },
    { dataKey: 'strength', name: 'Strength Score', color: COLORS.secondary, strokeWidth: 2 },
    { dataKey: 'endurance', name: 'Endurance Score', color: COLORS.accent, strokeWidth: 2 },
  ];

  return (
    <MultiLineChart
      data={data}
      lines={lines}
      xAxisKey="date"
      title={title}
      description={description}
      height={300}
    />
  );
}

// Membership Distribution Chart
interface MembershipDistributionChartProps {
  data: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
  title?: string;
  description?: string;
}

function MembershipDistributionChart({ 
  data, 
  title = "Membership Distribution", 
  description = "Distribution of clients by clientship type" 
}: MembershipDistributionChartProps) {
  return (
    <PieChart
      data={data}
      dataKey="value"
      nameKey="name"
      title={title}
      description={description}
      height={300}
      colors={COLORS.chart}
    />
  );
}

// Completion Rate Radial Chart
interface CompletionRateRadialChartProps {
  data: Array<{
    name: string;
    value: number;
  }>;
  title?: string;
  description?: string;
}

function CompletionRateRadialChart({ 
  data, 
  title = "Completion Rate", 
  description = "Overall workout completion rate" 
}: CompletionRateRadialChartProps) {
  return (
    <RadialChart
      data={data}
      dataKey="value"
      title={title}
      description={description}
      height={300}
      color={COLORS.secondary}
      maxValue={100}
    />
  );
}

// Activity Heatmap Chart (using Bar Chart)
interface ActivityHeatmapChartProps {
  data: Array<{
    day: string;
    sessions: number;
    intensity: 'low' | 'medium' | 'high';
  }>;
  title?: string;
  description?: string;
}

function ActivityHeatmapChart({ 
  data, 
  title = "Activity Heatmap", 
  description = "Daily activity intensity" 
}: ActivityHeatmapChartProps) {
  const getColor = (intensity: string) => {
    switch (intensity) {
      case 'high': return COLORS.destructive;
      case 'medium': return COLORS.accent;
      case 'low': return COLORS.secondary;
      default: return COLORS.muted;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.day}</span>
              <div className="flex items-center gap-2">
                <div 
                  className="h-4 rounded"
                  style={{ 
                    width: `${(item.sessions / Math.max(...data.map(d => d.sessions))) * 100}px`,
                    backgroundColor: getColor(item.intensity),
                    opacity: 0.7
                  }}
                />
                <span className="text-sm text-muted-foreground">{item.sessions}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// KPI Cards with Charts
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function KPICard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon, 
  color = COLORS.primary,
  trend = 'neutral'
}: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 mt-1">
                {getTrendIcon()}
                <span className={`text-sm ${getTrendColor()}`}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-muted-foreground ml-1">
                    {changeLabel}
                  </span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Usage Progress Chart
interface UsageProgressChartProps {
  data: Array<{
    resource: string;
    used: number;
    limit: number;
    percentage: number;
  }>;
  title?: string;
  description?: string;
}

function UsageProgressChart({ 
  data, 
  title = "Resource Usage", 
  description = "Current usage vs limits" 
}: UsageProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.resource}</span>
              <span className="text-sm text-muted-foreground">
                {item.used} / {item.limit}
              </span>
            </div>
            <Progress 
              value={item.percentage} 
              className="h-2"
              style={{
                backgroundColor: item.percentage > 90 ? COLORS.destructive : 
                               item.percentage > 75 ? COLORS.accent : COLORS.secondary
              }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Chart Grid Layout Component
interface ChartGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

function ChartGrid({ 
  children, 
  columns = 2, 
  className = '' 
}: ChartGridProps) {
  const getGridClasses = () => {
    switch (columns) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
      default: return 'grid-cols-1 md:grid-cols-2';
    }
  };

  return (
    <div className={`grid gap-6 ${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
}

// Export all analytics chart components
export {
  MemberGrowthChart,
  WorkoutCompletionChart,
  ProgressTrendChart,
  MembershipDistributionChart,
  CompletionRateRadialChart,
  ActivityHeatmapChart,
  KPICard,
  UsageProgressChart,
  ChartGrid,
};
