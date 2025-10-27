"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Store, 
  TrendingUp, 
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
  ArrowDown
} from 'lucide-react';
import Link from 'next/link';

// Mock data
const storeStats = {
  totalSales: 15420.50,
  monthlySales: 3240.80,
  totalOrders: 89,
  monthlyOrders: 23,
  totalProducts: 45,
  activeProducts: 42,
  averageRating: 4.8,
  totalReviews: 156,
  storeViews: 2340,
  favorites: 89
};

const recentOrders = [
  {
    id: 'ORD-001',
    customer: 'João Silva',
    product: 'Whey Protein Premium',
    amount: 89.90,
    status: 'completed',
    date: '2024-01-20'
  },
  {
    id: 'ORD-002',
    customer: 'Maria Santos',
    product: 'Creatina Monohidratada',
    amount: 45.90,
    status: 'processing',
    date: '2024-01-19'
  },
  {
    id: 'ORD-003',
    customer: 'Pedro Costa',
    product: 'Halteres Ajustáveis',
    amount: 299.90,
    status: 'shipped',
    date: '2024-01-18'
  },
  {
    id: 'ORD-004',
    customer: 'Ana Oliveira',
    product: 'BCAA 2:1:1',
    amount: 67.90,
    status: 'pending',
    date: '2024-01-17'
  }
];

const topProducts = [
  {
    name: 'Whey Protein Premium',
    sales: 45,
    revenue: 4045.50,
    rating: 4.9,
    image: '/images/marketplace/whey-protein.jpg'
  },
  {
    name: 'Creatina Monohidratada',
    sales: 32,
    revenue: 1468.80,
    rating: 4.8,
    image: '/images/marketplace/creatine.jpg'
  },
  {
    name: 'Halteres Ajustáveis',
    sales: 8,
    revenue: 2399.20,
    rating: 4.7,
    image: '/images/marketplace/dumbbells.jpg'
  }
];

const recentReviews = [
  {
    id: '1',
    customer: 'João Silva',
    product: 'Whey Protein Premium',
    rating: 5,
    comment: 'Excelente produto! Qualidade superior.',
    date: '2024-01-20'
  },
  {
    id: '2',
    customer: 'Maria Santos',
    product: 'Creatina Monohidratada',
    rating: 4,
    comment: 'Muito bom, entrega rápida.',
    date: '2024-01-19'
  },
  {
    id: '3',
    customer: 'Pedro Costa',
    product: 'Halteres Ajustáveis',
    rating: 5,
    comment: 'Perfeito para treinar em casa!',
    date: '2024-01-18'
  }
];

const salesData = [
  { month: 'Jan', sales: 2400 },
  { month: 'Fev', sales: 1398 },
  { month: 'Mar', sales: 9800 },
  { month: 'Abr', sales: 3908 },
  { month: 'Mai', sales: 4800 },
  { month: 'Jun', sales: 3800 }
];

export default function SellerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'processing':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Processando</Badge>;
      case 'shipped':
        return <Badge variant="outline"><Package className="h-3 w-3 mr-1" />Enviado</Badge>;
      case 'pending':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Pendente</Badge>;
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Minha Loja</h1>
                <p className="text-muted-foreground">Gerencie seus produtos e vendas</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {storeStats.totalSales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                <ArrowUp className="h-3 w-3 mr-1 text-green-500" />
                +12% vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {storeStats.monthlyOrders} este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Produtos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                {storeStats.activeProducts} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{storeStats.averageRating}</div>
              <p className="text-xs text-muted-foreground">
                {storeStats.totalReviews} avaliações
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
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
                          <span>R$ {data.sales.toFixed(2)}</span>
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
                        <div className="flex items-center space-x-1">
                          {renderStars(product.rating)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Store Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Performance da Loja</CardTitle>
                <CardDescription>
                  Métricas importantes para o sucesso da sua loja
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{storeStats.storeViews}</div>
                    <div className="text-sm text-muted-foreground">Visualizações da Loja</div>
                    <div className="flex items-center justify-center mt-2">
                      <Eye className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-xs text-muted-foreground">+15% este mês</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{storeStats.favorites}</div>
                    <div className="text-sm text-muted-foreground">Favoritos</div>
                    <div className="flex items-center justify-center mt-2">
                      <Heart className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-xs text-muted-foreground">+8% este mês</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">98%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Satisfação</div>
                    <div className="flex items-center justify-center mt-2">
                      <Award className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-xs text-muted-foreground">Excelente</span>
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
                      <div className="text-xs text-muted-foreground">{review.date}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}





