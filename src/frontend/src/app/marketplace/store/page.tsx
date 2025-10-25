"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingCart, 
  Users, 
  Star,
  Eye,
  Heart,
  MessageCircle,
  Settings,
  Plus,
  BarChart3,
  Package,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Target,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Edit,
  Share2,
  Download,
  RefreshCw,
  Activity,
  Zap,
  Shield,
  Crown,
  Gift,
  Percent,
  Truck,
  CreditCard,
  Bell,
  FileText,
  Image as ImageIcon,
  Globe,
  Instagram,
  Facebook,
  Twitter,
  Loader2,
  UserX
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Tipos para dados da loja
interface StoreData {
  id: string;
  name: string;
  owner: string;
  email: string;
  phone?: string;
  location?: string;
  foundedYear: string;
  description?: string;
  verified: boolean;
  badges: string[];
  specialties: string[];
  socialMedia: {
    website?: string;
    instagram?: string;
    facebook?: string;
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
  };
  performance: {
    salesGrowth: number;
    orderGrowth: number;
    viewGrowth: number;
    ratingTrend: number;
  };
}

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
    // Retornar dados padrão se a API falhar
    return generateDefaultStoreData(userId);
  }
};

// Função para gerar dados padrão da loja baseados no usuário
const generateDefaultStoreData = (userId: string): StoreData => {
  const currentYear = new Date().getFullYear().toString();
  
  return {
    id: userId,
    name: 'Minha Loja',
    owner: 'Usuário',
    email: 'usuario@exemplo.com',
    phone: '',
    location: 'Brasil',
    foundedYear: currentYear,
    description: 'Loja especializada em produtos de fitness e bem-estar.',
    verified: false,
    badges: [],
    specialties: ['Suplementos', 'Equipamentos', 'Roupas'],
    socialMedia: {
      website: '',
      instagram: '',
      facebook: ''
    },
    stats: {
      totalSales: 0,
      monthlySales: 0,
      totalOrders: 0,
      monthlyOrders: 0,
      totalProducts: 0,
      activeProducts: 0,
      averageRating: 0,
      totalReviews: 0,
      storeViews: 0,
      favorites: 0,
      conversionRate: 0,
      returnCustomers: 0
    },
    performance: {
      salesGrowth: 0,
      orderGrowth: 0,
      viewGrowth: 0,
      ratingTrend: 0
    }
  };
};

// Função para gerar dados da loja baseados no usuário logado
const generateStoreData = (user: any): StoreData => {
  const currentYear = new Date().getFullYear().toString();
  const userName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Usuário';
  
  return {
    id: user.id,
    name: `${userName}'s Store`,
    owner: userName,
    email: user.email,
    phone: user.phone || '',
    location: user.profile?.location || 'Brasil',
    foundedYear: currentYear,
    description: `Loja especializada em produtos de fitness e bem-estar de ${userName}.`,
    verified: user.emailVerified || false,
    badges: user.emailVerified ? ['Verified'] : [],
    specialties: ['Suplementos', 'Equipamentos', 'Roupas'],
    socialMedia: {
      website: user.profile?.website || '',
      instagram: user.profile?.instagram || '',
      facebook: user.profile?.facebook || ''
    },
    stats: {
      totalSales: 0,
      monthlySales: 0,
      totalOrders: 0,
      monthlyOrders: 0,
      totalProducts: 0,
      activeProducts: 0,
      averageRating: 0,
      totalReviews: 0,
      storeViews: 0,
      favorites: 0,
      conversionRate: 0,
      returnCustomers: 0
    },
    performance: {
      salesGrowth: 0,
      orderGrowth: 0,
      viewGrowth: 0,
      ratingTrend: 0
    }
  };
};

const recentOrders = [
  {
    id: 'ORD-001',
    customer: 'Maria Santos',
    product: 'Whey Protein Premium',
    amount: 89.90,
    status: 'completed',
    date: '2024-01-20',
    rating: 5
  },
  {
    id: 'ORD-002',
    customer: 'Pedro Costa',
    product: 'Creatina Monohidratada',
    amount: 45.90,
    status: 'processing',
    date: '2024-01-19',
    rating: null
  },
  {
    id: 'ORD-003',
    customer: 'Ana Oliveira',
    product: 'BCAA 2:1:1',
    amount: 67.90,
    status: 'shipped',
    date: '2024-01-18',
    rating: 4
  },
  {
    id: 'ORD-004',
    customer: 'Carlos Mendes',
    product: 'Halteres Ajustáveis',
    amount: 299.90,
    status: 'delivered',
    date: '2024-01-17',
    rating: 5
  }
];

