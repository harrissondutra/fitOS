"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { 
  Store, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Eye, 
  Heart, 
  Star, 
  Users, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Instagram, 
  Facebook, 
  Share2, 
  Settings, 
  Plus,
  UserX,
  CheckCircle,
  Shield,
  Activity,
  Clock,
  ArrowRight,
  Lightbulb,
  AlertCircle,
  MessageSquare,
  CreditCard,
  Truck,
  XCircle,
  Reply,
  ThumbsUp,
  ThumbsDown,
  Award,
  Zap,
  Target,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, RadialBarChart, RadialBar, LineChart as RechartsLineChart, Line, ResponsiveContainer } from 'recharts';

// Interface para os dados da loja
interface StoreData {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone: string;
  location: string;
  foundedYear: string;
  description: string;
  verified: boolean;
  badges: string[];
  specialties: string[];
  socialMedia: {
    website: string;
    instagram: string;
    facebook: string;
  };
  stats: {
    totalSales: number;
    monthlySales: number;
    totalOrders: number;
    monthlyOrders: number;
    totalProducts: number;
    activeProducts: number;
    averageRating: number;
    totalReviews: number;
    storeViews: number;
    favorites: number;
    conversionRate: number;
    returnCustomers: number;
    avgTicket: number;
    outOfStockProducts: number;
  };
  performance: {
    salesGrowth: number;
    orderGrowth: number;
    viewGrowth: number;
    ratingTrend: number;
  };
}

// Interface para dados de gráficos
interface ChartData {
  salesTimeline: Array<{
    date: string;
    value: number;
    previousValue?: number;
  }>;
  ordersTimeline: Array<{
    date: string;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  }>;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    growth: number;
  }>;
  categoryDistribution: Array<{
    category: string;
    value: number;
    fill: string;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    createdAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    customer: string;
    product: string;
    rating: number;
    comment: string;
    createdAt: string;
    needsResponse: boolean;
  }>;
}

// Configuração dos gráficos
const chartConfig = {
  sales: {
    label: "Vendas",
    color: "hsl(var(--chart-1))",
  },
  orders: {
    label: "Pedidos",
    color: "hsl(var(--chart-2))",
  },
  processing: {
    label: "Processando",
    color: "hsl(var(--chart-3))",
  },
  shipped: {
    label: "Enviado",
    color: "hsl(var(--chart-4))",
  },
  delivered: {
    label: "Entregue",
    color: "hsl(var(--chart-5))",
  },
  cancelled: {
    label: "Cancelado",
    color: "hsl(var(--chart-6))",
  },
  suplementos: {
    label: "Suplementos",
    color: "hsl(var(--chart-1))",
  },
  equipamentos: {
    label: "Equipamentos",
    color: "hsl(var(--chart-2))",
  },
  roupas: {
    label: "Roupas",
    color: "hsl(var(--chart-3))",
  },
  acessorios: {
    label: "Acessórios",
    color: "hsl(var(--chart-4))",
  },
} satisfies ChartConfig;

