'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Zap, 
  Plus, 
  Play, 
  Pause,
  Settings,
  Save,
  Eye,
  Edit,
  Trash2,
  Copy,
  MoreHorizontal,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Target,
  Filter,
  Search,
  ArrowRight,
  ArrowDown,
  Circle,
  Square,
  Diamond
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface WorkflowNode {
  id: string;
  type: 'trigger' | 'condition' | 'action' | 'delay';
  title: string;
  description: string;
  icon: any;
  color: string;
  position: { x: number; y: number };
  config: any;
}

interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
  condition?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
  executions: number;
  successRate: number;
}

export default function WorkflowBuilderPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: '1',
      name: 'Follow-up de Leads',
      description: 'Automação para follow-up de leads não qualificados',
      status: 'active',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          title: 'Novo Lead Criado',
          description: 'Quando um novo lead é adicionado',
          icon: Users,
          color: 'bg-blue-500',
          position: { x: 100, y: 100 },
          config: { triggerType: 'lead_created' }
        },
        {
          id: 'condition-1',
          type: 'condition',
          title: 'Lead Qualificado?',
          description: 'Verifica se o lead está qualificado',
          icon: Filter,
          color: 'bg-yellow-500',
          position: { x: 300, y: 100 },
          config: { condition: 'lead_qualified' }
        },
        {
          id: 'action-1',
          type: 'action',
          title: 'Enviar Email de Boas-vindas',
          description: 'Envia email automático de boas-vindas',
          icon: Mail,
          color: 'bg-green-500',
          position: { x: 500, y: 50 },
          config: { actionType: 'send_email', template: 'welcome' }
        },
        {
          id: 'delay-1',
          type: 'delay',
          title: 'Aguardar 24h',
          description: 'Aguarda 24 horas antes da próxima ação',
          icon: Clock,
          color: 'bg-purple-500',
          position: { x: 700, y: 50 },
          config: { delay: 24, unit: 'hours' }
        },
        {
          id: 'action-2',
          type: 'action',
          title: 'Enviar WhatsApp',
          description: 'Envia mensagem via WhatsApp',
          icon: MessageSquare,
          color: 'bg-green-500',
          position: { x: 900, y: 50 },
          config: { actionType: 'send_whatsapp', template: 'follow_up' }
        }
      ],
      connections: [
        { id: 'conn-1', from: 'trigger-1', to: 'condition-1' },
        { id: 'conn-2', from: 'condition-1', to: 'action-1', condition: 'yes' },
        { id: 'conn-3', from: 'action-1', to: 'delay-1' },
        { id: 'conn-4', from: 'delay-1', to: 'action-2' }
      ],
      createdAt: '15/01/2024',
      updatedAt: '10/02/2024',
      executions: 156,
      successRate: 94
    },
    {
      id: '2',
      name: 'Lembrete de Consulta',
      description: 'Envia lembretes automáticos de consultas',
      status: 'active',
      nodes: [
        {
          id: 'trigger-2',
          type: 'trigger',
          title: 'Consulta Agendada',
          description: 'Quando uma consulta é agendada',
          icon: Calendar,
          color: 'bg-blue-500',
          position: { x: 100, y: 100 },
          config: { triggerType: 'appointment_scheduled' }
        },
        {
          id: 'delay-2',
          type: 'delay',
          title: 'Aguardar 1 dia',
          description: 'Aguarda 1 dia antes do lembrete',
          icon: Clock,
          color: 'bg-purple-500',
          position: { x: 300, y: 100 },
          config: { delay: 1, unit: 'days' }
        },
        {
          id: 'action-3',
          type: 'action',
          title: 'Enviar Lembrete',
          description: 'Envia lembrete por email e WhatsApp',
          icon: Mail,
          color: 'bg-green-500',
          position: { x: 500, y: 100 },
          config: { actionType: 'send_reminder', channels: ['email', 'whatsapp'] }
        }
      ],
      connections: [
        { id: 'conn-5', from: 'trigger-2', to: 'delay-2' },
        { id: 'conn-6', from: 'delay-2', to: 'action-3' }
      ],
      createdAt: '20/01/2024',
      updatedAt: '08/02/2024',
      executions: 89,
      successRate: 98
    },
    {
      id: '3',
      name: 'Follow-up Pós-Consulta',
      description: 'Follow-up automático após consultas',
      status: 'draft',
      nodes: [
        {
          id: 'trigger-3',
          type: 'trigger',
          title: 'Consulta Concluída',
          description: 'Quando uma consulta é finalizada',
          icon: CheckCircle,
          color: 'bg-blue-500',
          position: { x: 100, y: 100 },
          config: { triggerType: 'appointment_completed' }
        },
        {
          id: 'delay-3',
          type: 'delay',
          title: 'Aguardar 3 dias',
          description: 'Aguarda 3 dias após a consulta',
          icon: Clock,
          color: 'bg-purple-500',
          position: { x: 300, y: 100 },
          config: { delay: 3, unit: 'days' }
        },
        {
          id: 'action-4',
          type: 'action',
          title: 'Enviar Feedback',
          description: 'Solicita feedback sobre a consulta',
          icon: MessageSquare,
          color: 'bg-green-500',
          position: { x: 500, y: 100 },
          config: { actionType: 'request_feedback', template: 'post_consultation' }
        }
      ],
      connections: [
        { id: 'conn-7', from: 'trigger-3', to: 'delay-3' },
        { id: 'conn-8', from: 'delay-3', to: 'action-4' }
      ],
      createdAt: '25/01/2024',
      updatedAt: '05/02/2024',
      executions: 0,
      successRate: 0
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

  const nodeTypes = [
    {
      type: 'trigger',
      title: 'Gatilho',
      description: 'Inicia o workflow',
      icon: Circle,
      color: 'bg-blue-500',
      examples: ['Novo Lead', 'Consulta Agendada', 'Pagamento Recebido']
    },
    {
      type: 'condition',
      title: 'Condição',
      description: 'Verifica uma condição',
      icon: Diamond,
      color: 'bg-yellow-500',
      examples: ['Lead Qualificado?', 'Cliente Ativo?', 'Valor > R$ 1000?']
    },
    {
      type: 'action',
      title: 'Ação',
      description: 'Executa uma ação',
      icon: Square,
      color: 'bg-green-500',
      examples: ['Enviar Email', 'Enviar WhatsApp', 'Criar Tarefa']
    },
    {
      type: 'delay',
      title: 'Atraso',
      description: 'Aguarda um tempo',
      icon: Clock,
      color: 'bg-purple-500',
      examples: ['Aguardar 1 hora', 'Aguardar 1 dia', 'Aguardar 1 semana']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />;
      case 'inactive':
        return <Pause className="w-3 h-3" />;
      case 'draft':
        return <Edit className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const renderWorkflowBuilder = () => {
    if (!selectedWorkflow) return null;

    return (
      <div className="space-y-4">
        {/* Workflow Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  {selectedWorkflow.name}
                </CardTitle>
                <CardDescription>{selectedWorkflow.description}</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(selectedWorkflow.status)}>
                  {getStatusIcon(selectedWorkflow.status)}
                  <span className="ml-1 capitalize">{selectedWorkflow.status}</span>
                </Badge>
                <Button variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button size="sm">
                  <Play className="w-4 h-4 mr-2" />
                  Testar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Workflow Canvas */}
        <Card>
          <CardHeader>
            <CardTitle>Canvas do Workflow</CardTitle>
            <CardDescription>
              Arraste e conecte os nós para criar sua automação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-96 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              {/* Workflow Nodes */}
              {selectedWorkflow.nodes.map((node) => (
                <div
                  key={node.id}
                  className={`absolute ${node.color} text-white p-3 rounded-lg shadow-lg cursor-move min-w-[150px]`}
                  style={{
                    left: node.position.x,
                    top: node.position.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <node.icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{node.title}</span>
                  </div>
                  <div className="text-xs opacity-90">{node.description}</div>
                </div>
              ))}

              {/* Workflow Connections */}
              {selectedWorkflow.connections.map((connection) => {
                const fromNode = selectedWorkflow.nodes.find(n => n.id === connection.from);
                const toNode = selectedWorkflow.nodes.find(n => n.id === connection.to);
                
                if (!fromNode || !toNode) return null;

                return (
                  <svg
                    key={connection.id}
                    className="absolute inset-0 pointer-events-none"
                    style={{ zIndex: 1 }}
                  >
                    <defs>
                      <marker
                        id={`arrowhead-${connection.id}`}
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3.5, 0 7"
                          fill="#6b7280"
                        />
                      </marker>
                    </defs>
                    <line
                      x1={fromNode.position.x + 75}
                      y1={fromNode.position.y}
                      x2={toNode.position.x - 75}
                      y2={toNode.position.y}
                      stroke="#6b7280"
                      strokeWidth="2"
                      markerEnd={`url(#arrowhead-${connection.id})`}
                    />
                  </svg>
                );
              })}

              {/* Empty State */}
              {selectedWorkflow.nodes.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Zap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      Workflow Vazio
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Adicione nós para começar a criar sua automação
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Primeiro Nó
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Node Library */}
        <Card>
          <CardHeader>
            <CardTitle>Biblioteca de Nós</CardTitle>
            <CardDescription>
              Arraste os nós para o canvas para criar seu workflow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {nodeTypes.map((nodeType) => (
                <div
                  key={nodeType.type}
                  className={`p-4 border rounded-lg cursor-move hover:shadow-md transition-shadow ${nodeType.color} text-white`}
                  draggable
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <nodeType.icon className="w-5 h-5" />
                    <span className="font-semibold">{nodeType.title}</span>
                  </div>
                  <div className="text-sm opacity-90 mb-3">{nodeType.description}</div>
                  <div className="text-xs opacity-75">
                    <div className="font-medium mb-1">Exemplos:</div>
                    {nodeType.examples.map((example, index) => (
                      <div key={index}>• {example}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Builder</h1>
          <p className="text-muted-foreground">
            Crie automações visuais para seu CRM
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button onClick={() => setIsBuilderOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Workflows</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workflows.length}</div>
            <p className="text-xs text-muted-foreground">
              {workflows.filter(w => w.status === 'active').length} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções Hoje</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workflows.reduce((sum, w) => sum + w.executions, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de execuções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Economizado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24h</div>
            <p className="text-xs text-muted-foreground">
              Por semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Builder or List */}
      {isBuilderOpen && selectedWorkflow ? (
        renderWorkflowBuilder()
      ) : (
        <div className="space-y-4">
          {/* Workflows List */}
          {workflows.map((workflow) => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      {workflow.name}
                    </CardTitle>
                    <CardDescription>{workflow.description}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(workflow.status)}>
                      {getStatusIcon(workflow.status)}
                      <span className="ml-1 capitalize">{workflow.status}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedWorkflow(workflow);
                        setIsBuilderOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Play className="mr-2 h-4 w-4" />
                          Executar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{workflow.nodes.length}</div>
                    <div className="text-sm text-muted-foreground">Nós</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{workflow.executions}</div>
                    <div className="text-sm text-muted-foreground">Execuções</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{workflow.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{workflow.updatedAt}</div>
                    <div className="text-sm text-muted-foreground">Última Atualização</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Novo Workflow
            </CardTitle>
            <CardDescription>
              Crie uma nova automação do zero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Workflow</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-green-600" />
              Templates
            </CardTitle>
            <CardDescription>
              Use templates prontos para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Ver Templates</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Configurações
            </CardTitle>
            <CardDescription>
              Configure integrações e limites
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
