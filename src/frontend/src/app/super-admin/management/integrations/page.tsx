"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Plus, 
  Search, 
  Filter, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Brain,
  CreditCard,
  MessageCircle,
  Database,
  Calendar,
  Workflow,
  Watch,
  BarChart,
  Mail,
  Server,
  MapPin,
  Globe,
  Zap,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause
} from "lucide-react"
import Link from "next/link"

interface Integration {
  id: string;
  integration: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  isConfigured: boolean;
  lastTested?: Date;
  lastTestStatus?: 'success' | 'failure' | 'warning';
  lastTestMessage?: string;
  environment: 'development' | 'staging' | 'production';
  createdAt: Date;
  updatedAt: Date;
}

const mockIntegrations: Integration[] = [
  {
    id: '1',
    integration: 'openai',
    displayName: 'OpenAI',
    description: 'API de inteligência artificial para geração de texto e conversas',
    category: 'ai',
    icon: 'brain',
    isActive: true,
    isConfigured: true,
    lastTested: new Date('2024-01-15T10:30:00Z'),
    lastTestStatus: 'success',
    lastTestMessage: 'Conexão estabelecida com sucesso',
    environment: 'production',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T10:30:00Z')
  },
  {
    id: '2',
    integration: 'anthropic',
    displayName: 'Anthropic Claude',
    description: 'API Claude para assistência inteligente e análise de texto',
    category: 'ai',
    icon: 'brain',
    isActive: true,
    isConfigured: true,
    lastTested: new Date('2024-01-14T15:20:00Z'),
    lastTestStatus: 'success',
    environment: 'production',
    createdAt: new Date('2024-01-02T00:00:00Z'),
    updatedAt: new Date('2024-01-14T15:20:00Z')
  },
  {
    id: '3',
    integration: 'stripe',
    displayName: 'Stripe',
    description: 'Processamento de pagamentos online',
    category: 'payment',
    icon: 'credit-card',
    isActive: false,
    isConfigured: false,
    environment: 'production',
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z')
  },
  {
    id: '4',
    integration: 'whatsapp',
    displayName: 'WhatsApp Business',
    description: 'Integração com WhatsApp para comunicação com clientes',
    category: 'communication',
    icon: 'message-circle',
    isActive: true,
    isConfigured: true,
    lastTested: new Date('2024-01-13T09:15:00Z'),
    lastTestStatus: 'warning',
    lastTestMessage: 'Conexão instável - verificar configurações',
    environment: 'production',
    createdAt: new Date('2024-01-04T00:00:00Z'),
    updatedAt: new Date('2024-01-13T09:15:00Z')
  },
  {
    id: '5',
    integration: 'google-calendar',
    displayName: 'Google Calendar',
    description: 'Sincronização de agendamentos com Google Calendar',
    category: 'calendar',
    icon: 'calendar',
    isActive: false,
    isConfigured: false,
    environment: 'production',
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z')
  },
  {
    id: '6',
    integration: 'cloudinary',
    displayName: 'Cloudinary',
    description: 'Armazenamento e otimização de imagens',
    category: 'storage',
    icon: 'database',
    isActive: true,
    isConfigured: true,
    lastTested: new Date('2024-01-12T14:45:00Z'),
    lastTestStatus: 'success',
    environment: 'production',
    createdAt: new Date('2024-01-06T00:00:00Z'),
    updatedAt: new Date('2024-01-12T14:45:00Z')
  }
];

const categoryIcons: { [key: string]: any } = {
  ai: Brain,
  payment: CreditCard,
  communication: MessageCircle,
  storage: Database,
  calendar: Calendar,
  automation: Workflow,
  wearables: Watch,
  analytics: BarChart,
  email: Mail,
  backend: Server,
  location: MapPin,
  webhooks: Globe
};

const categoryColors: { [key: string]: string } = {
  ai: "bg-purple-100 text-purple-800",
  payment: "bg-green-100 text-green-800",
  communication: "bg-blue-100 text-blue-800",
  storage: "bg-orange-100 text-orange-800",
  calendar: "bg-red-100 text-red-800",
  automation: "bg-yellow-100 text-yellow-800",
  wearables: "bg-pink-100 text-pink-800",
  analytics: "bg-indigo-100 text-indigo-800",
  email: "bg-gray-100 text-gray-800",
  backend: "bg-slate-100 text-slate-800",
  location: "bg-cyan-100 text-cyan-800",
  webhooks: "bg-emerald-100 text-emerald-800"
};

