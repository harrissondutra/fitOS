'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mail, 
  Plus, 
  Send,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreHorizontal,
  Users,
  Target,
  Calendar,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Settings,
  Save,
  Image,
  Link,
  Type,
  Palette,
  Layout,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function CampaignManagerPage() {
  const [campaigns, setCampaigns] = useState([
    {
      id: '1',
      name: 'Boas-vindas Novos Clientes',
      subject: 'Bem-vindo ao nosso programa nutricional!',
      status: 'active',
      type: 'welcome',
      audience: 'Novos Clientes',
      sent: 156,
      opened: 89,
      clicked: 23,
      unsubscribed: 2,
      createdAt: '15/01/2024',
      scheduledFor: null,
      template: 'welcome-template'
    },
    {
      id: '2',
      name: 'Lembrete de Consulta',
      subject: 'Sua consulta está chegando!',
      status: 'scheduled',
      type: 'reminder',
      audience: 'Clientes com Consulta',
      sent: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      createdAt: '20/01/2024',
      scheduledFor: '12/02/2024 09:00',
      template: 'reminder-template'
    },
    {
      id: '3',
      name: 'Oferta Especial - Fevereiro',
      subject: 'Desconto especial para você!',
      status: 'draft',
      type: 'promotional',
      audience: 'Clientes Ativos',
      sent: 0,
      opened: 0,
      clicked: 0,
      unsubscribed: 0,
      createdAt: '25/01/2024',
      scheduledFor: null,
      template: 'promotional-template'
    },
    {
      id: '4',
      name: 'Follow-up Pós-Consulta',
      subject: 'Como foi sua consulta?',
      status: 'active',
      type: 'follow-up',
      audience: 'Clientes Pós-Consulta',
      sent: 67,
      opened: 45,
      clicked: 12,
      unsubscribed: 1,
      createdAt: '10/01/2024',
      scheduledFor: null,
      template: 'followup-template'
    }
  ]);

  const [templates, setTemplates] = useState([
    {
      id: 'welcome-template',
      name: 'Template de Boas-vindas',
      category: 'Onboarding',
      description: 'Template para novos clientes',
      preview: 'welcome-preview.jpg',
      variables: ['nome', 'email', 'plano'],
      isDefault: true
    },
    {
      id: 'reminder-template',
      name: 'Template de Lembrete',
      category: 'Agendamento',
      description: 'Template para lembretes de consulta',
      preview: 'reminder-preview.jpg',
      variables: ['nome', 'data', 'hora', 'local'],
      isDefault: true
    },
    {
      id: 'promotional-template',
      name: 'Template Promocional',
      category: 'Marketing',
      description: 'Template para ofertas e promoções',
      preview: 'promotional-preview.jpg',
      variables: ['nome', 'desconto', 'validade'],
      isDefault: false
    },
    {
      id: 'followup-template',
      name: 'Template de Follow-up',
      category: 'Pós-Venda',
      description: 'Template para follow-up pós-consulta',
      preview: 'followup-preview.jpg',
      variables: ['nome', 'consulta', 'feedback'],
      isDefault: true
    }
  ]);

  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState('visual'); // visual, html, preview

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'paused':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3" />;
      case 'scheduled':
        return <Calendar className="w-3 h-3" />;
      case 'draft':
        return <Edit className="w-3 h-3" />;
      case 'paused':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Circle className="w-3 h-3" />;
    }
  };

  const calculateOpenRate = (sent: number, opened: number) => {
    return sent > 0 ? Math.round((opened / sent) * 100) : 0;
  };

  const calculateClickRate = (sent: number, clicked: number) => {
    return sent > 0 ? Math.round((clicked / sent) * 100) : 0;
  };

  const renderEmailEditor = () => {
    if (!selectedCampaign) return null;

    return (
      <div className="space-y-4">
        {/* Editor Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Editor de Email - {selectedCampaign.name}
                </CardTitle>
                <CardDescription>
                  Crie e personalize seu email marketing
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="outline" size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
                <Button size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Editor Tabs */}
        <Tabs value={editorMode} onValueChange={setEditorMode}>
          <TabsList>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="html">HTML</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-4">
              {/* Email Content */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Conteúdo do Email</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Email Header */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Cabeçalho</h3>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="subject">Assunto</Label>
                            <Input
                              id="subject"
                              placeholder="Digite o assunto do email"
                              defaultValue={selectedCampaign.subject}
                            />
                          </div>
                          <div>
                            <Label htmlFor="preheader">Pré-cabeçalho</Label>
                            <Input
                              id="preheader"
                              placeholder="Texto que aparece no preview"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email Body */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Corpo do Email</h3>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                              <Type className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Image className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Link className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Palette className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="greeting">Saudação</Label>
                            <Input
                              id="greeting"
                              placeholder="Olá {{nome}},"
                              defaultValue="Olá {{nome}},"
                            />
                          </div>
                          <div>
                            <Label htmlFor="content">Conteúdo Principal</Label>
                            <Textarea
                              id="content"
                              placeholder="Digite o conteúdo do seu email..."
                              rows={6}
                              defaultValue="Bem-vindo ao nosso programa nutricional! Estamos muito felizes em tê-lo conosco."
                            />
                          </div>
                          <div>
                            <Label htmlFor="cta">Chamada para Ação</Label>
                            <Input
                              id="cta"
                              placeholder="Agendar Consulta"
                              defaultValue="Agendar Consulta"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Email Footer */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">Rodapé</h3>
                          <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="signature">Assinatura</Label>
                            <Textarea
                              id="signature"
                              placeholder="Dra. Maria Silva - Nutricionista"
                              rows={3}
                              defaultValue="Dra. Maria Silva\nNutricionista CRN-12345\nmaria@nutricao.com"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="unsubscribe" defaultChecked />
                            <Label htmlFor="unsubscribe">Incluir link de descadastro</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Templates */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Templates</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="p-2 border rounded cursor-pointer hover:bg-gray-50"
                      >
                        <div className="text-sm font-medium">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.category}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Variables */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Variáveis</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground mb-2">Arraste para usar:</div>
                    {['nome', 'email', 'plano', 'data', 'hora', 'local'].map((variable) => (
                      <div
                        key={variable}
                        className="p-2 bg-blue-50 border border-blue-200 rounded cursor-move text-sm"
                        draggable
                      >
                        {`{{${variable}}}`}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Monitor className="w-3 h-3 mr-1" />
                          Desktop
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Tablet className="w-3 h-3 mr-1" />
                          Tablet
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Smartphone className="w-3 h-3 mr-1" />
                          Mobile
                        </Button>
                      </div>
                      <div className="border rounded p-2 bg-gray-50 text-xs">
                        Preview do email aparecerá aqui
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="html" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Editor HTML</CardTitle>
                <CardDescription>
                  Edite o código HTML diretamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Digite o código HTML do seu email..."
                  rows={20}
                  className="font-mono text-sm"
                  defaultValue={`<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Template</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333;">Olá {{nome}}!</h1>
        <p>Bem-vindo ao nosso programa nutricional!</p>
        <a href="#" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Agendar Consulta</a>
    </div>
</body>
</html>`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview do Email</CardTitle>
                <CardDescription>
                  Como o email aparecerá para os destinatários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white">
                  <div className="space-y-4">
                    <div className="border-b pb-2">
                      <div className="text-sm text-gray-500">Para: cliente@email.com</div>
                      <div className="font-semibold">{selectedCampaign.subject}</div>
                    </div>
                    <div className="space-y-3">
                      <p>Olá <strong>João Silva</strong>,</p>
                      <p>Bem-vindo ao nosso programa nutricional! Estamos muito felizes em tê-lo conosco.</p>
                      <div className="text-center">
                        <Button className="bg-blue-600 text-white px-6 py-2 rounded">
                          Agendar Consulta
                        </Button>
                      </div>
                      <div className="text-sm text-gray-600 mt-4">
                        <p>Dra. Maria Silva</p>
                        <p>Nutricionista CRN-12345</p>
                        <p>maria@nutricao.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaign Manager</h1>
          <p className="text-muted-foreground">
            Crie e gerencie suas campanhas de email marketing
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Templates
          </Button>
          <Button onClick={() => setIsEditorOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Campanha
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
            <p className="text-xs text-muted-foreground">
              {campaigns.filter(c => c.status === 'active').length} ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Enviados</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + c.sent, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(campaigns.reduce((sum, c) => sum + calculateOpenRate(c.sent, c.opened), 0) / campaigns.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(campaigns.reduce((sum, c) => sum + calculateClickRate(c.sent, c.clicked), 0) / campaigns.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Média geral
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Editor or List */}
      {isEditorOpen && selectedCampaign ? (
        renderEmailEditor()
      ) : (
        <div className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar campanhas..."
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <select className="px-3 py-2 border rounded-md text-sm">
                    <option>Todos os Status</option>
                    <option>Ativa</option>
                    <option>Agendada</option>
                    <option>Rascunho</option>
                    <option>Pausada</option>
                  </select>
                  <select className="px-3 py-2 border rounded-md text-sm">
                    <option>Todos os Tipos</option>
                    <option>Boas-vindas</option>
                    <option>Lembrete</option>
                    <option>Promocional</option>
                    <option>Follow-up</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Mail className="w-5 h-5 mr-2" />
                      {campaign.name}
                    </CardTitle>
                    <CardDescription>{campaign.subject}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusIcon(campaign.status)}
                      <span className="ml-1 capitalize">{campaign.status}</span>
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsEditorOpen(true);
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
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar Agora
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analytics
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
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{campaign.sent}</div>
                    <div className="text-sm text-muted-foreground">Enviados</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{campaign.opened}</div>
                    <div className="text-sm text-muted-foreground">Abertos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{campaign.clicked}</div>
                    <div className="text-sm text-muted-foreground">Cliques</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{calculateOpenRate(campaign.sent, campaign.opened)}%</div>
                    <div className="text-sm text-muted-foreground">Taxa Abertura</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{calculateClickRate(campaign.sent, campaign.clicked)}%</div>
                    <div className="text-sm text-muted-foreground">Taxa Clique</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{campaign.unsubscribed}</div>
                    <div className="text-sm text-muted-foreground">Descadastros</div>
                  </div>
                </div>
                {campaign.scheduledFor && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-blue-600 mr-2" />
                      <span className="text-sm text-blue-800">
                        Agendado para: {campaign.scheduledFor}
                      </span>
                    </div>
                  </div>
                )}
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
              Nova Campanha
            </CardTitle>
            <CardDescription>
              Crie uma nova campanha de email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Campanha</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Analytics
            </CardTitle>
            <CardDescription>
              Análise de performance das campanhas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Ver Analytics</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Templates
            </CardTitle>
            <CardDescription>
              Gerencie templates de email
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Gerenciar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
