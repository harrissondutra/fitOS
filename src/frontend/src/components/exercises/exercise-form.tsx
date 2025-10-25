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
import { ExerciseFormData, Exercise } from '@/shared/types';
import { X, Plus, Save, Loader2 } from 'lucide-react';

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function ExerciseForm({ exercise, onSubmit, onCancel, loading = false }: ExerciseFormProps) {
  const [muscleGroups, setMuscleGroups] = useState<string[]>(
    exercise?.muscleGroups || []
  );
  const [instructions, setInstructions] = useState<string[]>(
    exercise?.instructions || []
  );
  const [newMuscleGroup, setNewMuscleGroup] = useState('');
  const [newInstruction, setNewInstruction] = useState('');

  const { values, setValuesCustom, errors, setErrors, handleSubmit, isSubmitting } = useForm<ExerciseFormData>({
    name: exercise?.name || '',
    description: exercise?.description || '',
    category: exercise?.category || 'strength',
    muscleGroups: exercise?.muscleGroups || [],
    equipment: exercise?.equipment || '',
    difficulty: exercise?.difficulty || 'intermediate',
    instructions: exercise?.instructions || [],
    videoUrl: exercise?.videoUrl || '',
    thumbnailUrl: exercise?.thumbnailUrl || '',
    isPublic: exercise?.isPublic ?? true,
  });

  const handleFormSubmit = async (data: ExerciseFormData) => {
    try {
      await onSubmit({
        ...data,
        muscleGroups,
        instructions,
      });
    } catch (error) {
      console.error('Error submitting exercise:', error);
    }
  };

  const addMuscleGroup = () => {
    if (newMuscleGroup.trim() && !muscleGroups.includes(newMuscleGroup.trim())) {
      const updated = [...muscleGroups, newMuscleGroup.trim()];
      setMuscleGroups(updated);
      setNewMuscleGroup('');
    }
  };

  const removeMuscleGroup = (index: number) => {
    const updated = muscleGroups.filter((_, i) => i !== index);
    setMuscleGroups(updated);
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      const updated = [...instructions, newInstruction.trim()];
      setInstructions(updated);
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated);
  };

  const muscleGroupOptions = [
    'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full-body'
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {exercise ? 'Edit Exercise' : 'Create New Exercise'}
        </CardTitle>
        <CardDescription>
          {exercise ? 'Update exercise details and settings' : 'Add a new exercise to your library'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Exercise Name *</Label>
              <Input
                id="name"
                value={values.name}
                onChange={(e) => setValuesCustom({ name: e.target.value })}
                placeholder="e.g., Push-ups"
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={values.category}
                onValueChange={(value) => setValuesCustom({ category: value as 'strength' | 'cardio' | 'flexibility' | 'balance' | 'sports' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strength">Strength</SelectItem>
                  <SelectItem value="cardio">Cardio</SelectItem>
                  <SelectItem value="flexibility">Flexibility</SelectItem>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
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
              placeholder="Describe the exercise..."
              rows={3}
            />
          </div>

          {/* Muscle Groups */}
          <div className="space-y-2">
            <Label>Muscle Groups</Label>
            <div className="flex gap-2">
              <Select value={newMuscleGroup} onValueChange={setNewMuscleGroup}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select muscle group" />
                </SelectTrigger>
                <SelectContent>
                  {muscleGroupOptions.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" onClick={addMuscleGroup} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map((group, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {group.charAt(0).toUpperCase() + group.slice(1)}
                  <button
                    type="button"
                    onClick={() => removeMuscleGroup(index)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Equipment and Difficulty */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="equipment">Equipment</Label>
              <Input
                id="equipment"
                value={values.equipment}
                onChange={(e) => setValuesCustom({ equipment: e.target.value })}
                placeholder="e.g., Dumbbells, Bodyweight"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={values.difficulty}
                onValueChange={(value) => setValuesCustom({ difficulty: value as 'beginner' | 'intermediate' | 'advanced' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Instructions</Label>
            <div className="flex gap-2">
              <Input
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                placeholder="Add instruction step..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInstruction())}
              />
              <Button type="button" onClick={addInstruction} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {instructions.map((instruction, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <span className="text-sm font-medium">{index + 1}.</span>
                  <span className="flex-1 text-sm">{instruction}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInstruction(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Media URLs */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL</Label>
              <Input
                id="videoUrl"
                value={values.videoUrl}
                onChange={(e) => setValuesCustom({ videoUrl: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
              <Input
                id="thumbnailUrl"
                value={values.thumbnailUrl}
                onChange={(e) => setValuesCustom({ thumbnailUrl: e.target.value })}
                placeholder="https://..."
                type="url"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={values.isPublic}
                onChange={(e) => setValuesCustom({ isPublic: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isPublic">Make this exercise public</Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || loading}>
              {isSubmitting || loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {exercise ? 'Update Exercise' : 'Create Exercise'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
