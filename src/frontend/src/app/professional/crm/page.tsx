'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Users, Phone, Mail, Calendar, Target, TrendingUp, Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ClientProfile {
  id: string;
  clientId: string;
  leadSource?: string;
  status: 'prospect' | 'active' | 'at_risk' | 'inactive' | 'churned';
  lifetimeValue: number;
  lastContact: string;
  acquisitionDate: string;
  tags: string[];
  customFields: Record<string, any>;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  _count: {
    interactions: number;
    tasks: number;
  };
}

interface CRMTask {
  id: string;
  title: string;
  description?: string;
  type: 'follow_up' | 'call' | 'email' | 'meeting';
  dueDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  client: {
    client: {
      name: string;
    };
  };
}

interface CRMStats {
  totalClients: number;
  byStatus: Record<string, number>;
  byLeadSource: Record<string, number>;
  totalInteractions: number;
  totalTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  conversionRate: number;
}

const statusConfig = {
  prospect: { label: 'Prospect', color: 'bg-yellow-100 text-yellow-800', order: 0 },
  active: { label: 'Ativo', color: 'bg-green-100 text-green-800', order: 1 },
  at_risk: { label: 'Em Risco', color: 'bg-orange-100 text-orange-800', order: 2 },
  inactive: { label: 'Inativo', color: 'bg-muted text-muted-foreground', order: 3 },
  churned: { label: 'Perdido', color: 'bg-red-100 text-red-800', order: 4 }
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-800' },
  high: { label: 'Alta', color: 'bg-orange-100 text-orange-800' },
  urgent: { label: 'Urgente', color: 'bg-red-100 text-red-800' }
};

