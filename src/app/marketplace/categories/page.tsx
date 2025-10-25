"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Grid3X3,
  List,
  Star,
  TrendingUp,
  Package,
  Users,
  ArrowRight,
  Plus,
  Eye,
  Heart,
  ShoppingCart
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data
const categories = [
  {
    id: '1',
    name: 'Suplementos',
    slug: 'suplementos',
    description: 'Proteínas, vitaminas, creatina e outros suplementos para maximizar seus resultados',
    icon: '💊',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    productCount: 450,
    sellerCount: 25,
    averageRating: 4.8,
    featured: true,
    subcategories: [
      { name: 'Whey Protein', count: 120 },
      { name: 'Creatina', count: 85 },
      { name: 'BCAA', count: 65 },
      { name: 'Vitaminas', count: 90 },
      { name: 'Pré-treino', count: 45 },
      { name: 'Pós-treino', count: 35 }
    ],
    topProducts: [
      {
        id: '1',
        name: 'Whey Protein Premium',
        price: 89.90,
        originalPrice: 129.90,
        rating: 4.9,
        reviews: 156,
        image: '/images/marketplace/whey-protein.jpg',
        seller: 'Suplementos Premium'
      },
      {
        id: '2',
        name: 'Creatina Monohidratada',
        price: 45.90,
        originalPrice: 65.90,
        rating: 4.8,
        reviews: 89,
        image: '/images/marketplace/creatine.jpg',
        seller: 'Suplementos Premium'
      }
    ]
  },
  {
    id: '2',
    name: 'Equipamentos',
    slug: 'equipamentos',
    description: 'Halteres, esteiras, bicicletas e equipamentos para treinos em casa ou academia',
    icon: '🏋️',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    productCount: 320,
    sellerCount: 18,
    averageRating: 4.7,
    featured: true,
    subcategories: [
      { name: 'Halteres', count: 80 },
      { name: 'Esteiras', count: 45 },
      { name: 'Bicicletas', count: 35 },
      { name: 'Acessórios', count: 60 },
      { name: 'Máquinas', count: 50 },
      { name: 'Yoga', count: 30 }
    ],
    topProducts: [
      {
        id: '3',
        name: 'Halteres Ajustáveis',
        price: 299.90,
        originalPrice: 399.90,
        rating: 4.7,
        reviews: 67,
        image: '/images/marketplace/dumbbells.jpg',
        seller: 'Equipamentos Fitness'
      }
    ]
  },
  {
    id: '3',
    name: 'Roupas',
    slug: 'roupas',
    description: 'Camisetas, shorts, leggings e roupas esportivas para todas as modalidades',
    icon: '👕',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    productCount: 280,
    sellerCount: 22,
    averageRating: 4.6,
    featured: false,
    subcategories: [
      { name: 'Camisetas', count: 90 },
      { name: 'Shorts', count: 70 },
      { name: 'Leggings', count: 60 },
      { name: 'Tops', count: 40 },
      { name: 'Calças', count: 20 }
    ],
    topProducts: [
      {
        id: '5',
        name: 'Camiseta Dry Fit',
        price: 39.90,
        originalPrice: 59.90,
        rating: 4.5,
        reviews: 203,
        image: '/images/marketplace/dry-fit-shirt.jpg',
        seller: 'Roupas Esportivas'
      }
    ]
  },
  {
    id: '4',
    name: 'Acessórios',
    slug: 'acessorios',
    description: 'Monitores cardíacos, garrafas, mochilas e acessórios para treinos',
    icon: '⌚',
    color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
    productCount: 150,
    sellerCount: 15,
    averageRating: 4.5,
    featured: false,
    subcategories: [
      { name: 'Monitores', count: 40 },
      { name: 'Garrafas', count: 35 },
      { name: 'Mochilas', count: 25 },
      { name: 'Luvas', count: 30 },
      { name: 'Cintos', count: 20 }
    ],
    topProducts: [
      {
        id: '6',
        name: 'Monitor Cardíaco',
        price: 199.90,
        originalPrice: 299.90,
        rating: 4.6,
        reviews: 78,
        image: '/images/marketplace/heart-monitor.jpg',
        seller: 'Acessórios Tech'
      }
    ]
  },
  {
    id: '5',
    name: 'Livros',
    slug: 'livros',
    description: 'E-books, livros físicos e guias sobre fitness, nutrição e bem-estar',
    icon: '📚',
    color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    productCount: 80,
    sellerCount: 12,
    averageRating: 4.9,
    featured: false,
    subcategories: [
      { name: 'E-books', count: 45 },
      { name: 'Livros Físicos', count: 25 },
      { name: 'Guias', count: 10 }
    ],
    topProducts: [
      {
        id: '7',
        name: 'Ebook Nutrição Esportiva',
        price: 29.90,
        originalPrice: 49.90,
        rating: 4.9,
        reviews: 156,
        image: '/images/marketplace/ebook.jpg',
        seller: 'Livros e Cursos'
      }
    ]
  },
  {
    id: '6',
    name: 'Cursos',
    slug: 'cursos',
    description: 'Cursos online, certificações e treinamentos especializados',
    icon: '🎓',
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    productCount: 120,
    sellerCount: 8,
    averageRating: 4.8,
    featured: true,
    subcategories: [
      { name: 'Personal Training', count: 35 },
      { name: 'Nutrição', count: 25 },
      { name: 'Fisioterapia', count: 20 },
      { name: 'Yoga', count: 15 },
      { name: 'Pilates', count: 15 },
      { name: 'Outros', count: 10 }
    ],
    topProducts: [
      {
        id: '8',
        name: 'Curso Personal Training',
        price: 199.90,
        originalPrice: 299.90,
        rating: 4.8,
        reviews: 89,
        image: '/images/marketplace/personal-training-course.jpg',
        seller: 'Livros e Cursos'
      }
    ]
  }
];

