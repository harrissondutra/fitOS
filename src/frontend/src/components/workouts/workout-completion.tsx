'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Clock, Target, CheckCircle2 } from 'lucide-react';

interface WorkoutCompletionProps {
  workoutName: string;
  totalExercises: number;
  duration: number; // em minutos
  onContinue: () => void;
  onGoHome: () => void;
}

export function WorkoutCompletion({ 
  workoutName, 
  totalExercises, 
  duration,
  onContinue,
  onGoHome
}: WorkoutCompletionProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-4xl font-bold">Parabéns!</CardTitle>
          <p className="text-xl text-muted-foreground">
            Você concluiu o treino: <span className="font-semibold text-foreground">{workoutName}</span>
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-3xl font-bold">{totalExercises}</div>
              <p className="text-sm text-muted-foreground">Exercícios</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-3xl font-bold">{formatDuration(duration)}</div>
              <p className="text-sm text-muted-foreground">Duração</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-3xl font-bold">100%</div>
              <p className="text-sm text-muted-foreground">Concluído</p>
            </div>
          </div>

          {/* Mensagem Motivacional */}
          <div className="bg-muted rounded-lg p-6 text-center">
            <p className="text-lg font-medium mb-2">Treino concluído com sucesso! 🎉</p>
            <p className="text-sm text-muted-foreground">
              Continue treinando para alcançar seus objetivos!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button 
              onClick={onGoHome} 
              variant="outline" 
              className="flex-1"
            >
              Voltar para Treinos
            </Button>
            <Button 
              onClick={onContinue}
              className="flex-1"
            >
              Continuar Treinando
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



