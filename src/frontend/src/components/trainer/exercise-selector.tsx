'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Plus, Dumbbell } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

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

interface ExerciseSelectorProps {
  onSelect: (exercise: Exercise) => void;
  selectedExercises?: string[];
}

export function ExerciseSelector({ onSelect, selectedExercises = [] }: ExerciseSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/exercises');
      setExercises(response.data.data?.exercises || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
      toast.error('Erro ao carregar exercícios');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      loadExercises();
    }
  };

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ex.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || ex.category === category;
    const notSelected = !selectedExercises.includes(ex.id);
    
    return matchesSearch && matchesCategory && notSelected;
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar da Biblioteca
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Exercício</DialogTitle>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar exercício..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="strength">Força</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="flexibility">Flexibilidade</SelectItem>
              <SelectItem value="balance">Equilíbrio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exercises Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredExercises.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 mt-4">
            {filteredExercises.map((exercise) => (
              <Card 
                key={exercise.id} 
                className="cursor-pointer hover:shadow-lg transition-all"
                onClick={() => {
                  onSelect(exercise);
                  setOpen(false);
                  toast.success(`Exercício "${exercise.name}" adicionado`);
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {exercise.description || 'Sem descrição'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{exercise.category}</Badge>
                    <Badge variant="outline">{exercise.difficulty}</Badge>
                    {exercise.muscleGroups?.slice(0, 2).map((mg, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{mg}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchTerm || category !== 'all' 
                ? 'Nenhum exercício encontrado com os filtros selecionados'
                : 'Nenhum exercício disponível'}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

