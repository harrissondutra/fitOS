"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dumbbell,
  Clock,
  Target,
  CheckCircle,
  Play,
  Calendar,
  Flame,
  Timer,
} from "lucide-react";

interface Workout {
  id: string;
  name: string;
  type: string;
  duration: string;
  date: string;
  status: "completed" | "in-progress" | "scheduled";
  calories: number;
  exercises: number;
  progress?: number;
}

const recentWorkouts: Workout[] = [
  {
    id: "1",
    name: "Treino de Peito e Tríceps",
    type: "Força",
    duration: "45 min",
    date: "Hoje, 14:30",
    status: "completed",
    calories: 320,
    exercises: 8,
    progress: 100,
  },
  {
    id: "2",
    name: "Cardio HIIT",
    type: "Cardio",
    duration: "30 min",
    date: "Ontem, 18:00",
    status: "completed",
    calories: 450,
    exercises: 6,
    progress: 100,
  },
  {
    id: "3",
    name: "Treino de Pernas",
    type: "Força",
    duration: "60 min",
    date: "2 dias atrás",
    status: "completed",
    calories: 380,
    exercises: 10,
    progress: 100,
  },
  {
    id: "4",
    name: "Yoga Flow",
    type: "Flexibilidade",
    duration: "40 min",
    date: "3 dias atrás",
    status: "completed",
    calories: 180,
    exercises: 12,
    progress: 100,
  },
  {
    id: "5",
    name: "Treino de Costas",
    type: "Força",
    duration: "50 min",
    date: "Amanhã, 16:00",
    status: "scheduled",
    calories: 0,
    exercises: 9,
  },
];

function WorkoutCard({ workout }: { workout: Workout }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "scheduled":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "in-progress":
        return <Play className="h-4 w-4" />;
      case "scheduled":
        return <Calendar className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completo";
      case "in-progress":
        return "Em Andamento";
      case "scheduled":
        return "Agendado";
      default:
        return status;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{workout.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4" />
              {workout.type} • {workout.exercises} exercícios
            </CardDescription>
          </div>
          <Badge className={getStatusColor(workout.status)}>
            {getStatusIcon(workout.status)}
            <span className="ml-1">{getStatusText(workout.status)}</span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {workout.duration}
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {workout.date}
          </div>
        </div>
        
        {workout.status === "completed" && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4" />
              {workout.calories} cal
            </div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Target className="h-4 w-4" />
              Meta atingida
            </div>
          </div>
        )}
        
        {workout.status === "in-progress" && workout.progress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span>{workout.progress}%</span>
            </div>
            <Progress value={workout.progress} className="h-2" />
          </div>
        )}
        
        {workout.status === "scheduled" && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Próximo treino agendado
            </div>
            <Button size="sm" variant="outline">
              <Play className="h-4 w-4 mr-1" />
              Iniciar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentWorkouts() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Treinos Recentes
            </CardTitle>
            <CardDescription>
              Seus últimos treinos e progresso
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver Todos
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentWorkouts.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}








