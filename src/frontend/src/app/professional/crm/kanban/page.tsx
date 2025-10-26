'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DragDropContext, 
  Droppable, 
  Draggable,
  DropResult 
} from '@hello-pangea/dnd';
import { 
  Users, 
  Plus, 
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
  Filter,
  Search,
  Settings,
  BarChart3,
  Target,
  Zap
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Deal {
  id: string;
  title: string;
  client: string;
  value: number;
  probability: number;
  stage: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  nextAction?: string;
  notes?: string;
  tags: string[];
}

interface Pipeline {
  id: string;
  name: string;
  deals: Deal[];
  color: string;
}

export default function CRMKanbanPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([
    {
      id: 'lead',
      name: 'Lead',
      color: 'bg-gray-100',
      deals: [
        {
          id: '1',
          title: 'Consultoria Nutricional Empresarial',
          client: 'TechCorp Ltda',
          value: 15000,
          probability: 20,
          stage: 'lead',
          priority: 'high',
          createdAt: '2024-01-15',
          updatedAt: '2024-02-10',
          nextAction: 'Enviar proposta',
          notes: 'Empresa de 200 funcionários interessada em programa de bem-estar',
          tags: ['empresarial', 'grande-conta']
        },
        {
          id: '2',
          title: 'Plano Nutricional Individual',
          client: 'João Silva',
          value: 2500,
          probability: 30,
          stage: 'lead',
          priority: 'medium',
          createdAt: '2024-02-05',
          updatedAt: '2024-02-10',
          nextAction: 'Agendar consulta',
          notes: 'Interessado em perda de peso',
          tags: ['individual', 'perda-peso']
        }
      ]
    },
    {
      id: 'qualified',
      name: 'Qualificado',
      color: 'bg-blue-100',
      deals: [
        {
          id: '3',
          title: 'Programa de Nutrição Esportiva',
          client: 'Academia FitLife',
          value: 8000,
          probability: 60,
          stage: 'qualified',
          priority: 'high',
          createdAt: '2024-01-20',
          updatedAt: '2024-02-08',
          nextAction: 'Apresentar proposta detalhada',
          notes: 'Academia com 500 alunos, quer programa nutricional',
          tags: ['esportivo', 'academia']
        }
      ]
    },
    {
      id: 'proposal',
      name: 'Proposta',
      color: 'bg-yellow-100',
      deals: [
        {
          id: '4',
          title: 'Consultoria para Restaurante',
          client: 'Restaurante Sabor & Saúde',
          value: 5000,
          probability: 70,
          stage: 'proposal',
          priority: 'medium',
          createdAt: '2024-01-25',
          updatedAt: '2024-02-09',
          nextAction: 'Aguardando resposta',
          notes: 'Proposta enviada para criação de cardápio saudável',
          tags: ['restaurante', 'cardápio']
        }
      ]
    },
    {
      id: 'negotiation',
      name: 'Negociação',
      color: 'bg-orange-100',
      deals: [
        {
          id: '5',
          title: 'Plano Nutricional Familiar',
          client: 'Família Santos',
          value: 4000,
          probability: 80,
          stage: 'negotiation',
          priority: 'high',
          createdAt: '2024-01-30',
          updatedAt: '2024-02-11',
          nextAction: 'Reunião de negociação',
          notes: 'Família de 4 pessoas, negociando desconto',
          tags: ['familiar', 'negociação']
        }
      ]
    },
    {
      id: 'closed-won',
      name: 'Fechado',
      color: 'bg-green-100',
      deals: [
        {
          id: '6',
          title: 'Consultoria Nutricional Individual',
          client: 'Maria Oliveira',
          value: 3000,
          probability: 100,
          stage: 'closed-won',
          priority: 'medium',
          createdAt: '2024-01-10',
          updatedAt: '2024-02-01',
          nextAction: 'Iniciar consultas',
          notes: 'Cliente fechado, iniciando acompanhamento',
          tags: ['individual', 'fechado']
        }
      ]
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return;
    }

    const sourcePipeline = pipelines.find(p => p.id === source.droppableId);
    const destinationPipeline = pipelines.find(p => p.id === destination.droppableId);

    if (!sourcePipeline || !destinationPipeline) return;

    const deal = sourcePipeline.deals.find(d => d.id === draggableId);
    if (!deal) return;

    // Remove from source
    const newSourceDeals = Array.from(sourcePipeline.deals);
    newSourceDeals.splice(source.index, 1);

    // Add to destination
    const newDestinationDeals = Array.from(destinationPipeline.deals);
    newDestinationDeals.splice(destination.index, 0, {
      ...deal,
      stage: destination.droppableId,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    setPipelines(pipelines.map(pipeline => {
      if (pipeline.id === source.droppableId) {
        return { ...pipeline, deals: newSourceDeals };
      }
      if (pipeline.id === destination.droppableId) {
        return { ...pipeline, deals: newDestinationDeals };
      }
      return pipeline;
    }));
  };

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3" />;
      case 'medium':
        return <Clock className="w-3 h-3" />;
      case 'low':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculatePipelineValue = (deals: Deal[]) => {
    return deals.reduce((sum, deal) => sum + deal.value, 0);
  };

  const calculatePipelineProbability = (deals: Deal[]) => {
    if (deals.length === 0) return 0;
    const weightedSum = deals.reduce((sum, deal) => sum + (deal.value * deal.probability), 0);
    const totalValue = deals.reduce((sum, deal) => sum + deal.value, 0);
    return totalValue > 0 ? Math.round(weightedSum / totalValue) : 0;
  };

  const filteredPipelines = pipelines.map(pipeline => ({
    ...pipeline,
    deals: pipeline.deals.filter(deal => {
      const matchesSearch = deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           deal.client.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || deal.priority === filterPriority;
      return matchesSearch && matchesPriority;
    })
  }));

  const totalValue = pipelines.reduce((sum, pipeline) => sum + calculatePipelineValue(pipeline.deals), 0);
  const totalDeals = pipelines.reduce((sum, pipeline) => sum + pipeline.deals.length, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM - Kanban Board</h1>
          <p className="text-muted-foreground">
            Gerencie seus leads e oportunidades de negócio
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
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
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24%</div>
            <p className="text-xs text-muted-foreground">
              Lead para cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 dias</div>
            <p className="text-xs text-muted-foreground">
              Lead para fechamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar leads, clientes, valores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="high">Alta Prioridade</option>
                <option value="medium">Média Prioridade</option>
                <option value="low">Baixa Prioridade</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {filteredPipelines.map((pipeline) => (
            <div key={pipeline.id} className="flex-shrink-0 w-80">
              <Card>
                <CardHeader className={`${pipeline.color} rounded-t-lg`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <CardDescription>
                        {pipeline.deals.length} leads • {formatCurrency(calculatePipelineValue(pipeline.deals))}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {calculatePipelineProbability(pipeline.deals)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Probabilidade
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Droppable droppableId={pipeline.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[400px] p-4 space-y-3 ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {pipeline.deals.map((deal, index) => (
                          <Draggable key={deal.id} draggableId={deal.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-4 bg-white border rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                }`}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <h3 className="font-semibold text-sm line-clamp-2">
                                      {deal.title}
                                    </h3>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-6 w-6 p-0">
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
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-blue-600">
                                        {deal.client}
                                      </span>
                                      <Badge className={getPriorityColor(deal.priority)}>
                                        {getPriorityIcon(deal.priority)}
                                        <span className="ml-1 capitalize">{deal.priority}</span>
                                      </Badge>
                                    </div>

                                    <div className="flex items-center justify-between">
                                      <span className="text-lg font-bold text-green-600">
                                        {formatCurrency(deal.value)}
                                      </span>
                                      <span className="text-sm text-muted-foreground">
                                        {deal.probability}%
                                      </span>
                                    </div>

                                    {deal.nextAction && (
                                      <div className="text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3 inline mr-1" />
                                        {deal.nextAction}
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-1">
                                      {deal.tags.map((tag, tagIndex) => (
                                        <Badge key={tagIndex} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {pipeline.deals.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="mx-auto h-8 w-8 mb-2" />
                            <p className="text-sm">Nenhum lead nesta etapa</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Novo Lead
            </CardTitle>
            <CardDescription>
              Adicione um novo lead ao pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Lead</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Relatórios CRM
            </CardTitle>
            <CardDescription>
              Análise de performance do pipeline
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
              Configure automações do CRM
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