export default function IntegrationsHubPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>(mockIntegrations);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let filtered = integrations;

    if (searchTerm) {
      filtered = filtered.filter(integration =>
        integration.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(integration => integration.category === categoryFilter);
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(integration => integration.isActive);
      } else if (statusFilter === "configured") {
        filtered = filtered.filter(integration => integration.isConfigured);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter(integration => !integration.isActive);
      }
    }

    setFilteredIntegrations(filtered);
  }, [integrations, searchTerm, categoryFilter, statusFilter]);

  const handleToggleActive = async (integrationId: string) => {
    setLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setIntegrations(prev => prev.map(integration =>
        integration.id === integrationId
          ? { ...integration, isActive: !integration.isActive }
          : integration
      ));
    } catch (error) {
      console.error('Error toggling integration:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (confirm('Tem certeza que deseja deletar esta integração?')) {
      setLoading(true);
      try {
        // Simular API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setIntegrations(prev => prev.filter(integration => integration.id !== integrationId));
      } catch (error) {
        console.error('Error deleting integration:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleViewIntegration = (integration: Integration) => {
    // Redirect AI integrations to AI section
    if (integration.category === 'ai') {
      window.location.href = '/super-admin/ai/integrations';
      return;
    }
    // TODO: Implement view integration logic for non-AI integrations
    console.log('View integration:', integration);
  };

  const handleEditIntegration = (integration: Integration) => {
    // Redirect AI integrations to AI section
    if (integration.category === 'ai') {
      window.location.href = '/super-admin/ai/providers';
      return;
    }
    // TODO: Implement edit integration logic for non-AI integrations
    console.log('Edit integration:', integration);
  };

  const getStatusIcon = (integration: Integration) => {
    if (!integration.isConfigured) return Clock;
    if (integration.lastTestStatus === 'success') return CheckCircle;
    if (integration.lastTestStatus === 'warning') return AlertTriangle;
    if (integration.lastTestStatus === 'failure') return XCircle;
    return Clock;
  };

  const getStatusColor = (integration: Integration) => {
    if (!integration.isConfigured) return "text-gray-500";
    if (integration.lastTestStatus === 'success') return "text-green-600";
    if (integration.lastTestStatus === 'warning') return "text-yellow-600";
    if (integration.lastTestStatus === 'failure') return "text-red-600";
    return "text-gray-500";
  };

  const getStatusText = (integration: Integration) => {
    if (!integration.isConfigured) return "Não configurado";
    if (integration.lastTestStatus === 'success') return "Ativo";
    if (integration.lastTestStatus === 'warning') return "Aviso";
    if (integration.lastTestStatus === 'failure') return "Erro";
    return "Pendente";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
          <p className="text-muted-foreground">
            Gerencie todas as integrações externas da aplicação
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Integração</DialogTitle>
              <DialogDescription>
                Adicione uma nova integração ao sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="integration-name">Nome da Integração</Label>
                <Input id="integration-name" placeholder="Ex: OpenAI" />
              </div>
              <div>
                <Label htmlFor="integration-category">Categoria</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ai">IA</SelectItem>
                    <SelectItem value="payment">Pagamento</SelectItem>
                    <SelectItem value="communication">Comunicação</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="calendar">Calendário</SelectItem>
                    <SelectItem value="automation">Automação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="integration-description">Descrição</Label>
                <Textarea 
                  id="integration-description" 
                  placeholder="Descreva a funcionalidade desta integração"
                />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setIsCreateModalOpen(false)}>
                  Criar Integração
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar integrações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="ai">IA</SelectItem>
            <SelectItem value="payment">Pagamento</SelectItem>
            <SelectItem value="communication">Comunicação</SelectItem>
            <SelectItem value="storage">Storage</SelectItem>
            <SelectItem value="calendar">Calendário</SelectItem>
            <SelectItem value="automation">Automação</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="configured">Configurado</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
            <p className="text-xs text-muted-foreground">integrações</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">funcionando</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuradas</CardTitle>
            <Settings className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.isConfigured).length}
            </div>
            <p className="text-xs text-muted-foreground">prontas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Com Erro</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {integrations.filter(i => i.lastTestStatus === 'failure').length}
            </div>
            <p className="text-xs text-muted-foreground">precisam atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredIntegrations.map((integration) => {
          const Icon = categoryIcons[integration.category] || Settings;
          const StatusIcon = getStatusIcon(integration);
          
          return (
            <Card key={integration.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{integration.displayName}</CardTitle>
                      <CardDescription className="text-sm">
                        {integration.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(integration.id)}
                      disabled={loading}
                    >
                      {integration.isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className={categoryColors[integration.category]}>
                    {integration.category}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <StatusIcon className={`h-4 w-4 ${getStatusColor(integration)}`} />
                    <span className={`text-sm ${getStatusColor(integration)}`}>
                      {getStatusText(integration)}
                    </span>
                  </div>
                </div>

                {integration.lastTested && (
                  <div className="text-xs text-muted-foreground">
                    Último teste: {integration.lastTested.toLocaleDateString('pt-BR')}
                  </div>
                )}

                {integration.lastTestMessage && (
                  <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {integration.lastTestMessage}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleViewIntegration(integration)}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditIntegration(integration)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteIntegration(integration.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma integração encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou criar uma nova integração
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Integração
          </Button>
        </div>
      )}
    </div>
  );
}

