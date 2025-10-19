'use client';

// Desabilitar pre-rendering estático para esta página

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toastUtils } from '@/lib/toast-utils';
import { 
  Dumbbell, 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  // ArrowRight, 
  Play, 
  Calendar, 
  Target, 
  TrendingUp 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de controle FitOS
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <Button variant="ghost" onClick={() => router.push('/auth/login')}>
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos Hoje</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calorias Queimadas</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tempo de Treino</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0min</div>
              <p className="text-xs text-muted-foreground">
                +0% em relação ao mês passado
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0/5</div>
              <p className="text-xs text-muted-foreground">
                +0% em relação ao mês passado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>
                Comece seu treino ou explore recursos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => toastUtils.comingSoon('Treinos personalizados')}>
                <Play className="mr-2 h-4 w-4" />
                Iniciar Treino
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
                <Brain className="mr-2 h-4 w-4" />
                Recomendações IA
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Ver Estatísticas
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos Passos</CardTitle>
              <CardDescription>
                Configure sua conta para começar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-sm">Complete seu perfil</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Configure seus objetivos</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-muted rounded-full"></div>
                <span className="text-sm text-muted-foreground">Adicione suas medidas</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-blue-500" />
                <CardTitle>Personal Trainer IA</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Receba recomendações personalizadas de treinos alimentadas por IA.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <CardTitle>Multi-Inquilino</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Perfeito para academias e personal trainers.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <CardTitle>Analytics</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acompanhe seu progresso com insights detalhados.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}