function SortableClientCard({ client, onUpdateStatus }: { client: ClientProfile; onUpdateStatus: (clientId: string, newStatus: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: client.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 bg-card rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-move ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-sm">{client.client.name}</h3>
            <p className="text-xs text-muted-foreground">{client.client.email}</p>
            {client.client.phone && (
              <p className="text-xs text-muted-foreground">{client.client.phone}</p>
            )}
          </div>
          <Badge className={statusConfig[client.status].color}>
            {statusConfig[client.status].label}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Valor Total:</span>
            <span className="font-medium">R$ {client.lifetimeValue.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Último Contato:</span>
            <span>{format(new Date(client.lastContact), 'dd/MM/yyyy')}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Interações:</span>
            <span>{client._count.interactions}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Tarefas:</span>
            <span>{client._count.tasks}</span>
          </div>
        </div>

        {client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {client.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {client.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{client.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" className="flex-1">
            <Phone className="h-3 w-3 mr-1" />
            Ligar
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Mail className="h-3 w-3 mr-1" />
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CRMPage() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [tasks, setTasks] = useState<CRMTask[]>([]);
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Form states
  const [clientFormData, setClientFormData] = useState({
    clientId: '',
    leadSource: '',
    status: 'prospect' as 'prospect' | 'active' | 'at_risk' | 'inactive' | 'churned',
    tags: [] as string[],
    customFields: {} as Record<string, any>
  });

  const [taskFormData, setTaskFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    type: 'follow_up' as 'follow_up' | 'call' | 'email' | 'meeting',
    dueDate: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent'
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClients(),
        loadTasks(),
        loadStats()
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const loadClients = async () => {
    try {
      const response = await fetch('/api/crm/clients');
      const data = await response.json();

      if (data.clients) {
        setClients(data.clients);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/crm/tasks');
      const data = await response.json();

      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      toast.error('Erro ao carregar tarefas');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/crm/stats');
      const data = await response.json();

      if (data.stats) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/crm/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clientFormData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cliente criado com sucesso!');
        setShowCreateClientDialog(false);
        setClientFormData({
          clientId: '',
          leadSource: '',
          status: 'prospect',
          tags: [],
          customFields: {}
        });
        loadClients();
      } else {
        toast.error(data.error || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      toast.error('Erro ao criar cliente');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskFormData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Tarefa criada com sucesso!');
        setShowCreateTaskDialog(false);
        setTaskFormData({
          clientId: '',
          title: '',
          description: '',
          type: 'follow_up',
          dueDate: '',
          priority: 'normal'
        });
        loadTasks();
      } else {
        toast.error(data.error || 'Erro ao criar tarefa');
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      toast.error('Erro ao criar tarefa');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const clientId = active.id as string;
    const newStatus = over.id as string;

    if (newStatus in statusConfig) {
      try {
        const response = await fetch(`/api/crm/clients/${clientId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (response.ok) {
          toast.success('Status atualizado com sucesso!');
          loadClients();
        } else {
          toast.error('Erro ao atualizar status');
        }
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        toast.error('Erro ao atualizar status');
      }
    }

    setActiveId(null);
  };

  const getFilteredClients = () => {
    return clients.filter(client => {
      const matchesSearch = client.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           client.client.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !filterStatus || client.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  };

  const getClientsByStatus = (status: string) => {
    return getFilteredClients().filter(client => client.status === status);
  };

  const getOverdueTasks = () => {
    return tasks.filter(task => 
      task.status === 'pending' && 
      new Date(task.dueDate) < new Date()
    );
  };

  const getUpcomingTasks = () => {
    return tasks.filter(task => 
      task.status === 'pending' && 
      new Date(task.dueDate) >= new Date()
    ).slice(0, 5);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Gerencie seu pipeline de clientes e acompanhe interações
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Tarefa CRM</DialogTitle>
                <DialogDescription>
                  Crie uma nova tarefa para acompanhar um cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select value={taskFormData.clientId} onValueChange={(value) => setTaskFormData({...taskFormData, clientId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={taskFormData.title}
                    onChange={(e) => setTaskFormData({...taskFormData, title: e.target.value})}
                    placeholder="Ex: Ligar para confirmar consulta"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={taskFormData.description}
                    onChange={(e) => setTaskFormData({...taskFormData, description: e.target.value})}
                    placeholder="Descrição da tarefa"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo</Label>
                    <Select value={taskFormData.type} onValueChange={(value: any) => setTaskFormData({...taskFormData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="call">Ligação</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Reunião</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Select value={taskFormData.priority} onValueChange={(value: any) => setTaskFormData({...taskFormData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={taskFormData.dueDate}
                    onChange={(e) => setTaskFormData({...taskFormData, dueDate: e.target.value})}
                    required
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateTaskDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Tarefa
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Novo Cliente CRM</DialogTitle>
                <DialogDescription>
                  Adicione um novo cliente ao seu pipeline
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientId">Cliente</Label>
                  <Select value={clientFormData.clientId} onValueChange={(value) => setClientFormData({...clientFormData, clientId: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Lista de membros seria carregada aqui */}
                      <SelectItem value="client1">João Silva</SelectItem>
                      <SelectItem value="client2">Maria Santos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="leadSource">Origem do Lead</Label>
                    <Input
                      id="leadSource"
                      value={clientFormData.leadSource}
                      onChange={(e) => setClientFormData({...clientFormData, leadSource: e.target.value})}
                      placeholder="Ex: Instagram, Indicação"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={clientFormData.status} onValueChange={(value: any) => setClientFormData({...clientFormData, status: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="prospect">Prospect</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="at_risk">Em Risco</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                        <SelectItem value="churned">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateClientDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Criar Cliente
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {stats.byStatus.active || 0} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Prospects → Ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas Pendentes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdueTasks} em atraso
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Interações</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInteractions}</div>
              <p className="text-xs text-muted-foreground">
                Total registradas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            {Object.entries(statusConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline Kanban */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-6">
          {Object.entries(statusConfig)
            .sort(([,a], [,b]) => a.order - b.order)
            .map(([status, config]) => (
            <div key={status} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">{config.label}</h3>
                <Badge variant="outline" className="text-xs">
                  {getClientsByStatus(status).length}
                </Badge>
              </div>
              <div className="space-y-3 min-h-[400px]">
                <SortableContext items={getClientsByStatus(status).map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {getClientsByStatus(status).map((client) => (
                    <SortableClientCard
                      key={client.id}
                      client={client}
                      onUpdateStatus={(clientId, newStatus) => {
                        // Implementar atualização de status
                      }}
                    />
                  ))}
                </SortableContext>
              </div>
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="p-4 bg-card rounded-lg border shadow-lg">
              <p className="font-semibold">Arrastando...</p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Tarefas em Atraso</CardTitle>
            <CardDescription>
              Tarefas que passaram da data de vencimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getOverdueTasks().length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma tarefa em atraso
              </p>
            ) : (
              <div className="space-y-3">
                {getOverdueTasks().slice(0, 5).map((task) => (
                  <div key={task.id} className="p-3 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {task.client.client.name}
                        </p>
                        <p className="text-xs text-red-600">
                          Venceu em {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Badge className={priorityConfig[task.priority].color}>
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Tarefas</CardTitle>
            <CardDescription>
              Tarefas pendentes para os próximos dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {getUpcomingTasks().length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma tarefa pendente
              </p>
            ) : (
              <div className="space-y-3">
                {getUpcomingTasks().map((task) => (
                  <div key={task.id} className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {task.client.client.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          Vence em {format(new Date(task.dueDate), 'dd/MM/yyyy')}
                        </p>
                      </div>
                      <Badge className={priorityConfig[task.priority].color}>
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
