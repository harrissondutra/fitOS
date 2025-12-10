'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Play, Dumbbell, Filter } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  category: string;
  muscleGroups: string[];
  difficulty: string;
  equipment?: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export default function TrainerExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    difficulty: 'all',
    muscleGroup: 'all'
  });

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await api.get('/api/exercises');
      setExercises(response.data.data?.exercises || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Erro ao carregar exercícios');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exercise.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filters.category === 'all' || exercise.category === filters.category;
    const matchesDifficulty = filters.difficulty === 'all' || exercise.difficulty === filters.difficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Biblioteca de Exercícios</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground">Explore e gerencie exercícios para criar treinos</p>
        </div>
        <Button onClick={() => router.push('/trainer/exercises/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Criar Exercício
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.category}
              onValueChange={(v) => setFilters({ ...filters, category: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="strength">Força</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
                <SelectItem value="flexibility">Flexibilidade</SelectItem>
                <SelectItem value="balance">Equilíbrio</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.difficulty}
              onValueChange={(v) => setFilters({ ...filters, difficulty: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setFilters({ category: 'all', difficulty: 'all', muscleGroup: 'all' });
              setSearchTerm('');
            }}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exercises Grid */}
      {filteredExercises.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="aspect-video bg-muted relative">
                {exercise.thumbnailUrl ? (
                  <img src={exercise.thumbnailUrl} alt={exercise.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Dumbbell className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {exercise.videoUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2"
                    onClick={() => window.open(exercise.videoUrl, '_blank')}
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{exercise.name}</CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {exercise.description || 'Sem descrição'}
                </p>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{exercise.category}</Badge>
                  <Badge variant="outline">{exercise.difficulty}</Badge>
                </div>
                {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exercise.muscleGroups.slice(0, 3).map((mg, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {mg}
                      </Badge>
                    ))}
                    {exercise.muscleGroups.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{exercise.muscleGroups.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/trainer/exercises/${exercise.id}`)}
                  >
                    Ver Detalhes
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/trainer/workouts/create?exerciseId=${exercise.id}`)}
                  >
                    Usar em Treino
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum exercício encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || filters.category !== 'all' || filters.difficulty !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro exercício'}
            </p>
            {!searchTerm && filters.category === 'all' && filters.difficulty === 'all' && (
              <Button onClick={() => router.push('/trainer/exercises/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Exercício
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
