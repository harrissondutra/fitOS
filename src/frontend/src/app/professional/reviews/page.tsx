'use client';

import { useState, useEffect } from 'react';
import { Star, StarIcon, Calendar, User, MessageSquare, TrendingUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentReview {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  appointment: {
    id: string;
    title: string;
    scheduledAt: string;
    client: {
      id: string;
      name: string;
    };
  };
}

const StarRating = ({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating 
              ? 'text-yellow-400 fill-yellow-400' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<AppointmentReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | '2' | '1'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointment-reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (filter === 'all') return true;
    return review.rating === parseInt(filter);
  });

  const getRatingStats = () => {
    const total = reviews.length;
    if (total === 0) return { average: 0, distribution: [0, 0, 0, 0, 0] };

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;

    const distribution = [5, 4, 3, 2, 1].map(rating => 
      reviews.filter(review => review.rating === rating).length
    );

    return { average, distribution };
  };

  const { average, distribution } = getRatingStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Avaliações</h1>
          <p className="text-muted-foreground">
            Acompanhe o feedback dos clientes sobre os atendimentos
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold">{average.toFixed(1)}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{reviews.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">5 Estrelas</p>
                <p className="text-2xl font-bold text-green-600">{distribution[0]}</p>
              </div>
              <Star className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Satisfação</p>
                <p className="text-2xl font-bold text-blue-600">
                  {reviews.length > 0 
                    ? Math.round((distribution[0] + distribution[1]) / reviews.length * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Avaliações</CardTitle>
          <CardDescription>
            Veja como as avaliações estão distribuídas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating, index) => {
              const count = distribution[index];
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-16">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1">
                    <Progress value={percentage} className="h-2" />
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm text-muted-foreground">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todas ({reviews.length})
        </Button>
        <Button
          variant={filter === '5' ? 'default' : 'outline'}
          onClick={() => setFilter('5')}
        >
          5 Estrelas ({distribution[0]})
        </Button>
        <Button
          variant={filter === '4' ? 'default' : 'outline'}
          onClick={() => setFilter('4')}
        >
          4 Estrelas ({distribution[1]})
        </Button>
        <Button
          variant={filter === '3' ? 'default' : 'outline'}
          onClick={() => setFilter('3')}
        >
          3 Estrelas ({distribution[2]})
        </Button>
        <Button
          variant={filter === '2' ? 'default' : 'outline'}
          onClick={() => setFilter('2')}
        >
          2 Estrelas ({distribution[3]})
        </Button>
        <Button
          variant={filter === '1' ? 'default' : 'outline'}
          onClick={() => setFilter('1')}
        >
          1 Estrela ({distribution[4]})
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'As avaliações dos clientes aparecerão aqui quando forem feitas.'
                  : `Nenhuma avaliação de ${filter} estrela${filter !== '1' ? 's' : ''} encontrada.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <Star className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} size="md" />
                          <Badge 
                            variant={review.rating >= 4 ? 'default' : review.rating >= 3 ? 'secondary' : 'destructive'}
                          >
                            {review.rating >= 4 ? 'Excelente' : review.rating >= 3 ? 'Bom' : 'Precisa Melhorar'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(review.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <div className="pl-11">
                      <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                        "{review.comment}"
                      </p>
                    </div>
                  )}

                  {/* Appointment Info */}
                  <div className="pl-11">
                    <Separator className="my-3" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">{review.appointment.title}</span>
                      <span>•</span>
                      <User className="h-4 w-4" />
                      <span>{review.appointment.client.name}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(review.appointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