// Função para gerar dados mock realistas
const generateMockData = (period: string): { storeData: StoreData; chartData: ChartData } => {
  const now = new Date();
  let daysBack = 30;
  
  switch (period) {
    case '7d': daysBack = 7; break;
    case '30d': daysBack = 30; break;
    case '3m': daysBack = 90; break;
    case '6m': daysBack = 180; break;
    case '1y': daysBack = 365; break;
    default: daysBack = 30;
  }

  // Gerar dados de vendas
  const salesTimeline = Array.from({ length: daysBack }, (_, i) => {
    const date = subDays(now, daysBack - i - 1);
    const baseValue = 1000 + Math.random() * 2000;
    const trend = Math.sin(i / daysBack * Math.PI) * 500;
    return {
      date: format(date, 'yyyy-MM-dd'),
      value: Math.max(0, baseValue + trend),
      previousValue: Math.max(0, baseValue + trend - 200)
    };
  });

  // Gerar dados de pedidos
  const ordersTimeline = Array.from({ length: Math.min(daysBack, 30) }, (_, i) => {
    const date = subDays(now, Math.min(daysBack, 30) - i - 1);
    return {
      date: format(date, 'yyyy-MM-dd'),
      processing: Math.floor(Math.random() * 10) + 2,
      shipped: Math.floor(Math.random() * 15) + 5,
      delivered: Math.floor(Math.random() * 20) + 10,
      cancelled: Math.floor(Math.random() * 3)
    };
  });

  // Produtos mais vendidos
  const topProducts = [
    { id: '1', name: 'Whey Protein Premium', quantity: 45, revenue: 4045.50, growth: 15.2 },
    { id: '2', name: 'Creatina Monohidratada', quantity: 32, revenue: 1468.80, growth: 8.5 },
    { id: '3', name: 'BCAA 2:1:1', quantity: 28, revenue: 1901.20, growth: 22.1 },
    { id: '4', name: 'Halteres Ajustáveis', quantity: 15, revenue: 2998.50, growth: -5.2 },
    { id: '5', name: 'Camiseta Dry Fit', quantity: 67, revenue: 2673.30, growth: 12.8 }
  ];

  // Distribuição por categoria
  const categoryDistribution = [
    { category: 'Suplementos', value: 45, fill: 'hsl(var(--chart-1))' },
    { category: 'Equipamentos', value: 25, fill: 'hsl(var(--chart-2))' },
    { category: 'Roupas', value: 20, fill: 'hsl(var(--chart-3))' },
    { category: 'Acessórios', value: 10, fill: 'hsl(var(--chart-4))' }
  ];

  // Pedidos recentes
  const recentOrders = [
    { id: 'ORD-001', customer: 'João Silva', total: 225.70, status: 'processing', createdAt: '2024-01-20T10:30:00Z' },
    { id: 'ORD-002', customer: 'Maria Santos', total: 67.90, status: 'shipped', createdAt: '2024-01-19T15:45:00Z' },
    { id: 'ORD-003', customer: 'Pedro Costa', total: 199.90, status: 'delivered', createdAt: '2024-01-18T09:20:00Z' },
    { id: 'ORD-004', customer: 'Ana Oliveira', total: 89.90, status: 'processing', createdAt: '2024-01-17T14:10:00Z' },
    { id: 'ORD-005', customer: 'Carlos Mendes', total: 156.40, status: 'shipped', createdAt: '2024-01-16T11:25:00Z' }
  ];

  // Avaliações recentes
  const recentReviews = [
    { id: '1', customer: 'João Silva', product: 'Whey Protein Premium', rating: 5, comment: 'Excelente produto!', createdAt: '2024-01-20T14:30:00Z', needsResponse: false },
    { id: '2', customer: 'Maria Santos', product: 'Creatina Monohidratada', rating: 4, comment: 'Bom produto, mas embalagem poderia ser melhor.', createdAt: '2024-01-19T16:45:00Z', needsResponse: true },
    { id: '3', customer: 'Pedro Costa', product: 'BCAA 2:1:1', rating: 2, comment: 'Produto não chegou ainda.', createdAt: '2024-01-18T09:20:00Z', needsResponse: true }
  ];

  const totalSales = salesTimeline.reduce((sum, item) => sum + item.value, 0);
  const totalOrders = ordersTimeline.reduce((sum, item) => sum + item.processing + item.shipped + item.delivered, 0);

  const storeData: StoreData = {
    id: '1',
    name: 'Minha Loja',
    owner: 'Usuário',
    email: 'usuario@exemplo.com',
    phone: '',
    location: 'Brasil',
    foundedYear: '2024',
    description: 'Loja especializada em produtos de fitness e bem-estar.',
    verified: true,
    badges: ['Verified', 'Top Seller'],
    specialties: ['Suplementos', 'Equipamentos', 'Roupas'],
    socialMedia: {
      website: '',
      instagram: '',
      facebook: ''
    },
    stats: {
      totalSales,
      monthlySales: totalSales * 0.3,
      totalOrders,
      monthlyOrders: totalOrders * 0.3,
      totalProducts: 24,
      activeProducts: 20,
      averageRating: 4.7,
      totalReviews: 156,
      storeViews: 1234,
      favorites: 89,
      conversionRate: 3.2,
      returnCustomers: 45,
      avgTicket: totalSales / Math.max(totalOrders, 1),
      outOfStockProducts: 4
    },
    performance: {
      salesGrowth: 15.2,
      orderGrowth: 8.5,
      viewGrowth: 22.1,
      ratingTrend: 0.3
    }
  };

  return { storeData, chartData: { salesTimeline, ordersTimeline, topProducts, categoryDistribution, recentOrders, recentReviews } };
};

