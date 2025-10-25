"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Key,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Server,
  Zap,
  Brain,
  Settings,
  Activity
} from "lucide-react"
import { useAiProviders } from "../../management/ai-agents/_hooks/use-ai-providers"
import { useAiServices } from "../../management/ai-agents/_hooks/use-ai-services"
import { AiProvider, AiProviderType } from "@/shared/types/ai.types"
import { AiServiceConfig, AiServiceType } from "@/shared/types/ai.types"
import { ProviderWizard } from "../../management/ai-agents/_components/provider-wizard"
import { ServiceCard } from "../../management/ai-agents/_components/service-card"
import { ServiceConfigModal } from "../../management/ai-agents/_components/service-config-modal"

const SERVICE_CATEGORIES = {
  conversation: { name: "Conversação", color: "bg-blue-100 text-blue-800", count: 5 },
  visual: { name: "Visual", color: "bg-purple-100 text-purple-800", count: 6 },
  audio: { name: "Áudio", color: "bg-green-100 text-green-800", count: 2 },
  workout: { name: "Treinos", color: "bg-orange-100 text-orange-800", count: 6 },
  nutrition: { name: "Nutrição", color: "bg-yellow-100 text-yellow-800", count: 3 },
  health: { name: "Saúde", color: "bg-red-100 text-red-800", count: 4 },
  business: { name: "Business", color: "bg-indigo-100 text-indigo-800", count: 6 },
  content: { name: "Conteúdo", color: "bg-pink-100 text-pink-800", count: 4 },
  automation: { name: "Automação", color: "bg-gray-100 text-gray-800", count: 1 },
  rag: { name: "RAG", color: "bg-cyan-100 text-cyan-800", count: 4 },
  custom: { name: "Customizado", color: "bg-slate-100 text-slate-800", count: 1 }
}

