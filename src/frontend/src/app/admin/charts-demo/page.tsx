'use client';

// Configurações SSR
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MemberGrowthChart,
  WorkoutCompletionChart,
  ProgressTrendChart,
  MembershipDistributionChart,
  CompletionRateRadialChart,
  ActivityHeatmapChart,
  KPICard,
  UsageProgressChart,
  ChartGrid,
} from '@/components/charts/analytics-charts';
import { 
  Users, 
  Dumbbell, 
  Target, 
  TrendingUp,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw
} from 'lucide-react';

export default function AnalyticsChartsDemo() {
  const [isLoading, setIsLoading] = useState(false);

  // Sample data for demonstration
  const clientGrowthData = [
    { month: 'Jan', newMembers: 12, totalMembers: 120, activeMembers: 95 },
    { month: 'Feb', newMembers: 18, totalMembers: 138, activeMembers: 110 },
    { month: 'Mar', newMembers: 25, totalMembers: 163, activeMembers: 130 },
    { month: 'Apr', newMembers: 22, totalMembers: 185, activeMembers: 145 },
    { month: 'May', newMembers: 30, totalMembers: 215, activeMembers: 170 },
    { month: 'Jun', newMembers: 28, totalMembers: 243, activeMembers: 195 },
  ];

  const workoutCompletionData = [
    { week: 'Week 1', completed: 45, total: 60, completionRate: 75 },
    { week: 'Week 2', completed: 52, total: 65, completionRate: 80 },
    { week: 'Week 3', completed: 48, total: 62, completionRate: 77 },
    { week: 'Week 4', completed: 58, total: 70, completionRate: 83 },
    { week: 'Week 5', completed: 55, total: 68, completionRate: 81 },
    { week: 'Week 6', completed: 62, total: 72, completionRate: 86 },
  ];

  const progressTrendData = [
    { date: '2024-01-01', weight: 75, strength: 60, endurance: 45 },
    { date: '2024-01-08', weight: 74, strength: 65, endurance: 50 },
    { date: '2024-01-15', weight: 73, strength: 70, endurance: 55 },
    { date: '2024-01-22', weight: 72, strength: 75, endurance: 60 },
    { date: '2024-01-29', weight: 71, strength: 80, endurance: 65 },
    { date: '2024-02-05', weight: 70, strength: 85, endurance: 70 },
  ];

  const clientshipDistributionData = [
    { name: 'Basic', value: 120, color: '#3b82f6' },
    { name: 'Premium', value: 80, color: '#10b981' },
    { name: 'VIP', value: 25, color: '#f59e0b' },
  ];

  const completionRateData = [
    { name: 'Completion Rate', value: 85 },
  ];

  const activityHeatmapData = [
    { day: 'Monday', sessions: 45, intensity: 'high' as const },
    { day: 'Tuesday', sessions: 38, intensity: 'medium' as const },
    { day: 'Wednesday', sessions: 52, intensity: 'high' as const },
    { day: 'Thursday', sessions: 42, intensity: 'medium' as const },
    { day: 'Friday', sessions: 48, intensity: 'high' as const },
    { day: 'Saturday', sessions: 35, intensity: 'low' as const },
    { day: 'Sunday', sessions: 28, intensity: 'low' as const },
  ];

  const usageData = [
    { resource: 'Members', used: 225, limit: 300, percentage: 75 },
    { resource: 'Workouts', used: 450, limit: 500, percentage: 90 },
    { resource: 'Storage', used: 2.5, limit: 5, percentage: 50 },
    { resource: 'Trainers', used: 8, limit: 10, percentage: 80 },
  ];

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleExport = () => {
    // Simulate export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics with interactive charts
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ChartGrid columns={4}>
        <KPICard
          title="Total Members"
          value="243"
          change={12}
          changeLabel="vs last month"
          icon={<Users className="h-6 w-6" />}
          color="#3b82f6"
          trend="up"
        />
        <KPICard
          title="Active Workouts"
          value="1,247"
          change={8}
          changeLabel="vs last month"
          icon={<Dumbbell className="h-6 w-6" />}
          color="#10b981"
          trend="up"
        />
        <KPICard
          title="Completion Rate"
          value="86%"
          change={5}
          changeLabel="vs last month"
          icon={<Target className="h-6 w-6" />}
          color="#f59e0b"
          trend="up"
        />
        <KPICard
          title="Avg. Sessions/Week"
          value="4.2"
          change={-2}
          changeLabel="vs last month"
          icon={<Activity className="h-6 w-6" />}
          color="#ef4444"
          trend="down"
        />
      </ChartGrid>

      {/* Charts Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="clients">Members</TabsTrigger>
          <TabsTrigger value="workouts">Workouts</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <ChartGrid columns={2}>
            <MemberGrowthChart 
              data={clientGrowthData}
              title="Member Growth"
              description="Monthly new client registrations"
            />
            <WorkoutCompletionChart 
              data={workoutCompletionData}
              title="Workout Completion"
              description="Weekly completion rates"
            />
          </ChartGrid>

          <ChartGrid columns={3}>
            <MembershipDistributionChart 
              data={clientshipDistributionData}
              title="Membership Distribution"
              description="Members by plan type"
            />
            <CompletionRateRadialChart 
              data={completionRateData}
              title="Overall Completion Rate"
              description="System-wide completion rate"
            />
            <UsageProgressChart 
              data={usageData}
              title="Resource Usage"
              description="Current usage vs limits"
            />
          </ChartGrid>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <ChartGrid columns={2}>
            <MemberGrowthChart 
              data={clientGrowthData}
              title="Member Growth Trend"
              description="New client registrations over time"
            />
            <MembershipDistributionChart 
              data={clientshipDistributionData}
              title="Plan Distribution"
              description="Membership plan breakdown"
            />
          </ChartGrid>

          <ActivityHeatmapChart 
            data={activityHeatmapData}
            title="Weekly Activity Pattern"
            description="Member activity by day of week"
          />
        </TabsContent>

        <TabsContent value="workouts" className="space-y-6">
          <ChartGrid columns={2}>
            <WorkoutCompletionChart 
              data={workoutCompletionData}
              title="Completion Trends"
              description="Workout completion over time"
            />
            <UsageProgressChart 
              data={usageData.slice(0, 2)}
              title="Workout Usage"
              description="Workout resource utilization"
            />
          </ChartGrid>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <ProgressTrendChart 
            data={progressTrendData}
            title="Member Progress"
            description="Individual progress metrics over time"
          />
          
          <ChartGrid columns={2}>
            <CompletionRateRadialChart 
              data={completionRateData}
              title="Progress Completion"
              description="Overall progress completion rate"
            />
            <ActivityHeatmapChart 
              data={activityHeatmapData}
              title="Activity Intensity"
              description="Daily activity patterns"
            />
          </ChartGrid>
        </TabsContent>
      </Tabs>

      {/* Chart Types Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Available Chart Types</CardTitle>
          <CardDescription>
            Interactive charts powered by Recharts and styled with shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Bar Charts</p>
                <p className="text-sm text-muted-foreground">Categorical data</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <LineChart className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Line Charts</p>
                <p className="text-sm text-muted-foreground">Trends over time</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <PieChart className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-medium">Pie Charts</p>
                <p className="text-sm text-muted-foreground">Part-to-whole</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              <Activity className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Area Charts</p>
                <p className="text-sm text-muted-foreground">Volume data</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



