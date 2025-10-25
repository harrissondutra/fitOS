'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExerciseCard } from '@/components/exercises/exercise-card';
import { useExercises } from '@/hooks/use-exercises';
import { usePermissions } from '@/hooks/use-permissions';
import { Exercise, ExerciseFormData } from '@/shared/types';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List,
  Dumbbell,
  Target,
  Users
} from 'lucide-react';

// Configurações para evitar problemas de SSR com useAuth
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
export const preferredRegion = 'auto'

export default function ExercisesPage() {
  // Auth removed - using default values
  const user = { role: 'ADMIN' as const };
  const permissions = usePermissions(user?.role);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    difficulty: '',
    equipment: ''
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { exercises, loading, error, pagination, createExercise, updateExercise, deleteExercise } = useExercises(filters);

  const handleCreateExercise = async (data: ExerciseFormData) => {
    try {
      await createExercise(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Erro ao criar exercício:', error);
    }
  };

  const handleEditExercise = async (data: Partial<ExerciseFormData>) => {
    if (!selectedExercise) return;
    
    try {
      await updateExercise(selectedExercise.id, data);
      setIsEditDialogOpen(false);
      setSelectedExercise(null);
    } catch (error) {
      console.error('Erro ao atualizar exercício:', error);
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (confirm(`Tem certeza que deseja excluir "${exercise.name}"?`)) {
      try {
        await deleteExercise(exercise.id);
      } catch (error) {
        console.error('Erro ao excluir exercício:', error);
      }
    }
  };

  const handleCloneExercise = async (exercise: Exercise) => {
    const clonedData: ExerciseFormData = {
      name: `${exercise.name} (Cópia)`,
      description: exercise.description || '',
      category: exercise.category,
      muscleGroups: exercise.muscleGroups as string[],
      equipment: exercise.equipment || '',
      difficulty: exercise.difficulty,
      instructions: exercise.instructions as string[],
      videoUrl: exercise.videoUrl || '',
      thumbnailUrl: exercise.thumbnailUrl || '',
      isPublic: exercise.isPublic
    };
    
    try {
      await createExercise(clonedData);
    } catch (error) {
      console.error('Erro ao clonar exercício:', error);
    }
  };

  if (!permissions.canManageExercises) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para gerenciar exercícios.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Biblioteca de Exercícios</h1>
          <p className="text-muted-foreground">
            Gerencie sua base de dados de exercícios com {exercises.length} exercícios
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Exercício
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercícios..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="max-w-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={filters.category || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value === "all" ? "" : value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  <SelectItem value="strength">Força</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibilidade</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.difficulty || "all"} onValueChange={(value) => setFilters(prev => ({ ...prev, difficulty: value === "all" ? "" : value }))}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Níveis</SelectItem>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive">Erro ao carregar exercícios: {error}</p>
            </div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhum exercício encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {filters.search || filters.category || filters.difficulty
                  ? 'Tente ajustar seus filtros para ver mais resultados.'
                  : 'Comece criando seu primeiro exercício.'}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Exercício
              </Button>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3" 
              : "space-y-4"
            }>
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={(exercise) => {
                    setSelectedExercise(exercise);
                    setIsEditDialogOpen(true);
                  }}
                  onDelete={handleDeleteExercise}
                  onClone={handleCloneExercise}
                  showActions={permissions.canManageExercises}
                />
              ))}
            </div>
          )}
          
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} exercícios
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => {/* Handle previous page */}}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() => {/* Handle next page */}}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Exercise Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Exercise</DialogTitle>
            <DialogDescription>
              Add a new exercise to your library.
            </DialogDescription>
          </DialogHeader>
          {/* Exercise Form Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Exercise form component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Exercise Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Exercise</DialogTitle>
            <DialogDescription>
              Update the exercise details.
            </DialogDescription>
          </DialogHeader>
          {/* Exercise Form Component would go here */}
          <div className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Exercise form component will be implemented here</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
