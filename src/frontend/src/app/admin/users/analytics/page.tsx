/**
 * User Analytics Dashboard - FitOS
 * 
 * Dashboard completo de analytics de usuários
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock,
  RefreshCw,
  Download,
  Eye,
  Target,
  BarChart3
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UserEngagementMetrics {
  dau: number;
  mau: number;
  wau: number;
  avgSessionTime: number;
  avgActionsPerSession: number;
  bounceRate: number;
  fromCache?: boolean;
  cachedAt?: Date;
}

interface RetentionCohort {
  cohortDate: string;
  users: number;
  retention: number[];
  period: number;
}

interface FeatureAdoption {
  feature: string;
  totalUsers: number;
  adoptedUsers: number;
  adoptionRate: number;
  trend: 'up' | 'down' | 'stable';
}

interface SessionAnalytics {
  totalSessions: number;
  avgSessionDuration: number;
  sessionsByDevice: Record<string, number>;
  sessionsByHour: Array<{
    hour: number;
    count: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
  }>;
}

interface TopActiveUser {
  id: string;
  name: string;
  email: string;
  lastActive: Date;
  sessionCount: number;
  totalTime: number;
  actionsCount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserAnalyticsPage() {
  const [overview, setOverview] = useState<UserEngagementMetrics | null>(null);
  const [retentionCohorts, setRetentionCohorts] = useState<RetentionCohort[]>([]);
  const [featureAdoption, setFeatureAdoption] = useState<FeatureAdoption[]>([]);
  const [sessionAnalytics, setSessionAnalytics] = useState<SessionAnalytics | null>(null);
  const [topUsers, setTopUsers] = useState<TopActiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      const [overviewRes, retentionRes, featuresRes, sessionsRes, topUsersRes] = await Promise.all([
        fetch('/api/admin/user-analytics/overview'),
        fetch(`/api/admin/user-analytics/retention?period=${selectedPeriod}`),
        fetch('/api/admin/user-analytics/features'),
        fetch('/api/admin/user-analytics/sessions'),
        fetch('/api/admin/user-analytics/top-users?limit=10')
      ]);

      const [overviewData, retentionData, featuresData, sessionsData, topUsersData] = await Promise.all([
        overviewRes.json(),
        retentionRes.json(),
        featuresRes.json(),
        sessionsRes.json(),
        topUsersRes.json()
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (retentionData.success) setRetentionCohorts(retentionData.data);
      if (featuresData.success) setFeatureAdoption(featuresData.data);
      if (sessionsData.success) setSessionAnalytics(sessionsData.data);
      if (topUsersData.success) setTopUsers(topUsersData.data);
    } catch (error) {
      console.error('Error fetching user analytics data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh a cada 5 minutos
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Analytics</h1>
            <p className="text-muted-foreground">Análise completa de engajamento e comportamento dos usuários</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Analytics</h1>
          <p className="text-muted-foreground">Análise completa de engajamento e comportamento dos usuários</p>
        </div>
        <div className="flex items-center gap-2">
          {overview?.fromCache && (
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              Cached {overview.cachedAt && formatDistanceToNow(new Date(overview.cachedAt), { addSuffix: true, locale: ptBR })}
            </Badge>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview?.dau || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview?.mau || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(overview?.avgSessionTime || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {overview?.avgActionsPerSession || 0} actions per session
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(overview?.bounceRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 inline mr-1" />
              -2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="top-users">Top Users</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Trends</CardTitle>
              <CardDescription>Evolução do engajamento ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[
                    { date: '2024-01', dau: 1200, mau: 4500, wau: 2800 },
                    { date: '2024-02', dau: 1350, mau: 4800, wau: 3100 },
                    { date: '2024-03', dau: 1420, mau: 5200, wau: 3400 },
                    { date: '2024-04', dau: 1580, mau: 5600, wau: 3700 },
                    { date: '2024-05', dau: 1650, mau: 5900, wau: 3900 },
                    { date: '2024-06', dau: 1720, mau: 6200, wau: 4100 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="dau" stroke="#8884d8" strokeWidth={2} name="DAU" />
                    <Line type="monotone" dataKey="wau" stroke="#82ca9d" strokeWidth={2} name="WAU" />
                    <Line type="monotone" dataKey="mau" stroke="#ffc658" strokeWidth={2} name="MAU" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Retention Cohorts</CardTitle>
                  <CardDescription>Análise de retenção por coorte de usuários</CardDescription>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 dias</SelectItem>
                    <SelectItem value="30d">30 dias</SelectItem>
                    <SelectItem value="90d">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {retentionCohorts.slice(0, 5).map((cohort) => (
                  <div key={cohort.cohortDate} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{cohort.cohortDate}</span>
                      <span className="text-sm text-muted-foreground">{cohort.users} users</span>
                    </div>
                    <div className="flex gap-1">
                      {cohort.retention.slice(0, 7).map((rate, index) => (
                        <div
                          key={index}
                          className="h-6 flex-1 rounded-sm"
                          style={{
                            backgroundColor: `rgba(34, 197, 94, ${rate})`,
                            minWidth: '20px'
                          }}
                          title={`Day ${index + 1}: ${formatPercentage(rate)}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Feature Adoption</CardTitle>
              <CardDescription>Taxa de adoção das funcionalidades</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    <TableHead>Adoption Rate</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureAdoption.map((feature) => (
                    <TableRow key={feature.feature}>
                      <TableCell className="font-medium capitalize">{feature.feature}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${feature.adoptionRate * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{formatPercentage(feature.adoptionRate)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{feature.adoptedUsers} / {feature.totalUsers}</TableCell>
                      <TableCell>
                        <Badge variant={feature.trend === 'up' ? 'default' : feature.trend === 'down' ? 'destructive' : 'secondary'}>
                          {feature.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                          {feature.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                          {feature.trend}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sessions by Device</CardTitle>
                <CardDescription>Distribuição de sessões por dispositivo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(sessionAnalytics?.sessionsByDevice || {}).map(([device, count]) => ({
                          name: device,
                          value: count
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {Object.entries(sessionAnalytics?.sessionsByDevice || {}).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions by Hour</CardTitle>
                <CardDescription>Distribuição de sessões por hora do dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionAnalytics?.sessionsByHour || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
              <CardDescription>Páginas mais visitadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead>Unique Views</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionAnalytics?.topPages.map((page) => (
                    <TableRow key={page.page}>
                      <TableCell className="font-medium capitalize">{page.page}</TableCell>
                      <TableCell>{page.views}</TableCell>
                      <TableCell>{page.uniqueViews}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Active Users</CardTitle>
              <CardDescription>Usuários mais ativos da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Total Time</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{user.sessionCount}</TableCell>
                      <TableCell>{formatDuration(user.totalTime)}</TableCell>
                      <TableCell>{user.actionsCount}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}