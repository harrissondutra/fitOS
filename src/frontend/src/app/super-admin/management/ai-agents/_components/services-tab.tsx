"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Filter, 
  Brain,
  Clock,
  AlertCircle,
  CheckCircle,
  Settings,
  Activity
} from "lucide-react"
import { ServiceCard } from "./service-card"
import { ServiceConfigModal } from "./service-config-modal"
import { useAiServices } from "../_hooks/use-ai-services"
import { useAiProviders } from "../_hooks/use-ai-providers"
import { AiServiceConfig, AiServiceType } from "@/shared/types/ai.types"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import testBulkUpdateConversationServices from "../_utils/test-bulk-update"

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

export function ServicesTab() {
  const {
    serviceConfigs,
    loading,
    error,
    pagination,
    listServiceConfigs,
    createServiceConfig,
    updateServiceConfig,
    deleteServiceConfig,
    duplicateServiceConfig,
    refresh,
    updateManyServiceConfigs
  } = useAiServices()

  const { providers } = useAiProviders()

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [showModal, setShowModal] = useState(false)
  const [selectedService, setSelectedService] = useState<AiServiceConfig | null>(null)
  const hasLoadedRef = useRef(false)
  const isFetchingRef = useRef(false)

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProviderId, setBulkProviderId] = useState<string>("")
  const [bulkModel, setBulkModel] = useState<string>("")

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const isAllFilteredSelected = useMemo(() => {
    if (filteredServices.length === 0) return false
    return filteredServices.every(s => selectedIds.has(s.id))
  }, [filteredServices, selectedIds])

  const toggleSelectAllFiltered = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const allSelected = filteredServices.every(s => next.has(s.id))
      if (allSelected) {
        filteredServices.forEach(s => next.delete(s.id))
      } else {
        filteredServices.forEach(s => next.add(s.id))
      }
      return next
    })
  }, [filteredServices])

  const canBulkApply = useMemo(() => selectedIds.size > 0 && (bulkProviderId || bulkModel), [selectedIds, bulkProviderId, bulkModel])

  const handleBulkApply = useCallback(async () => {
    const ids = Array.from(selectedIds)
    const partial: any = {}
    if (bulkProviderId) partial.providerId = bulkProviderId
    if (bulkModel) partial.model = bulkModel
    if (ids.length === 0 || Object.keys(partial).length === 0) return
    
    // Limpar seleção ANTES de atualizar para evitar loops
    setSelectedIds(new Set())
    setBulkProviderId("")
    setBulkModel("")
    
    try {
      await updateManyServiceConfigs(ids, partial)
    } catch (err) {
      // Em caso de erro, restaurar seleção
      setSelectedIds(new Set(ids))
      console.error('Erro ao aplicar LLM em massa:', err)
    }
  }, [selectedIds, bulkProviderId, bulkModel, updateManyServiceConfigs])

  // Load services on mount - apenas uma vez usando ref
  useEffect(() => {
    if (!hasLoadedRef.current && !isFetchingRef.current) {
      isFetchingRef.current = true
      // Usar Promise.resolve para garantir que é uma Promise
      Promise.resolve(listServiceConfigs())
        .catch(() => {
          // Erro já é tratado dentro de listServiceConfigs
        })
        .finally(() => {
          hasLoadedRef.current = true
          isFetchingRef.current = false
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executa apenas no mount - listServiceConfigs é estável (useCallback vazio)

  // Apply filters - com debounce e sem depender de listServiceConfigs para evitar loop
  useEffect(() => {
    // Skip se ainda não carregou pela primeira vez ou já está buscando
    if (!hasLoadedRef.current || isFetchingRef.current) return

    const timeoutId = setTimeout(() => {
      if (isFetchingRef.current) return // Double check
      
      isFetchingRef.current = true
      const filters: any = {}
      
      if (searchTerm) filters.search = searchTerm
      if (statusFilter !== "all") {
        filters.isActive = statusFilter === "active"
      }

      // Usar Promise.resolve para garantir que é uma Promise
      Promise.resolve(listServiceConfigs(filters, { page: 1, limit: 100 }))
        .catch(() => {
          // Erro já é tratado dentro de listServiceConfigs
        })
        .finally(() => {
          isFetchingRef.current = false
        })
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]) // listServiceConfigs é estável (useCallback vazio) - não causa loop

  // Memoizar handlers para evitar recriação que causa re-renders infinitos
  const handleCreateService = useCallback(() => {
    setSelectedService(null)
    setShowModal(true)
  }, [])

  const handleEditService = useCallback((service: AiServiceConfig) => {
    setSelectedService(service)
    setShowModal(true)
  }, [])

  const handleSaveService = useCallback(async (data: any) => {
    if (selectedService) {
      await updateServiceConfig(selectedService.id, { id: selectedService.id, ...data })
    } else {
      await createServiceConfig(data)
    }
    // Evitar refresh imediato para não causar loops em massa
    setShowModal(false)
    setSelectedService(null)
  }, [selectedService, updateServiceConfig, createServiceConfig])

  const handleDeleteService = useCallback(async (id: string) => {
    if (confirm("Tem certeza que deseja remover este serviço?")) {
      await deleteServiceConfig(id)
      // Sem refresh para evitar re-render em cascata
    }
  }, [deleteServiceConfig])

  const handleDuplicateService = useCallback(async (service: AiServiceConfig) => {
    await duplicateServiceConfig(service.id, {
      newServiceName: `${service.serviceName} (Copy)`
    })
    // Sem refresh
  }, [duplicateServiceConfig])

  const handleToggleService = useCallback(async (id: string, isActive: boolean) => {
    await updateServiceConfig(id, { id, isActive })
    // Sem refresh
  }, [updateServiceConfig])

  const handleTestService = useCallback(async (id: string) => {
    // TODO: Implement service testing
    console.log(`Testing service ${id}`)
  }, [])

  // Handler para teste automatizado de bulk update
  const handleTestBulkUpdate = useCallback(async () => {
    if (!confirm('🧪 Executar teste automatizado de bulk update?\n\nIsso irá alterar todos os serviços de conversação para Gemini e depois Groq.')) {
      return
    }

    try {
      console.clear()
      console.log('🚀 Iniciando teste automatizado...')
      await testBulkUpdateConversationServices()
      // Recarregar lista após teste
      await listServiceConfigs()
      alert('✅ Teste concluído! Verifique o console para detalhes.')
    } catch (error) {
      console.error('❌ Erro no teste:', error)
      alert(`❌ Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    }
  }, [listServiceConfigs])

  // Memoizar função getServiceCategory para evitar recriação
  const getServiceCategory = useMemo(() => {
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
    return (serviceType: AiServiceType): string => {
      return categoryMap[serviceType] || "custom"
    }
  }, [])

  // Memoizar groupedServices para evitar recálculos desnecessários
  // Usar stringify para comparar deep equality e evitar re-renders desnecessários
  const serviceConfigsKey = useMemo(() => 
    JSON.stringify(serviceConfigs.map(s => ({ id: s.id, providerId: s.providerId, model: s.model, isActive: s.isActive }))), 
    [serviceConfigs]
  )
  
  const groupedServices = useMemo(() => {
    return serviceConfigs.reduce((acc, service) => {
      const category = getServiceCategory(service.serviceType)
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(service)
      return acc
    }, {} as Record<string, AiServiceConfig[]>)
  }, [serviceConfigsKey, getServiceCategory]) // Usar key ao invés de serviceConfigs diretamente

  const filteredServices = useMemo(() => {
    return categoryFilter === "all" 
    ? serviceConfigs 
    : groupedServices[categoryFilter] || []
  }, [categoryFilter, serviceConfigs, groupedServices])

  // Memoizar cálculos de estatísticas para evitar recálculos
  const activeServicesCount = useMemo(() => 
    serviceConfigs.filter(s => s.isActive).length, 
    [serviceConfigs]
  )
  
  const activeServicesPercentage = useMemo(() => 
    serviceConfigs.length > 0 
      ? Math.round((activeServicesCount / serviceConfigs.length) * 100) 
      : 0, 
    [activeServicesCount, serviceConfigs.length]
  )
  
  const uniqueProvidersCount = useMemo(() => 
    new Set(serviceConfigs.map(s => s.providerId)).size,
    [serviceConfigs]
  )

  if (loading && serviceConfigs.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando serviços...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
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

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleTestBulkUpdate}
            title="Teste automatizado: alterar todos os serviços de conversação para Gemini e Groq"
          >
            🧪 Testar Bulk Update
          </Button>
          <Button onClick={handleCreateService}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Serviço
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col md:flex-row items-start md:items-center gap-3 p-3 border rounded-md">
          <div className="flex items-center gap-2">
            <Checkbox checked={isAllFilteredSelected} onCheckedChange={toggleSelectAllFiltered as any} />
            <span className="text-sm text-muted-foreground">Selecionados: {selectedIds.size}</span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={bulkProviderId} onValueChange={setBulkProviderId}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Selecionar Provedor" />
              </SelectTrigger>
              <SelectContent>
                {providers.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.displayName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Modelo (opcional)"
              value={bulkModel}
              onChange={(e) => setBulkModel(e.target.value)}
              className="w-56"
            />
            <Button disabled={!canBulkApply} onClick={handleBulkApply}>
              Aplicar LLM
            </Button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Serviços</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceConfigs.length}</div>
            <p className="text-xs text-muted-foreground">
              de 42 tipos disponíveis
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Ativos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeServicesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeServicesPercentage}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(groupedServices).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de 11 categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueProvidersCount}
            </div>
            <p className="text-xs text-muted-foreground">
              provedores em uso
            </p>
          </CardContent>
        </Card>
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
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {categoryFilter === "all" ? (
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
                        <div key={service.id} className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedIds.has(service.id)}
                            onCheckedChange={() => toggleSelect(service.id)}
                            className="mt-2"
                          />
                          <div className="flex-1">
                            <ServiceCard
                              serviceConfig={service}
                              onEdit={handleEditService}
                              onToggle={handleToggleService}
                              onDuplicate={handleDuplicateService}
                              onDelete={handleDeleteService}
                              onTest={handleTestService}
                            />
                          </div>
                        </div>
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
                <div key={service.id} className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedIds.has(service.id)}
                    onCheckedChange={() => toggleSelect(service.id)}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <ServiceCard
                      serviceConfig={service}
                      onEdit={handleEditService}
                      onToggle={handleToggleService}
                      onDuplicate={handleDuplicateService}
                      onDelete={handleDeleteService}
                      onTest={handleTestService}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredServices.length === 0 && !loading && (
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

      {/* Service Config Modal */}
      {showModal && (
        <ServiceConfigModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveService}
          serviceConfig={selectedService}
          providers={providers}
          loading={loading}
        />
      )}
    </div>
  )
}
