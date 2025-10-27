'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Mail, 
  Plus, 
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Eye,
  Download,
  Upload,
  Star,
  Users,
  Calendar,
  Target,
  Filter,
  Search,
  Settings,
  Save,
  Image,
  Type,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function EmailTemplatesPage() {
  const templates = [
    {
      id: '1',
      name: 'Boas-vindas Cliente',
      category: 'Onboarding',
      description: 'Template para novos clientes',
      subject: 'Bem-vindo ao nosso programa nutricional!',
      preview: 'welcome-preview.jpg',
      variables: ['nome', 'email', 'plano'],
      isDefault: true,
      usage: 156,
      lastUsed: '10/02/2024',
      createdAt: '15/01/2024',
      status: 'active',
      responsive: true,
      accessibility: true
    },
    {
      id: '2',
      name: 'Lembrete de Consulta',
      category: 'Agendamento',
      description: 'Template para lembretes de consulta',
      subject: 'Sua consulta está chegando!',
      preview: 'reminder-preview.jpg',
      variables: ['nome', 'data', 'hora', 'local'],
      isDefault: true,
      usage: 89,
      lastUsed: '09/02/2024',
      createdAt: '20/01/2024',
      status: 'active',
      responsive: true,
      accessibility: true
    },
    {
      id: '3',
      name: 'Oferta Especial',
      category: 'Marketing',
      description: 'Template para ofertas e promoções',
      subject: 'Desconto especial para você!',
      preview: 'promotional-preview.jpg',
      variables: ['nome', 'desconto', 'validade'],
      isDefault: false,
      usage: 45,
      lastUsed: '08/02/2024',
      createdAt: '25/01/2024',
      status: 'active',
      responsive: true,
      accessibility: false
    },
    {
      id: '4',
      name: 'Follow-up Pós-Consulta',
      category: 'Pós-Venda',
      description: 'Template para follow-up pós-consulta',
      subject: 'Como foi sua consulta?',
      preview: 'followup-preview.jpg',
      variables: ['nome', 'consulta', 'feedback'],
      isDefault: true,
      usage: 67,
      lastUsed: '07/02/2024',
      createdAt: '10/01/2024',
      status: 'active',
      responsive: true,
      accessibility: true
    },
    {
      id: '5',
      name: 'Newsletter Nutricional',
      category: 'Educativo',
      description: 'Template para newsletter mensal',
      subject: 'Dicas nutricionais do mês',
      preview: 'newsletter-preview.jpg',
      variables: ['nome', 'mes', 'dicas'],
      isDefault: false,
      usage: 23,
      lastUsed: '05/02/2024',
      createdAt: '30/01/2024',
      status: 'draft',
      responsive: false,
      accessibility: true
    },
    {
      id: '6',
      name: 'Recuperação de Senha',
      category: 'Sistema',
      description: 'Template para recuperação de senha',
      subject: 'Recuperação de senha',
      preview: 'password-preview.jpg',
      variables: ['nome', 'link'],
      isDefault: true,
      usage: 12,
      lastUsed: '03/02/2024',
      createdAt: '05/01/2024',
      status: 'active',
      responsive: true,
      accessibility: true
    }
  ];

  const categories = ['Todos', 'Onboarding', 'Agendamento', 'Marketing', 'Pós-Venda', 'Educativo', 'Sistema'];
  const statuses = ['Todos', 'Ativo', 'Rascunho', 'Arquivado'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3" />;
      case 'draft':
        return <Edit className="w-3 h-3" />;
      case 'archived':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Onboarding':
        return <Users className="w-4 h-4" />;
      case 'Agendamento':
        return <Calendar className="w-4 h-4" />;
      case 'Marketing':
        return <Target className="w-4 h-4" />;
      case 'Pós-Venda':
        return <CheckCircle className="w-4 h-4" />;
      case 'Educativo':
        return <Type className="w-4 h-4" />;
      case 'Sistema':
        return <Settings className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates de Email</h1>
          <p className="text-muted-foreground">
            Gerencie seus templates de email marketing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
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
            <Mail className="h-4 w-4 text-muted-foreground" />
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
            <CardTitle className="text-sm font-medium">Templates Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Prontos para uso
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Responsivos</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates.filter(t => t.responsive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Mobile-friendly
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
                    {template.description}
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(template.status)}>
                  {getStatusIcon(template.status)}
                  <span className="ml-1 capitalize">{template.status}</span>
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Template Preview */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Preview:</div>
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="text-xs text-gray-600 mb-1">{template.subject}</div>
                  <div className="text-xs text-gray-500">
                    Olá <strong>{{nome}}</strong>, bem-vindo ao nosso programa nutricional!
                  </div>
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
                  <div className="font-medium">{template.lastUsed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Variáveis</div>
                  <div className="font-medium">{template.variables.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Criado</div>
                  <div className="font-medium">{template.createdAt}</div>
                </div>
              </div>

              {/* Template Features */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Recursos:</div>
                <div className="flex flex-wrap gap-2">
                  {template.responsive && (
                    <Badge variant="outline" className="text-xs">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Responsivo
                    </Badge>
                  )}
                  {template.accessibility && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Acessível
                    </Badge>
                  )}
                  {template.isDefault && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Padrão
                    </Badge>
                  )}
                </div>
              </div>

              {/* Variables */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Variáveis:</div>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {`{{${variable}}}`}
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
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
              <Upload className="w-5 h-5 mr-2 text-green-600" />
              Importar Template
            </CardTitle>
            <CardDescription>
              Importe templates de outros sistemas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Importar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Configurações
            </CardTitle>
            <CardDescription>
              Configure padrões e variáveis globais
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

