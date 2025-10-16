"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Target,
  TrendingUp,
  CheckCircle,
  Clock,
  Flame,
  Dumbbell,
} from "lucide-react";

interface DayProgress {
  day: string;
  date: number;
  workouts: number;
  calories: number;
  duration: number; // in minutes
  completed: boolean;
  goal: number;
}

const weeklyData: DayProgress[] = [
  { day: "Seg", date: 1, workouts: 1, calories: 320, duration: 45, completed: true, goal: 1 },
  { day: "Ter", date: 2, workouts: 0, calories: 0, duration: 0, completed: false, goal: 1 },
  { day: "Qua", date: 3, workouts: 2, calories: 580, duration: 75, completed: true, goal: 1 },
  { day: "Qui", date: 4, workouts: 1, calories: 280, duration: 30, completed: true, goal: 1 },
  { day: "Sex", date: 5, workouts: 0, calories: 0, duration: 0, completed: false, goal: 1 },
  { day: "Sáb", date: 6, workouts: 1, calories: 450, duration: 60, completed: true, goal: 1 },
  { day: "Dom", date: 7, workouts: 0, calories: 0, duration: 0, completed: false, goal: 1 },
];

export function WeeklyProgress() {
  const totalWorkouts = weeklyData.reduce((sum, day) => sum + day.workouts, 0);
  const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
  const totalDuration = weeklyData.reduce((sum, day) => sum + day.duration, 0);
  const completedDays = weeklyData.filter(day => day.completed).length;
  const weeklyGoal = 5; // 5 treinos por semana
  const progressPercentage = (totalWorkouts / weeklyGoal) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Progresso Semanal
        </CardTitle>
        <CardDescription>
          Acompanhe sua evolução ao longo da semana
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resumo da Semana */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalWorkouts}</div>
            <div className="text-xs text-muted-foreground">Treinos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{totalCalories}</div>
            <div className="text-xs text-muted-foreground">Calorias</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{Math.round(totalDuration / 60)}h</div>
            <div className="text-xs text-muted-foreground">Tempo</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{completedDays}</div>
            <div className="text-xs text-muted-foreground">Dias Ativos</div>
          </div>
        </div>

        {/* Barra de Progresso Geral */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Meta Semanal</span>
            <Badge variant="secondary">
              {totalWorkouts}/{weeklyGoal} treinos
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="text-xs text-muted-foreground text-center">
            {progressPercentage >= 100 ? "🎉 Meta atingida!" : `${Math.round(progressPercentage)}% da meta semanal`}
          </div>
        </div>

        {/* Calendário da Semana */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Calendário da Semana</h4>
          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((day, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg text-center border-2 transition-colors ${
                  day.completed
                    ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                    : "border-muted bg-muted/50"
                }`}
              >
                <div className="text-xs font-medium text-muted-foreground">{day.day}</div>
                <div className="text-lg font-bold">{day.date}</div>
                {day.completed ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mx-auto" />
                ) : (
                  <div className="h-4 w-4 mx-auto" />
                )}
                {day.workouts > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {day.workouts} treino{day.workouts > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Estatísticas Detalhadas</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-primary" />
                <span>Treinos Completos</span>
              </div>
              <span className="font-medium">{totalWorkouts}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>Calorias Queimadas</span>
              </div>
              <span className="font-medium">{totalCalories.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span>Tempo Total</span>
              </div>
              <span className="font-medium">{Math.round(totalDuration / 60)}h {totalDuration % 60}m</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <span>Dias Ativos</span>
              </div>
              <span className="font-medium">{completedDays}/7</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}







