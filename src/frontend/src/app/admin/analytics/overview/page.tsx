'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { useAnalytics } from '@/hooks/use-analytics';
import { usePermissions } from '@/hooks/use-permissions';
import { UserRoles } from '@/shared/types/auth.types';
import { TenantAnalytics, TrainerAnalytics, ClientAnalytics, GlobalAnalytics } from '@/shared/types';
import {
  BarChart3,
  TrendingUp,
  Users,
  Dumbbell,
  Calendar,
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';

// Configurações para evitar problemas de SSR com useAuth
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

export default function AnalyticsPage() {
  // Auth removed - using default values
  const user = { role: UserRoles.ADMIN, tenantId: 'default-tenant' };
  const permissions = usePermissions(user?.role);
  const type = 'tenant'; // Define the analytics type for this page
  const { analytics, loading, error, refetch } = useAnalytics({
    tenantId: user?.tenantId,
    enabled: !!user?.tenantId
  });

  if (!permissions.canViewAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-muted rounded w-96 mt-2 animate-pulse"></div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Error Loading Analytics</CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>
              Analytics data is not available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Insights and performance metrics for your organization
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <AnalyticsDashboard analytics={analytics} type="tenant" />

      {/* Additional Analytics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Workout Completion Trends
            </CardTitle>
            <CardDescription>Weekly workout completion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {type === 'tenant' && (analytics as TenantAnalytics).treinoTrends && (analytics as TenantAnalytics).treinoTrends.length > 0 ? (
                (analytics as TenantAnalytics).treinoTrends.slice(0, 4).map((trend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{trend.date}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{trend.count} workouts</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No workout data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Member Activity
            </CardTitle>
            <CardDescription>Member engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active this week</span>
                <span className="text-sm font-medium">
                  {type === 'tenant' ? (analytics as TenantAnalytics).activeClients || 0 :
                    type === 'trainer' ? (analytics as TrainerAnalytics).activeClients || 0 : 0} clients
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New this month</span>
                <span className="text-sm font-medium">
                  {type === 'tenant' ? (analytics as TenantAnalytics).newClientsThisMonth || 0 : 0} clients
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. sessions/week</span>
                <span className="text-sm font-medium">
                  0 sessions
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Performance Metrics
          </CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {type === 'tenant' ? (analytics as TenantAnalytics).completionRate || 0 :
                  type === 'trainer' ? (analytics as TrainerAnalytics).completionRate || 0 :
                    type === 'client' ? (analytics as ClientAnalytics).completionRate || 0 : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {type === 'tenant' ? (analytics as TenantAnalytics).retentionRate || 0 : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Retention Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {type === 'tenant' ? (analytics as TenantAnalytics).completionRate || 0 :
                  type === 'trainer' ? (analytics as TrainerAnalytics).completionRate || 0 :
                    type === 'client' ? (analytics as ClientAnalytics).completionRate || 0 : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Workout Completion</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {type === 'tenant' ? (analytics as TenantAnalytics).retentionRate || 0 : 0}%
              </div>
              <div className="text-sm text-muted-foreground">Satisfaction</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Recent Activity
          </CardTitle>
          <CardDescription>Latest client activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {type === 'tenant' && (analytics as TenantAnalytics).activityTrends && (analytics as TenantAnalytics).activityTrends.length > 0 ? (
              (analytics as TenantAnalytics).activityTrends.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                      {activity.count}
                    </div>
                    <div>
                      <span className="text-sm font-medium">{activity.date}</span>
                      <p className="text-xs text-muted-foreground">Activities</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.count} activities
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
