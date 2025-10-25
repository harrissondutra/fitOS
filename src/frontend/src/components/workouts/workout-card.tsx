import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Treino } from '@/shared/types';
import { 
  Calendar, 
  Clock, 
  Users, 
  Target,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Play,
  CheckCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TreinoCardProps {
  treino: Treino;
  onEdit?: (treino: Treino) => void;
  onDelete?: (treino: Treino) => void;
  onClone?: (treino: Treino) => void;
  onComplete?: (treino: Treino) => void;
  onStart?: (treino: Treino) => void;
  showActions?: boolean;
}

export function WorkoutCard({ 
  treino, 
  onEdit, 
  onDelete, 
  onClone, 
  onComplete,
  onStart,
  showActions = true 
}: TreinoCardProps) {
  const getStatusColor = (completed: boolean) => {
    return completed 
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const getStatusIcon = (completed: boolean) => {
    return completed ? <CheckCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />;
  };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg dark:hover:shadow-none dark:hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{treino.name}</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {treino.description || 'No description'}
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
                {onStart && !treino.completed && (
                  <DropdownMenuItem onClick={() => onStart(treino)}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Treino
                  </DropdownMenuItem>
                )}
                {onComplete && !treino.completed && (
                  <DropdownMenuItem onClick={() => onComplete(treino)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark Complete
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(treino)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onClone && (
                  <DropdownMenuItem onClick={() => onClone(treino)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Clone
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete(treino)}
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
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className={getStatusColor(treino.completed)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(treino.completed)}
              {treino.completed ? 'Completed' : 'In Progress'}
            </div>
          </Badge>
          {treino.aiGenerated && (
            <Badge variant="outline" className="text-xs">
              AI Generated
            </Badge>
          )}
        </div>
        
        {treino.exercises && Array.isArray(treino.exercises) && treino.exercises.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Exercises ({treino.exercises.length}):</h4>
            <div className="flex flex-wrap gap-1">
              {treino.exercises.slice(0, 3).map((exercise, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  Exercise {index + 1}
                </Badge>
              ))}
              {treino.exercises.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{treino.exercises.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {treino.createdAt ? new Date(treino.createdAt).toLocaleDateString() : 'Unknown'}
            </span>
            {treino.completedAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Completed {new Date(treino.completedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        
        {treino.client && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>Assigned to: {treino.client.name}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
