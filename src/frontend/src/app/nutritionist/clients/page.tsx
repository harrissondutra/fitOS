'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  MessageSquare,
  Calendar,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ClientsPage() {
  const clients = [
    {
      id: 1,
      name: "Maria Silva",
      email: "maria@email.com",
      phone: "(11) 99999-9999",
      avatar: "/avatars/maria.jpg",
      status: "active",
      joinDate: "15/01/2024",
      lastConsultation: "2 dias atrás",
      progress: 75,
      goals: ["Perda de peso", "Melhora da digestão"],
      nextAppointment: "Amanhã 14:00",
      totalConsultations: 8,
      adherence: 85
    },
    {
      id: 2,
      name: "João Santos",
      email: "joao@email.com",
      phone: "(11) 88888-8888",
      avatar: "/avatars/joao.jpg",
      status: "active",
      joinDate: "20/01/2024",
      lastConsultation: "1 semana atrás",
      progress: 60,
      goals: ["Ganho de massa muscular", "Melhora da performance"],
      nextAppointment: "Sexta 10:00",
      totalConsultations: 6,
      adherence: 92
    },
    {
      id: 3,
      name: "Ana Costa",
      email: "ana@email.com",
      phone: "(11) 77777-7777",
      avatar: "/avatars/ana.jpg",
      status: "needs_attention",
      joinDate: "10/02/2024",
      lastConsultation: "3 dias atrás",
      progress: 45,
      goals: ["Controle glicêmico", "Redução de inflamação"],
      nextAppointment: "Hoje 16:00",
      totalConsultations: 4,
      adherence: 65
    },
    {
      id: 4,
      name: "Carlos Lima",
      email: "carlos@email.com",
      phone: "(11) 66666-6666",
      avatar: "/avatars/carlos.jpg",
      status: "inactive",
      joinDate: "05/12/2023",
      lastConsultation: "1 mês atrás",
      progress: 30,
      goals: ["Perda de peso", "Melhora da qualidade do sono"],
      nextAppointment: "Não agendada",
      totalConsultations: 12,
      adherence: 45
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'needs_attention':
        return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="w-3 h-3 mr-1" />Atenção</Badge>;
      case 'inactive':
        return <Badge className="bg-red-100 text-red-800"><Clock className="w-3 h-3 mr-1" />Inativo</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const stats = [
    { title: "Total de Clientes", value: "24", icon: Users, color: "text-blue-600" },
    { title: "Clientes Ativos", value: "18", icon: CheckCircle, color: "text-green-600" },
    { title: "Precisam Atenção", value: "4", icon: AlertCircle, color: "text-yellow-600" },
    { title: "Inativos", value: "2", icon: Clock, color: "text-red-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie todos os seus pacientes nutricionais
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Cliente
        </Button>
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

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clientes</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar clientes..."
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
              <TabsTrigger value="all">Todos (24)</TabsTrigger>
              <TabsTrigger value="active">Ativos (18)</TabsTrigger>
              <TabsTrigger value="attention">Atenção (4)</TabsTrigger>
              <TabsTrigger value="inactive">Inativos (2)</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progresso</TableHead>
                      <TableHead>Última Consulta</TableHead>
                      <TableHead>Próxima Consulta</TableHead>
                      <TableHead>Adesão</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={client.avatar} />
                              <AvatarFallback>
                                {client.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{client.name}</div>
                              <div className="text-sm text-muted-foreground">{client.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(client.status)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{client.progress}%</span>
                            </div>
                            <Progress value={client.progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{client.lastConsultation}</div>
                          <div className="text-xs text-muted-foreground">
                            {client.totalConsultations} consultas
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{client.nextAppointment}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Activity className="w-3 h-3 text-muted-foreground" />
                            <span className="text-sm">{client.adherence}%</span>
                          </div>
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
                                Ver Perfil
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="mr-2 h-4 w-4" />
                                Mensagem
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Calendar className="mr-2 h-4 w-4" />
                                Agendar Consulta
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="active" className="space-y-4">
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Clientes Ativos</h3>
                <p className="text-muted-foreground">
                  Mostrando apenas clientes com status ativo
                </p>
              </div>
            </TabsContent>

            <TabsContent value="attention" className="space-y-4">
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Precisam de Atenção</h3>
                <p className="text-muted-foreground">
                  Clientes que precisam de acompanhamento especial
                </p>
              </div>
            </TabsContent>

            <TabsContent value="inactive" className="space-y-4">
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-red-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Clientes Inativos</h3>
                <p className="text-muted-foreground">
                  Clientes que não estão seguindo o tratamento
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
              Novo Cliente
            </CardTitle>
            <CardDescription>
              Cadastre um novo paciente nutricional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Cadastrar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Agendar Consultas
            </CardTitle>
            <CardDescription>
              Marque consultas para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Agendar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-purple-600" />
              Definir Metas
            </CardTitle>
            <CardDescription>
              Estabeleça objetivos para seus clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Definir</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