// Função para buscar dados da loja do usuário
const fetchStoreData = async (userId: string): Promise<StoreData> => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Token de acesso não encontrado');
    }

    const response = await fetch(`http://localhost:3001/api/marketplace/store/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao buscar dados da loja');
    }
  } catch (error) {
    console.warn('Erro ao buscar dados da loja, usando dados padrão:', error);
    return generateMockData('30d').storeData;
  }
};

// Componente de KPI Card
const KPICard = ({ title, value, change, icon: Icon, color = "text-primary", sparkline }: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  sparkline?: Array<{ value: number }>;
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const targetValue = typeof value === 'number' ? value : parseFloat(value.toString().replace(/[^\d.-]/g, ''));
    const duration = 1000;
    const steps = 60;
    const stepValue = targetValue / steps;
    let currentStep = 0;
    
    const timer = setInterval(() => {
      currentStep++;
      setDisplayValue(stepValue * currentStep);
      
      if (currentStep >= steps) {
        setDisplayValue(targetValue);
        clearInterval(timer);
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className={`h-4 w-4 ${color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {typeof value === 'string' ? value : value.toLocaleString('pt-BR')}
          </div>
          {change !== undefined && (
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <TrendingUp className={`h-3 w-3 mr-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="ml-1">vs período anterior</span>
            </div>
          )}
          {sparkline && (
            <div className="mt-2 h-8">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <RechartsLineChart data={sparkline}>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </RechartsLineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Componente de Status Badge
const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    processing: { label: 'Processando', variant: 'secondary' as const, icon: Clock },
    shipped: { label: 'Enviado', variant: 'default' as const, icon: Truck },
    delivered: { label: 'Entregue', variant: 'default' as const, icon: CheckCircle },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const, icon: XCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const, icon: Clock };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
};

export default function StorePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  // Validação de autenticação e permissões
  useEffect(() => {
    const loadStoreData = async () => {
      if (!isLoading) {
        if (!isAuthenticated || !user) {
          toast.error('Você precisa estar logado para acessar sua loja');
          router.push('/auth/login');
          return;
        }

        try {
          setLoading(true);
          // Gerar dados mock baseados no período selecionado
          const mockData = generateMockData(selectedPeriod);
          setStoreData(mockData.storeData);
          setChartData(mockData.chartData);
        } catch (error) {
          console.warn('Erro ao carregar dados da loja:', error);
          const mockData = generateMockData(selectedPeriod);
          setStoreData(mockData.storeData);
          setChartData(mockData.chartData);
        } finally {
          setLoading(false);
        }
      }
    };

    loadStoreData();
  }, [isAuthenticated, user, isLoading, router, selectedPeriod]);

  // Loading state com skeleton
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header Skeleton */}
        <div className="border-b border-border bg-background">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-4">Você precisa estar logado para acessar sua loja.</p>
          <Button onClick={() => router.push('/auth/login')}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  if (!storeData || !chartData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Erro ao Carregar</h2>
          <p className="text-muted-foreground mb-4">Não foi possível carregar os dados da sua loja.</p>
          <Button onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header da Loja */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <Store className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-3xl font-bold">{storeData.name}</h1>
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>Verificado</span>
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">por {storeData.owner}</p>
                  <div className="flex items-center space-x-6 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < Math.floor(storeData.stats.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{storeData.stats.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">({storeData.stats.totalReviews})</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{storeData.location}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Desde {storeData.foundedYear}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Alertas e Insights */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950/20">
              <Lightbulb className="h-4 w-4" />
              <AlertTitle>Insight do Dia</AlertTitle>
              <AlertDescription>
                Suas vendas cresceram {storeData.performance.salesGrowth}% este mês! 
                Continue assim para alcançar suas metas.
              </AlertDescription>
            </Alert>
          </motion.div>

          {/* Filtro de Período */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Dashboard da Loja</h2>
              <div className="flex items-center space-x-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[180px]">
                    <Calendar className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="3m">Últimos 3 meses</SelectItem>
                    <SelectItem value="6m">Últimos 6 meses</SelectItem>
                    <SelectItem value="1y">Último ano</SelectItem>
                    <SelectItem value="all">Todo período</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Comparar Período
                </Button>
              </div>
            </div>
          </motion.div>

          {/* KPIs Principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Vendas Totais"
              value={`R$ ${storeData.stats.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              change={storeData.performance.salesGrowth}
              icon={TrendingUp}
              color="text-green-500"
              sparkline={chartData.salesTimeline.slice(-7).map(item => ({ value: item.value }))}
            />
            <KPICard
              title="Total de Pedidos"
              value={storeData.stats.totalOrders}
              change={storeData.performance.orderGrowth}
              icon={ShoppingCart}
              color="text-blue-500"
            />
            <KPICard
              title="Ticket Médio"
              value={`R$ ${storeData.stats.avgTicket.toFixed(2)}`}
              change={12.3}
              icon={CreditCard}
              color="text-purple-500"
            />
            <KPICard
              title="Taxa de Conversão"
              value={`${storeData.stats.conversionRate}%`}
              change={0.5}
              icon={Target}
              color="text-orange-500"
            />
            <KPICard
              title="Total de Produtos"
              value={storeData.stats.totalProducts}
              icon={Package}
              color="text-indigo-500"
            />
            <KPICard
              title="Produtos Ativos"
              value={storeData.stats.activeProducts}
              icon={CheckCircle}
              color="text-green-500"
            />
            <KPICard
              title="Sem Estoque"
              value={storeData.stats.outOfStockProducts}
              icon={AlertCircle}
              color="text-red-500"
            />
            <KPICard
              title="Visualizações"
              value={storeData.stats.storeViews.toLocaleString()}
              change={storeData.performance.viewGrowth}
              icon={Eye}
              color="text-cyan-500"
            />
            <KPICard
              title="Avaliação Média"
              value={storeData.stats.averageRating.toFixed(1)}
              change={storeData.performance.ratingTrend}
              icon={Star}
              color="text-yellow-500"
            />
            <KPICard
              title="Total de Avaliações"
              value={storeData.stats.totalReviews}
              icon={MessageSquare}
              color="text-pink-500"
            />
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Vendas */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Vendas no Período</CardTitle>
                  <CardDescription>
                    Trending up by {storeData.performance.salesGrowth}% this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <AreaChart data={chartData.salesTimeline}>
                      <defs>
                        <linearGradient id="fillSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                      />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            indicator="line"
                            labelFormatter={(value) => {
                              return format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR })
                            }}
                            formatter={(value) => {
                              return new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL'
                              }).format(value as number)
                            }}
                          />
                        }
                      />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--chart-1))"
                        fill="url(#fillSales)"
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Gráfico de Pedidos */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos por Status</CardTitle>
                  <CardDescription>
                    Distribuição de pedidos nos últimos 30 dias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px]">
                    <BarChart data={chartData.ordersTimeline}>
                      <CartesianGrid vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => format(parseISO(value), 'dd/MM', { locale: ptBR })}
                      />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            indicator="dot"
                            labelFormatter={(value) => `Período: ${format(parseISO(value), 'dd/MM/yyyy', { locale: ptBR })}`}
                            formatter={(value, name) => {
                              const statusNames = {
                                processing: 'Processando',
                                shipped: 'Enviado',
                                delivered: 'Entregue',
                                cancelled: 'Cancelado'
                              }
                              return (
                                <div className="flex items-center gap-2">
                                  <span>{statusNames[name as keyof typeof statusNames] || name}:</span>
                                  <span className="font-bold">{value} pedidos</span>
                                </div>
                              )
                            }}
                          />
                        }
                      />
                      <Bar dataKey="processing" stackId="a" fill="hsl(var(--chart-3))" />
                      <Bar dataKey="shipped" stackId="a" fill="hsl(var(--chart-4))" />
                      <Bar dataKey="delivered" stackId="a" fill="hsl(var(--chart-5))" />
                      <Bar dataKey="cancelled" stackId="a" fill="hsl(var(--chart-6))" />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Análises */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Produtos Mais Vendidos */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                  <CardDescription>Top 5 produtos por receita</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {product.quantity} vendas • R$ {product.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="h-3 w-3 text-green-500" />
                            <span className="text-sm font-medium text-green-500">+{product.growth}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <Button variant="link" className="w-full" asChild>
                    <Link href="/store/produtos">
                      Ver todos os produtos <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Distribuição por Categoria */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Vendas por Categoria</CardTitle>
                  <CardDescription>Distribuição percentual</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <RechartsPieChart>
                      <Pie
                        data={chartData.categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {chartData.categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            hideLabel
                            formatter={(value, name) => (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{name}:</span>
                                <span className="font-bold">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(value as number)}
                                </span>
                                <span className="text-muted-foreground">
                                  ({((value as number / chartData.categoryDistribution.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(1)}%)
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                    </RechartsPieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </motion.div>

            {/* Performance de Entrega */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Performance de Entrega</CardTitle>
                  <CardDescription>Taxa de entrega no prazo</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ value: 87 }]}>
                      <RadialBar dataKey="value" fill="hsl(var(--chart-1))" />
                      <ChartTooltip 
                        content={
                          <ChartTooltipContent 
                            hideLabel
                            formatter={(value) => `${value}% de entregas no prazo`}
                          />
                        }
                      />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="text-center mt-4">
                    <div className="text-3xl font-bold text-green-500">87%</div>
                    <div className="text-sm text-muted-foreground">Taxa de entrega no prazo</div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Atividades Recentes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Pedidos Recentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Pedidos Recentes</CardTitle>
                  <CardDescription>Últimos 5 pedidos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium">{order.id}</div>
                            <div className="text-sm text-muted-foreground">{order.customer}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">R$ {order.total.toFixed(2)}</div>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <Button variant="link" className="w-full" asChild>
                    <Link href="/store/pedidos">
                      Ver todos os pedidos <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Avaliações Recentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Avaliações Recentes</CardTitle>
                  <CardDescription>Últimas 3 avaliações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chartData.recentReviews.map((review) => (
                      <div key={review.id} className="p-3 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-medium">{review.customer}</div>
                              <div className="text-sm text-muted-foreground">{review.product}</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-sm text-muted-foreground cursor-help">
                                {review.comment.length > 50 ? `${review.comment.substring(0, 50)}...` : review.comment}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{review.comment}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {review.needsResponse && (
                          <Badge variant="destructive" className="mt-2">
                            <Reply className="h-3 w-3 mr-1" />
                            Resposta Pendente
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <Button variant="link" className="w-full" asChild>
                    <Link href="/store/avaliacoes">
                      Ver todas avaliações <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Cards de Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.0 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="secondary">{storeData.stats.activeProducts} ativos</Badge>
                  </div>
                  <CardTitle>Gerenciar Produtos</CardTitle>
                  <CardDescription>
                    Adicionar, editar e gerenciar seu catálogo
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/store/produtos">
                      Acessar <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.1 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                      <ShoppingCart className="h-6 w-6 text-green-500" />
                    </div>
                    <Badge variant="secondary">{chartData.recentOrders.filter(o => o.status === 'processing').length} pendentes</Badge>
                  </div>
                  <CardTitle>Gerenciar Pedidos</CardTitle>
                  <CardDescription>
                    Acompanhar e processar pedidos
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/store/pedidos">
                      Acessar <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 1.2 }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                      <Star className="h-6 w-6 text-yellow-500" />
                    </div>
                    <Badge variant="secondary">{chartData.recentReviews.filter(r => r.needsResponse).length} sem resposta</Badge>
                  </div>
                  <CardTitle>Feedback dos Clientes</CardTitle>
                  <CardDescription>
                    Responder e gerenciar avaliações
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button className="w-full" asChild>
                    <Link href="/store/avaliacoes">
                      Acessar <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          {/* Informações da Loja */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>Detalhes sobre sua loja e especialidades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Descrição</h3>
                    <p className="text-muted-foreground mb-4">{storeData.description}</p>
                    <h3 className="font-semibold mb-3">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {storeData.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline">{specialty}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Contato</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{storeData.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{storeData.phone || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{storeData.location}</span>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-3 mt-4">Redes Sociais</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{storeData.socialMedia.website || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{storeData.socialMedia.instagram || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Facebook className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{storeData.socialMedia.facebook || 'Não informado'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}