"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart3, 
  Settings, 
  Zap, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  Server,
  Cloud,
  Brain,
  DollarSign,
  Upload,
  Activity,
  Globe,
  Key,
  Lock,
  Unlock,
  Bot,
  Mail,
  Phone,
  MapPin,
  BarChart,
  Monitor,
  Layers,
  GitBranch,
  Workflow,
  Smartphone as PhoneIcon,
  Calendar,
  MessageCircle,
  Stethoscope,
  CreditCard,
  Building2,
  PieChart,
  Target,
  UserCog,
  Wrench,
  Cpu,
  Eye,
  Code,
  Palette,
  Bell,
  FileText,
  Star,
  Share2,
  Download,
  History,
  Smartphone,
  Store,
  Watch,
  Building,
  CreditCard as CardIcon,
  TrendingUp as TrendingUpIcon,
  Activity as ActivityIcon,
  Users as UsersIcon,
  MessageSquare,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  Clock as ClockIcon,
  AlertTriangle as AlertTriangleIcon,
} from "lucide-react"
import Link from "next/link"

interface IntegrationStats {
  total: number;
  active: number;
  configured: number;
  failed: number;
  byCategory: {
    [key: string]: number;
  };
}

interface LimitStats {
  plans: {
    starter: number;
    professional: number;
    enterprise: number;
  };
  overrides: number;
  totalTenants: number;
}

interface UsageStats {
  ai: {
    totalTokens: number;
    totalRequests: number;
    totalCost: number;
    byService: {
      [key: string]: number;
    };
  };
  uploads: {
    totalStorage: number;
    totalFiles: number;
    monthlyUploads: number;
  };
  features: {
    [key: string]: number;
  };
}

