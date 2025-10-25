'use client';

import { useState } from 'react';
import { useForm } from '@/hooks/use-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TreinoFormData, Treino, Exercise } from '@/shared/types';
import { useExercises } from '@/hooks/use-exercises';
import { useClients } from '@/hooks/use-clients';
import { X, Plus, Save, Loader2, Dumbbell } from 'lucide-react';

interface TreinoFormProps {
  treino?: Treino;
  onSubmit: (data: TreinoFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function TreinoForm({ treino, onSubmit, onCancel, loading = false }: TreinoFormProps) {
  const [selectedExercises, setSelectedExercises] = useState<any[]>(
    treino?.exercises || []
  );
  const [newExercise, setNewExercise] = useState<Exercise | null>(null);
  const [newSets, setNewSets] = useState(3);
  const [newReps, setNewReps] = useState(10);
  const [newWeight, setNewWeight] = useState('');
  const [newDuration, setNewDuration] = useState('');

  const { exercises } = useExercises();
  const { clients } = useClients();

  const { values, setValuesCustom, errors, setErrors, handleSubmit, isSubmitting } = useForm<TreinoFormData>({
    name: treino?.name || '',
    description: treino?.description || '',
    exercises: treino?.exercises || [],
    clientId: treino?.clientId || '',
    aiGenerated: treino?.aiGenerated || false,
  });

  const handleFormSubmit = async (data: TreinoFormData) => {
    try {
      await onSubmit({
        ...data,
        exercises: selectedExercises,
      });
    } catch (error) {
      console.error('Error submitting treino:', error);
    }
  };

  const addExercise = () => {
    if (newExercise) {
      const exerciseData = {
        exerciseId: newExercise.id,
        name: newExercise.name,
        sets: newSets,
        reps: newReps,
        weight: newWeight ? parseFloat(newWeight) : undefined,
        duration: newDuration || undefined,
        restTime: 60, // Default rest time
        notes: '',
      };
      
      setSelectedExercises([...selectedExercises, exerciseData]);
      setNewExercise(null);
      setNewSets(3);
      setNewReps(10);
      setNewWeight('');
      setNewDuration('');
    }
  };

  const removeExercise = (index: number) => {
    const updated = selectedExercises.filter((_, i) => i !== index);
    setSelectedExercises(updated);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = selectedExercises.map((exercise, i) => 
      i === index ? { ...exercise, [field]: value } : exercise
    );
    setSelectedExercises(updated);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {treino ? 'Edit Treino' : 'Create New Treino'}
        </CardTitle>
        <CardDescription>
          {treino ? 'Update treino details and exercises' : 'Create a new treino plan'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Treino Name *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValuesCustom({ name: e.target.value })}
                placeholder="e.g., Upper Body Strength"
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Assigned Member *</Label>
              <Select
                value={values.clientId}
                onValueChange={(value) => setValuesCustom({ clientId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={values.description}
              onChange={(e) => setValuesCustom({ description: e.target.value })}
              placeholder="Describe the treino..."
              rows={3}
            />
          </div>

          {/* Exercise Selection */}
          <div className="space-y-4">
            <Label>Exercises</Label>
            
            {/* Add Exercise */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Exercise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select Exercise</Label>
                    <Select
                      value={newExercise?.id || ''}
                      onValueChange={(value) => {
                        const exercise = exercises?.find(e => e.id === value);
                        setNewExercise(exercise || null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an exercise" />
                      </SelectTrigger>
                      <SelectContent>
                        {exercises?.map((exercise) => (
                          <SelectItem key={exercise.id} value={exercise.id}>
                            {exercise.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      value={newSets}
                      onChange={(e) => setNewSets(parseInt(e.target.value) || 1)}
                      min="1"
                      max="20"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Reps</Label>
                    <Input
                      type="number"
                      value={newReps}
                      onChange={(e) => setNewReps(parseInt(e.target.value) || 1)}
                      min="1"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input
                      type="number"
                      value={newWeight}
                      onChange={(e) => setNewWeight(e.target.value)}
                      placeholder="Optional"
                      step="0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input
                      type="number"
                      value={newDuration}
                      onChange={(e) => setNewDuration(e.target.value)}
                      placeholder="Optional"
                      min="1"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={addExercise}
                  disabled={!newExercise}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </CardContent>
            </Card>

            {/* Selected Exercises */}
            <div className="space-y-2">
              <Label>Selected Exercises ({selectedExercises.length})</Label>
              {selectedExercises.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No exercises added yet</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {selectedExercises.map((exercise, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{exercise.name}</h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExercise(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid gap-2 md:grid-cols-4">
                          <div>
                            <Label className="text-xs">Sets</Label>
                            <Input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                              min="1"
                              max="20"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Reps</Label>
                            <Input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                              min="1"
                              max="100"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Weight (kg)</Label>
                            <Input
                              type="number"
                              value={exercise.weight || ''}
                              onChange={(e) => updateExercise(index, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                              placeholder="Optional"
                              step="0.5"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Duration (min)</Label>
                            <Input
                              type="number"
                              value={exercise.duration || ''}
                              onChange={(e) => updateExercise(index, 'duration', e.target.value || undefined)}
                              placeholder="Optional"
                              min="1"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="aiGenerated"
                checked={values.aiGenerated}
                onChange={(e) => setValuesCustom({ aiGenerated: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="aiGenerated">AI Generated Treino</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading || selectedExercises.length === 0}>
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {treino ? 'Update Treino' : 'Create Treino'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
