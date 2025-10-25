import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Exercise } from '@/shared/types';
import { 
  Dumbbell, 
  Clock, 
  Users, 
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  onClone?: (exercise: Exercise) => void;
  showActions?: boolean;
}

export function ExerciseCard({ 
  exercise, 
  onEdit, 
  onDelete, 
  onClone, 
  showActions = true 
}: ExerciseCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'strength':
        return <Dumbbell className="h-4 w-4" />;
      case 'cardio':
        return <Target className="h-4 w-4" />;
      case 'flexibility':
        return <Users className="h-4 w-4" />;
      default:
        return <Dumbbell className="h-4 w-4" />;
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-none dark:hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {getCategoryIcon(exercise.category)}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{exercise.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {exercise.category} • {exercise.equipment || 'No equipment'}
              </CardDescription>
            </div>
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(exercise)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onClone && (
                  <DropdownMenuItem onClick={() => onClone(exercise)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Clone
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(exercise)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {exercise.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {exercise.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={getDifficultyColor(exercise.difficulty)}>
            {exercise.difficulty}
          </Badge>
          {exercise.muscleGroups && Array.isArray(exercise.muscleGroups) && exercise.muscleGroups.length > 0 && (
            <Badge variant="outline">
              {exercise.muscleGroups.slice(0, 2).join(', ')}
              {exercise.muscleGroups.length > 2 && ` +${exercise.muscleGroups.length - 2}`}
            </Badge>
          )}
        </div>
        
        {exercise.instructions && Array.isArray(exercise.instructions) && exercise.instructions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Instructions:</h4>
            <ol className="text-xs text-muted-foreground space-y-1">
              {exercise.instructions.slice(0, 3).map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center mt-0.5">
                    {index + 1}
                  </span>
                  <span className="line-clamp-2">{instruction}</span>
                </li>
              ))}
              {exercise.instructions.length > 3 && (
                <li className="text-xs text-muted-foreground">
                  +{exercise.instructions.length - 3} more steps
                </li>
              )}
            </ol>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {exercise.createdAt ? new Date(exercise.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
            {exercise.isPublic && (
              <Badge variant="outline" className="text-xs">
                Public
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
