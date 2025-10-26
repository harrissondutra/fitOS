'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Send,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  Phone,
  Mail,
  Image,
  FileText,
  Video,
  Audio,
  MapPin,
  User,
  Zap,
  BarChart3,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function WhatsAppMessagesPage() {
  const messages = [
    {
      id: '1',
      to: '+5511999999999',
      from: '+5511888888888',
      body: 'Olá! Bem-vindo ao nosso programa nutricional. Como posso ajudá-lo hoje?',
      type: 'text',
      status: 'delivered',
      sentAt: '10/02/2024 14:30',
      deliveredAt: '10/02/2024 14:30',
      readAt: '10/02/2024 14:35',
      templateName: 'welcome_message',
      tenantId: 'tenant-1'
    },
    {
      id: '2',
      to: '+5511999999999',
      from: '+5511888888888',
      body: 'Sua consulta está agendada para amanhã às 10:00. Não esqueça!',
      type: 'text',
      status: 'read',
      sentAt: '09/02/2024 16:00',
      deliveredAt: '09/02/2024 16:00',
      readAt: '09/02/2024 16:05',
      templateName: 'appointment_reminder',
      tenantId: 'tenant-1'
    },
    {
      id: '3',
      to: '+5511777777777',
      from: '+5511888888888',
      body: 'Como foi sua consulta? Gostaria de agendar o retorno?',
      type: 'text',
      status: 'delivered',
      sentAt: '08/02/2024 18:00',
      deliveredAt: '08/02/2024 18:00',
      readAt: null,
      templateName: 'follow_up',
      tenantId: 'tenant-1'
    },
    {
      id: '4',
      to: '+5511666666666',
      from: '+5511888888888',
      body: 'Oferta especial: 20% de desconto na sua próxima consulta!',
      type: 'text',
      status: 'failed',
      sentAt: '07/02/2024 12:00',
      deliveredAt: null,
      readAt: null,
      templateName: 'promotional_offer',
      tenantId: 'tenant-1'
    },
    {
      id: '5',
      to: '+5511555555555',
      from: '+5511888888888',
      body: 'Aqui está seu plano nutricional personalizado.',
      type: 'document',
      status: 'delivered',
      sentAt: '06/02/2024 15:30',
      deliveredAt: '06/02/2024 15:30',
      readAt: '06/02/2024 15:45',
      templateName: null,
      tenantId: 'tenant-1'
    }
  ];

  const scheduledMessages = [
    {
      id: '1',
      to: '+5511999999999',
      body: 'Lembrete: Sua consulta é hoje às 14:00',
      scheduledAt: '12/02/2024 13:00',
      status: 'SCHEDULED',
      templateName: 'appointment_reminder'
    },
    {
      id: '2',
      to: '+5511888888888',
      body: 'Follow-up: Como está indo seu plano nutricional?',
      scheduledAt: '15/02/2024 10:00',
      status: 'SCHEDULED',
      templateName: 'follow_up'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'read':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'SCHEDULED':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Send className="w-3 h-3" />;
      case 'delivered':
        return <CheckCircle className="w-3 h-3" />;
      case 'read':
        return <Eye className="w-3 h-3" />;
      case 'failed':
        return <AlertCircle className="w-3 h-3" />;
      case 'SCHEDULED':
        return <Clock className="w-3 h-3" />;
      default:
        return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <MessageSquare className="w-4 h-4" />;
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Audio className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'contact':
        return <User className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const totalMessages = messages.length;
  const deliveredMessages = messages.filter(m => m.status === 'delivered' || m.status === 'read').length;
  const readMessages = messages.filter(m => m.status === 'read').length;
  const failedMessages = messages.filter(m => m.status === 'failed').length;
  const deliveryRate = totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0;
  const readRate = deliveredMessages > 0 ? Math.round((readMessages / deliveredMessages) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Messages</h1>
          <p className="text-muted-foreground">
            Gerencie suas mensagens do WhatsApp Business
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nova Mensagem
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Mensagens</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              {deliveredMessages} entregues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Leitura</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{readRate}%</div>
            <p className="text-xs text-muted-foreground">
              {readMessages} lidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedMessages}</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
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
                placeholder="Buscar mensagens, números, conteúdo..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todos os Status</option>
                <option>Enviado</option>
                <option>Entregue</option>
                <option>Lido</option>
                <option>Falhou</option>
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todos os Tipos</option>
                <option>Texto</option>
                <option>Imagem</option>
                <option>Documento</option>
                <option>Vídeo</option>
                <option>Áudio</option>
              </select>
              <select className="px-3 py-2 border rounded-md text-sm">
                <option>Todos os Templates</option>
                <option>Boas-vindas</option>
                <option>Lembrete</option>
                <option>Follow-up</option>
                <option>Promocional</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Tabs */}
      <Tabs defaultValue="sent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sent">Enviadas ({totalMessages})</TabsTrigger>
          <TabsTrigger value="scheduled">Agendadas ({scheduledMessages.length})</TabsTrigger>
          <TabsTrigger value="failed">Falhas ({failedMessages})</TabsTrigger>
          <TabsTrigger value="compose">Compor</TabsTrigger>
        </TabsList>

        <TabsContent value="sent" className="space-y-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(message.type)}
                        <span className="font-medium">{message.to}</span>
                        <Badge className={getStatusColor(message.status)}>
                          {getStatusIcon(message.status)}
                          <span className="ml-1 capitalize">{message.status}</span>
                        </Badge>
                        {message.templateName && (
                          <Badge variant="outline" className="text-xs">
                            {message.templateName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {message.body}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Send className="w-3 h-3 mr-1" />
                          Enviado: {message.sentAt}
                        </div>
                        {message.deliveredAt && (
                          <div className="flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Entregue: {message.deliveredAt}
                          </div>
                        )}
                        {message.readAt && (
                          <div className="flex items-center">
                            <Eye className="w-3 h-3 mr-1" />
                            Lido: {message.readAt}
                          </div>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Reenviar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          Copiar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="mr-2 h-4 w-4" />
                          Agendar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4">
          <div className="space-y-4">
            {scheduledMessages.map((message) => (
              <Card key={message.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">{message.to}</span>
                        <Badge className={getStatusColor(message.status)}>
                          {getStatusIcon(message.status)}
                          <span className="ml-1 capitalize">{message.status}</span>
                        </Badge>
                        {message.templateName && (
                          <Badge variant="outline" className="text-xs">
                            {message.templateName}
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {message.body}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Agendado para: {message.scheduledAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Enviar Agora
                      </Button>
                      <Button variant="outline" size="sm">
                        <Pause className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <div className="space-y-4">
            {messages.filter(m => m.status === 'failed').map((message) => (
              <Card key={message.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{message.to}</span>
                        <Badge className={getStatusColor(message.status)}>
                          {getStatusIcon(message.status)}
                          <span className="ml-1 capitalize">{message.status}</span>
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {message.body}
                      </div>
                      <div className="text-xs text-red-600 mb-2">
                        Erro: Número inválido ou bloqueado
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Send className="w-3 h-3 mr-1" />
                          Tentativa: {message.sentAt}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Tentar Novamente
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compor Nova Mensagem</CardTitle>
              <CardDescription>
                Envie uma mensagem personalizada via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="to">Para</Label>
                  <Input
                    id="to"
                    placeholder="+5511999999999"
                    type="tel"
                  />
                </div>
                <div>
                  <Label htmlFor="template">Template (Opcional)</Label>
                  <select id="template" className="w-full px-3 py-2 border rounded-md">
                    <option value="">Selecionar template</option>
                    <option value="welcome">Boas-vindas</option>
                    <option value="reminder">Lembrete</option>
                    <option value="follow-up">Follow-up</option>
                    <option value="promotional">Promocional</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Agora
                </Button>
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Agendar
                </Button>
                <Button variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Rascunho
                </Button>
              </div>
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
              Nova Mensagem
            </CardTitle>
            <CardDescription>
              Envie uma mensagem personalizada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Compor</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Analytics
            </CardTitle>
            <CardDescription>
              Análise de performance das mensagens
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
      </div>
    </div>
  );
}
