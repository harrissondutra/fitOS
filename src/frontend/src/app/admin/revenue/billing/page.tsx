/**
 * Billing Overview Dashboard - FitOS
 * 
 * Dashboard completo de billing e receita
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Eye,
  Users,
  Calendar
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BillingOverview {
  mrr: number;
  arr: number;
  growthRate: number;
  churnRate: number;
  activeSubscriptions: number;
  paymentSuccessRate: number;
  totalRevenue: number;
  fromCache?: boolean;
  cachedAt?: Date;
}

interface BillingIssue {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'failed_payment' | 'pending_payment' | 'expired_card' | 'insufficient_funds';
  amount: number;
  currency: string;
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: Date;
  lastAttempt?: Date;
  attemptsCount: number;
  paymentMethod: string;
}

interface MRRARRData {
  mrr: number;
  arr: number;
  mrrGrowth: number;
  arrGrowth: number;
  newMRR: number;
  churnedMRR: number;
  expansionMRR: number;
  contractionMRR: number;
  byPlan: Array<{
    plan: string;
    mrr: number;
    tenantCount: number;
  }>;
}

interface RevenueForecast {
  month: string;
  pessimistic: number;
  realistic: number;
  optimistic: number;
  actual?: number;
}

interface PaymentMethodDistribution {
  method: string;
  count: number;
  percentage: number;
  successRate: number;
  avgAmount: number;
}

interface SubscriptionLifecycle {
  new: number;
  active: number;
  trial: number;
  cancelled: number;
  expired: number;
  total: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function BillingOverviewPage() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [mrrArr, setMrrArr] = useState<MRRARRData | null>(null);
  const [issues, setIssues] = useState<BillingIssue[]>([]);
  const [forecasting, setForecasting] = useState<RevenueForecast[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDistribution[]>([]);
  const [lifecycle, setLifecycle] = useState<SubscriptionLifecycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      
      const [overviewRes, mrrArrRes, issuesRes, forecastingRes, paymentMethodsRes, lifecycleRes] = await Promise.all([
        fetch('/api/admin/billing/overview'),
        fetch('/api/admin/billing/mrr-arr'),
        fetch('/api/admin/billing/issues'),
        fetch('/api/admin/billing/forecasting'),
        fetch('/api/admin/billing/payment-methods'),
        fetch('/api/admin/billing/lifecycle')
      ]);

      const [overviewData, mrrArrData, issuesData, forecastingData, paymentMethodsData, lifecycleData] = await Promise.all([
        overviewRes.json(),
        mrrArrRes.json(),
        issuesRes.json(),
        forecastingRes.json(),
        paymentMethodsRes.json(),
        lifecycleRes.json()
      ]);

      if (overviewData.success) setOverview(overviewData.data);
      if (mrrArrData.success) setMrrArr(mrrArrData.data);
      if (issuesData.success) setIssues(issuesData.data);
      if (forecastingData.success) setForecasting(forecastingData.data);
      if (paymentMethodsData.success) setPaymentMethods(paymentMethodsData.data);
      if (lifecycleData.success) setLifecycle(lifecycleData.data);
    } catch (error) {
      console.error('Error fetching billing data:', error);
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
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return (num * 100).toFixed(1) + '%';
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'failed_payment': return 'destructive';
      case 'pending_payment': return 'default';
      case 'expired_card': return 'secondary';
      case 'insufficient_funds': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'escalated': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Billing Overview</h1>
            <p className="text-muted-foreground">Visão completa de receita e billing</p>
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
          <h1 className="text-3xl font-bold">Billing Overview</h1>
          <p className="text-muted-foreground">Visão completa de receita e billing</p>
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

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +{formatPercentage(overview?.growthRate || 0)} growth
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overview?.arr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(overview?.activeSubscriptions || 0)} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(overview?.churnRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Monthly churn rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(overview?.paymentSuccessRate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Successful payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {issues.filter(issue => issue.status === 'escalated').length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{issues.filter(issue => issue.status === 'escalated').length} billing issues</strong> require immediate attention.
            <Button variant="link" className="p-0 h-auto ml-2" onClick={() => document.getElementById('issues-tab')?.click()}>
              View Issues
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="mrr-arr">MRR/ARR</TabsTrigger>
          <TabsTrigger value="issues" id="issues-tab">Issues</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="lifecycle">Lifecycle</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>MRR Growth</CardTitle>
                <CardDescription>Evolução do MRR nos últimos 12 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { month: 'Jan', mrr: 45000 },
                      { month: 'Feb', mrr: 52000 },
                      { month: 'Mar', mrr: 58000 },
                      { month: 'Apr', mrr: 62000 },
                      { month: 'May', mrr: 68000 },
                      { month: 'Jun', mrr: 72000 },
                      { month: 'Jul', mrr: 78000 },
                      { month: 'Aug', mrr: 82000 },
                      { month: 'Sep', mrr: 87000 },
                      { month: 'Oct', mrr: 92000 },
                      { month: 'Nov', mrr: 96000 },
                      { month: 'Dec', mrr: overview?.mrr || 100000 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'MRR']} />
                      <Area type="monotone" dataKey="mrr" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Distribuição de receita por plano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mrrArr?.byPlan.map(plan => ({
                          name: plan.plan,
                          value: plan.mrr
                        })) || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(mrrArr?.byPlan || []).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="mrr-arr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">MRR Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(mrrArr?.mrrGrowth || 0)}</div>
                <p className="text-xs text-muted-foreground">Monthly growth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">ARR Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatPercentage(mrrArr?.arrGrowth || 0)}</div>
                <p className="text-xs text-muted-foreground">Annual growth</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">New MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(mrrArr?.newMRR || 0)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Churned MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(mrrArr?.churnedMRR || 0)}</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>MRR by Plan</CardTitle>
              <CardDescription>Distribuição de MRR por plano de assinatura</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>MRR</TableHead>
                    <TableHead>Tenants</TableHead>
                    <TableHead>Avg MRR per Tenant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mrrArr?.byPlan.map((plan) => (
                    <TableRow key={plan.plan}>
                      <TableCell className="font-medium capitalize">{plan.plan}</TableCell>
                      <TableCell>{formatCurrency(plan.mrr)}</TableCell>
                      <TableCell>{plan.tenantCount}</TableCell>
                      <TableCell>{formatCurrency(plan.mrr / plan.tenantCount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Issues</CardTitle>
              <CardDescription>Problemas de pagamento que requerem atenção</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{issue.tenantName}</div>
                          <div className="text-sm text-muted-foreground">{issue.tenantId}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getIssueColor(issue.type)}>
                          {issue.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(issue.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={issue.status === 'resolved' ? 'default' : 'destructive'}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(issue.status)}`} />
                          {issue.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{issue.attemptsCount}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>Previsões de receita para os próximos 12 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecasting}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Area type="monotone" dataKey="pessimistic" stackId="1" stroke="#ff6b6b" fill="#ff6b6b" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="realistic" stackId="1" stroke="#4ecdc4" fill="#4ecdc4" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="optimistic" stackId="1" stroke="#45b7d1" fill="#45b7d1" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods Distribution</CardTitle>
              <CardDescription>Distribuição e performance dos métodos de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Avg Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentMethods.map((method) => (
                    <TableRow key={method.method}>
                      <TableCell className="font-medium capitalize">{method.method}</TableCell>
                      <TableCell>{method.count}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${method.percentage * 100}%` }}
                            />
                          </div>
                          <span className="text-sm">{formatPercentage(method.percentage)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={method.successRate > 0.9 ? 'default' : 'destructive'}>
                          {formatPercentage(method.successRate)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(method.avgAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lifecycle" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Lifecycle</CardTitle>
              <CardDescription>Distribuição de assinaturas por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{lifecycle?.new || 0}</div>
                  <div className="text-sm text-muted-foreground">New</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{lifecycle?.active || 0}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{lifecycle?.trial || 0}</div>
                  <div className="text-sm text-muted-foreground">Trial</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{lifecycle?.cancelled || 0}</div>
                  <div className="text-sm text-muted-foreground">Cancelled</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{lifecycle?.expired || 0}</div>
                  <div className="text-sm text-muted-foreground">Expired</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