export default function AIProvidersPage() {
  const {
    providers,
    loading: providersLoading,
    error: providersError,
    pagination,
    listProviders,
    deleteProvider,
    testProvider,
    rotateApiKey,
    refresh: refreshProviders
  } = useAiProviders()

  const {
    serviceConfigs,
    loading: servicesLoading,
    error: servicesError,
    listServiceConfigs,
    createServiceConfig,
    updateServiceConfig,
    deleteServiceConfig,
    duplicateServiceConfig,
    refresh: refreshServices
  } = useAiServices()

  const [activeTab, setActiveTab] = useState("providers")
  const [searchTerm, setSearchTerm] = useState("")
  const [providerFilter, setProviderFilter] = useState<AiProviderType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [showWizard, setShowWizard] = useState(false)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null)
  const [selectedService, setSelectedService] = useState<AiServiceConfig | null>(null)

  // Load data on mount
  useEffect(() => {
    listProviders()
    listServiceConfigs()
  }, [listProviders, listServiceConfigs])

  // Apply filters for providers
  useEffect(() => {
    if (activeTab === "providers") {
      const filters: any = {}
      
      if (searchTerm) filters.search = searchTerm
      if (providerFilter !== "all") filters.provider = providerFilter
      if (statusFilter !== "all") {
        filters.isActive = statusFilter === "active"
      }

      listProviders(filters, { page: 1, limit: 20 })
    }
  }, [searchTerm, providerFilter, statusFilter, activeTab, listProviders])

  // Apply filters for services
  useEffect(() => {
    if (activeTab === "services") {
      const filters: any = {}
      
      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== "all") {
        filters.isActive = statusFilter === "active"
      }

      listServiceConfigs(filters, { page: 1, limit: 100 })
    }
  }, [searchTerm, statusFilter, activeTab, listServiceConfigs])

  const handleTestProvider = async (provider: AiProvider) => {
    const result = await testProvider(provider.id)
    if (result.success) {
      console.log(`Provider ${provider.name} testado com sucesso`)
    } else {
      console.error(`Erro ao testar provider ${provider.name}:`, result.error)
    }
  }

  const handleDeleteProvider = async (provider: AiProvider) => {
    if (confirm(`Tem certeza que deseja remover o provedor "${provider.displayName}"?`)) {
      const success = await deleteProvider(provider.id)
      if (success) {
        console.log(`Provider ${provider.name} removido com sucesso`)
      }
    }
  }

  const handleCreateService = () => {
    setSelectedService(null)
    setShowServiceModal(true)
  }

  const handleEditService = (service: AiServiceConfig) => {
    setSelectedService(service)
    setShowServiceModal(true)
  }

  const handleSaveService = async (data: any) => {
    if (selectedService) {
      await updateServiceConfig(selectedService.id, { id: selectedService.id, ...data })
    } else {
      await createServiceConfig(data)
    }
    refreshServices()
  }

  const handleDeleteService = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      await deleteServiceConfig(id)
      refreshServices()
    }
  }

  const handleDuplicateService = async (service: AiServiceConfig) => {
    await duplicateServiceConfig(service.id, {
      newServiceName: `${service.serviceName} (Copy)`
    })
    refreshServices()
  }

  const handleToggleService = async (id: string, isActive: boolean) => {
    await updateServiceConfig(id, { id, isActive })
    refreshServices()
  }

  const handleTestService = async (id: string) => {
    console.log(`Testing service ${id}`)
  }

  const getProviderIcon = (provider: AiProviderType) => {
    switch (provider) {
      case AiProviderType.OPENAI:
        return "🤖"
      case AiProviderType.GEMINI:
        return "💎"
      case AiProviderType.GROQ:
        return "⚡"
      case AiProviderType.CLAUDE:
        return "🧠"
      case AiProviderType.MISTRAL:
        return "🌪️"
      case AiProviderType.COHERE:
        return "🔮"
      case AiProviderType.OLLAMA:
        return "🦙"
      case AiProviderType.HUGGINGFACE:
        return "🤗"
      case AiProviderType.DEEPSEEK:
        return "🧠"
      case AiProviderType.N8N_WEBHOOK:
        return "🔗"
      case AiProviderType.CUSTOM_WEBHOOK:
        return "⚙️"
      case AiProviderType.CUSTOM_API:
        return "🔧"
      default:
        return "❓"
    }
  }

  const getStatusBadge = (provider: AiProvider) => {
    if (!provider.isActive) {
      return <Badge variant="secondary">Inativo</Badge>
    }
    if (provider.isDefault) {
      return <Badge variant="default" className="bg-green-600">Padrão</Badge>
    }
    return <Badge variant="outline" className="text-green-600 border-green-600">Ativo</Badge>
  }

  const getServiceCategory = (serviceType: AiServiceType): string => {
    const categoryMap: Record<AiServiceType, string> = {
      [AiServiceType.CHAT]: "conversation",
      [AiServiceType.MULTIAGENT_CHAT]: "conversation",
      [AiServiceType.VOICE_WORKOUT_COACH]: "conversation",
      [AiServiceType.VIRTUAL_WORKOUT_BUDDY]: "conversation",
      [AiServiceType.FORM_FILLING_ASSISTANT]: "conversation",
      [AiServiceType.IMAGE_ANALYSIS]: "visual",
      [AiServiceType.VIDEO_ANALYSIS]: "visual",
      [AiServiceType.POSTURE_ANALYSIS]: "visual",
      [AiServiceType.EXERCISE_FORM_CHECKER]: "visual",
      [AiServiceType.BODY_COMPOSITION_PREDICTOR]: "visual",
      [AiServiceType.NUTRITION_LABEL_SCANNER]: "visual",
      [AiServiceType.TRANSCRIPTION]: "audio",
      [AiServiceType.TEXT_TO_SPEECH]: "audio",
      [AiServiceType.WORKOUT]: "workout",
      [AiServiceType.SMART_WARMUP_GENERATOR]: "workout",
      [AiServiceType.AUTO_SUBSTITUTE_EXERCISES]: "workout",
      [AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER]: "workout",
      [AiServiceType.RECOVERY_OPTIMIZER]: "workout",
      [AiServiceType.INJURY_PREDICTION]: "workout",
      [AiServiceType.NUTRITION]: "nutrition",
      [AiServiceType.MEAL_PLAN_GENERATION]: "nutrition",
      [AiServiceType.SUPPLEMENT_RECOMMENDATION]: "nutrition",
      [AiServiceType.MEDICAL_OCR]: "health",
      [AiServiceType.SENTIMENT_ANALYSIS]: "health",
      [AiServiceType.MOTIVATION_DETECTION]: "health",
      [AiServiceType.MENTAL_HEALTH_MONITOR]: "health",
      [AiServiceType.ANALYTICS]: "business",
      [AiServiceType.CHURN]: "business",
      [AiServiceType.REVENUE_PREDICTION]: "business",
      [AiServiceType.MARKET_INTELLIGENCE]: "business",
      [AiServiceType.COMPETITOR_WORKOUT_DETECTOR]: "business",
      [AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT]: "business",
      [AiServiceType.CONTENT_GENERATION]: "content",
      [AiServiceType.AUTOMATIC_PROGRESS_REPORTS]: "content",
      [AiServiceType.VIDEO_GENERATION]: "content",
      [AiServiceType.PLAYLIST_GENERATION]: "content",
      [AiServiceType.SCHEDULING_ASSISTANT]: "automation",
      [AiServiceType.EMBEDDINGS]: "rag",
      [AiServiceType.RAG_COACH]: "rag",
      [AiServiceType.RAG_NUTRITION]: "rag",
      [AiServiceType.RAG_MEDICAL]: "rag",
      [AiServiceType.CUSTOM]: "custom"
    }
    return categoryMap[serviceType] || "custom"
  }

  // Group services by category
  const groupedServices = serviceConfigs.reduce((acc, service) => {
    const category = getServiceCategory(service.serviceType)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(service)
    return acc
  }, {} as Record<string, AiServiceConfig[]>)

  const filteredServices = categoryFilter === "all" 
    ? serviceConfigs 
    : groupedServices[categoryFilter] || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provedores & Serviços IA</h1>
          <p className="text-muted-foreground">
            Gerencie provedores de IA e configure serviços
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores Ativos</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{providers.filter(p => p.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              de {providers.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Configurados</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceConfigs.filter(s => s.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              de {serviceConfigs.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(groupedServices).length}</div>
            <p className="text-xs text-muted-foreground">
              de 11 disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores em Uso</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(serviceConfigs.map(s => s.providerId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              provedores ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de IA</CardTitle>
          <CardDescription>
            Configure provedores e serviços de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="providers" className="flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span>Provedores</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span>Serviços</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="providers" className="space-y-4">
              {/* Providers Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar provedores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <Select value={providerFilter} onValueChange={(value) => setProviderFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Tipo de provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      <SelectItem value={AiProviderType.OPENAI}>OpenAI</SelectItem>
                      <SelectItem value={AiProviderType.GEMINI}>Gemini</SelectItem>
                      <SelectItem value={AiProviderType.GROQ}>Groq</SelectItem>
                      <SelectItem value={AiProviderType.CLAUDE}>Claude</SelectItem>
                      <SelectItem value={AiProviderType.MISTRAL}>Mistral</SelectItem>
                      <SelectItem value={AiProviderType.COHERE}>Cohere</SelectItem>
                      <SelectItem value={AiProviderType.OLLAMA}>Ollama</SelectItem>
                      <SelectItem value={AiProviderType.HUGGINGFACE}>Hugging Face</SelectItem>
                      <SelectItem value={AiProviderType.DEEPSEEK}>DeepSeek</SelectItem>
                      <SelectItem value={AiProviderType.N8N_WEBHOOK}>N8N Webhook</SelectItem>
                      <SelectItem value={AiProviderType.CUSTOM_WEBHOOK}>Webhook Custom</SelectItem>
                      <SelectItem value={AiProviderType.CUSTOM_API}>API Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={() => setShowWizard(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Provedor
                </Button>
              </div>

              {/* Providers Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>Provedores de IA</span>
                    <Badge variant="outline">{providers.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Gerencie provedores de IA e suas configurações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {providersError && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">{providersError}</p>
                      </div>
                    </div>
                  )}

                  {providersLoading && providers.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Carregando provedores...</p>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Provedor</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Modelos</TableHead>
                          <TableHead>Configuração</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map((provider) => (
                          <TableRow key={provider.id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{getProviderIcon(provider.provider)}</span>
                                <div>
                                  <div className="font-medium">{provider.displayName}</div>
                                  <div className="text-sm text-muted-foreground">{provider.name}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{provider.provider}</Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(provider)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {provider.models.slice(0, 2).map((model, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {model}
                                  </Badge>
                                ))}
                                {provider.models.length > 2 && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{provider.models.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Timeout:</span> {provider.timeout}ms
                                </div>
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Retries:</span> {provider.maxRetries}
                                </div>
                                {provider.isAsync && (
                                  <Badge variant="outline" className="text-xs">
                                    <Zap className="h-3 w-3 mr-1" />
                                    Assíncrono
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuItem onClick={() => handleTestProvider(provider)}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Testar Conexão
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setSelectedProvider(provider)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Key className="mr-2 h-4 w-4" />
                                    Rotacionar API Key
                                  </DropdownMenuItem>
                                  {!provider.isDefault && (
                                    <DropdownMenuItem>
                                      <Star className="mr-2 h-4 w-4" />
                                      Definir como Padrão
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteProvider(provider)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remover
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}

                  {providers.length === 0 && !providersLoading && (
                    <div className="text-center py-8">
                      <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum provedor encontrado</h3>
                      <p className="text-muted-foreground mb-4">
                        Comece adicionando seu primeiro provedor de IA
                      </p>
                      <Button onClick={() => setShowWizard(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Provedor
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-4">
              {/* Services Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-2 flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar serviços..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {Object.entries(SERVICE_CATEGORIES).map(([key, category]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <span>{category.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {category.count}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreateService}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Serviço
                </Button>
              </div>

              {/* Services Grid */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>Serviços de IA</span>
                    <Badge variant="outline">{filteredServices.length}</Badge>
                  </CardTitle>
                  <CardDescription>
                    Configure e gerencie os 42 tipos de serviços de IA disponíveis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {servicesError && (
                    <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">{servicesError}</p>
                      </div>
                    </div>
                  )}

                  {servicesLoading && serviceConfigs.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center space-y-2">
                        <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Carregando serviços...</p>
                      </div>
                    </div>
                  ) : categoryFilter === "all" ? (
                    // Show all services grouped by category
                    <div className="space-y-6">
                      {Object.entries(groupedServices).map(([categoryKey, services]) => {
                        const category = SERVICE_CATEGORIES[categoryKey as keyof typeof SERVICE_CATEGORIES]
                        if (!category || services.length === 0) return null

                        return (
                          <div key={categoryKey}>
                            <div className="flex items-center space-x-2 mb-4">
                              <Badge className={category.color}>
                                {category.name}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {services.length} serviço{services.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {services.map((service) => (
                                <ServiceCard
                                  key={service.id}
                                  serviceConfig={service}
                                  onEdit={handleEditService}
                                  onToggle={handleToggleService}
                                  onDuplicate={handleDuplicateService}
                                  onDelete={handleDeleteService}
                                  onTest={handleTestService}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    // Show filtered services
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          serviceConfig={service}
                          onEdit={handleEditService}
                          onToggle={handleToggleService}
                          onDuplicate={handleDuplicateService}
                          onDelete={handleDeleteService}
                          onTest={handleTestService}
                        />
                      ))}
                    </div>
                  )}

                  {filteredServices.length === 0 && !servicesLoading && (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
                      <p className="text-muted-foreground mb-4">
                        Comece configurando seus primeiros serviços de IA
                      </p>
                      <Button onClick={handleCreateService}>
                        <Plus className="mr-2 h-4 w-4" />
                        Configurar Serviço
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modals */}
      {showWizard && (
        <ProviderWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false)
            refreshProviders()
          }}
        />
      )}

      {showServiceModal && (
        <ServiceConfigModal
          isOpen={showServiceModal}
          onClose={() => setShowServiceModal(false)}
          onSave={handleSaveService}
          serviceConfig={selectedService}
          providers={providers}
          loading={servicesLoading}
        />
      )}
    </div>
  )
}