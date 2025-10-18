'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Dumbbell, 
  Calendar, 
  Target,
  Activity,
  TrendingUp,
  UserCheck,
  Clock
} from 'lucide-react';

export default function TrainerDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Dumbbell className="h-8 w-8 text-orange-500" />
              <span className="text-2xl font-bold">Trainer Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel do Personal Trainer</h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes e monitore o progresso dos treinos.
          </p>
        </div>

        {/* Trainer Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos Hoje</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% em relação à semana passada
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horários Agendados</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Próximas 24h
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Objetivos Alcançados</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0/0</div>
              <p className="text-xs text-muted-foreground">
                Este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Trainer Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Clientes</CardTitle>
              <CardDescription>
                Monitore e gerencie seus clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Users className="mr-2 h-4 w-4" />
                Ver Clientes
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <UserCheck className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Activity className="mr-2 h-4 w-4" />
                Progresso dos Clientes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Planejamento de Treinos</CardTitle>
              <CardDescription>
                Crie e gerencie programas de treino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Dumbbell className="mr-2 h-4 w-4" />
                Criar Treino
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Calendar className="mr-2 h-4 w-4" />
                Agendar Sessão
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Clock className="mr-2 h-4 w-4" />
                Histórico de Treinos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Trainer Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle>Gestão de Clientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Controle completo sobre seus clientes e seus progressos.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Dumbbell className="h-5 w-5 text-green-500" />
                <CardTitle>Programas de Treino</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Crie treinos personalizados para cada cliente.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <CardTitle>Analytics de Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Acompanhe métricas e resultados dos seus clientes.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
