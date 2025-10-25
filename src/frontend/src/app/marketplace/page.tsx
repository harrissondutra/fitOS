"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw, 
  Headphones,
  ChevronLeft,
  ChevronRight,
  Filter,
  Grid3X3,
  List,
  ArrowRight,
  Clock,
  Users,
  TrendingUp,
  Award,
  Zap,
  Gift,
  Percent,
  Store,
  Home,
  User,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Mock Data for demonstration
const heroSlides = [
  {
    id: 1,
    title: "Whey Protein Premium",
    subtitle: "Proteína de alta qualidade para seus treinos",
    description: "Ganhe massa muscular com nossa proteína premium. 25g de proteína por dose.",
    price: "R$ 89,90",
    originalPrice: "R$ 129,90",
    discount: "30% OFF",
    image: "/images/marketplace/whey-protein.jpg",
    badge: "MAIS VENDIDO",
    bgColor: "from-blue-600 to-purple-600"
  },
  {
    id: 2,
    title: "Creatina Monohidratada",
    subtitle: "Aumente sua força e resistência",
    description: "Creatina pura para maximizar seus resultados nos treinos.",
    price: "R$ 45,90",
    originalPrice: "R$ 65,90",
    discount: "30% OFF",
    image: "/images/marketplace/creatine.jpg",
    badge: "NOVIDADE",
    bgColor: "from-green-600 to-teal-600"
  },
  {
    id: 3,
    title: "BCAA 2:1:1",
    subtitle: "Recuperação muscular otimizada",
    description: "Aminoácidos essenciais para recuperação e crescimento muscular.",
    price: "R$ 67,90",
    originalPrice: "R$ 89,90",
    discount: "25% OFF",
    image: "/images/marketplace/bcaa.jpg",
    badge: "PREMIUM",
    bgColor: "from-orange-600 to-red-600"
  }
];

