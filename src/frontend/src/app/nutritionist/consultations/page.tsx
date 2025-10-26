'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Video,
  Phone,
  FileText,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingUp,
  Star,
  MessageCircle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ConsultationsPage() {
  const consultations = [
    {
      id: 1,
      client: "Maria Silva",
      clientAvatar: "/avatars/maria.jpg",
      type: "Primeira Consulta",
      status: "scheduled",
      date: "Hoje",
      time: "16:00",
      duration: 60,
      notes: "Anamnese completa e avaliação inicial",
      rating: null,
      followUp: false
    },
    {
      id: 2,
      client: "João Santos",
      clientAvatar: "/avatars/joao.jpg",
      type: "Follow-up",
      status: "completed",
      date: "Ontem",
      time: "14:00",
      duration: 45,
      notes: "Avaliação de progresso e ajuste do plano",
      rating: 5,
      followUp: true
    },
    {
      id: 3,
      client: "Ana Costa",
      clientAvatar: "/avatars/ana.jpg",
      type: "Consulta de Emergência",
      status: "cancelled",
      date: "Ontem",
      time: "10:00",
      duration: 30,
      notes: "Cliente cancelou por motivos pessoais",
      rating: null,
      followUp: false
    },
    {
      id: 4,
      client: "Carlos Lima",
      clientAvatar: "/avatars/carlos.jpg",
      type: "Consulta Online",
      status: "completed",
      date: "2 dias atrás",
      time: "15:30",
      duration: 50,
      notes: "Consulta via videochamada - revisão do plano",
      rating: 4,
      followUp: true
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />Agendada</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluída</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />Cancelada</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Em Andamento</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Primeira Consulta':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'Follow-up':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'Consulta Online':
        return <Video className="w-4 h-4 text-purple-600" />;
      case 'Consulta de Emergência':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" />;
    }
  };

  const stats = [
    { title: "Consultas Hoje", value: "8", icon: Calendar, color: "text-blue-600" },
    { title: "Concluídas", value: "6", icon: CheckCircle, color: "text-green-600" },
    { title: "Pendentes", value: "2", icon: Clock, color: "text-yellow-600" },
    { title: "Avaliação Média", value: "4.8", icon: Star, color: "text-orange-600" }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      client: "Ana Costa",
      time: "16:00",
      type: "Primeira Consulta",
      status: "confirmed"
    },
    {
      id: 2,
      client: "Carlos Lima",
      time: "17:30",
      type: "Follow-up",
      status: "confirmed"
    },
    {
      id: 3,
      client: "Fernanda Oliveira",
      time: "18:00",
      type: "Consulta Online",
      status: "pending"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Consultas</h1>
          <p className="text-muted-foreground">
            Gerencie suas consultas nutricionais
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Agenda
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Consulta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Agenda de Hoje
          </CardTitle>
          <CardDescription>
            Próximas consultas agendadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    appointment.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{appointment.client}</h3>
                    <Badge variant="outline">{appointment.time}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{appointment.type}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Consultations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Histórico de Consultas</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar consultas..."
                  className="w-80 pl-10"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">Todas (24)</TabsTrigger>
              <TabsTrigger value="today">Hoje (8)</TabsTrigger>
              <TabsTrigger value="completed">Concluídas (18)</TabsTrigger>
              <TabsTrigger value="pending">Pendentes (4)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultations.map((consultation) => (
                      <TableRow key={consultation.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={consultation.clientAvatar} />
                              <AvatarFallback>
                                {consultation.client.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{consultation.client}</div>
                              <div className="text-sm text-muted-foreground">
                                {consultation.notes}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(consultation.type)}
                            <span className="text-sm">{consultation.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{consultation.date}</div>
                            <div className="text-muted-foreground">{consultation.time}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{consultation.duration} min</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(consultation.status)}
                        </TableCell>
                        <TableCell>
                          {consultation.rating ? (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3 text-yellow-500 fill-current" />
                              <span className="text-sm">{consultation.rating}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <FileText className="mr-2 h-4 w-4" />
                                Relatório
                              </DropdownMenuItem>
                              {consultation.status === 'scheduled' && (
                                <DropdownMenuItem>
                                  <Video className="mr-2 h-4 w-4" />
                                  Iniciar Consulta
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="today" className="space-y-4">
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Consultas de Hoje</h3>
                <p className="text-muted-foreground">
                  {upcomingAppointments.length} consultas agendadas para hoje
                </p>
              </div>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Consultas Concluídas</h3>
                <p className="text-muted-foreground">
                  Histórico de consultas finalizadas
                </p>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Consultas Pendentes</h3>
                <p className="text-muted-foreground">
                  Consultas aguardando confirmação
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Nova Consulta
            </CardTitle>
            <CardDescription>
              Agendar nova consulta nutricional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Agendar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Video className="w-5 h-5 mr-2 text-green-600" />
              Consulta Online
            </CardTitle>
            <CardDescription>
              Iniciar consulta por videochamada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Iniciar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-purple-600" />
              Relatórios
            </CardTitle>
            <CardDescription>
              Gerar relatórios de consultas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Gerar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
