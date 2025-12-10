"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
  Pause,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

interface Integration {
  id: string;
  integration: string;
  displayName: string;
  description: string;
  category: string;
  icon: string;
  isActive: boolean;
  isConfigured: boolean;
  lastTested?: Date | string;
  lastTestStatus?: 'success' | 'failure' | 'warning';
  lastTestMessage?: string;
  environment: 'development' | 'staging' | 'production';
  createdAt: Date | string;
  updatedAt: Date | string;
}

const categoryIcons: { [key: string]: any } = {
  ai: Brain,
};

const categoryColors: { [key: string]: string } = {
  ai: "bg-purple-100 text-purple-800",
};

export default function AIIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [filteredIntegrations, setFilteredIntegrations] = useState<Integration[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/super-admin/ai/integrations', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar integrações');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Converter strings de data para Date objects
        const formattedIntegrations = result.data.map((integration: any) => ({
          ...integration,
          lastTested: integration.lastTested ? new Date(integration.lastTested) : undefined,
          createdAt: integration.createdAt ? new Date(integration.createdAt) : new Date(),
          updatedAt: integration.updatedAt ? new Date(integration.updatedAt) : new Date()
        }));
        setIntegrations(formattedIntegrations);
        setFilteredIntegrations(formattedIntegrations);
      }
    } catch (error: any) {
      console.error('Erro ao carregar integrações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as integrações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;
    
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

  const handleTestIntegration = async (integrationId: string) => {
    try {
      setTestingId(integrationId);
      const response = await fetch(`/api/super-admin/ai/integrations/${integrationId}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao testar integração');
      }

      const result = await response.json();
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: result.data?.message || 'Teste realizado com sucesso'
        });
        
        // Recarregar integrações para atualizar status
        await loadIntegrations();
      } else {
        throw new Error(result.error || 'Erro ao testar');
      }
    } catch (error: any) {
      console.error('Error testing integration:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível testar a integração',
        variant: 'destructive'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleActive = async (integrationId: string) => {
    try {
      // As integrações são gerenciadas via provedores
      // Redirecionar para página de provedores
      toast({
        title: 'Info',
        description: 'Para ativar/desativar integrações, edite os provedores na página de Provedores'
      });
    } catch (error: any) {
      console.error('Error toggling integration:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a integração',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta integração?')) {
      return;
    }

    try {
      // Integrações são gerenciadas via provedores
      toast({
        title: 'Info',
        description: 'Para deletar integrações, remova os provedores na página de Provedores'
      });
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar a integração',
        variant: 'destructive'
      });
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
          <Button variant="outline" onClick={loadIntegrations} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
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

      {/* Loading State */}
      {loading && integrations.length === 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Integrations Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredIntegrations.length === 0 ? (
              <div className="col-span-full">
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma integração encontrada</h3>
                    <p className="text-muted-foreground text-center">
                      {searchTerm || statusFilter !== 'all'
                        ? 'Tente ajustar os filtros'
                        : 'Configure provedores na página de Provedores'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredIntegrations.map((integration) => {
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleTestIntegration(integration.id)}
                    disabled={testingId === integration.id || !integration.isConfigured}
                  >
                    {testingId === integration.id ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Testar
                      </>
                    )}
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/super-admin/ai/providers`}>
                      <Settings className="h-4 w-4" />
                    </Link>
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
            })
            )}
          </div>
        </>
      )}
    </div>
  );
}
