'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Home, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  Calendar,
  UtensilsCrossed,
  BookOpen,
  Activity,
  Zap,
  Apple,
  Beef,
  Wheat,
  Milk,
  Droplets
} from 'lucide-react';

export default function ClientDashboard() {
  const todayStats = {
    calories: { consumed: 1450, target: 2000, percentage: 72 },
    protein: { consumed: 95, target: 120, percentage: 79 },
    carbs: { consumed: 180, target: 200, percentage: 90 },
    fat: { consumed: 45, target: 70, percentage: 64 },
    fiber: { consumed: 18, target: 25, percentage: 72 },
    water: { consumed: 1800, target: 2500, percentage: 72 }
  };

  const progressData = {
    weight: { current: 68.5, start: 72.0, target: 65.0, change: -3.5 },
    bodyFat: { current: 22, start: 26, target: 18, change: -4 },
    muscle: { current: 28, start: 25, target: 30, change: 3 }
  };

  const recentMeals = [
    {
      id: 1,
      name: "Café da Manhã",
      time: "07:30",
      calories: 320,
      foods: ["Aveia", "Banana", "Leite desnatado"],
      status: "completed"
    },
    {
      id: 2,
      name: "Lanche da Manhã",
      time: "10:00",
      calories: 150,
      foods: ["Maçã", "Amêndoas"],
      status: "completed"
    },
    {
      id: 3,
      name: "Almoço",
      time: "12:30",
      calories: 580,
      foods: ["Frango grelhado", "Arroz integral", "Salada"],
      status: "completed"
    },
    {
      id: 4,
      name: "Lanche da Tarde",
      time: "15:00",
      calories: 200,
      foods: ["Iogurte grego"],
      status: "pending"
    },
    {
      id: 5,
      name: "Jantar",
      time: "19:00",
      calories: 0,
      foods: [],
      status: "pending"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      type: "Consulta",
      title: "Consulta com Dra. Maria",
      date: "Amanhã",
      time: "14:00",
      status: "confirmed"
    },
    {
      id: 2,
      type: "Lembrete",
      title: "Tomar suplemento",
      date: "Hoje",
      time: "20:00",
      status: "pending"
    },
    {
      id: 3,
      type: "Meta",
      title: "Meta semanal: 3kg perdidos",
      date: "Esta semana",
      time: "",
      status: "in_progress"
    }
  ];

  const quickActions = [
    {
      title: "Registrar Refeição",
      description: "Adicionar alimento ao diário",
      icon: Plus,
      color: "bg-blue-500",
      href: "/nutrition-client/diary"
    },
    {
      title: "Ver Meu Plano",
      description: "Consultar plano alimentar",
      icon: UtensilsCrossed,
      color: "bg-green-500",
      href: "/nutrition-client/meal-plan"
    },
    {
      title: "Agendar Consulta",
      description: "Marcar nova consulta",
      icon: Calendar,
      color: "bg-purple-500",
      href: "/nutrition-client/consultations"
    },
    {
      title: "Ver Progresso",
      description: "Acompanhar evolução",
      icon: TrendingUp,
      color: "bg-orange-500",
      href: "/nutrition-client/progress"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-green-600';
      case 'in_progress':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Dashboard Nutricional</h1>
          <p className="text-muted-foreground">
            Acompanhe seu progresso e mantenha-se no caminho certo
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Clock className="w-3 h-3 mr-1" />
            Última atualização: há 2 min
          </Badge>
        </div>
      </div>

      {/* Today's Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Progresso de Hoje
          </CardTitle>
          <CardDescription>
            Acompanhe suas metas nutricionais diárias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calorias</span>
                <span className="text-sm">{todayStats.calories.consumed}/{todayStats.calories.target}</span>
              </div>
              <Progress value={todayStats.calories.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {todayStats.calories.percentage}% da meta
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proteína</span>
                <span className="text-sm">{todayStats.protein.consumed}/{todayStats.protein.target}g</span>
              </div>
              <Progress value={todayStats.protein.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {todayStats.protein.percentage}% da meta
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Carboidratos</span>
                <span className="text-sm">{todayStats.carbs.consumed}/{todayStats.carbs.target}g</span>
              </div>
              <Progress value={todayStats.carbs.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {todayStats.carbs.percentage}% da meta
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gorduras</span>
                <span className="text-sm">{todayStats.fat.consumed}/{todayStats.fat.target}g</span>
              </div>
              <Progress value={todayStats.fat.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {todayStats.fat.percentage}% da meta
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fibras</span>
                <span className="text-sm">{todayStats.fiber.consumed}/{todayStats.fiber.target}g</span>
              </div>
              <Progress value={todayStats.fiber.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {todayStats.fiber.percentage}% da meta
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Água</span>
                <span className="text-sm">{todayStats.water.consumed}/{todayStats.water.target}ml</span>
              </div>
              <Progress value={todayStats.water.percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {todayStats.water.percentage}% da meta
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="meals">Refeições</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Meals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UtensilsCrossed className="w-5 h-5 mr-2" />
                  Refeições de Hoje
                </CardTitle>
                <CardDescription>
                  Suas refeições registradas hoje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentMeals.map((meal) => (
                  <div key={meal.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      {getStatusIcon(meal.status)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{meal.name}</h3>
                        <Badge variant="outline">{meal.time}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {meal.calories} kcal • {meal.foods.join(', ')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Resumo do Progresso
                </CardTitle>
                <CardDescription>
                  Sua evolução nas últimas semanas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peso</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{progressData.weight.current}kg</span>
                      <Badge variant="outline" className="text-green-600">
                        {progressData.weight.change > 0 ? '+' : ''}{progressData.weight.change}kg
                      </Badge>
                    </div>
                  </div>
                  <Progress value={((progressData.weight.start - progressData.weight.current) / (progressData.weight.start - progressData.weight.target)) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gordura Corporal</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{progressData.bodyFat}%</span>
                      <Badge variant="outline" className="text-green-600">
                        {progressData.bodyFat.change > 0 ? '+' : ''}{progressData.bodyFat.change}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={((progressData.bodyFat.start - progressData.bodyFat.current) / (progressData.bodyFat.start - progressData.bodyFat.target)) * 100} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Massa Muscular</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{progressData.muscle}%</span>
                      <Badge variant="outline" className="text-green-600">
                        +{progressData.muscle.change}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={(progressData.muscle.current / progressData.muscle.target) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="meals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diário Alimentar</CardTitle>
              <CardDescription>
                Gerencie suas refeições e alimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">5 Refeições Hoje</Badge>
                  <Badge variant="outline">1,450 kcal</Badge>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Refeição
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use a aba "Diário Alimentar" para uma visão completa das suas refeições.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progresso Detalhado</CardTitle>
              <CardDescription>
                Acompanhe sua evolução ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">-3.5kg em 4 semanas</Badge>
                  <Badge variant="outline">Meta: 65kg</Badge>
                </div>
                <Button>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Ver Gráficos
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use a aba "Progresso" para uma visão completa da sua evolução.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Próximos Eventos</CardTitle>
              <CardDescription>
                Consultas, lembretes e metas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{event.title}</h3>
                      <Badge variant="outline">{event.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {event.type} {event.time && `• ${event.time}`}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-lg">{action.title}</CardTitle>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full" variant="outline">
                Acessar
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
