"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dumbbell,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Clock,
  Flame,
  Award,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  progress?: number;
  description?: string;
}

function StatCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  progress,
  description,
}: StatCardProps) {
  const changeColor = {
    positive: "text-green-600 dark:text-green-400",
    negative: "text-red-600 dark:text-red-400",
    neutral: "text-muted-foreground",
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className={`flex items-center text-xs ${changeColor[changeType]}`}>
            <TrendingUp className="mr-1 h-3 w-3" />
            {change}
          </div>
        )}
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const stats = [
    {
      title: "Treinos Completos",
      value: "12",
      change: "+2 esta semana",
      changeType: "positive" as const,
      icon: Dumbbell,
      progress: 80,
      description: "Meta: 15 treinos/mês",
    },
    {
      title: "Dias Ativos",
      value: "8",
      change: "+3 esta semana",
      changeType: "positive" as const,
      icon: Calendar,
      progress: 60,
      description: "Sequência atual: 5 dias",
    },
    {
      title: "Metas Alcançadas",
      value: "5",
      change: "2 esta semana",
      changeType: "positive" as const,
      icon: Target,
      progress: 100,
      description: "Parabéns! 🎉",
    },
    {
      title: "Progresso Geral",
      value: "+15%",
      change: "vs. mês anterior",
      changeType: "positive" as const,
      icon: TrendingUp,
      progress: 75,
      description: "Excelente evolução",
    },
    {
      title: "Calorias Queimadas",
      value: "2,340",
      change: "+180 hoje",
      changeType: "positive" as const,
      icon: Flame,
      progress: 65,
      description: "Meta diária: 3,500 cal",
    },
    {
      title: "Tempo de Treino",
      value: "4h 30m",
      change: "+45min esta semana",
      changeType: "positive" as const,
      icon: Clock,
      progress: 90,
      description: "Média: 45min/sessão",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}







