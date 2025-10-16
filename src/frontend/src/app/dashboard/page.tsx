'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { DashboardLayout } from '@/components/dashboard/sidebar';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { RecentWorkouts } from '@/components/dashboard/recent-workouts';
import { AIRecommendations } from '@/components/dashboard/ai-recommendations';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { WeeklyProgress } from '@/components/dashboard/weekly-progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dumbbell, 
  Brain, 
  Users, 
  BarChart3, 
  Zap, 
  ArrowRight,
  Play,
  Calendar,
  Target,
  TrendingUp,
  Activity,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Bem-vindo de volta, {user.firstName}! 👋
            </h1>
            <p className="text-muted-foreground">
              Aqui está um resumo do seu progresso e próximos passos.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden sm:inline-flex">
              <Activity className="mr-1 h-3 w-3" />
              Online
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8">
        <StatsCards />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recent Workouts */}
        <div className="lg:col-span-2">
          <RecentWorkouts />
        </div>

        {/* Quick Actions */}
        <div>
          <QuickActions />
        </div>
      </div>

      {/* Secondary Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Recommendations */}
        <div>
          <AIRecommendations />
        </div>

        {/* Weekly Progress */}
        <div>
          <WeeklyProgress />
        </div>
      </div>

      {/* Bottom Section - Additional Features */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Recursos em Destaque
            </CardTitle>
            <CardDescription>
              Explore as funcionalidades mais populares da plataforma
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold">Personal Trainer IA</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Receba treinos personalizados e sugestões inteligentes baseadas no seu progresso.
                </p>
                <Button size="sm" variant="outline">
                  Experimentar
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="font-semibold">Comunidade</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Conecte-se com outros usuários, participe de desafios e compartilhe conquistas.
                </p>
                <Button size="sm" variant="outline">
                  Entrar
                </Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <h3 className="font-semibold">Analytics Avançado</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  Acompanhe seu progresso com gráficos detalhados e relatórios personalizados.
                </p>
                <Button size="sm" variant="outline">
                  Ver Analytics
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
