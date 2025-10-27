'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Target,
  Phone,
  Mail,
  MapPin,
  FileText,
  Star,
  Zap
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function CRMDealsPage() {
  const deals = [
    {
      id: 1,
      title: "Consultoria Nutricional Empresarial",
      client: "TechCorp Ltda",
      value: 15000,
      probability: 20,
      stage: "Lead",
      priority: "high",
      createdAt: "15/01/2024",
      updatedAt: "10/02/2024",
      nextAction: "Enviar proposta",
      nextActionDate: "12/02/2024",
      owner: "Dra. Maria Silva",
      source: "Website",
      tags: ["empresarial", "grande-conta"],
      notes: "Empresa de 200 funcionários interessada em programa de bem-estar",
      contact: {
        name: "João Santos",
        email: "joao@techcorp.com",
        phone: "(11) 99999-9999",
        position: "RH Manager"
      }
    },
    {
      id: 2,
      title: "Plano Nutricional Individual",
      client: "João Silva",
      value: 2500,
      probability: 30,
      stage: "Lead",
      priority: "medium",
      createdAt: "05/02/2024",
      updatedAt: "10/02/2024",
      nextAction: "Agendar consulta",
      nextActionDate: "15/02/2024",
      owner: "Dra. Maria Silva",
      source: "Indicação",
      tags: ["individual", "perda-peso"],
      notes: "Interessado em perda de peso",
      contact: {
        name: "João Silva",
        email: "joao@email.com",
        phone: "(11) 88888-8888",
        position: "Cliente"
      }
    },
    {
      id: 3,
      title: "Programa de Nutrição Esportiva",
      client: "Academia FitLife",
      value: 8000,
      probability: 60,
      stage: "Qualificado",
      priority: "high",
      createdAt: "20/01/2024",
      updatedAt: "08/02/2024",
      nextAction: "Apresentar proposta detalhada",
      nextActionDate: "14/02/2024",
      owner: "Dra. Maria Silva",
      source: "Evento",
      tags: ["esportivo", "academia"],
      notes: "Academia com 500 alunos, quer programa nutricional",
      contact: {
        name: "Carlos Lima",
        email: "carlos@fitlife.com",
        phone: "(11) 77777-7777",
        position: "Diretor"
      }
    },
    {
      id: 4,
      title: "Consultoria para Restaurante",
      client: "Restaurante Sabor & Saúde",
      value: 5000,
      probability: 70,
      stage: "Proposta",
      priority: "medium",
      createdAt: "25/01/2024",
      updatedAt: "09/02/2024",
      nextAction: "Aguardando resposta",
      nextActionDate: "16/02/2024",
      owner: "Dra. Maria Silva",
      source: "LinkedIn",
      tags: ["restaurante", "cardápio"],
      notes: "Proposta enviada para criação de cardápio saudável",
      contact: {
        name: "Ana Costa",
        email: "ana@sabor.com",
        phone: "(11) 66666-6666",
        position: "Chef"
      }
    },
    {
      id: 5,
      title: "Plano Nutricional Familiar",
      client: "Família Santos",
      value: 4000,
      probability: 80,
      stage: "Negociação",
      priority: "high",
      createdAt: "30/01/2024",
      updatedAt: "11/02/2024",
      nextAction: "Reunião de negociação",
      nextActionDate: "13/02/2024",
      owner: "Dra. Maria Silva",
      source: "Indicação",
      tags: ["familiar", "negociação"],
      notes: "Família de 4 pessoas, negociando desconto",
      contact: {
        name: "Maria Santos",
        email: "maria@santos.com",
        phone: "(11) 55555-5555",
        position: "Mãe"
      }
    },
    {
      id: 6,
      title: "Consultoria Nutricional Individual",
      client: "Maria Oliveira",
      value: 3000,
      probability: 100,
      stage: "Fechado",
      priority: "medium",
      createdAt: "10/01/2024",
      updatedAt: "01/02/2024",
      nextAction: "Iniciar consultas",
      nextActionDate: "15/02/2024",
      owner: "Dra. Maria Silva",
      source: "Website",
      tags: ["individual", "fechado"],
      notes: "Cliente fechado, iniciando acompanhamento",
      contact: {
        name: "Maria Oliveira",
        email: "maria@oliveira.com",
        phone: "(11) 44444-4444",
        position: "Cliente"
      }
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'Lead':
        return 'bg-gray-100 text-gray-800';
      case 'Qualificado':
        return 'bg-blue-100 text-blue-800';
      case 'Proposta':
        return 'bg-yellow-100 text-yellow-800';
      case 'Negociação':
        return 'bg-orange-100 text-orange-800';
      case 'Fechado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const closedValue = deals.filter(deal => deal.stage === 'Fechado').reduce((sum, deal) => sum + deal.value, 0);
  const avgDealSize = totalValue / deals.length;
  const conversionRate = (deals.filter(deal => deal.stage === 'Fechado').length / deals.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Deals</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e oportunidades de negócio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Deal
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Deals</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deals.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
            <p className="text-xs text-muted-foreground">
              Pipeline ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Fechado</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(closedValue)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((closedValue / totalValue) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(conversionRate)}%</div>
            <p className="text-xs text-muted-foreground">
              Lead para cliente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar deals, clientes, valores..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todas as Etapas</option>
                <option>Lead</option>
                <option>Qualificado</option>
                <option>Proposta</option>
                <option>Negociação</option>
                <option>Fechado</option>
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todas as Prioridades</option>
                <option>Alta</option>
                <option>Média</option>
                <option>Baixa</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals Table */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">Todos ({deals.length})</TabsTrigger>
          <TabsTrigger value="active">Ativos ({deals.filter(d => d.stage !== 'Fechado').length})</TabsTrigger>
          <TabsTrigger value="closed">Fechados ({deals.filter(d => d.stage === 'Fechado').length})</TabsTrigger>
          <TabsTrigger value="high-priority">Alta Prioridade ({deals.filter(d => d.priority === 'high').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Probabilidade</TableHead>
                    <TableHead>Próxima Ação</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Criado em {deal.createdAt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.client}</div>
                          <div className="text-sm text-muted-foreground">
                            {deal.contact.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(deal.value)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={deal.probability} className="w-16 h-2" />
                          <span className="text-sm">{deal.probability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{deal.nextAction}</div>
                          <div className="text-xs text-muted-foreground">
                            {deal.nextActionDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(deal.priority)}>
                          {deal.priority}
                        </Badge>
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
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Enviar Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Agendar Reunião
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Phone className="mr-2 h-4 w-4" />
                              Ligar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Probabilidade</TableHead>
                    <TableHead>Próxima Ação</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.filter(deal => deal.stage !== 'Fechado').map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Criado em {deal.createdAt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.client}</div>
                          <div className="text-sm text-muted-foreground">
                            {deal.contact.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(deal.value)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={deal.probability} className="w-16 h-2" />
                          <span className="text-sm">{deal.probability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{deal.nextAction}</div>
                          <div className="text-xs text-muted-foreground">
                            {deal.nextActionDate}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(deal.priority)}>
                          {deal.priority}
                        </Badge>
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
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Enviar Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Agendar Reunião
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Data de Fechamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima Ação</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.filter(deal => deal.stage === 'Fechado').map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Criado em {deal.createdAt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.client}</div>
                          <div className="text-sm text-muted-foreground">
                            {deal.contact.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">{formatCurrency(deal.value)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{deal.updatedAt}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Fechado
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{deal.nextAction}</div>
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
                              <FileText className="mr-2 h-4 w-4" />
                              Gerar Contrato
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="high-priority" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Etapa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Probabilidade</TableHead>
                    <TableHead>Próxima Ação</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.filter(deal => deal.priority === 'high').map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.title}</div>
                          <div className="text-sm text-muted-foreground">
                            Criado em {deal.createdAt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{deal.client}</div>
                          <div className="text-sm text-muted-foreground">
                            {deal.contact.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStageColor(deal.stage)}>
                          {deal.stage}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{formatCurrency(deal.value)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={deal.probability} className="w-16 h-2" />
                          <span className="text-sm">{deal.probability}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{deal.nextAction}</div>
                          <div className="text-xs text-muted-foreground">
                            {deal.nextActionDate}
                          </div>
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
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Enviar Mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="mr-2 h-4 w-4" />
                              Agendar Reunião
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Novo Deal
            </CardTitle>
            <CardDescription>
              Adicione um novo lead ao pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Deal</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-green-600" />
              Relatórios de Vendas
            </CardTitle>
            <CardDescription>
              Análise de performance dos deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Ver Relatórios</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              Automações
            </CardTitle>
            <CardDescription>
              Configure automações para deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Configurar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

