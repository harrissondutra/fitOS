'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Zap, 
  Plus, 
  Copy,
  Eye,
  Star,
  Users,
  Mail,
  MessageSquare,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Filter,
  Search,
  Download,
  ArrowRight,
  Circle,
  Square,
  Diamond
} from 'lucide-react';

export default function WorkflowTemplatesPage() {
  const templates = [
    {
      id: '1',
      name: 'Follow-up de Leads',
      description: 'Automação completa para follow-up de leads não qualificados',
      category: 'Leads',
      difficulty: 'Fácil',
      estimatedTime: '5 min',
      nodes: 5,
      executions: 1250,
      rating: 4.8,
      isPopular: true,
      isFree: true,
      tags: ['leads', 'follow-up', 'email', 'whatsapp'],
      preview: [
        { type: 'trigger', title: 'Novo Lead Criado', icon: Circle, color: 'bg-blue-500' },
        { type: 'condition', title: 'Lead Qualificado?', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'action', title: 'Enviar Email', icon: Square, color: 'bg-green-500' },
        { type: 'delay', title: 'Aguardar 24h', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Enviar WhatsApp', icon: Square, color: 'bg-green-500' }
      ],
      features: [
        'Email de boas-vindas automático',
        'Follow-up via WhatsApp',
        'Segmentação por qualificação',
        'Relatórios de engajamento'
      ]
    },
    {
      id: '2',
      name: 'Lembrete de Consultas',
      description: 'Sistema completo de lembretes para consultas agendadas',
      category: 'Agendamento',
      difficulty: 'Fácil',
      estimatedTime: '3 min',
      nodes: 3,
      executions: 890,
      rating: 4.9,
      isPopular: true,
      isFree: true,
      tags: ['agendamento', 'lembretes', 'email', 'whatsapp'],
      preview: [
        { type: 'trigger', title: 'Consulta Agendada', icon: Circle, color: 'bg-blue-500' },
        { type: 'delay', title: 'Aguardar 1 dia', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Enviar Lembrete', icon: Square, color: 'bg-green-500' }
      ],
      features: [
        'Lembrete 24h antes da consulta',
        'Confirmação de presença',
        'Instruções pré-consulta',
        'Integração com calendário'
      ]
    },
    {
      id: '3',
      name: 'Follow-up Pós-Consulta',
      description: 'Automação para acompanhamento após consultas',
      category: 'Clientes',
      difficulty: 'Médio',
      estimatedTime: '8 min',
      nodes: 6,
      executions: 567,
      rating: 4.7,
      isPopular: false,
      isFree: true,
      tags: ['pós-consulta', 'feedback', 'acompanhamento'],
      preview: [
        { type: 'trigger', title: 'Consulta Concluída', icon: Circle, color: 'bg-blue-500' },
        { type: 'delay', title: 'Aguardar 3 dias', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Solicitar Feedback', icon: Square, color: 'bg-green-500' },
        { type: 'condition', title: 'Feedback Recebido?', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'action', title: 'Enviar Agradecimento', icon: Square, color: 'bg-green-500' },
        { type: 'action', title: 'Agendar Próxima', icon: Square, color: 'bg-green-500' }
      ],
      features: [
        'Solicitação automática de feedback',
        'Agradecimento personalizado',
        'Agendamento da próxima consulta',
        'Análise de satisfação'
      ]
    },
    {
      id: '4',
      name: 'Onboarding de Clientes',
      description: 'Sequência completa de onboarding para novos clientes',
      category: 'Clientes',
      difficulty: 'Avançado',
      estimatedTime: '15 min',
      nodes: 8,
      executions: 234,
      rating: 4.6,
      isPopular: false,
      isFree: false,
      tags: ['onboarding', 'bem-vindas', 'educação'],
      preview: [
        { type: 'trigger', title: 'Cliente Cadastrado', icon: Circle, color: 'bg-blue-500' },
        { type: 'action', title: 'Email de Boas-vindas', icon: Square, color: 'bg-green-500' },
        { type: 'delay', title: 'Aguardar 1 dia', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Enviar Guia', icon: Square, color: 'bg-green-500' },
        { type: 'delay', title: 'Aguardar 3 dias', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Solicitar Anamnese', icon: Square, color: 'bg-green-500' },
        { type: 'condition', title: 'Anamnese Completa?', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'action', title: 'Agendar Consulta', icon: Square, color: 'bg-green-500' }
      ],
      features: [
        'Sequência de boas-vindas',
        'Envio de materiais educativos',
        'Solicitação de anamnese',
        'Agendamento automático'
      ]
    },
    {
      id: '5',
      name: 'Recuperação de Churn',
      description: 'Sistema para recuperar clientes inativos',
      category: 'Retenção',
      difficulty: 'Avançado',
      estimatedTime: '12 min',
      nodes: 7,
      executions: 156,
      rating: 4.5,
      isPopular: false,
      isFree: false,
      tags: ['retenção', 'churn', 'recuperação'],
      preview: [
        { type: 'trigger', title: 'Cliente Inativo', icon: Circle, color: 'bg-blue-500' },
        { type: 'condition', title: 'Tempo Inativo > 30 dias?', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'action', title: 'Email de Reengajamento', icon: Square, color: 'bg-green-500' },
        { type: 'delay', title: 'Aguardar 1 semana', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Oferta Especial', icon: Square, color: 'bg-green-500' },
        { type: 'delay', title: 'Aguardar 2 semanas', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Contato Telefônico', icon: Square, color: 'bg-green-500' }
      ],
      features: [
        'Detecção automática de inatividade',
        'Sequência de reengajamento',
        'Ofertas especiais',
        'Contato telefônico'
      ]
    },
    {
      id: '6',
      name: 'Upsell de Serviços',
      description: 'Automação para venda adicional de serviços',
      category: 'Vendas',
      difficulty: 'Médio',
      estimatedTime: '10 min',
      nodes: 6,
      executions: 89,
      rating: 4.4,
      isPopular: false,
      isFree: false,
      tags: ['upsell', 'vendas', 'serviços'],
      preview: [
        { type: 'trigger', title: 'Cliente Satisfeito', icon: Circle, color: 'bg-blue-500' },
        { type: 'condition', title: 'Tempo Cliente > 3 meses?', icon: Diamond, color: 'bg-yellow-500' },
        { type: 'action', title: 'Enviar Oferta', icon: Square, color: 'bg-green-500' },
        { type: 'delay', title: 'Aguardar 1 semana', icon: Clock, color: 'bg-purple-500' },
        { type: 'action', title: 'Follow-up', icon: Square, color: 'bg-green-500' },
        { type: 'action', title: 'Agendar Consulta', icon: Square, color: 'bg-green-500' }
      ],
      features: [
        'Identificação de oportunidades',
        'Ofertas personalizadas',
        'Follow-up estratégico',
        'Agendamento de consultas'
      ]
    }
  ];

  const categories = ['Todos', 'Leads', 'Agendamento', 'Clientes', 'Retenção', 'Vendas'];
  const difficulties = ['Todos', 'Fácil', 'Médio', 'Avançado'];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil':
        return 'bg-green-100 text-green-800';
      case 'Médio':
        return 'bg-yellow-100 text-yellow-800';
      case 'Avançado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Leads':
        return <Users className="w-4 h-4" />;
      case 'Agendamento':
        return <Calendar className="w-4 h-4" />;
      case 'Clientes':
        return <Users className="w-4 h-4" />;
      case 'Retenção':
        return <Target className="w-4 h-4" />;
      case 'Vendas':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de Workflow</h1>
          <p className="text-muted-foreground">
            Use templates prontos para criar automações rapidamente
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Criar Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Templates</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.filter(t => t.isFree).length} gratuitos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mais Popular</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Follow-up de Leads</div>
            <p className="text-xs text-muted-foreground">
              {templates.find(t => t.isPopular)?.executions} execuções
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(templates.reduce((sum, t) => sum + t.rating, 0) / templates.length * 10) / 10}
            </div>
            <p className="text-xs text-muted-foreground">
              Avaliação média
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Economizado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h</div>
            <p className="text-xs text-muted-foreground">
              Por template usado
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
                placeholder="Buscar templates..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border rounded-md text-sm">
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                <option value="all">Todos</option>
                <option value="free">Gratuitos</option>
                <option value="premium">Premium</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            {template.isPopular && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-orange-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    {getCategoryIcon(template.category)}
                    <span className="ml-2">{template.name}</span>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
                <Badge className={getDifficultyColor(template.difficulty)}>
                  {template.difficulty}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Template Preview */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Preview do Workflow:</div>
                <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                  {template.preview.map((node, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`${node.color} text-white p-2 rounded-lg text-xs min-w-[80px] text-center`}>
                        <node.icon className="w-3 h-3 mx-auto mb-1" />
                        <div className="font-medium">{node.title}</div>
                      </div>
                      {index < template.preview.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Tempo Estimado</div>
                  <div className="font-medium">{template.estimatedTime}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Nós</div>
                  <div className="font-medium">{template.nodes}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Execuções</div>
                  <div className="font-medium">{template.executions}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Avaliação</div>
                  <div className="font-medium flex items-center">
                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                    {template.rating}
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Recursos Incluídos:</div>
                <div className="space-y-1">
                  {template.features.map((feature, index) => (
                    <div key={index} className="text-xs text-muted-foreground flex items-center">
                      <CheckCircle className="w-3 h-3 text-green-500 mr-2" />
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {template.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Button className="flex-1" size="sm">
                  <Copy className="w-4 h-4 mr-2" />
                  Usar Template
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Categories Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias de Templates</CardTitle>
          <CardDescription>
            Explore templates por categoria de uso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {categories.slice(1).map((category) => {
              const categoryTemplates = templates.filter(t => t.category === category);
              return (
                <div key={category} className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-center mb-2">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="font-semibold">{category}</div>
                  <div className="text-sm text-muted-foreground">
                    {categoryTemplates.length} templates
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="w-5 h-5 mr-2 text-blue-600" />
              Criar Template
            </CardTitle>
            <CardDescription>
              Crie seu próprio template personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Template</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2 text-green-600" />
              Importar Template
            </CardTitle>
            <CardDescription>
              Importe templates de outros usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Importar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-600" />
              Templates Populares
            </CardTitle>
            <CardDescription>
              Veja os templates mais usados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Ver Populares</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
