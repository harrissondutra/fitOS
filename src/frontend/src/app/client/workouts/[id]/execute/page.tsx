'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, SkipForward, Play, Pause, RotateCcw } from 'lucide-react';
import { ProgressBar } from '@/components/workouts/progress-bar';
import { Timer } from '@/components/workouts/timer';
import { VideoPlayer } from '@/components/workouts/video-player';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface WorkoutExercise {
  exerciseId?: string;
  exerciseName?: string;
  sets: number;
  reps: string;
  rest: number;
  weight?: string;
  notes?: string;
  videoUrl?: string; // URL do vídeo do exercício
}

export default function ExecuteWorkoutPage() {
  const router = useRouter();
  const params = useParams();
  const workoutId = params.id as string;

  const [workout, setWorkout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restSeconds, setRestSeconds] = useState(0);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [exerciseVideos, setExerciseVideos] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchWorkout();
  }, []);

  // Buscar vídeos dos exercícios quando o workout for carregado
  useEffect(() => {
    if (workout && workout.exercises) {
      fetchExerciseVideos();
    }
  }, [workout]);

  useEffect(() => {
    if (isResting && restSeconds > 0) {
      const timer = setTimeout(() => {
        setRestSeconds(restSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isResting && restSeconds === 0) {
      setIsResting(false);
    }
  }, [isResting, restSeconds]);

  const fetchWorkout = async () => {
    try {
      const response = await api.get(`/api/workouts/${workoutId}`);
      setWorkout(response.data.data.workout);
    } catch (error) {
      toast.error('Erro ao carregar treino');
      router.push('/client/workouts');
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseVideos = async () => {
    if (!workout?.exercises) return;

    const videoPromises = workout.exercises
      .filter((ex: WorkoutExercise) => ex.exerciseId)
      .map(async (ex: WorkoutExercise) => {
        try {
          const response = await api.get(`/api/exercises/${ex.exerciseId}`);
          return {
            exerciseId: ex.exerciseId,
            videoUrl: response.data.data?.videoUrl
          };
        } catch (error) {
          console.error(`Error fetching video for exercise ${ex.exerciseId}:`, error);
          return { exerciseId: ex.exerciseId, videoUrl: null };
        }
      });

    const results = await Promise.all(videoPromises);
    const videosMap: Record<string, string> = {};
    
    results.forEach(result => {
      if (result.videoUrl) {
        videosMap[result.exerciseId!] = result.videoUrl;
      }
    });

    setExerciseVideos(videosMap);
  };

  if (loading || !workout) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/2"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  const exercises: WorkoutExercise[] = Array.isArray(workout.exercises) 
    ? workout.exercises 
    : [];

  const currentExercise = exercises[currentExerciseIndex];
  const progress = ((currentExerciseIndex + 1) / exercises.length) * 100;

  const startWorkout = () => {
    setWorkoutStarted(true);
  };

  const completeSet = () => {
    if (currentSet < currentExercise.sets) {
      setCurrentSet(currentSet + 1);
      setIsResting(true);
      setRestSeconds(currentExercise.rest);
    } else {
      nextExercise();
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setCurrentSet(1);
      setIsResting(false);
      setRestSeconds(0);
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    try {
      await api.put(`/api/workouts/${workoutId}`, {
        completed: true,
        completedAt: new Date()
      });
      
      toast.success('Treino concluído com sucesso!');
      router.push('/client/workouts');
    } catch (error) {
      toast.error('Erro ao concluir treino');
    }
  };

  if (!workoutStarted) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              <h1 className="text-3xl font-bold">{workout.name}</h1>
              <Badge variant="outline">{exercises.length} exercícios</Badge>
            </div>
            {workout.description && (
              <p className="text-muted-foreground">{workout.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Exercícios</p>
                <p className="text-2xl font-bold">{exercises.length}</p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Tempo estimado</p>
                <p className="text-2xl font-bold">45 min</p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Exercícios:</h3>
              {exercises.map((ex, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span>{ex.exerciseName || `Exercício ${index + 1}`}</span>
                  <Badge>{ex.sets}x{ex.reps}</Badge>
                </div>
              ))}
            </div>

            <Button onClick={startWorkout} size="lg" className="w-full">
              <Play className="h-5 w-5 mr-2" />
              Iniciar Treino
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6">
      {/* Progress Bar */}
      <ProgressBar 
        current={currentExerciseIndex + 1} 
        total={exercises.length}
        label={`Exercício ${currentExerciseIndex + 1} de ${exercises.length}`}
      />

      {/* Current Exercise */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {currentExercise.exerciseName || `Exercício ${currentExerciseIndex + 1}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Set Info */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Série</p>
              <p className="text-3xl font-bold">{currentSet}/{currentExercise.sets}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Repetições</p>
              <p className="text-3xl font-bold">{currentExercise.reps}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Peso</p>
              <p className="text-3xl font-bold">{currentExercise.weight || '-'}</p>
            </div>
          </div>

          {/* Video Player (se disponível) */}
          {currentExercise.exerciseId && exerciseVideos[currentExercise.exerciseId] && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Demonstração do exercício:</h3>
              <VideoPlayer 
                url={exerciseVideos[currentExercise.exerciseId]} 
                className="h-64"
              />
            </div>
          )}

          {/* Rest Timer */}
          {isResting && (
            <Timer 
              seconds={restSeconds} 
              onComplete={() => {
                setIsResting(false);
                setRestSeconds(0);
              }}
              autoStart={true}
            />
          )}

          {/* Notes */}
          {currentExercise.notes && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Observações:</p>
              <p className="text-sm">{currentExercise.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              className="flex-1"
              onClick={completeSet}
              disabled={isResting}
              size="lg"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              {currentSet < currentExercise.sets ? 'Concluir Série' : 'Próximo Exercício'}
            </Button>
            <Button
              variant="outline"
              onClick={nextExercise}
              size="lg"
              disabled={isResting}
            >
              <SkipForward className="h-5 w-5 mr-2" />
              Pular
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