const categories = [
  { name: 'Suplementos', icon: '💊', count: '450+', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
  { name: 'Equipamentos', icon: '🏋️', count: '320+', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' },
  { name: 'Roupas', icon: '👕', count: '280+', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
  { name: 'Acessórios', icon: '⌚', count: '150+', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  { name: 'Livros', icon: '📚', count: '80+', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' },
  { name: 'Cursos', icon: '🎓', count: '120+', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' },
];

const featuredProducts = [
  {
    id: '1',
    name: 'Whey Protein Premium',
    price: 'R$ 89,90',
    originalPrice: 'R$ 129,90',
    rating: 4.9,
    reviews: 156,
    image: '/images/marketplace/whey-protein.jpg',
    badge: 'MAIS VENDIDO',
    discount: '30% OFF',
    category: 'Suplementos'
  },
  {
    id: '2',
    name: 'Creatina Monohidratada',
    price: 'R$ 45,90',
    originalPrice: 'R$ 65,90',
    rating: 4.8,
    reviews: 89,
    image: '/images/marketplace/creatine.jpg',
    badge: 'NOVIDADE',
    discount: '30% OFF',
    category: 'Suplementos'
  },
  {
    id: '3',
    name: 'Halteres Ajustáveis',
    price: 'R$ 299,90',
    originalPrice: 'R$ 399,90',
    rating: 4.7,
    reviews: 67,
    image: '/images/marketplace/dumbbells.jpg',
    badge: 'PROMOÇÃO',
    discount: '25% OFF',
    category: 'Equipamentos'
  },
  {
    id: '4',
    name: 'BCAA 2:1:1',
    price: 'R$ 67,90',
    originalPrice: 'R$ 89,90',
    rating: 4.9,
    reviews: 134,
    image: '/images/marketplace/bcaa.jpg',
    badge: 'PREMIUM',
    discount: '25% OFF',
    category: 'Suplementos'
  },
  {
    id: '5',
    name: 'Camiseta Dry Fit',
    price: 'R$ 39,90',
    originalPrice: 'R$ 59,90',
    rating: 4.6,
    reviews: 203,
    image: '/images/marketplace/shirt.jpg',
    badge: 'POPULAR',
    discount: '33% OFF',
    category: 'Roupas'
  },
  {
    id: '6',
    name: 'Monitor Cardíaco',
    price: 'R$ 199,90',
    originalPrice: 'R$ 299,90',
    rating: 4.8,
    reviews: 78,
    image: '/images/marketplace/heart-monitor.jpg',
    badge: 'TECNOLOGIA',
    discount: '33% OFF',
    category: 'Acessórios'
  },
  {
    id: '7',
    name: 'Ebook Nutrição Esportiva',
    price: 'R$ 29,90',
    originalPrice: 'R$ 49,90',
    rating: 4.7,
    reviews: 156,
    image: '/images/marketplace/ebook.jpg',
    badge: 'DIGITAL',
    discount: '40% OFF',
    category: 'Livros'
  },
  {
    id: '8',
    name: 'Curso Personal Training',
    price: 'R$ 199,90',
    originalPrice: 'R$ 299,90',
    rating: 4.9,
    reviews: 89,
    image: '/images/marketplace/course.jpg',
    badge: 'CERTIFICAÇÃO',
    discount: '33% OFF',
    category: 'Cursos'
  }
];

const bestSellers = [
  {
    id: '1',
    name: 'Suplementos Premium',
    rating: 4.9,
    products: 45,
    sales: '2.5K+',
    image: '/avatars/supplements-premium.png',
    category: 'Suplementos'
  },
  {
    id: '2',
    name: 'Equipamentos Fitness',
    rating: 4.8,
    products: 32,
    sales: '1.8K+',
    image: '/avatars/equipment-fitness.png',
    category: 'Equipamentos'
  },
  {
    id: '3',
    name: 'Roupas Esportivas',
    rating: 4.7,
    products: 28,
    sales: '1.2K+',
    image: '/avatars/sports-clothing.png',
    category: 'Roupas'
  }
];

const features = [
  {
    icon: Truck,
    title: 'Frete Grátis',
    description: 'Para pedidos acima de R$ 99'
  },
  {
    icon: RotateCcw,
    title: 'Devolução em 7 dias',
    description: 'Cancelamento após 1 dia'
  },
  {
    icon: Shield,
    title: 'Pagamentos Seguros',
    description: 'Garantia de pagamentos seguros'
  },
  {
    icon: Headphones,
    title: 'Suporte 24/7',
    description: 'Qualquer lugar e hora'
  }
];

export default function MarketplaceHomePage() {
  const [isClient, setIsClient] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Garantir que só renderize no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  // Renderizar apenas no cliente para evitar problemas de hidratação
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          {/* Primeira linha - Logo e ações do usuário */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-8">
              <Link href="/marketplace" className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-primary">FitOS Marketplace</h1>
                  <p className="text-xs text-muted-foreground">A maior plataforma de fitness do Brasil</p>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Heart className="h-5 w-5 mr-2" />
                Favoritos
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">3</Badge>
              </Button>
              <Button variant="ghost" size="sm" className="relative">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Carrinho
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-xs">0</Badge>
              </Button>
              <Button variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                Minha Conta
              </Button>
            </div>
          </div>
          
          {/* Segunda linha - Navegação e barra de pesquisa */}
          <div className="flex items-center justify-between py-4 border-t border-border">
            <nav className="hidden lg:flex space-x-8">
              <Link href="/marketplace" className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center space-x-1">
                <Home className="h-4 w-4" />
                <span>Início</span>
              </Link>
              <Link href="/marketplace/categories" className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center space-x-1">
                <Grid3X3 className="h-4 w-4" />
                <span>Categorias</span>
              </Link>
              <Link href="/marketplace/sellers" className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Vendedores</span>
              </Link>
              <Link href="/marketplace/deals" className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center space-x-1">
                <Percent className="h-4 w-4" />
                <span>Ofertas</span>
              </Link>
              <Link href="/marketplace/trending" className="text-sm font-semibold text-foreground hover:text-primary transition-colors flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>Em Alta</span>
              </Link>
            </nav>
            
            {/* Barra de pesquisa grande e proeminente */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar produtos, vendedores, categorias, marcas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 text-lg pl-12 pr-20 rounded-full border-2 border-primary/20 focus:border-primary shadow-lg"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                  <Button size="sm" className="h-8 px-3 rounded-full">
                    <Search className="h-4 w-4 mr-1" />
                    Buscar
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 px-3 rounded-full">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* Sugestões rápidas */}
              <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                <span className="font-medium">Populares:</span>
                <button className="hover:text-primary transition-colors">Whey Protein</button>
                <button className="hover:text-primary transition-colors">Creatina</button>
                <button className="hover:text-primary transition-colors">Halteres</button>
                <button className="hover:text-primary transition-colors">Roupas</button>
              </div>
            </div>
            
            {/* Menu mobile */}
            <div className="lg:hidden">
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Slider */}
      <section className="relative h-[500px] overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className={`h-full bg-gradient-to-r ${slide.bgColor} flex items-center`}>
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className="text-white">
                    <Badge className="mb-4 bg-white/20 text-white border-white/30">
                      {slide.badge}
                    </Badge>
                    <h1 className="text-5xl font-bold mb-4">{slide.title}</h1>
                    <h2 className="text-2xl mb-4 opacity-90">{slide.subtitle}</h2>
                    <p className="text-lg mb-6 opacity-80">{slide.description}</p>
                    <div className="flex items-center space-x-4 mb-6">
                      <span className="text-3xl font-bold">{slide.price}</span>
                      <span className="text-xl line-through opacity-60">{slide.originalPrice}</span>
                      <Badge variant="destructive">{slide.discount}</Badge>
                    </div>
                    <div className="flex space-x-4">
                      <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                        Comprar Agora
                      </Button>
                      <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="w-full h-96 bg-white/10 rounded-2xl flex items-center justify-center">
                      <div className="text-6xl opacity-50">💊</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Slider Controls */}
        <Button
          onClick={prevSlide}
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
        <Button
          onClick={nextSlide}
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
        
        {/* Slider Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <Button
              key={index}
              onClick={() => setCurrentSlide(index)}
              variant="ghost"
              size="icon"
              className={`w-3 h-3 rounded-full p-0 transition-colors ${
                index === currentSlide ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-8 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Navegar por Categoria</h2>
            <Button variant="outline" size="sm">
              Ver Todas
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/marketplace/category/${category.name.toLowerCase()}`}
                className="group"
              >
                <Card className="p-6 text-center hover:shadow-lg transition-all duration-300 group-hover:border-primary/50 hover:scale-105">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${category.color} flex items-center justify-center text-2xl`}>
                    {category.icon}
                  </div>
                  <h3 className="font-semibold mb-1 text-foreground">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">{category.count}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-foreground">Produtos em Destaque</h2>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="outline" size="sm">
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 hover:scale-105">
                <div className="relative">
                  <div className="aspect-square bg-muted rounded-t-lg flex items-center justify-center">
                    <div className="text-4xl opacity-50">💊</div>
                  </div>
                  <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                    {product.discount}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.badge}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-2 line-clamp-2 text-foreground">{product.name}</h3>
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(product.rating) ? 'fill-current' : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">
                      ({product.reviews})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-lg font-bold text-primary">{product.price}</span>
                    <span className="text-sm text-muted-foreground line-through">
                      {product.originalPrice}
                    </span>
                  </div>
                  <Button className="w-full" size="sm">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Adicionar ao Carrinho
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button size="lg" variant="outline">
              Ver Todos os Produtos
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center p-8">
              <div>
                <Badge className="mb-4 bg-white/20 text-white border-white/30">
                  <Gift className="h-3 w-3 mr-1" />
                  OFERTA ESPECIAL
                </Badge>
                <h2 className="text-4xl font-bold mb-4">Até 50% OFF</h2>
                <h3 className="text-2xl mb-4">Em Suplementos Premium</h3>
                <p className="text-lg mb-6 opacity-90">
                  Aproveite nossa maior promoção do ano! Suplementos de alta qualidade com preços imperdíveis.
                </p>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Termina em:</span>
                  </div>
                  <div className="flex space-x-2">
                    <div className="bg-white/20 px-3 py-1 rounded">
                      <span className="font-bold">02</span>
                      <span className="text-sm">dias</span>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded">
                      <span className="font-bold">14</span>
                      <span className="text-sm">hrs</span>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded">
                      <span className="font-bold">32</span>
                      <span className="text-sm">min</span>
                    </div>
                  </div>
                </div>
                <Button size="lg" className="bg-white text-orange-500 hover:bg-gray-100">
                  Aproveitar Oferta
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
              <div className="relative">
                <div className="w-full h-80 bg-white/10 rounded-2xl flex items-center justify-center">
                  <div className="text-8xl opacity-50">🎁</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Best Sellers - Enhanced */}
      <section className="py-16 bg-gradient-to-br from-blue-50 via-background to-purple-50 dark:from-blue-950/20 dark:via-background dark:to-purple-950/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Award className="h-3 w-3 mr-1" />
              VENDEDORES VERIFICADOS
            </Badge>
            <h2 className="text-4xl font-bold mb-4 text-foreground">Nossos Profissionais em Destaque</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conheça os profissionais mais bem avaliados da nossa plataforma. 
              Produtos de qualidade garantida por especialistas certificados.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {bestSellers.map((seller, index) => (
              <Card key={seller.id} className="group hover:shadow-2xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                <div className="relative">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-6xl opacity-80">🏪</div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-gray-900">
                      #{index + 1} Top
                    </Badge>
                  </div>
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
                    <div className="w-16 h-16 bg-background rounded-full shadow-lg flex items-center justify-center border-4 border-background">
                      <div className="text-2xl">👨‍💼</div>
                    </div>
                  </div>
                </div>
                
                <CardContent className="pt-12 pb-6 px-6 text-center">
                  <h3 className="text-xl font-bold mb-2 text-foreground">{seller.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{seller.category}</p>
                  
                  <div className="flex items-center justify-center mb-4">
                    <div className="flex text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < Math.floor(seller.rating) ? 'fill-current' : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground ml-2">({seller.rating})</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{seller.products}</div>
                      <div className="text-xs text-muted-foreground">Produtos</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{seller.sales}</div>
                      <div className="text-xs text-muted-foreground">Vendas</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full" size="sm">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Ver Loja Completa
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Heart className="h-4 w-4 mr-2" />
                      Seguir Vendedor
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Call to Action for Sellers */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-primary to-blue-600 dark:from-blue-600 dark:to-blue-800 text-white border-0">
              <CardContent className="p-8">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-2xl font-bold mb-4">Seja um Vendedor de Destaque!</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Junte-se aos melhores profissionais e venda seus produtos na maior plataforma de fitness do Brasil.
                    <br />
                    <strong>Comissões baixas, suporte completo e milhares de clientes potenciais.</strong>
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" className="bg-white text-primary hover:bg-gray-100 dark:bg-white dark:text-blue-600 dark:hover:bg-gray-100">
                      <Users className="h-5 w-5 mr-2" />
                      Começar a Vender
                    </Button>
                    <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 dark:border-white dark:text-white dark:hover:bg-white/10">
                      <Award className="h-5 w-5 mr-2" />
                      Ver Benefícios
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">1,250+</div>
              <div className="text-muted-foreground">Produtos</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Vendedores</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Vendas</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.8</div>
              <div className="text-muted-foreground">Avaliação</div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-12 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Não Perca as Últimas Ofertas!</h2>
          <p className="text-lg mb-8 opacity-90">
            Cadastre-se para receber notícias sobre as últimas ofertas e códigos de desconto
          </p>
          <div className="max-w-md mx-auto flex space-x-2">
            <Input
              type="email"
              placeholder="Seu e-mail"
              className="bg-white/10 border-white/30 text-white placeholder:text-white/70"
            />
            <Button className="bg-white text-primary hover:bg-gray-100">
              Inscrever-se
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}