const sortOptions = [
  { value: 'name', label: 'Nome A-Z' },
  { value: 'products', label: 'Mais Produtos' },
  { value: 'rating', label: 'Melhor Avaliados' },
  { value: 'trending', label: 'Em Alta' }
];

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         category.subcategories.some(sub => sub.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'products':
        return b.productCount - a.productCount;
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'trending':
        return b.productCount - a.productCount; // Simplified trending logic
      default:
        return 0;
    }
  });

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

  const featuredCategories = categories.filter(cat => cat.featured);
  const regularCategories = categories.filter(cat => !cat.featured);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Categorias</h1>
              <p className="text-muted-foreground mt-1">
                Explore produtos por categoria e encontre exatamente o que você precisa
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar categorias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-sm text-muted-foreground flex items-center">
                {filteredCategories.length} categorias encontradas
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Categories */}
        {!searchQuery && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-primary" />
              Categorias em Destaque
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className={`h-32 ${category.color} flex items-center justify-center`}>
                    <div className="text-6xl">{category.icon}</div>
                  </div>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          {renderStars(category.averageRating)}
                          <span className="font-medium">{category.averageRating}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {category.productCount} produtos
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Subcategorias populares:</div>
                        <div className="flex flex-wrap gap-1">
                          {category.subcategories.slice(0, 3).map((sub, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {sub.name}
                            </Badge>
                          ))}
                          {category.subcategories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{category.subcategories.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <Link href={`/marketplace/category/${category.slug}`}>
                          <Button className="w-full group-hover:bg-primary/90">
                            Explorar Categoria
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Categories */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {searchQuery ? 'Resultados da Busca' : 'Todas as Categorias'}
          </h2>
          
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCategories.map((category) => (
                <Card key={category.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  <div className={`h-24 ${category.color} flex items-center justify-center`}>
                    <div className="text-4xl">{category.icon}</div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{category.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{category.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-1">
                          {renderStars(category.averageRating)}
                          <span className="font-medium">{category.averageRating}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {category.productCount} produtos
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{category.sellerCount} vendedores</span>
                        <span>{category.subcategories.length} subcategorias</span>
                      </div>

                      <Link href={`/marketplace/category/${category.slug}`}>
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                          Ver Produtos
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedCategories.map((category) => (
                <Card key={category.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center`}>
                        <div className="text-2xl">{category.icon}</div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-semibold">{category.name}</h3>
                          <div className="flex items-center space-x-1">
                            {renderStars(category.averageRating)}
                            <span className="font-medium">{category.averageRating}</span>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{category.description}</p>
                        
                        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Package className="h-4 w-4" />
                            <span>{category.productCount} produtos</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{category.sellerCount} vendedores</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Grid3X3 className="h-4 w-4" />
                            <span>{category.subcategories.length} subcategorias</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <Link href={`/marketplace/category/${category.slug}`}>
                          <Button>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Produtos
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm">
                          <Heart className="h-4 w-4 mr-2" />
                          Favoritar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {!searchQuery && (
          <Card className="mt-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Produtos Disponíveis</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {categories.reduce((sum, cat) => sum + cat.sellerCount, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Vendedores Ativos</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {categories.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Categorias</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {(categories.reduce((sum, cat) => sum + cat.averageRating, 0) / categories.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">Avaliação Média</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


