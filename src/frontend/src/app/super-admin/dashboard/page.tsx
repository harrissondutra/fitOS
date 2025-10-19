'use client';

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Users, 
  CreditCard, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  PieChart,
  ArrowRight,
  Plus,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  totalTenants: number;
  individualTenants: number;
  businessTenants: number;
  totalUsers: number;
  totalRevenue: number;
  activePlans: number;
  customPlans: number;
  recentActivity: Array<{
    id: string;
    type: 'tenant_created' | 'plan_assigned' | 'user_added' | 'custom_plan_created';
    description: string;
    timestamp: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/super-admin/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      } else {
        // Dados de exemplo para demonstração
        setStats({
          totalTenants: 12,
          individualTenants: 8,
          businessTenants: 4,
          totalUsers: 156,
          totalRevenue: 12500,
          activePlans: 3,
          customPlans: 2,
          recentActivity: [
            {
              id: '1',
              type: 'tenant_created',
              description: 'Novo tenant "Academia Fit" criado',
              timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '2',
              type: 'user_added',
              description: '5 novos usuários adicionados ao tenant "Personal Trainer Pro"',
              timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '3',
              type: 'custom_plan_created',
              description: 'Plano customizado "Premium Plus" criado',
              timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '4',
              type: 'plan_assigned',
              description: 'Plano "Professional" atribuído ao tenant "Gym Central"',
              timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '5',
              type: 'tenant_created',
              description: 'Novo tenant "CrossFit Zone" criado',
              timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Dados de exemplo em caso de erro
      setStats({
        totalTenants: 12,
        individualTenants: 8,
        businessTenants: 4,
        totalUsers: 156,
        totalRevenue: 12500,
        activePlans: 3,
        customPlans: 2,
        recentActivity: [
          {
            id: '1',
            type: 'tenant_created',
            description: 'Novo tenant "Academia Fit" criado',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            type: 'user_added',
            description: '5 novos usuários adicionados ao tenant "Personal Trainer Pro"',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            type: 'custom_plan_created',
            description: 'Plano customizado "Premium Plus" criado',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '4',
            type: 'plan_assigned',
            description: 'Plano "Professional" atribuído ao tenant "Gym Central"',
            timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '5',
            type: 'tenant_created',
            description: 'Novo tenant "CrossFit Zone" criado',
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total de Tenants',
      value: stats?.totalTenants || 0,
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Usuários Ativos',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Receita Mensal',
      value: `R$ ${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: '+15%',
      changeType: 'positive'
    },
    {
      title: 'Planos Customizados',
      value: stats?.customPlans || 0,
      icon: TrendingUp,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: '+3',
      changeType: 'positive'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tenant_created':
        return <Building2 className="h-4 w-4" />;
      case 'plan_assigned':
        return <CreditCard className="h-4 w-4" />;
      case 'user_added':
        return <Users className="h-4 w-4" />;
      case 'custom_plan_created':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'tenant_created':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'plan_assigned':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'user_added':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'custom_plan_created':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default:
        return 'text-muted-foreground bg-muted/50 border-border';
    }
  };

  const businessPercentage = Math.round(((stats?.businessTenants || 0) / (stats?.totalTenants || 1)) * 100);
  const individualPercentage = Math.round(((stats?.individualTenants || 0) / (stats?.totalTenants || 1)) * 100);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Super Admin</h1>
          <p className="text-muted-foreground">
            Visão geral do sistema FitOS e gestão de tenants
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Badge 
                    variant={card.changeType === 'positive' ? 'default' : 'destructive'}
                    className="mr-2"
                  >
                    {card.change}
                  </Badge>
                  <span>vs mês anterior</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Tenant Types Distribution */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribuição por Tipo de Tenant
              </CardTitle>
              <CardDescription>
                Análise da distribuição de tenants no sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profissionais */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-sm font-medium">Profissionais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats?.businessTenants || 0}</span>
                    <Badge variant="secondary">{businessPercentage}%</Badge>
                  </div>
                </div>
                <Progress value={businessPercentage} className="h-2" />
              </div>

              <Separator />

              {/* Pessoas Físicas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-medium">Pessoas Físicas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{stats?.individualTenants || 0}</span>
                    <Badge variant="secondary">{individualPercentage}%</Badge>
                  </div>
                </div>
                <Progress value={individualPercentage} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="xl:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade Recente
              </CardTitle>
              <CardDescription>
                Últimas atividades do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-80">
                <div className="space-y-4">
                  {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-2 rounded-full border ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.timestamp).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesso rápido às principais funcionalidades do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-auto p-6 flex-col items-start gap-4 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800">
                <a href="/super-admin/tenants" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                      <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Gerenciar Tenants</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualizar e gerenciar todos os tenants do sistema
                    </p>
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col items-start gap-4 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-200 dark:hover:border-orange-800">
                <a href="/super-admin/custom-plans" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                      <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Criar Plano Customizado</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criar planos personalizados para tenants específicos
                    </p>
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col items-start gap-4 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-800">
                <a href="/super-admin/plans" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
                      <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Configurar Planos</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Gerenciar planos base e configurações globais
                    </p>
                  </div>
                </a>
              </Button>

              <Button asChild variant="outline" className="h-auto p-6 flex-col items-start gap-4 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-800">
                <a href="/super-admin/users" className="w-full">
                  <div className="flex items-center justify-between w-full">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                      <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-sm">Gerenciar Usuários</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualizar e gerenciar usuários do sistema
                    </p>
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}