'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Dumbbell, 
  TrendingUp, 
  Calendar, 
  Target, 
  Activity,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';

// KPI Widget Components
export function MembersKPIWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Members</p>
          <p className="text-3xl font-bold">{data?.total || 0}</p>
        </div>
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Active</span>
          <span>{data?.active || 0}</span>
        </div>
        <Progress value={(data?.active || 0) / (data?.total || 1) * 100} className="h-2" />
      </div>
    </div>
  );
}

export function WorkoutsKPIWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Total Workouts</p>
          <p className="text-3xl font-bold">{data?.total || 0}</p>
        </div>
        <Dumbbell className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Completed</span>
          <span>{data?.completed || 0}</span>
        </div>
        <Progress value={(data?.completed || 0) / (data?.total || 1) * 100} className="h-2" />
      </div>
    </div>
  );
}

export function CompletionRateWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
          <p className="text-3xl font-bold">{data?.rate || 0}%</p>
        </div>
        <Target className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <Progress value={data?.rate || 0} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {data?.trend || 'No change'} from last month
        </p>
      </div>
    </div>
  );
}

export function WeeklyActivityWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Weekly Activity</p>
          <p className="text-3xl font-bold">{data?.sessions || 0}</p>
        </div>
        <Activity className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>This Week</span>
          <span>{data?.thisWeek || 0}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Last Week</span>
          <span>{data?.lastWeek || 0}</span>
        </div>
      </div>
    </div>
  );
}

// Chart Widget Components
export function WorkoutsChartWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Workouts Over Time</span>
      </div>
      <div className="h-32 flex items-end justify-between gap-1">
        {data?.chartData?.map((value: number, index: number) => (
          <div
            key={index}
            className="bg-primary rounded-t"
            style={{
              height: `${(value / Math.max(...(data?.chartData || [1]))) * 100}%`,
              width: '100%',
              minHeight: '4px',
            }}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Last 7 days
      </div>
    </div>
  );
}

export function MemberDistributionWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <PieChart className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Member Distribution</span>
      </div>
      <div className="space-y-2">
        {data?.distribution?.map((item: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm">{item.label}</span>
            </div>
            <span className="text-sm font-medium">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressTrendWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <LineChart className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Progress Trend</span>
      </div>
      <div className="h-24 flex items-end justify-between gap-1">
        {data?.trendData?.map((value: number, index: number) => (
          <div
            key={index}
            className="bg-green-500 rounded-t"
            style={{
              height: `${(value / Math.max(...(data?.trendData || [1]))) * 100}%`,
              width: '100%',
              minHeight: '4px',
            }}
          />
        ))}
      </div>
      <div className="text-xs text-muted-foreground text-center">
        Member progress over time
      </div>
    </div>
  );
}

// Table Widget Components
export function RecentActivityWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Recent Activity</span>
      </div>
      <div className="space-y-2">
        {data?.activities?.map((activity: any, index: number) => (
          <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
            <div>
              <p className="text-sm font-medium">{activity.title}</p>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {activity.type}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TopMembersWidget({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">Top Performers</span>
      </div>
      <div className="space-y-2">
        {data?.clients?.map((client: any, index: number) => (
          <div key={index} className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>
              <span className="text-sm font-medium">{client.name}</span>
            </div>
            <span className="text-sm text-muted-foreground">{client.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Widget Factory
export function createDashboardWidgets() {
  return [
    {
      id: 'clients-kpi',
      type: 'kpi' as const,
      title: 'Total Members',
      description: 'Overview of client statistics',
      component: <MembersKPIWidget data={{ total: 150, active: 120 }} />,
      size: 'small' as const,
      order: 0,
    },
    {
      id: 'treinos-kpi',
      type: 'kpi' as const,
      title: 'Total Workouts',
      description: 'Workout completion statistics',
      component: <WorkoutsKPIWidget data={{ total: 450, completed: 380 }} />,
      size: 'small' as const,
      order: 1,
    },
    {
      id: 'completion-rate',
      type: 'kpi' as const,
      title: 'Completion Rate',
      description: 'Workout completion percentage',
      component: <CompletionRateWidget data={{ rate: 85, trend: '+5%' }} />,
      size: 'small' as const,
      order: 2,
    },
    {
      id: 'weekly-activity',
      type: 'kpi' as const,
      title: 'Weekly Activity',
      description: 'Sessions this week',
      component: <WeeklyActivityWidget data={{ sessions: 120, thisWeek: 120, lastWeek: 95 }} />,
      size: 'small' as const,
      order: 3,
    },
    {
      id: 'treinos-chart',
      type: 'chart' as const,
      title: 'Workouts Over Time',
      description: 'Daily treino trends',
      component: <WorkoutsChartWidget data={{ chartData: [12, 15, 18, 14, 16, 20, 22] }} />,
      size: 'medium' as const,
      order: 4,
    },
    {
      id: 'client-distribution',
      type: 'chart' as const,
      title: 'Member Distribution',
      description: 'Members by clientship type',
      component: <MemberDistributionWidget data={{ 
        distribution: [
          { label: 'Basic', value: 80, color: '#3b82f6' },
          { label: 'Premium', value: 50, color: '#10b981' },
          { label: 'VIP', value: 20, color: '#f59e0b' }
        ]
      }} />,
      size: 'medium' as const,
      order: 5,
    },
    {
      id: 'progress-trend',
      type: 'chart' as const,
      title: 'Progress Trend',
      description: 'Member progress over time',
      component: <ProgressTrendWidget data={{ trendData: [65, 70, 75, 80, 85, 90, 95] }} />,
      size: 'medium' as const,
      order: 6,
    },
    {
      id: 'recent-activity',
      type: 'table' as const,
      title: 'Recent Activity',
      description: 'Latest client activities',
      component: <RecentActivityWidget data={{ 
        activities: [
          { title: 'John completed Upper Body Workout', time: '2 hours ago', type: 'treino' },
          { title: 'Sarah joined Premium clientship', time: '4 hours ago', type: 'clientship' },
          { title: 'Mike updated his goals', time: '6 hours ago', type: 'goal' },
          { title: 'Lisa completed Cardio Session', time: '8 hours ago', type: 'treino' }
        ]
      }} />,
      size: 'large' as const,
      order: 7,
    },
    {
      id: 'top-clients',
      type: 'list' as const,
      title: 'Top Performers',
      description: 'Highest performing clients',
      component: <TopMembersWidget data={{ 
        clients: [
          { name: 'John Smith', score: '95%' },
          { name: 'Sarah Johnson', score: '92%' },
          { name: 'Mike Davis', score: '89%' },
          { name: 'Lisa Wilson', score: '87%' },
          { name: 'Tom Brown', score: '85%' }
        ]
      }} />,
      size: 'medium' as const,
      order: 8,
    },
  ];
}

