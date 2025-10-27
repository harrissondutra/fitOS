"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Star, 
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  User,
  Calendar,
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  Reply
} from 'lucide-react';

export default function AvaliacoesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data - em produção viria da API
  const reviews = [
    {
      id: '1',
      customer: 'João Silva',
      email: 'joao@email.com',
      product: 'Whey Protein Premium',
      productId: '1',
      rating: 5,
      title: 'Excelente produto!',
      comment: 'Produto de alta qualidade, entrega rápida e atendimento excepcional. Recomendo!',
      images: ['/review1.jpg', '/review2.jpg'],
      verified: true,
      helpful: 12,
      notHelpful: 1,
      status: 'published',
      response: {
        text: 'Obrigado pelo feedback! Ficamos felizes que tenha gostado do produto.',
        date: '2024-01-21T10:30:00Z',
        author: 'Equipe da Loja'
      },
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-21T10:30:00Z'
    },
    {
      id: '2',
      customer: 'Maria Santos',
      email: 'maria@email.com',
      product: 'Creatina Monohidratada',
      productId: '2',
      rating: 4,
      title: 'Bom produto',
      comment: 'Produto atende às expectativas, mas a embalagem poderia ser melhor.',
      images: [],
      verified: true,
      helpful: 8,
      notHelpful: 2,
      status: 'published',
      response: null,
      createdAt: '2024-01-19T16:45:00Z',
      updatedAt: '2024-01-19T16:45:00Z'
    },
    {
      id: '3',
      customer: 'Pedro Costa',
      email: 'pedro@email.com',
      product: 'BCAA 2:1:1',
      productId: '3',
      rating: 2,
      title: 'Produto não chegou',
      comment: 'Faz mais de 15 dias que fiz o pedido e ainda não recebi. Muito decepcionante.',
      images: [],
      verified: true,
      helpful: 3,
      notHelpful: 5,
      status: 'pending_response',
      response: null,
      createdAt: '2024-01-18T09:20:00Z',
      updatedAt: '2024-01-18T09:20:00Z'
    },
    {
      id: '4',
      customer: 'Ana Oliveira',
      email: 'ana@email.com',
      product: 'Halteres 10kg',
      productId: '4',
      rating: 5,
      title: 'Perfeito!',
      comment: 'Produto exatamente como descrito. Qualidade excelente e entrega super rápida.',
      images: ['/review3.jpg'],
      verified: true,
      helpful: 15,
      notHelpful: 0,
      status: 'published',
      response: {
        text: 'Que bom que gostou! Obrigado pela confiança em nossa loja.',
        date: '2024-01-17T11:15:00Z',
        author: 'Equipe da Loja'
      },
      createdAt: '2024-01-16T14:10:00Z',
      updatedAt: '2024-01-17T11:15:00Z'
    },
    {
      id: '5',
      customer: 'Carlos Mendes',
      email: 'carlos@email.com',
      product: 'Whey Protein Premium',
      productId: '1',
      rating: 1,
      title: 'Produto vencido',
      comment: 'Recebi o produto com data de validade próxima ao vencimento. Inaceitável!',
      images: ['/review4.jpg'],
      verified: true,
      helpful: 2,
      notHelpful: 8,
      status: 'pending_response',
      response: null,
      createdAt: '2024-01-15T12:30:00Z',
      updatedAt: '2024-01-15T12:30:00Z'
    }
  ];

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="default" className="flex items-center space-x-1"><CheckCircle className="h-3 w-3" />Publicada</Badge>;
      case 'pending_response':
        return <Badge variant="secondary" className="flex items-center space-x-1"><Clock className="h-3 w-3" />Aguardando Resposta</Badge>;
      case 'hidden':
        return <Badge variant="destructive" className="flex items-center space-x-1"><AlertCircle className="h-3 w-3" />Oculta</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    
    return matchesSearch && matchesRating && matchesStatus;
  });

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const totalReviews = reviews.length;
  const pendingResponses = reviews.filter(review => review.status === 'pending_response').length;
  const verifiedReviews = reviews.filter(review => review.verified).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Avaliações</h1>
            <p className="text-muted-foreground">Gerencie as avaliações dos seus produtos</p>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avaliação Média</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center space-x-1 mt-1">
                {getRatingStars(Math.round(averageRating))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">Avaliações recebidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Resposta</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingResponses}</div>
              <p className="text-xs text-muted-foreground">Precisam de resposta</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verificadas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedReviews}</div>
              <p className="text-xs text-muted-foreground">Compras verificadas</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar avaliações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={ratingFilter} onValueChange={setRatingFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Avaliação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Avaliações</SelectItem>
                  <SelectItem value="5">5 Estrelas</SelectItem>
                  <SelectItem value="4">4 Estrelas</SelectItem>
                  <SelectItem value="3">3 Estrelas</SelectItem>
                  <SelectItem value="2">2 Estrelas</SelectItem>
                  <SelectItem value="1">1 Estrela</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="published">Publicada</SelectItem>
                  <SelectItem value="pending_response">Aguardando Resposta</SelectItem>
                  <SelectItem value="hidden">Oculta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle>Avaliações ({filteredReviews.length})</CardTitle>
            <CardDescription>Lista de todas as avaliações dos seus produtos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {filteredReviews.map((review) => (
                <Card key={review.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{review.customer}</h4>
                              {review.verified && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verificado
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <span>{review.product}</span>
                              <span>•</span>
                              <div className="flex items-center space-x-1">
                                {getRatingStars(review.rating)}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-13">
                          <h5 className="font-medium mb-1">{review.title}</h5>
                          <p className="text-muted-foreground mb-3">{review.comment}</p>
                          
                          {review.images.length > 0 && (
                            <div className="flex space-x-2 mb-3">
                              {review.images.map((image, index) => (
                                <div key={index} className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-1">
                              <ThumbsUp className="h-4 w-4" />
                              <span>{review.helpful} úteis</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <ThumbsDown className="h-4 w-4" />
                              <span>{review.notHelpful} não úteis</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(review.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          
                          {review.response && (
                            <div className="bg-muted/50 rounded-lg p-3 mb-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <Reply className="h-4 w-4 text-primary" />
                                <span className="font-medium text-sm">Resposta da Loja</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.response.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm">{review.response.text}</p>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(review.status)}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {review.status === 'pending_response' && (
                                <Button size="sm" variant="outline">
                                  <Reply className="h-4 w-4 mr-2" />
                                  Responder
                                </Button>
                              )}
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Responder
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Marcar como Útil
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Ocultar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReviews.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma avaliação encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || ratingFilter !== 'all' || statusFilter !== 'all'
                    ? 'Tente ajustar os filtros para encontrar as avaliações.'
                    : 'Você ainda não recebeu nenhuma avaliação.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





