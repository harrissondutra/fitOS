'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Calendar, 
  UtensilsCrossed, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Eye,
  MessageSquare,
  BarChart3,
  Target,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function NutritionistDashboard() {
  const stats = [
    {
      title: "Clientes Ativos",
      value: "24",
      change: "+12%",
      trend: "up",
      icon: Users,
      color: "text-blue-600"
    },
    {
      title: "Consultas Hoje",
      value: "8",
      change: "+2",
      trend: "up",
      icon: Calendar,
      color: "text-green-600"
    },
    {
      title: "Planos Criados",
      value: "156",
      change: "+8%",
      trend: "up",
      icon: UtensilsCrossed,
      color: "text-purple-600"
    },
    {
      title: "Taxa de Sucesso",
      value: "94%",
      change: "+3%",
      trend: "up",
      icon: TrendingUp,
      color: "text-emerald-600"
    }
  ];

  const recentClients = [
    {
      id: 1,
      name: "Maria Silva",
      email: "maria@email.com",
      avatar: "/avatars/maria.jpg",
      lastConsultation: "2 dias atrás",
      status: "active",
      progress: 75,
      nextAppointment: "Amanhã 14:00"
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@email.com",
      avatar: "/avatars/joao.jpg",
      lastConsultation: "1 semana atrás",
      status: "active",
      progress: 60,
      nextAppointment: "Sexta 10:00"
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana@email.com",
      avatar: "/avatars/ana.jpg",
      lastConsultation: "3 dias atrás",
      status: "needs_attention",
      progress: 45,
      nextAppointment: "Hoje 16:00"
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      client: "Ana Costa",
      time: "16:00",
      type: "Consulta",
      status: "confirmed",
      notes: "Avaliação de progresso"
    },
    {
      id: 2,
      client: "Carlos Lima",
      time: "17:30",
      type: "Follow-up",
      status: "pending",
      notes: "Revisão do plano alimentar"
    },
    {
      id: 3,
      client: "Fernanda Oliveira",
      time: "18:00",
      type: "Primeira Consulta",
      status: "confirmed",
      notes: "Anamnese completa"
    }
  ];

  const quickActions = [
    {
      title: "Novo Cliente",
      description: "Cadastrar novo paciente",
      icon: Plus,
      color: "bg-blue-500",
      href: "/nutritionist/clients/new"
    },
    {
      title: "Criar Plano",
      description: "Novo plano alimentar",
      icon: UtensilsCrossed,
      color: "bg-green-500",
      href: "/nutritionist/meal-plans/new"
    },
    {
      title: "Agendar Consulta",
      description: "Marcar nova consulta",
      icon: Calendar,
      color: "bg-purple-500",
      href: "/nutritionist/consultations/new"
    },
    {
      title: "Ver Analytics",
      description: "Relatórios e métricas",
      icon: BarChart3,
      color: "bg-orange-500",
      href: "/nutritionist/analytics"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard Nutricional</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Visão geral da sua prática nutricional
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs sm:text-sm">
            <Clock className="w-3 h-3 mr-1" />
            <span className="hidden sm:inline">Última atualização: há 5 min</span>
            <span className="sm:hidden">há 5 min</span>
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{stat.change}</span> vs mês anterior
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="appointments">Agenda</TabsTrigger>
          <TabsTrigger value="actions">Ações Rápidas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Clientes Recentes
                </CardTitle>
                <CardDescription>
                  Últimos pacientes atendidos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentClients.map((client) => (
                  <div key={client.id} className="flex items-center space-x-4">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={client.avatar} />
                      <AvatarFallback>{client.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{client.name}</p>
                        <Badge 
                          variant={client.status === 'active' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {client.status === 'active' ? 'Ativo' : 'Atenção'}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progresso</span>
                          <span>{client.progress}%</span>
                        </div>
                        <Progress value={client.progress} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Próxima consulta: {client.nextAppointment}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Próximas Consultas
                </CardTitle>
                <CardDescription>
                  Agenda de hoje
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${
                        appointment.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{appointment.client}</p>
                        <Badge variant="outline" className="text-xs">
                          {appointment.time}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.notes}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Clientes</CardTitle>
              <CardDescription>
                Gerencie todos os seus pacientes nutricionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">24 Clientes Ativos</Badge>
                  <Badge variant="outline">8 Novos este mês</Badge>
                </div>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cliente
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use a aba "Clientes" para uma visão completa da gestão de pacientes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Consultas</CardTitle>
              <CardDescription>
                Gerencie sua agenda nutricional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">8 Consultas Hoje</Badge>
                  <Badge variant="outline">3 Pendentes</Badge>
                </div>
                <Button>
                  <Calendar className="w-4 h-4 mr-2" />
                  Nova Consulta
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use a aba "Consultas" para uma visão completa da agenda.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

