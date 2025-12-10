"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
import { Label } from "@/components/ui/label"
import { 
  Search, 
  Save,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Brain,
  Settings,
  Zap
} from "lucide-react"
import { useServiceConfigs } from "./_hooks/use-service-configs"
import { useAiProviders } from "../../management/ai-agents/_hooks/use-ai-providers"
import { AiServiceType, AiServiceConfig, AI_SERVICE_DISPLAY_NAMES } from "@/shared/types/ai.types"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import testBulkUpdateConversationServices from "../../management/ai-agents/_utils/test-bulk-update"

// Módulos organizados por categoria
const SERVICE_MODULES = {
  conversation: {
    name: "Conversação",
    icon: "💬",
    types: [
      AiServiceType.CHAT,
      AiServiceType.MULTIAGENT_CHAT,
      AiServiceType.VOICE_WORKOUT_COACH,
      AiServiceType.VIRTUAL_WORKOUT_BUDDY,
      AiServiceType.FORM_FILLING_ASSISTANT,
      AiServiceType.NUTRITION_COACH_CHAT,
    ]
  },
  visual: {
    name: "Visual",
    icon: "👁️",
    types: [
      AiServiceType.IMAGE_ANALYSIS,
      AiServiceType.VIDEO_ANALYSIS,
      AiServiceType.POSTURE_ANALYSIS,
      AiServiceType.EXERCISE_FORM_CHECKER,
      AiServiceType.BODY_COMPOSITION_PREDICTOR,
      AiServiceType.NUTRITION_LABEL_SCANNER,
      AiServiceType.FOOD_RECOGNITION,
    ]
  },
  audio: {
    name: "Áudio",
    icon: "🔊",
    types: [
      AiServiceType.TRANSCRIPTION,
      AiServiceType.TEXT_TO_SPEECH,
    ]
  },
  workout: {
    name: "Treinos",
    icon: "🏋️",
    types: [
      AiServiceType.WORKOUT,
      AiServiceType.SMART_WARMUP_GENERATOR,
      AiServiceType.AUTO_SUBSTITUTE_EXERCISES,
      AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER,
      AiServiceType.RECOVERY_OPTIMIZER,
      AiServiceType.INJURY_PREDICTION,
    ]
  },
  predictive: {
    name: "IA Preditiva",
    icon: "🔮",
    types: [
      AiServiceType.PERFORMANCE_PREDICTION,
      AiServiceType.PLATEAU_PREDICTION,
      AiServiceType.RECOVERY_TIME_PREDICTION,
      AiServiceType.MUSCLE_GAIN_PREDICTION,
      AiServiceType.STRENGTH_PREDICTION,
      AiServiceType.METABOLIC_AGE_PREDICTION,
      AiServiceType.HORMONAL_IMBALANCE_DETECTION,
      AiServiceType.SLEEP_QUALITY_PREDICTION,
      AiServiceType.STRESS_LEVEL_PREDICTION,
      AiServiceType.IMMUNE_SYSTEM_SCORE,
      AiServiceType.WEIGHT_LOSS_PREDICTION,
      AiServiceType.NUTRIENT_DEFICIENCY_DETECTION,
      AiServiceType.METABOLIC_RATE_PREDICTION,
      AiServiceType.FOOD_ALLERGY_RISK_ASSESSMENT,
      AiServiceType.DIGESTIVE_HEALTH_PREDICTION,
      AiServiceType.ADHERENCE_PREDICTION,
      AiServiceType.MOTIVATION_DROP_PREDICTION,
      AiServiceType.GOAL_ACHIEVEMENT_PROBABILITY,
      AiServiceType.DROPOUT_RISK_ASSESSMENT,
      AiServiceType.MEMBER_ACQUISITION_PREDICTION,
      AiServiceType.REVENUE_OPTIMIZATION_PREDICTION,
      AiServiceType.PEAK_HOUR_PREDICTION,
      AiServiceType.EQUIPMENT_MAINTENANCE_PREDICTION,
      AiServiceType.STAFFING_NEEDS_PREDICTION,
      AiServiceType.CHURN,
      AiServiceType.REVENUE_PREDICTION,
    ]
  },
  generative: {
    name: "IA Generativa",
    icon: "✨",
    types: [
      AiServiceType.PERSONALIZED_EMAIL_GENERATION,
      AiServiceType.SOCIAL_MEDIA_CONTENT_GENERATION,
      AiServiceType.PROGRESS_REPORT_GENERATION,
      AiServiceType.MOTIVATIONAL_MESSAGE_GENERATION,
      AiServiceType.NEWSLETTER_GENERATION,
      AiServiceType.ADAPTIVE_WORKOUT_GENERATION,
      AiServiceType.PERIODIZATION_GENERATION,
      AiServiceType.RECOVERY_PROTOCOL_GENERATION,
      AiServiceType.EXERCISE_ALTERNATIVE_GENERATION,
      AiServiceType.WARMUP_COOLDOWN_GENERATION,
      AiServiceType.RECIPE_GENERATION,
      AiServiceType.SHOPPING_LIST_GENERATION,
      AiServiceType.MEAL_PREP_PLAN_GENERATION,
      AiServiceType.MACRO_OPTIMIZATION_SUGGESTIONS,
      AiServiceType.INSIGHT_GENERATION,
      AiServiceType.TREND_ANALYSIS_REPORT,
      AiServiceType.COMPARATIVE_ANALYSIS_GENERATION,
      AiServiceType.BENCHMARK_REPORT_GENERATION,
      AiServiceType.CONTENT_GENERATION,
      AiServiceType.AUTOMATIC_PROGRESS_REPORTS,
      AiServiceType.VIDEO_GENERATION,
      AiServiceType.PLAYLIST_GENERATION,
      AiServiceType.MEAL_PLAN_GENERATION,
    ]
  },
  nutrition: {
    name: "Nutrição",
    icon: "🥗",
    types: [
      AiServiceType.NUTRITION,
      AiServiceType.SUPPLEMENT_RECOMMENDATION,
      AiServiceType.AI_MEAL_PLANNER,
      AiServiceType.PATTERN_ANALYSIS,
      AiServiceType.FOOD_SWAP_SUGGESTIONS,
    ]
  },
  health: {
    name: "Saúde",
    icon: "🏥",
    types: [
      AiServiceType.MEDICAL_OCR,
      AiServiceType.SENTIMENT_ANALYSIS,
      AiServiceType.MOTIVATION_DETECTION,
      AiServiceType.MENTAL_HEALTH_MONITOR,
    ]
  },
  business: {
    name: "Business",
    icon: "📊",
    types: [
      AiServiceType.ANALYTICS,
      AiServiceType.MARKET_INTELLIGENCE,
      AiServiceType.COMPETITOR_WORKOUT_DETECTOR,
      AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT,
    ]
  },
  automation: {
    name: "Automação",
    icon: "⚙️",
    types: [
      AiServiceType.SCHEDULING_ASSISTANT,
    ]
  },
  rag: {
    name: "RAG",
    icon: "🧠",
    types: [
      AiServiceType.EMBEDDINGS,
      AiServiceType.RAG_COACH,
      AiServiceType.RAG_NUTRITION,
      AiServiceType.RAG_MEDICAL,
    ]
  },
  other: {
    name: "Outros",
    icon: "🔧",
    types: [
      AiServiceType.CUSTOM,
    ]
  }
}

