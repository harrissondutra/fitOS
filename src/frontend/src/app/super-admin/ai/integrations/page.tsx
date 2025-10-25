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
  Activity,
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
    integration: 'google-gemini',
    displayName: 'Google Gemini',
    description: 'API Gemini para processamento multimodal e geração de conteúdo',
    category: 'ai',
    icon: 'brain',
    isActive: false,
    isConfigured: false,
    environment: 'production',
    createdAt: new Date('2024-01-03T00:00:00Z'),
    updatedAt: new Date('2024-01-03T00:00:00Z')
  },
  {
    id: '4',
    integration: 'groq',
    displayName: 'Groq',
    description: 'API Groq para inferência rápida de modelos de IA',
    category: 'ai',
    icon: 'brain',
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
    integration: 'mistral',
    displayName: 'Mistral AI',
    description: 'API Mistral para modelos de linguagem eficientes',
    category: 'ai',
    icon: 'brain',
    isActive: false,
    isConfigured: false,
    environment: 'production',
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-05T00:00:00Z')
  },
  {
    id: '6',
    integration: 'cohere',
    displayName: 'Cohere',
    description: 'API Cohere para processamento de linguagem natural',
    category: 'ai',
    icon: 'brain',
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
};

const categoryColors: { [key: string]: string } = {
  ai: "bg-purple-100 text-purple-800",
};

export default function AIIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>(mockIntegrations);
  const [searchTerm, setSearchTerm] = useState("");
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
  }, [integrations, searchTerm, statusFilter]);

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
          <h1 className="text-3xl font-bold tracking-tight">Integrações IA</h1>
          <p className="text-muted-foreground">
            Gerencie integrações específicas de inteligência artificial
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar integrações de IA..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
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
            <p className="text-xs text-muted-foreground">integrações de IA</p>
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
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/super-admin/ai/providers`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
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
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma integração de IA encontrada</h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros ou configurar uma nova integração
          </p>
          <Button asChild>
            <Link href="/super-admin/ai/providers">
              <Plus className="h-4 w-4 mr-2" />
              Configurar Provedores
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