const topProducts = [
  {
    id: '1',
    name: 'Whey Protein Premium',
    sales: 45,
    revenue: 4045.50,
    rating: 4.9,
    reviews: 156,
    image: '/images/marketplace/whey-protein.jpg',
    growth: 15.2
  },
  {
    id: '2',
    name: 'Creatina Monohidratada',
    sales: 32,
    revenue: 1468.80,
    rating: 4.8,
    reviews: 89,
    image: '/images/marketplace/creatine.jpg',
    growth: 8.5
  },
  {
    id: '3',
    name: 'BCAA 2:1:1',
    sales: 28,
    revenue: 1901.20,
    rating: 4.9,
    reviews: 134,
    image: '/images/marketplace/bcaa.jpg',
    growth: 22.1
  }
];

const salesData = [
  { month: 'Jan', sales: 2400, orders: 45 },
  { month: 'Fev', sales: 1398, orders: 32 },
  { month: 'Mar', sales: 9800, orders: 89 },
  { month: 'Abr', sales: 3908, orders: 67 },
  { month: 'Mai', sales: 4800, orders: 78 },
  { month: 'Jun', sales: 3800, orders: 65 }
];

const recentReviews = [
  {
    id: '1',
    customer: 'Maria Santos',
    product: 'Whey Protein Premium',
    rating: 5,
    comment: 'Excelente produto! Qualidade superior e entrega rápida.',
    date: '2024-01-20',
    helpful: 12
  },
  {
    id: '2',
    customer: 'Pedro Costa',
    product: 'Creatina Monohidratada',
    rating: 4,
    comment: 'Muito bom, resultado visível nos treinos.',
    date: '2024-01-19',
    helpful: 8
  },
  {
    id: '3',
    customer: 'Ana Oliveira',
    product: 'BCAA 2:1:1',
    rating: 5,
    comment: 'Perfeito para recuperação pós-treino!',
    date: '2024-01-18',
    helpful: 15
  }
];

const storeMetrics = [
  {
    title: 'Taxa de Conversão',
    value: '3.8%',
    change: '+0.5%',
    trend: 'up',
    description: 'Visitantes que fazem compra'
  },
  {
    title: 'Ticket Médio',
    value: 'R$ 173.26',
    change: '+12.3%',
    trend: 'up',
    description: 'Valor médio por pedido'
  },
  {
    title: 'Tempo de Resposta',
    value: '2.4h',
    change: '-15min',
    trend: 'up',
    description: 'Média de resposta a clientes'
  },
  {
    title: 'Taxa de Retorno',
    value: '75.3%',
    change: '+5.2%',
    trend: 'up',
    description: 'Clientes que compram novamente'
  }
];

