'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';
import { ExerciseSelector } from '@/components/trainer/exercise-selector';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface ExerciseItem {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  rest: number;
  weight?: string;
  notes?: string;
  order: number;
}

export default function CreateWorkoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [workout, setWorkout] = useState({
    name: '',
    description: '',
    clientId: '',
    exercises: [] as ExerciseItem[]
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/trainer/clients');
      if (response.data.success && response.data.data) {
        setClients(response.data.data.map((client: any) => ({
          id: client.id,
          name: client.name
        })));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!workout.name || !workout.clientId) {
      toast.error('Nome do treino e cliente são obrigatórios');
      return;
    }

    setLoading(true);
    
    try {
      await api.post('/api/workouts', {
        name: workout.name,
        description: workout.description,
        clientId: workout.clientId,
        exercises: workout.exercises
      });
      
      toast.success('Treino criado com sucesso!');
      router.push('/trainer/workouts');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar treino');
    } finally {
      setLoading(false);
    }
  };

  const addExercise = () => {
    const newExercise: ExerciseItem = {
      exerciseId: `temp-${Date.now()}`,
      exerciseName: '',
      sets: 3,
      reps: '10-12',
      rest: 60,
      weight: '',
      notes: '',
      order: workout.exercises.length + 1
    };
    
    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
  };

  const removeExercise = (index: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const updateExercise = (index: number, field: keyof ExerciseItem, value: any) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, [field]: value } : ex
      )
    }));
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Criar Novo Treino</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Treino</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Treino *</Label>
              <Input
                id="name"
                placeholder="Ex: Treino A - Peito e Tríceps"
                value={workout.name}
                onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o objetivo do treino..."
                value={workout.description}
                onChange={(e) => setWorkout({ ...workout, description: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="clientId">Atribuir para Cliente *</Label>
              <Select
                value={workout.clientId}
                onValueChange={(v) => setWorkout({ ...workout, clientId: v })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clientsLoading ? (
                    <SelectItem value="loading" disabled>Carregando clientes...</SelectItem>
                  ) : clients.length > 0 ? (
                    clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-clients" disabled>
                      Nenhum cliente disponível
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Exercícios */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Exercícios</CardTitle>
              <div className="flex gap-2">
                <ExerciseSelector
                  onSelect={(exercise) => {
                    const newExercise: ExerciseItem = {
                      exerciseId: exercise.id,
                      exerciseName: exercise.name,
                      sets: 3,
                      reps: '10-12',
                      rest: 60,
                      weight: '',
                      notes: '',
                      order: workout.exercises.length + 1
                    };
                    setWorkout(prev => ({
                      ...prev,
                      exercises: [...prev.exercises, newExercise]
                    }));
                  }}
                  selectedExercises={workout.exercises.map(ex => ex.exerciseId)}
                />
                <Button type="button" variant="outline" onClick={addExercise}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Manual
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {workout.exercises.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum exercício adicionado ainda.</p>
                <div className="flex gap-2 justify-center mt-4">
                  <ExerciseSelector
                    onSelect={(exercise) => {
                      const newExercise: ExerciseItem = {
                        exerciseId: exercise.id,
                        exerciseName: exercise.name,
                        sets: 3,
                        reps: '10-12',
                        rest: 60,
                        weight: '',
                        notes: '',
                        order: 1
                      };
                      setWorkout(prev => ({
                        ...prev,
                        exercises: [newExercise]
                      }));
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addExercise}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Manual
                  </Button>
                </div>
              </div>
            ) : (
              workout.exercises.map((exercise, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="font-medium">Exercício {index + 1}</div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeExercise(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Exercício</Label>
                      <Input
                        placeholder="Ex: Supino Reto"
                        value={exercise.exerciseName}
                        onChange={(e) => updateExercise(index, 'exerciseName', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Séries</Label>
                      <Input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    
                    <div>
                      <Label>Repetições</Label>
                      <Input
                        placeholder="Ex: 10-12"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <Label>Descanso (segundos)</Label>
                      <Input
                        type="number"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(index, 'rest', parseInt(e.target.value))}
                        min={0}
                      />
                    </div>
                    
                    <div>
                      <Label>Peso</Label>
                      <Input
                        placeholder="Ex: 20kg"
                        value={exercise.weight || ''}
                        onChange={(e) => updateExercise(index, 'weight', e.target.value)}
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Observações sobre o exercício..."
                        value={exercise.notes || ''}
                        onChange={(e) => updateExercise(index, 'notes', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Treino
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

