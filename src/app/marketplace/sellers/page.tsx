"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { 
  Search, 
  Filter, 
  Star, 
  Users, 
  Store, 
  Award,
  TrendingUp,
  MapPin,
  Calendar,
  MessageCircle,
  Heart,
  Eye,
  CheckCircle,
  Clock,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data
const sellers = [
  {
    id: '1',
    name: 'Suplementos Premium',
    owner: 'João Silva',
    category: 'Suplementos',
    rating: 4.9,
    reviews: 156,
    products: 45,
    sales: '2.5K+',
    location: 'São Paulo, SP',
    verified: true,
    joinedDate: '2023-01-15',
    description: 'Especialistas em suplementos de alta qualidade para atletas e praticantes de atividade física.',
    image: '/avatars/supplement-store.png',
    banner: '/images/marketplace/supplement-banner.jpg',
    specialties: ['Whey Protein', 'Creatina', 'BCAA', 'Vitaminas'],
    badges: ['Top Seller', 'Verified', 'Fast Shipping']
  },
  {
    id: '2',
    name: 'Equipamentos Fitness',
    owner: 'Maria Santos',
    category: 'Equipamentos',
    rating: 4.8,
    reviews: 89,
    products: 32,
    sales: '1.8K+',
    location: 'Rio de Janeiro, RJ',
    verified: true,
    joinedDate: '2023-03-20',
    description: 'Equipamentos profissionais para academias e treinos em casa.',
    image: '/avatars/fitness-equipment.png',
    banner: '/images/marketplace/equipment-banner.jpg',
    specialties: ['Halteres', 'Esteiras', 'Bicicletas', 'Acessórios'],
    badges: ['Professional', 'Verified', 'Warranty']
  },
  {
    id: '3',
    name: 'Roupas Esportivas',
    owner: 'Pedro Costa',
    category: 'Roupas',
    rating: 4.7,
    reviews: 203,
    products: 28,
    sales: '1.2K+',
    location: 'Belo Horizonte, MG',
    verified: false,
    joinedDate: '2023-06-10',
    description: 'Roupas esportivas de alta qualidade para todas as modalidades.',
    image: '/avatars/sports-clothing.png',
    banner: '/images/marketplace/clothing-banner.jpg',
    specialties: ['Camisetas', 'Shorts', 'Leggings', 'Acessórios'],
    badges: ['Trending', 'Quality']
  },
  {
    id: '4',
    name: 'Livros e Cursos',
    owner: 'Ana Oliveira',
    category: 'Educação',
    rating: 4.9,
    reviews: 67,
    products: 15,
    sales: '890+',
    location: 'Porto Alegre, RS',
    verified: true,
    joinedDate: '2023-02-28',
    description: 'Cursos e livros especializados em fitness, nutrição e bem-estar.',
    image: '/avatars/education-store.png',
    banner: '/images/marketplace/education-banner.jpg',
    specialties: ['Cursos Online', 'E-books', 'Certificações', 'Consultoria'],
    badges: ['Expert', 'Verified', 'Certified']
  },
  {
    id: '5',
    name: 'Acessórios Tech',
    owner: 'Carlos Mendes',
    category: 'Tecnologia',
    rating: 4.6,
    reviews: 45,
    products: 22,
    sales: '650+',
    location: 'Brasília, DF',
    verified: false,
    joinedDate: '2023-08-15',
    description: 'Tecnologia wearable e acessórios inteligentes para fitness.',
    image: '/avatars/tech-store.png',
    banner: '/images/marketplace/tech-banner.jpg',
    specialties: ['Smartwatches', 'Monitores', 'Apps', 'Gadgets'],
    badges: ['Innovation', 'Tech']
  }
];

const categories = [
  'Todos',
  'Suplementos',
  'Equipamentos',
  'Roupas',
  'Educação',
  'Tecnologia',
  'Acessórios'
];

const sortOptions = [
  { value: 'rating', label: 'Melhor Avaliados' },
  { value: 'sales', label: 'Mais Vendidos' },
  { value: 'newest', label: 'Mais Recentes' },
  { value: 'name', label: 'Nome A-Z' }
];

export default function SellersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [sortBy, setSortBy] = useState('rating');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredSellers = sellers.filter(seller => {
    const matchesSearch = seller.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         seller.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         seller.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || seller.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const sortedSellers = [...filteredSellers].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'sales':
        return parseInt(b.sales.replace('K+', '')) - parseInt(a.sales.replace('K+', ''));
      case 'newest':
        return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const itemsPerPage = 6;
  const totalPages = Math.ceil(sortedSellers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSellers = sortedSellers.slice(startIndex, startIndex + itemsPerPage);

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
      case 'Expert':
        return 'default';
      case 'Professional':
      case 'Certified':
        return 'secondary';
      case 'Trending':
      case 'Innovation':
        return 'outline';
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
            <div>
              <h1 className="text-3xl font-bold text-foreground">Vendedores</h1>
              <p className="text-muted-foreground mt-1">
                Descubra os melhores vendedores e suas lojas especializadas
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros Avançados
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sellers.length}</div>
              <p className="text-xs text-muted-foreground">
                +5 novos este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificados</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sellers.filter(s => s.verified).length}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((sellers.filter(s => s.verified).length / sellers.length) * 100)}% do total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(sellers.reduce((sum, s) => sum + s.rating, 0) / sellers.length).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">
                Baseado em {sellers.reduce((sum, s) => sum + s.reviews, 0)} avaliações
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categorias</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length - 1}</div>
              <p className="text-xs text-muted-foreground">
                Diferentes especialidades
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros e Busca</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vendedores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                  Grid
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  Lista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sellers Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {paginatedSellers.map((seller) => (
            <Card key={seller.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <div className="h-32 bg-gradient-to-r from-primary/20 to-blue-600/20 flex items-center justify-center">
                  <Store className="h-16 w-16 text-primary/60" />
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
                  {seller.badges.slice(0, 2).map((badge) => (
                    <Badge key={badge} variant={getBadgeVariant(badge)} className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
                <div className="absolute -bottom-6 left-4">
                  <div className="w-12 h-12 bg-background border-2 border-background rounded-full flex items-center justify-center">
                    <Store className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
              
              <CardContent className="pt-8">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{seller.name}</h3>
                      {seller.verified && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">por {seller.owner}</p>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {seller.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{seller.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(seller.joinedDate).getFullYear()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {renderStars(seller.rating)}
                      <span className="text-sm font-medium">{seller.rating}</span>
                      <span className="text-sm text-muted-foreground">({seller.reviews})</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {seller.sales} vendas
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {seller.specialties.slice(0, 3).map((specialty) => (
                      <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {seller.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{seller.specialties.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Button size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Loja
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, sortedSellers.length)} de {sortedSellers.length} vendedores
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
}