export default function StoreManagementPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [storeData, setStoreData] = useState<StoreData | null>(null);
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
          // Tentar buscar dados da API primeiro
          const apiData = await fetchStoreData(user.id);
          setStoreData(apiData);
        } catch (error) {
          console.warn('Erro ao carregar dados da loja, usando dados do usuário:', error);
          // Fallback para dados baseados no usuário
          const userStoreData = generateStoreData(user);
          setStoreData(userStoreData);
        } finally {
          setLoading(false);
        }
      }
    };

    loadStoreData();
  }, [isAuthenticated, user, isLoading, router]);

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando sua loja...</p>
        </div>
      </div>
    );
  }

  // Se não há dados da loja, mostrar erro
  if (!storeData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UserX className="h-8 w-8 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar loja</h2>
          <p className="text-muted-foreground mb-4">Não foi possível carregar os dados da sua loja.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      case 'shipped':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"><Truck className="h-3 w-3 mr-1" />Enviado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  const getBadgeVariant = (badge: string) => {
    switch (badge) {
      case 'Top Seller':
      case 'Verified':
        return 'default';
      case 'Fast Shipping':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
                <Store className="h-8 w-8 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h1 className="text-3xl font-bold text-foreground">{storeData.name}</h1>
                  {storeData.verified && (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  )}
                  {user?.role && (
                    <Badge variant="outline" className="ml-2">
                      {user.role}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">por {storeData.owner}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    {renderStars(storeData.stats.averageRating)}
                    <span className="font-medium">{storeData.stats.averageRating}</span>
                    <span className="text-sm text-muted-foreground">({storeData.stats.totalReviews})</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{storeData.location}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Desde {storeData.foundedYear}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{storeData.email}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Link href="/marketplace/listings">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Produto
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Store Badges */}
        <div className="flex items-center space-x-2 mb-6">
          {storeData.badges.map((badge) => (
            <Badge key={badge} variant={getBadgeVariant(badge)} className="text-sm">
              {badge === 'Top Seller' && <Crown className="h-3 w-3 mr-1" />}
              {badge === 'Verified' && <Shield className="h-3 w-3 mr-1" />}
              {badge === 'Fast Shipping' && <Truck className="h-3 w-3 mr-1" />}
              {badge}
            </Badge>
          ))}
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {storeData.stats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                +{storeData.performance.salesGrowth}% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeData.stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                +{storeData.performance.orderGrowth}% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Visualizações</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeData.stats.storeViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                +{storeData.performance.viewGrowth}% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favoritos</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeData.stats.favorites}</div>
              <p className="text-xs text-muted-foreground">
                Clientes que favoritaram
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {storeMetrics.map((metric, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                {metric.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground">
                  {metric.change} • {metric.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Vendas dos Últimos 6 Meses</CardTitle>
                  <CardDescription>
                    Acompanhe o crescimento das suas vendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {salesData.map((data, index) => (
                      <div key={data.month} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{data.month}</span>
                          <span>R$ {data.sales.toFixed(2)} • {data.orders} pedidos</span>
                        </div>
                        <Progress 
                          value={(data.sales / Math.max(...salesData.map(d => d.sales))) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Mais Vendidos</CardTitle>
                  <CardDescription>
                    Seus produtos com melhor desempenho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.sales} vendas • R$ {product.revenue.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {renderStars(product.rating)}
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            +{product.growth}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Store Info */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Loja</CardTitle>
                <CardDescription>
                  Detalhes sobre sua loja e especialidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Descrição</h3>
                    <p className="text-muted-foreground mb-4">{storeData.description}</p>
                    
                    <h3 className="font-semibold mb-3">Especialidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {storeData.specialties.map((specialty) => (
                        <Badge key={specialty} variant="outline">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3">Contato</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{storeData.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{storeData.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{storeData.location}</span>
                      </div>
                    </div>

                    <h3 className="font-semibold mb-3 mt-4">Redes Sociais</h3>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>{storeData.socialMedia.website}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Instagram className="h-4 w-4 text-muted-foreground" />
                        <span>{storeData.socialMedia.instagram}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Facebook className="h-4 w-4 text-muted-foreground" />
                        <span>{storeData.socialMedia.facebook}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meus Produtos</CardTitle>
                    <CardDescription>
                      Gerencie seu catálogo de produtos
                    </CardDescription>
                  </div>
                  <Link href="/marketplace/listings">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Produto
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Gerencie seus produtos na página dedicada. 
                    <Link href="/marketplace/listings" className="text-primary hover:underline ml-1">
                      Clique aqui para acessar
                    </Link>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>
                  Acompanhe os últimos pedidos da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{order.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer} • {order.product}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="font-medium">R$ {order.amount.toFixed(2)}</div>
                          <div className="text-sm text-muted-foreground">{order.date}</div>
                        </div>
                        {getStatusBadge(order.status)}
                        {order.rating && (
                          <div className="flex items-center space-x-1">
                            {renderStars(order.rating)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações dos Clientes</CardTitle>
                <CardDescription>
                  Veja o que seus clientes estão dizendo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReviews.map((review) => (
                    <div key={review.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium">{review.customer}</div>
                          <div className="text-sm text-muted-foreground">{review.product}</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{review.date}</span>
                        <div className="flex items-center space-x-1">
                          <span>{review.helpful} pessoas acharam útil</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance da Loja</CardTitle>
                  <CardDescription>
                    Métricas importantes para o sucesso da sua loja
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{storeData.stats.storeViews}</div>
                      <div className="text-sm text-muted-foreground">Visualizações da Loja</div>
                      <div className="flex items-center justify-center mt-2">
                        <Eye className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">+{storeData.performance.viewGrowth}% este mês</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{storeData.stats.favorites}</div>
                      <div className="text-sm text-muted-foreground">Favoritos</div>
                      <div className="flex items-center justify-center mt-2">
                        <Heart className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">Clientes engajados</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">{storeData.stats.conversionRate}%</div>
                      <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
                      <div className="flex items-center justify-center mt-2">
                        <Target className="h-4 w-4 text-muted-foreground mr-1" />
                        <span className="text-xs text-muted-foreground">Visitantes que compram</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resumo de Vendas</CardTitle>
                  <CardDescription>
                    Análise detalhada das suas vendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vendas Totais</span>
                      <span className="font-bold">R$ {storeData.stats.totalSales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vendas do Mês</span>
                      <span className="font-bold">R$ {storeData.stats.monthlySales.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pedidos Totais</span>
                      <span className="font-bold">{storeData.stats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Pedidos do Mês</span>
                      <span className="font-bold">{storeData.stats.monthlyOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Ticket Médio</span>
                      <span className="font-bold">R$ {(storeData.stats.totalSales / storeData.stats.totalOrders).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Clientes Retornam</span>
                      <span className="font-bold">{storeData.stats.returnCustomers}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Informações do Usuário Logado */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
            <CardDescription>
              Detalhes da sua conta e permissões no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Dados Pessoais</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Nome:</strong> {user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Email:</strong> {user?.email || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Telefone:</strong> {user?.phone || 'Não informado'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Membro desde:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Permissões e Status</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Função:</strong> {user?.role || 'Não definida'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${user?.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className="text-sm">
                      <strong>Status:</strong> {user?.status || 'Não definido'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className={`h-4 w-4 ${user?.emailVerified ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="text-sm">
                      <strong>Email Verificado:</strong> {user?.emailVerified ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      <strong>Último Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Não informado'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
