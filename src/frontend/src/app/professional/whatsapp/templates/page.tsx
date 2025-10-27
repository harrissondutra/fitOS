'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  MessageSquare, 
  Plus,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Filter,
  Search,
  Settings,
  Save,
  Send,
  Users,
  Target,
  Star,
  Zap,
  FileText,
  Image,
  Video,
  Audio,
  MapPin,
  User
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function WhatsAppTemplatesPage() {
  const templates = [
    {
      id: '1',
      name: 'welcome_message',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APPROVED',
      components: [
        { type: 'HEADER', text: 'Bem-vindo ao nosso programa nutricional!' },
        { type: 'BODY', text: 'Olá {{nome}}, bem-vindo! Estamos muito felizes em tê-lo conosco. Como posso ajudá-lo hoje?' },
        { type: 'FOOTER', text: 'Dra. Maria Silva - Nutricionista' }
      ],
      usage: 156,
      lastUsed: '10/02/2024',
      createdAt: '15/01/2024',
      approvedAt: '16/01/2024',
      isDefault: true
    },
    {
      id: '2',
      name: 'appointment_reminder',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APPROVED',
      components: [
        { type: 'HEADER', text: 'Lembrete de Consulta' },
        { type: 'BODY', text: 'Olá {{nome}}, sua consulta está agendada para {{data}} às {{hora}}. Não esqueça!' },
        { type: 'FOOTER', text: 'Dra. Maria Silva - Nutricionista' },
        { type: 'BUTTONS', buttons: [
          { type: 'QUICK_REPLY', text: 'Confirmar' },
          { type: 'QUICK_REPLY', text: 'Reagendar' }
        ]}
      ],
      usage: 89,
      lastUsed: '09/02/2024',
      createdAt: '20/01/2024',
      approvedAt: '21/01/2024',
      isDefault: true
    },
    {
      id: '3',
      name: 'follow_up',
      category: 'UTILITY',
      language: 'pt_BR',
      status: 'APPROVED',
      components: [
        { type: 'HEADER', text: 'Follow-up Pós-Consulta' },
        { type: 'BODY', text: 'Olá {{nome}}, como foi sua consulta? Gostaria de agendar o retorno?' },
        { type: 'FOOTER', text: 'Dra. Maria Silva - Nutricionista' },
        { type: 'BUTTONS', buttons: [
          { type: 'QUICK_REPLY', text: 'Ótima' },
          { type: 'QUICK_REPLY', text: 'Boa' },
          { type: 'QUICK_REPLY', text: 'Regular' }
        ]}
      ],
      usage: 67,
      lastUsed: '08/02/2024',
      createdAt: '10/01/2024',
      approvedAt: '11/01/2024',
      isDefault: true
    },
    {
      id: '4',
      name: 'promotional_offer',
      category: 'MARKETING',
      language: 'pt_BR',
      status: 'APPROVED',
      components: [
        { type: 'HEADER', text: 'Oferta Especial!' },
        { type: 'BODY', text: 'Olá {{nome}}, temos uma oferta especial para você: {{desconto}}% de desconto na sua próxima consulta. Válido até {{validade}}.' },
        { type: 'FOOTER', text: 'Dra. Maria Silva - Nutricionista' },
        { type: 'BUTTONS', buttons: [
          { type: 'URL', text: 'Agendar Consulta', url: 'https://nutricao.com/agendar' },
          { type: 'QUICK_REPLY', text: 'Mais Informações' }
        ]}
      ],
      usage: 45,
      lastUsed: '07/02/2024',
      createdAt: '25/01/2024',
      approvedAt: '26/01/2024',
      isDefault: false
    },
    {
      id: '5',
      name: 'password_recovery',
      category: 'AUTHENTICATION',
      language: 'pt_BR',
      status: 'APPROVED',
      components: [
        { type: 'HEADER', text: 'Recuperação de Senha' },
        { type: 'BODY', text: 'Olá {{nome}}, você solicitou a recuperação de senha. Clique no link abaixo para redefinir sua senha: {{link}}' },
        { type: 'FOOTER', text: 'Dra. Maria Silva - Nutricionista' }
      ],
      usage: 12,
      lastUsed: '05/02/2024',
      createdAt: '05/01/2024',
      approvedAt: '06/01/2024',
      isDefault: true
    },
    {
      id: '6',
      name: 'newsletter_monthly',
      category: 'MARKETING',
      language: 'pt_BR',
      status: 'PENDING',
      components: [
        { type: 'HEADER', text: 'Newsletter Nutricional' },
        { type: 'BODY', text: 'Olá {{nome}}, confira as dicas nutricionais do mês de {{mes}}: {{dicas}}' },
        { type: 'FOOTER', text: 'Dra. Maria Silva - Nutricionista' }
      ],
      usage: 0,
      lastUsed: null,
      createdAt: '30/01/2024',
      approvedAt: null,
      isDefault: false
    }
  ];

  const categories = ['Todos', 'UTILITY', 'MARKETING', 'AUTHENTICATION'];
  const statuses = ['Todos', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PAUSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-3 h-3" />;
      case 'PENDING':
        return <Clock className="w-3 h-3" />;
      case 'REJECTED':
        return <AlertCircle className="w-3 h-3" />;
      case 'PAUSED':
        return <Pause className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'UTILITY':
        return <MessageSquare className="w-4 h-4" />;
      case 'MARKETING':
        return <Target className="w-4 h-4" />;
      case 'AUTHENTICATION':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getComponentIcon = (type: string) => {
    switch (type) {
      case 'HEADER':
        return <FileText className="w-3 h-3" />;
      case 'BODY':
        return <MessageSquare className="w-3 h-3" />;
      case 'FOOTER':
        return <FileText className="w-3 h-3" />;
      case 'BUTTONS':
        return <Target className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates do WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie seus templates de mensagem do WhatsApp Business
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Templates</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-muted-foreground">
              {templates.filter(t => t.isDefault).length} padrão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.status === 'APPROVED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Prontos para uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.status === 'PENDING').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Aguardando aprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.reduce((sum, t) => sum + t.usage, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
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
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                <option value="all">Todos</option>
                <option value="default">Padrão</option>
                <option value="custom">Personalizado</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            {template.isDefault && (
              <div className="absolute -top-2 -right-2 z-10">
                <Badge className="bg-blue-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Padrão
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
                    {template.category} • {template.language}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(template.status)}>
                  {getStatusIcon(template.status)}
                  <span className="ml-1">{template.status}</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Template Preview */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Preview:</div>
                <div className="border rounded-lg p-3 bg-gray-50">
                  {template.components.map((component, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getComponentIcon(component.type)}
                        <span className="text-xs font-medium text-gray-600">{component.type}</span>
                      </div>
                      {component.text && (
                        <div className="text-xs text-gray-800">
                          {component.text}
                        </div>
                      )}
                      {component.buttons && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {component.buttons.map((button, btnIndex) => (
                            <Badge key={btnIndex} variant="outline" className="text-xs">
                              {button.text}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Template Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Usos</div>
                  <div className="font-medium">{template.usage}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Último Uso</div>
                  <div className="font-medium">{template.lastUsed || 'Nunca'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Componentes</div>
                  <div className="font-medium">{template.components.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Criado</div>
                  <div className="font-medium">{template.createdAt}</div>
                </div>
              </div>

              {/* Template Components */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Componentes:</div>
                <div className="flex flex-wrap gap-1">
                  {template.components.map((component, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {getComponentIcon(component.type)}
                      <span className="ml-1">{component.type}</span>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Button className="flex-1" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Send className="mr-2 h-4 w-4" />
                      Testar
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Configurar
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            Organize seus templates por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              Novo Template
            </CardTitle>
            <CardDescription>
              Crie um novo template personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Template</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-green-600" />
              Configurações
            </CardTitle>
            <CardDescription>
              Configure integração com Twilio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Configurar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-purple-600" />
              Automações
            </CardTitle>
            <CardDescription>
              Configure automações com templates
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

