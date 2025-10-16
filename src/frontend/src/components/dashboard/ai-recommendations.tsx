"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  Zap,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface Recommendation {
  id: string;
  type: "tip" | "goal" | "workout" | "nutrition";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  progress?: number;
  action?: string;
  icon: React.ComponentType<{ className?: string }>;
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    type: "tip",
    title: "Dica de Treino",
    description: "Considere aumentar a intensidade do seu treino de peito em 10% para melhorar os resultados",
    priority: "high",
    icon: Lightbulb,
    action: "Aplicar Sugestão",
  },
  {
    id: "2",
    type: "goal",
    title: "Meta Sugerida",
    description: "Tente completar 3 treinos de cardio esta semana para acelerar a perda de gordura",
    priority: "medium",
    progress: 66,
    icon: Target,
    action: "Definir Meta",
  },
  {
    id: "3",
    type: "workout",
    title: "Treino Personalizado",
    description: "Baseado no seu progresso, criei um treino de HIIT de 20 minutos para hoje",
    priority: "high",
    icon: Zap,
    action: "Iniciar Treino",
  },
  {
    id: "4",
    type: "nutrition",
    title: "Dica Nutricional",
    description: "Consuma 30g de proteína 30 minutos após o treino para otimizar a recuperação",
    priority: "low",
    icon: TrendingUp,
    action: "Ver Detalhes",
  },
];

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "tip":
        return "text-blue-600 dark:text-blue-400";
      case "goal":
        return "text-purple-600 dark:text-purple-400";
      case "workout":
        return "text-orange-600 dark:text-orange-400";
      case "nutrition":
        return "text-green-600 dark:text-green-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "Alta";
      case "medium":
        return "Média";
      case "low":
        return "Baixa";
      default:
        return priority;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-muted ${getTypeColor(recommendation.type)}`}>
              <recommendation.icon className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base">{recommendation.title}</CardTitle>
              <CardDescription className="text-sm">
                {recommendation.description}
              </CardDescription>
            </div>
          </div>
          <Badge className={getPriorityColor(recommendation.priority)}>
            {getPriorityText(recommendation.priority)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendation.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span>{recommendation.progress}%</span>
            </div>
            <Progress value={recommendation.progress} className="h-2" />
          </div>
        )}
        
        {recommendation.action && (
          <Button size="sm" className="w-full">
            {recommendation.action}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function AIRecommendations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Recomendações IA
              <Sparkles className="h-4 w-4 text-yellow-500" />
            </CardTitle>
            <CardDescription>
              Sugestões personalizadas baseadas no seu progresso
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            <Brain className="h-4 w-4 mr-2" />
            Consultar IA
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.id} recommendation={recommendation} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}