export default function ManagementDashboard() {
  const [integrationStats, setIntegrationStats] = useState<IntegrationStats>({
    total: 0,
    active: 0,
    configured: 0,
    failed: 0,
    byCategory: {}
  });

  const [limitStats, setLimitStats] = useState<LimitStats>({
    plans: { starter: 0, professional: 0, enterprise: 0 },
    overrides: 0,
    totalTenants: 0
  });

  const [usageStats, setUsageStats] = useState<UsageStats>({
    ai: { totalTokens: 0, totalRequests: 0, totalCost: 0, byService: {} },
    uploads: { totalStorage: 0, totalFiles: 0, monthlyUploads: 0 },
    features: {}
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados
    setTimeout(() => {
      setIntegrationStats({
        total: 30,
        active: 18,
        configured: 22,
        failed: 3,
        byCategory: {
          ai: 4,
          payment: 2,
          communication: 6,
          storage: 2,
          calendar: 1,
          automation: 3,
          wearables: 4,
          analytics: 3,
          email: 2,
          backend: 2,
          location: 1
        }
      });

      setLimitStats({
        plans: { starter: 15, professional: 8, enterprise: 3 },
        overrides: 5,
        totalTenants: 26
      });

      setUsageStats({
        ai: {
          totalTokens: 1250000,
          totalRequests: 45000,
          totalCost: 1250.50,
          byService: {
            openai: 800000,
            anthropic: 300000,
            groq: 150000
          }
        },
        uploads: {
          totalStorage: 25000,
          totalFiles: 1500,
          monthlyUploads: 5000
        },
        features: {
          aiChat: 26,
          aiWorkoutGeneration: 11,
          biometricAnalysis: 20,
          whatsappIntegration: 8,
          stripeIntegration: 5
        }
      });

      setLoading(false);
    }, 1000);
  }, []);

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      ai: Brain,
      payment: CreditCard,
      communication: MessageCircle,
      storage: Database,
      calendar: Calendar,
      automation: Workflow,
      wearables: Watch,
      analytics: BarChart,
      email: Mail,
      backend: Server,
      location: MapPin
    };
    return icons[category] || Settings;
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      ai: "bg-purple-100 text-purple-800",
      payment: "bg-green-100 text-green-800",
      communication: "bg-blue-100 text-blue-800",
      storage: "bg-orange-100 text-orange-800",
      calendar: "bg-red-100 text-red-800",
      automation: "bg-yellow-100 text-yellow-800",
      wearables: "bg-pink-100 text-pink-800",
      analytics: "bg-indigo-100 text-indigo-800",
      email: "bg-gray-100 text-gray-800",
      backend: "bg-slate-100 text-slate-800",
      location: "bg-cyan-100 text-cyan-800"
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciamento do Sistema</h1>
          <p className="text-muted-foreground">
            Visão geral de limites, integrações e uso da aplicação
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" asChild>
            <Link href="/super-admin/management/limits">
              <Settings className="h-4 w-4 mr-2" />
              Limites Globais
            </Link>
          </Button>
          <Button asChild>
            <Link href="/super-admin/management/integrations">
              <Zap className="h-4 w-4 mr-2" />
              Integrações
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integrações Ativas</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrationStats.active}</div>
            <p className="text-xs text-muted-foreground">
              de {integrationStats.total} integrações
            </p>
            <Progress 
              value={(integrationStats.active / integrationStats.total) * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{limitStats.totalTenants}</div>
            <p className="text-xs text-muted-foreground">
              {limitStats.overrides} com overrides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uso de IA (Mês)</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usageStats.ai.totalTokens / 1000000).toFixed(1)}M
            </div>
            <p className="text-xs text-muted-foreground">
              tokens • ${usageStats.ai.totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Total</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(usageStats.uploads.totalStorage / 1000).toFixed(1)}GB
            </div>
            <p className="text-xs text-muted-foreground">
              {usageStats.uploads.totalFiles} arquivos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="limits">Limites</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status das Integrações</CardTitle>
                <CardDescription>
                  Visão geral do status de todas as integrações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Ativas</span>
                  </div>
                  <span className="font-medium">{integrationStats.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Configuradas</span>
                  </div>
                  <span className="font-medium">{integrationStats.configured}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Falhas</span>
                  </div>
                  <span className="font-medium">{integrationStats.failed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Pendentes</span>
                  </div>
                  <span className="font-medium">
                    {integrationStats.total - integrationStats.configured}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Plan Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Planos</CardTitle>
                <CardDescription>
                  Tenants por plano de assinatura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Starter</Badge>
                  </div>
                  <span className="font-medium">{limitStats.plans.starter}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Professional</Badge>
                  </div>
                  <span className="font-medium">{limitStats.plans.professional}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Enterprise</Badge>
                  </div>
                  <span className="font-medium">{limitStats.plans.enterprise}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span className="text-sm">Com Overrides</span>
                  </div>
                  <span className="font-medium">{limitStats.overrides}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>
                Últimas ações no sistema de gerenciamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Integração OpenAI configurada</p>
                    <p className="text-xs text-muted-foreground">há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Settings className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Limites do plano Professional atualizados</p>
                    <p className="text-xs text-muted-foreground">há 4 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Falha na integração Stripe</p>
                    <p className="text-xs text-muted-foreground">há 6 horas</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Override criado para Academia Premium</p>
                    <p className="text-xs text-muted-foreground">há 1 dia</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integrações por Categoria</CardTitle>
              <CardDescription>
                Distribuição das integrações por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(integrationStats.byCategory).map(([category, count]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium capitalize">{category}</p>
                          <p className="text-sm text-muted-foreground">{count} integrações</p>
                        </div>
                      </div>
                      <Badge className={getCategoryColor(category)}>
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Limites de IA</CardTitle>
                <CardDescription>Uso atual vs limites</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Tokens (Mês)</span>
                    <span>{(usageStats.ai.totalTokens / 1000000).toFixed(1)}M</span>
                  </div>
                  <Progress value={75} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Requests (Mês)</span>
                    <span>{usageStats.ai.totalRequests.toLocaleString()}</span>
                  </div>
                  <Progress value={60} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Custo (Mês)</span>
                    <span>${usageStats.ai.totalCost.toFixed(2)}</span>
                  </div>
                  <Progress value={45} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Limites de Upload</CardTitle>
                <CardDescription>Storage e uploads</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Storage Total</span>
                    <span>{(usageStats.uploads.totalStorage / 1000).toFixed(1)}GB</span>
                  </div>
                  <Progress value={50} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Uploads (Mês)</span>
                    <span>{(usageStats.uploads.monthlyUploads / 1000).toFixed(1)}GB</span>
                  </div>
                  <Progress value={30} className="mt-1" />
                </div>
                <div>
                  <div className="flex justify-between text-sm">
                    <span>Total de Arquivos</span>
                    <span>{usageStats.uploads.totalFiles.toLocaleString()}</span>
                  </div>
                  <Progress value={40} className="mt-1" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Features Mais Usadas</CardTitle>
                <CardDescription>Funcionalidades ativas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(usageStats.features).map(([feature, count]) => (
                  <div key={feature}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                      <span>{count}</span>
                    </div>
                    <Progress value={(count / limitStats.totalTenants) * 100} className="mt-1" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Uso de IA por Serviço</CardTitle>
                <CardDescription>Distribuição de tokens por provedor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(usageStats.ai.byService).map(([service, tokens]) => (
                    <div key={service}>
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{service}</span>
                        <span>{(tokens / 1000000).toFixed(1)}M tokens</span>
                      </div>
                      <Progress 
                        value={(tokens / usageStats.ai.totalTokens) * 100} 
                        className="mt-1" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertas e Notificações</CardTitle>
                <CardDescription>Sistema de monitoramento</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium">Limite de IA próximo</p>
                      <p className="text-xs text-muted-foreground">Academia Premium - 85% usado</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium">Integração falhou</p>
                      <p className="text-xs text-muted-foreground">Stripe - Clínica FisioLife</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Nova integração ativa</p>
                      <p className="text-xs text-muted-foreground">WhatsApp - Personal Trainer João</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}