export default function AIServicesPage() {
      const {
        serviceConfigs,
        loading,
        error,
        listServiceConfigs,
        createServiceConfig,
        updateServiceConfig,
        refresh,
        clearError
      } = useServiceConfigs()

  const {
    providers,
    loading: providersLoading,
    listProviders
  } = useAiProviders()

      const [searchTerm, setSearchTerm] = useState("")
      const [serviceAssignments, setServiceAssignments] = useState<Record<string, { providerId: string; model: string }>>({})
      const [saving, setSaving] = useState<Record<string, boolean>>({})
      const [applyingToAll, setApplyingToAll] = useState(false)
      const [moduleLLMs, setModuleLLMs] = useState<Record<string, { providerId: string; model: string }>>({})
      const [applyingToModule, setApplyingToModule] = useState<Record<string, boolean>>({})
      
      // Estados para dialogs de confirmação
      const [confirmModuleDialog, setConfirmModuleDialog] = useState<{ open: boolean; moduleKey: string | null }>({ open: false, moduleKey: null })
      const [confirmAllDialog, setConfirmAllDialog] = useState(false)
      const [confirmTestDialog, setConfirmTestDialog] = useState(false)

  // Carregar dados na inicialização - apenas uma vez
  const hasInitialLoadRef = useRef(false)
  
  useEffect(() => {
    if (!hasInitialLoadRef.current) {
      hasInitialLoadRef.current = true
      listServiceConfigs({}, { limit: 1000 })
      listProviders()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Executar apenas uma vez no mount

  // Inicializar assignments com configurações existentes
  // Usar useRef para evitar loops infinitos
  const prevServiceConfigsRef = useRef<string>('')
  
  useEffect(() => {
    // Só inicializar uma vez ou se serviceConfigs realmente mudou
    const currentConfigsKey = JSON.stringify(serviceConfigs.map(c => ({ id: c.id, serviceType: c.serviceType, providerId: c.providerId, model: c.model, isActive: c.isActive, priority: c.priority })))
    
    if (currentConfigsKey === prevServiceConfigsRef.current) {
      return // Sem mudanças, não fazer nada
    }
    
    prevServiceConfigsRef.current = currentConfigsKey
    
    if (serviceConfigs.length > 0) {
      const assignments: Record<string, { providerId: string; model: string }> = {}
      
      // Agrupar por serviceType e pegar a configuração ativa com maior prioridade
      const configsByService: Record<string, AiServiceConfig[]> = {}
      serviceConfigs.forEach(config => {
        if (config.isActive && config.providerId && config.model) {
          const key = config.serviceType
          if (!configsByService[key]) {
            configsByService[key] = []
          }
          configsByService[key].push(config)
        }
      })
      
      // Para cada serviço, pegar a configuração com maior prioridade (menor número = maior prioridade)
      Object.entries(configsByService).forEach(([serviceType, configs]) => {
        const bestConfig = configs.sort((a, b) => a.priority - b.priority)[0]
        if (bestConfig) {
          assignments[serviceType] = {
            providerId: bestConfig.providerId,
            model: bestConfig.model
          }
        }
      })
      
      // Atualizar apenas se houver mudanças para evitar loops
      setServiceAssignments(prev => {
        const prevKey = JSON.stringify(prev)
        const newKey = JSON.stringify(assignments)
        if (prevKey === newKey) {
          return prev // Sem mudanças, retornar o mesmo objeto
        }
        return assignments
      })
    }
  }, [serviceConfigs])

  // Obter todos os serviços disponíveis
  const allServices = useMemo(() => {
    return Object.values(SERVICE_MODULES).flatMap(module => module.types)
  }, [])

  // Filtrar serviços por busca
  const filteredModules = useMemo(() => {
    if (!searchTerm) return SERVICE_MODULES

    const filtered: typeof SERVICE_MODULES = {}
    const searchLower = searchTerm.toLowerCase()

    Object.entries(SERVICE_MODULES).forEach(([key, module]) => {
      const matchingTypes = module.types.filter(type => {
        const name = AI_SERVICE_DISPLAY_NAMES[type] || type
        return name.toLowerCase().includes(searchLower)
      })

      if (matchingTypes.length > 0) {
        filtered[key] = {
          ...module,
          types: matchingTypes
        }
      }
    })

    return filtered
  }, [searchTerm])

  // Obter configuração atual de um serviço
  // Memoizar para evitar recriação desnecessária
  const getCurrentConfig = useCallback((serviceType: AiServiceType): { providerId?: string; model?: string; providerName?: string } => {
    const assignment = serviceAssignments[serviceType]
    if (!assignment) return {}

    const provider = providers.find(p => p.id === assignment.providerId)
    return {
      providerId: assignment.providerId,
      model: assignment.model,
      providerName: provider?.displayName
    }
  }, [serviceAssignments, providers])

  // Obter modelos disponíveis do provedor
  const getModelsForProvider = (providerId: string): string[] => {
    const provider = providers.find(p => p.id === providerId)
    return provider?.models || []
  }

  // Atualizar assignment local
  const updateAssignment = (serviceType: AiServiceType, providerId: string, model: string) => {
    setServiceAssignments(prev => ({
      ...prev,
      [serviceType]: { providerId, model }
    }))
  }

  // Salvar configuração de um serviço
  const saveServiceConfig = async (serviceType: AiServiceType) => {
    const assignment = serviceAssignments[serviceType]
    const currentConfig = getCurrentConfig(serviceType)
    
    // Usar assignment se houver, senão usar currentConfig
    const providerId = assignment?.providerId || currentConfig.providerId
    const model = assignment?.model || currentConfig.model

    if (!providerId || !model) {
      toast.error("Selecione um provedor e modelo")
      return
    }

    setSaving(prev => ({ ...prev, [serviceType]: true }))

    try {
      // Buscar todas as configurações existentes para este serviço
      const existingConfigs = serviceConfigs.filter(sc => sc.serviceType === serviceType)
      
      // Desativar todas as configurações existentes primeiro
      for (const config of existingConfigs) {
        if (config.isActive) {
          await updateServiceConfig(config.id, {
            id: config.id,
            isActive: false
          })
        }
      }
      
      // Verificar se já existe configuração com este provider para este serviço
      const existingConfigWithProvider = existingConfigs.find(
        sc => sc.providerId === providerId
      )

      if (existingConfigWithProvider) {
        // Atualizar configuração existente
        await updateServiceConfig(existingConfigWithProvider.id, {
          id: existingConfigWithProvider.id,
          model: model,
          isActive: true,
          priority: 1
        })
      } else {
        // Criar nova configuração
        await createServiceConfig({
          serviceType,
          providerId: providerId,
          model: model,
          priority: 1,
          isActive: true,
          config: {
            temperature: 0.8,
            maxTokens: 2000
          }
        })
      }

      toast.success(`${AI_SERVICE_DISPLAY_NAMES[serviceType]} configurado com sucesso!`)
      refresh()
    } catch (err) {
      toast.error(`Erro ao configurar ${AI_SERVICE_DISPLAY_NAMES[serviceType]}`)
      console.error(err)
    } finally {
      setSaving(prev => ({ ...prev, [serviceType]: false }))
    }
  }

      // Obter LLM mais comum do módulo (para mostrar no select)
      // Memoizar com dependências corretas para evitar loops
      const getModuleDefaultLLM = useCallback((moduleKey: string): { providerId: string; model: string } | null => {
        const module = SERVICE_MODULES[moduleKey as keyof typeof SERVICE_MODULES]
        if (!module) return null

        const configs = module.types
          .map(type => {
            const assignment = serviceAssignments[type]
            if (!assignment) return null
            const provider = providers.find(p => p.id === assignment.providerId)
            return provider ? {
              providerId: assignment.providerId,
              model: assignment.model
            } : null
          })
          .filter((config): config is { providerId: string; model: string } => config !== null && !!config.providerId && !!config.model)

        if (configs.length === 0) return null

        // Contar frequência de cada LLM
        const llmCounts = new Map<string, number>()
        configs.forEach(config => {
          const key = `${config.providerId}:${config.model}`
          llmCounts.set(key, (llmCounts.get(key) || 0) + 1)
        })

        // Retornar a mais comum
        let maxCount = 0
        let mostCommonKey = ""
        llmCounts.forEach((count, key) => {
          if (count > maxCount) {
            maxCount = count
            mostCommonKey = key
          }
        })

        if (mostCommonKey) {
          const [providerId, model] = mostCommonKey.split(":")
          return { providerId, model }
        }

        return null
      }, [serviceAssignments, providers]) // Depender diretamente de serviceAssignments e providers

      // Aplicar LLM para todos os serviços de um módulo
      const applyToModule = async (moduleKey: string) => {
        const moduleLLM = moduleLLMs[moduleKey]
        if (!moduleLLM || !moduleLLM.providerId || !moduleLLM.model) {
          toast.error("Selecione um provedor e modelo para o módulo")
          return
        }

        const module = SERVICE_MODULES[moduleKey as keyof typeof SERVICE_MODULES]
        if (!module) return

        // Abrir dialog de confirmação
        setConfirmModuleDialog({ open: true, moduleKey })
      }

      // Confirmar e executar aplicação ao módulo
      const confirmApplyToModule = useCallback(async () => {
        const { moduleKey } = confirmModuleDialog
        if (!moduleKey) return

        const moduleLLM = moduleLLMs[moduleKey]
        if (!moduleLLM || !moduleLLM.providerId || !moduleLLM.model) {
          setConfirmModuleDialog({ open: false, moduleKey: null })
          return
        }

        const module = SERVICE_MODULES[moduleKey as keyof typeof SERVICE_MODULES]
        if (!module) {
          setConfirmModuleDialog({ open: false, moduleKey: null })
          return
        }

        setConfirmModuleDialog({ open: false, moduleKey: null })
        setApplyingToModule(prev => ({ ...prev, [moduleKey]: true }))

        try {
          const promises = module.types.map(async (serviceType) => {
            // Buscar todas as configurações existentes para este serviço
            const existingConfigs = serviceConfigs.filter(sc => sc.serviceType === serviceType)
            
            // Desativar todas as configurações existentes primeiro
            for (const config of existingConfigs) {
              if (config.isActive) {
                await updateServiceConfig(config.id, {
                  id: config.id,
                  isActive: false
                })
              }
            }
            
            // Verificar se já existe configuração com este provider para este serviço
            const existingConfigWithProvider = existingConfigs.find(
              sc => sc.providerId === moduleLLM.providerId
            )

            if (existingConfigWithProvider) {
              // Atualizar configuração existente
              return updateServiceConfig(existingConfigWithProvider.id, {
                id: existingConfigWithProvider.id,
                model: moduleLLM.model,
                isActive: true,
                priority: 1
              })
            } else {
              // Criar nova configuração
              return createServiceConfig({
                serviceType,
                providerId: moduleLLM.providerId,
                model: moduleLLM.model,
                priority: 1,
                isActive: true,
                config: {
                  temperature: 0.8,
                  maxTokens: 2000
                }
              })
            }
          })

          await Promise.all(promises)
          toast.success(`LLM aplicada para todos os serviços do módulo "${module.name}"!`)
          refresh()
        } catch (err) {
          toast.error(`Erro ao aplicar LLM para o módulo "${module.name}"`)
          console.error(err)
        } finally {
          setApplyingToModule(prev => ({ ...prev, [moduleKey]: false }))
        }
      }, [confirmModuleDialog, moduleLLMs, serviceConfigs, providers, updateServiceConfig, createServiceConfig, refresh])

      // Inicializar LLMs dos módulos com a mais comum
      // Usar useRef para evitar loops infinitos
      const prevModuleLLMsKeyRef = useRef<string>('')
      const prevServiceAssignmentsKeyRef = useRef<string>('')
      
      useEffect(() => {
        // Criar key única para serviceAssignments para detectar mudanças
        const assignmentsKey = JSON.stringify(serviceAssignments)
        
        // Só executar se assignments realmente mudou e há providers
        if (assignmentsKey === prevServiceAssignmentsKeyRef.current) {
          return // Sem mudanças em assignments, não fazer nada
        }
        
        prevServiceAssignmentsKeyRef.current = assignmentsKey
        
        // Só executar se houver assignments e providers
        if (Object.keys(serviceAssignments).length > 0 && providers.length > 0) {
          const newModuleLLMs: Record<string, { providerId: string; model: string }> = {}
          
          Object.keys(SERVICE_MODULES).forEach(moduleKey => {
            const module = SERVICE_MODULES[moduleKey as keyof typeof SERVICE_MODULES]
            if (!module) return
            
            // Calcular LLM mais comum diretamente aqui, sem usar getModuleDefaultLLM
            const configs = module.types
              .map(type => {
                const assignment = serviceAssignments[type]
                if (!assignment) return null
                const provider = providers.find(p => p.id === assignment.providerId)
                return provider ? {
                  providerId: assignment.providerId,
                  model: assignment.model
                } : null
              })
              .filter((config): config is { providerId: string; model: string } => config !== null && !!config.providerId && !!config.model)
            
            if (configs.length > 0) {
              // Contar frequência de cada LLM
              const llmCounts = new Map<string, number>()
              configs.forEach(config => {
                const key = `${config.providerId}:${config.model}`
                llmCounts.set(key, (llmCounts.get(key) || 0) + 1)
              })
              
              // Retornar a mais comum
              let maxCount = 0
              let mostCommonKey = ""
              llmCounts.forEach((count, key) => {
                if (count > maxCount) {
                  maxCount = count
                  mostCommonKey = key
                }
              })
              
              if (mostCommonKey) {
                const [providerId, model] = mostCommonKey.split(":")
                newModuleLLMs[moduleKey] = { providerId, model }
              }
            }
          })
          
          const newKey = JSON.stringify(newModuleLLMs)
          if (newKey === prevModuleLLMsKeyRef.current) {
            return // Sem mudanças, não fazer nada
          }
          prevModuleLLMsKeyRef.current = newKey
          
          setModuleLLMs(prev => {
            // Só atualizar se houver mudanças reais
            const prevKey = JSON.stringify(prev)
            if (prevKey === newKey) {
              return prev // Sem mudanças, retornar o mesmo objeto
            }
            return { ...prev, ...newModuleLLMs }
          })
        }
      }, [serviceAssignments, providers]) // Remover getModuleDefaultLLM das dependências

      // Aplicar mesma LLM para todos os serviços
      const applyToAllServices = async () => {
    // Pegar a primeira configuração disponível ou mostrar dialog para selecionar
    const configuredServices = Object.entries(serviceAssignments).filter(([_, assignment]) => assignment.providerId && assignment.model)
    
    if (configuredServices.length === 0) {
      toast.error("Configure pelo menos um serviço primeiro para usar como modelo")
      return
    }

    const [firstServiceType, firstAssignment] = configuredServices[0]
    const defaultProvider = firstAssignment.providerId
    const defaultModel = firstAssignment.model

    if (!defaultProvider || !defaultModel) {
      toast.error("Configure pelo menos um serviço primeiro")
      return
    }

    // Abrir dialog de confirmação
    setConfirmAllDialog(true)
  }

  // Confirmar e executar aplicação a todos
  const confirmApplyToAllServices = useCallback(async () => {
    const configuredServices = Object.entries(serviceAssignments).filter(([_, assignment]) => assignment.providerId && assignment.model)
    
    if (configuredServices.length === 0) {
      setConfirmAllDialog(false)
      return
    }

    const [firstServiceType, firstAssignment] = configuredServices[0]
    const defaultProvider = firstAssignment.providerId
    const defaultModel = firstAssignment.model

    if (!defaultProvider || !defaultModel) {
      setConfirmAllDialog(false)
      return
    }

    setConfirmAllDialog(false)
    setApplyingToAll(true)

    try {
      const promises = allServices.map(async (serviceType) => {
        // Buscar todas as configurações existentes para este serviço
        const existingConfigs = serviceConfigs.filter(sc => sc.serviceType === serviceType)
        
        // Desativar todas as configurações existentes primeiro
        for (const config of existingConfigs) {
          if (config.isActive) {
            await updateServiceConfig(config.id, {
              id: config.id,
              isActive: false
            })
          }
        }
        
        // Verificar se já existe configuração com este provider para este serviço
        const existingConfigWithProvider = existingConfigs.find(
          sc => sc.providerId === defaultProvider
        )

        if (existingConfigWithProvider) {
          // Atualizar configuração existente
          return updateServiceConfig(existingConfigWithProvider.id, {
            id: existingConfigWithProvider.id,
            model: defaultModel,
            isActive: true,
            priority: 1
          })
        } else {
          // Criar nova configuração
          return createServiceConfig({
            serviceType,
            providerId: defaultProvider,
            model: defaultModel,
            priority: 1,
            isActive: true,
            config: {
              temperature: 0.8,
              maxTokens: 2000
            }
          })
        }
      })

      await Promise.all(promises)
      toast.success(`LLM aplicada para todos os ${allServices.length} serviços!`)
      refresh()
    } catch (err) {
      toast.error("Erro ao aplicar LLM para todos os serviços")
      console.error(err)
    } finally {
      setApplyingToAll(false)
    }
  }, [serviceAssignments, providers, allServices, serviceConfigs, updateServiceConfig, createServiceConfig, refresh])

  // Estatísticas
  const stats = useMemo(() => {
    const configured = Object.keys(serviceAssignments).length
    const total = allServices.length
    
    return {
      configured,
      total,
      percentage: total > 0 ? Math.round((configured / total) * 100) : 0
    }
  }, [serviceAssignments, allServices.length])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Serviços de IA</h1>
          <p className="text-muted-foreground">
            Configure qual LLM será utilizada para cada funcionalidade de IA
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços Configurados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.configured}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.total} total ({stats.percentage}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores Disponíveis</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {providers.filter(p => p.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              provedores ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Módulos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(SERVICE_MODULES).length}
            </div>
            <p className="text-xs text-muted-foreground">
              módulos de IA
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setConfirmTestDialog(true)}
                title="Teste automatizado: alterar todos os serviços de conversação para Gemini e Groq"
              >
                🧪 Testar Bulk Update
              </Button>
              {stats.configured > 0 && (
                <Button 
                  onClick={applyToAllServices}
                  disabled={applyingToAll}
                  variant="outline"
                >
                  {applyingToAll ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Aplicar para Todos
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Dialog de Erro */}
          <Dialog open={!!error} onOpenChange={(open) => {
            if (!open && clearError) {
              clearError()
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  Erro
                </DialogTitle>
                <DialogDescription className="text-base">
                  {error}
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>

          {/* Dialog de Confirmação - Aplicar ao Módulo */}
          <Dialog open={confirmModuleDialog.open} onOpenChange={(open) => {
            if (!open) {
              setConfirmModuleDialog({ open: false, moduleKey: null })
            }
          }}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Aplicação ao Módulo</DialogTitle>
                <DialogDescription className="whitespace-pre-line">
                  {confirmModuleDialog.moduleKey && (() => {
                    const module = SERVICE_MODULES[confirmModuleDialog.moduleKey as keyof typeof SERVICE_MODULES]
                    const moduleLLM = moduleLLMs[confirmModuleDialog.moduleKey]
                    if (!module || !moduleLLM) return ""
                    
                    const providerName = providers.find(p => p.id === moduleLLM.providerId)?.displayName || 'Provedor'
                    return `Aplicar ${providerName} (${moduleLLM.model}) para todos os ${module.types.length} serviços do módulo "${module.name}"?\n\nIsso irá substituir todas as configurações existentes do módulo.`
                  })()}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmModuleDialog({ open: false, moduleKey: null })}>
                  Cancelar
                </Button>
                <Button onClick={confirmApplyToModule}>
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de Confirmação - Aplicar a Todos */}
          <Dialog open={confirmAllDialog} onOpenChange={setConfirmAllDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Confirmar Aplicação a Todos os Serviços</DialogTitle>
                <DialogDescription className="whitespace-pre-line">
                  {(() => {
                    const configuredServices = Object.entries(serviceAssignments).filter(([_, assignment]) => assignment.providerId && assignment.model)
                    if (configuredServices.length === 0) return ""
                    
                    const [firstServiceType, firstAssignment] = configuredServices[0]
                    const defaultProvider = firstAssignment.providerId
                    const defaultModel = firstAssignment.model
                    const providerName = providers.find(p => p.id === defaultProvider)?.displayName || 'Provedor'
                    
                    return `Aplicar ${providerName} (${defaultModel}) para todos os ${allServices.length} serviços?\n\nIsso irá substituir todas as configurações existentes.`
                  })()}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmAllDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={confirmApplyToAllServices}>
                  Confirmar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog de Confirmação - Teste Automatizado */}
          <Dialog open={confirmTestDialog} onOpenChange={setConfirmTestDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>🧪 Executar Teste Automatizado</DialogTitle>
                <DialogDescription className="whitespace-pre-line">
                  Executar teste automatizado de bulk update?{'\n\n'}Isso irá alterar todos os serviços de conversação para Gemini e depois Groq.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setConfirmTestDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={async () => {
                  setConfirmTestDialog(false)
                  try {
                    console.clear()
                    console.log('🚀 Iniciando teste automatizado...')
                    await testBulkUpdateConversationServices()
                    toast.success('Teste concluído! Verifique o console para detalhes.')
                    refresh()
                  } catch (error) {
                    console.error('❌ Erro no teste:', error)
                    toast.error(`Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
                  }
                }}>
                  Executar Teste
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

      {/* Lista de Serviços por Módulo */}
      {loading && providersLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredModules).map(([moduleKey, module]) => {
            // Usar moduleLLMs diretamente
            const isApplyingToModule = applyingToModule[moduleKey]
            // Calcular configuredCount de forma simples
            const configuredCount = module.types.filter(t => {
              const assignment = serviceAssignments[t]
              return !!assignment?.providerId
            }).length

            return (
              <Card key={moduleKey}>
                <CardHeader>
                  <div className="space-y-4">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-2xl">{module.icon}</span>
                      <div className="flex-1">
                        <div>{module.name}</div>
                        <CardDescription className="mt-1">
                          {module.types.length} serviço{module.types.length !== 1 ? 's' : ''} • {configuredCount} configurado{configuredCount !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {configuredCount}/{module.types.length}
                      </Badge>
                    </CardTitle>
                    
                    {/* Select de LLM para o módulo */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center pt-2 border-t">
                      <div className="flex-1 w-full sm:w-auto">
                        <Label className="text-sm font-medium mb-2 block">
                          Aplicar LLM para todos os serviços do módulo:
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Select
                            value={moduleLLMs[moduleKey]?.providerId || ""}
                            onValueChange={(providerId) => {
                              const models = getModelsForProvider(providerId)
                              const currentModel = moduleLLMs[moduleKey]?.model || models[0] || ""
                              setModuleLLMs(prev => ({
                                ...prev,
                                [moduleKey]: { providerId, model: currentModel }
                              }))
                            }}
                            disabled={isApplyingToModule || providersLoading}
                          >
                            <SelectTrigger className="w-full sm:w-48">
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {providersLoading ? (
                                <SelectItem value="loading" disabled>Carregando...</SelectItem>
                              ) : providers.filter(p => p.isActive).length === 0 ? (
                                <SelectItem value="none" disabled>Nenhum provedor disponível</SelectItem>
                              ) : (
                                providers.filter(p => p.isActive).map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.displayName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {moduleLLMs[moduleKey]?.providerId && (
                            <Select
                              value={moduleLLMs[moduleKey]?.model || ""}
                              onValueChange={(model) => {
                                const providerId = moduleLLMs[moduleKey]?.providerId || ""
                                if (providerId) {
                                  setModuleLLMs(prev => ({
                                    ...prev,
                                    [moduleKey]: { providerId, model }
                                  }))
                                }
                              }}
                              disabled={isApplyingToModule || providersLoading || !moduleLLMs[moduleKey]?.providerId}
                            >
                              <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                {getModelsForProvider(moduleLLMs[moduleKey]?.providerId || "").length === 0 ? (
                                  <SelectItem value="none" disabled>Nenhum modelo</SelectItem>
                                ) : (
                                  getModelsForProvider(moduleLLMs[moduleKey]?.providerId || "").map((model) => (
                                    <SelectItem key={model} value={model}>
                                      {model}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}

                          <Button
                            onClick={() => applyToModule(moduleKey)}
                            disabled={!moduleLLMs[moduleKey]?.providerId || !moduleLLMs[moduleKey]?.model || isApplyingToModule || providersLoading}
                            size="sm"
                            variant="default"
                            className="w-full sm:w-auto"
                          >
                            {isApplyingToModule ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Aplicando...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-2" />
                                Aplicar ao Módulo
                              </>
                            )}
                          </Button>
                        </div>
                        {moduleLLMs[moduleKey] && (
                          <p className="text-xs text-muted-foreground mt-2">
                            LLM atual: <strong>{providers.find(p => p.id === moduleLLMs[moduleKey]?.providerId)?.displayName}</strong> • {moduleLLMs[moduleKey]?.model}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {module.types.map((serviceType) => {
                    const currentConfig = getCurrentConfig(serviceType)
                    const assignment = serviceAssignments[serviceType] || {}
                    const isConfigured = !!currentConfig.providerId
                    const isSaving = saving[serviceType]

                    return (
                      <div 
                        key={serviceType}
                        className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium">
                              {AI_SERVICE_DISPLAY_NAMES[serviceType] || serviceType}
                            </Label>
                            {isConfigured && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Configurado
                              </Badge>
                            )}
                          </div>
                          {isConfigured && currentConfig.providerName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Usando: <strong>{currentConfig.providerName}</strong> • {currentConfig.model}
                            </div>
                          )}
                          {!isConfigured && (
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <XCircle className="h-3 w-3" />
                              Não configurado
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 items-center flex-1 sm:flex-initial sm:w-auto">
                          <Select
                            value={assignment.providerId || currentConfig.providerId || ""}
                            onValueChange={(providerId) => {
                              const models = getModelsForProvider(providerId)
                              const currentModel = assignment.model || currentConfig.model || models[0] || ""
                              updateAssignment(serviceType, providerId, currentModel)
                            }}
                            disabled={isSaving || providersLoading}
                          >
                            <SelectTrigger className="w-full sm:w-48">
                              <SelectValue placeholder="Selecione o provedor" />
                            </SelectTrigger>
                            <SelectContent>
                              {providersLoading ? (
                                <SelectItem value="loading" disabled>Carregando...</SelectItem>
                              ) : providers.filter(p => p.isActive).length === 0 ? (
                                <SelectItem value="none" disabled>Nenhum provedor disponível</SelectItem>
                              ) : (
                                providers.filter(p => p.isActive).map((provider) => (
                                  <SelectItem key={provider.id} value={provider.id}>
                                    {provider.displayName}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>

                          {(assignment.providerId || currentConfig.providerId) && (
                            <Select
                              value={assignment.model || currentConfig.model || ""}
                              onValueChange={(model) => {
                                const providerId = assignment.providerId || currentConfig.providerId || ""
                                if (providerId) {
                                  updateAssignment(serviceType, providerId, model)
                                }
                              }}
                              disabled={isSaving || providersLoading || (!assignment.providerId && !currentConfig.providerId)}
                            >
                              <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Modelo" />
                              </SelectTrigger>
                              <SelectContent>
                                {getModelsForProvider(assignment.providerId || currentConfig.providerId || "").length === 0 ? (
                                  <SelectItem value="none" disabled>Nenhum modelo</SelectItem>
                                ) : (
                                  getModelsForProvider(assignment.providerId || currentConfig.providerId || "").map((model) => (
                                    <SelectItem key={model} value={model}>
                                      {model}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          )}

                          <Button
                            onClick={() => saveServiceConfig(serviceType)}
                            disabled={(!assignment.providerId && !currentConfig.providerId) || (!assignment.model && !currentConfig.model) || isSaving || providersLoading}
                            size="sm"
                            variant={isConfigured ? "default" : "outline"}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                {isConfigured ? "Atualizar" : "Salvar"}
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            )
          })}
        </div>
      )}

      {Object.keys(filteredModules).length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum serviço encontrado</h3>
            <p className="text-muted-foreground text-center">
              Tente buscar com outros termos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
