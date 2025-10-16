"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Play,
  Brain,
  BarChart3,
  Users,
  Target,
  Calendar,
  Plus,
  Dumbbell,
  Activity,
  Timer,
  Sparkles,
} from "lucide-react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  action: string;
  badge?: string;
  isNew?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: "1",
    title: "Iniciar Treino",
    description: "Comece um treino personalizado",
    icon: Play,
    color: "bg-green-500 hover:bg-green-600",
    action: "Iniciar",
    badge: "Popular",
  },
  {
    id: "2",
    title: "Consultar IA",
    description: "Peça sugestões ao personal trainer IA",
    icon: Brain,
    color: "bg-purple-500 hover:bg-purple-600",
    action: "Consultar",
    isNew: true,
  },
  {
    id: "3",
    title: "Ver Analytics",
    description: "Acompanhe seu progresso detalhado",
    icon: BarChart3,
    color: "bg-blue-500 hover:bg-blue-600",
    action: "Ver",
  },
  {
    id: "4",
    title: "Comunidade",
    description: "Conecte-se com outros usuários",
    icon: Users,
    color: "bg-orange-500 hover:bg-orange-600",
    action: "Entrar",
  },
  {
    id: "5",
    title: "Definir Meta",
    description: "Estabeleça novos objetivos",
    icon: Target,
    color: "bg-pink-500 hover:bg-pink-600",
    action: "Definir",
  },
  {
    id: "6",
    title: "Agendar Treino",
    description: "Programe seus próximos treinos",
    icon: Calendar,
    color: "bg-indigo-500 hover:bg-indigo-600",
    action: "Agendar",
  },
];

function QuickActionCard({ action }: { action: QuickAction }) {
  return (
    <Card className="hover:shadow-md transition-all duration-200 hover:scale-105 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
            <action.icon className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{action.title}</h3>
              {action.badge && (
                <Badge variant="secondary" className="text-xs">
                  {action.badge}
                </Badge>
              )}
              {action.isNew && (
                <Badge variant="default" className="text-xs bg-yellow-500 hover:bg-yellow-600">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Novo
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{action.description}</p>
            <Button size="sm" className="w-full">
              {action.action}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>
          Acesso rápido às funcionalidades principais
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {quickActions.map((action) => (
            <QuickActionCard key={action.id} action={action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}







