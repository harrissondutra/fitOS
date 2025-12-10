"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Save, 
  X, 
  AlertCircle,
  CheckCircle,
  Brain,
  Zap,
  Clock,
  DollarSign,
  Settings
} from "lucide-react"
import { 
  AiServiceConfig, 
  AiServiceType, 
  AiProviderType,
  CreateAiServiceConfigRequest,
  UpdateAiServiceConfigRequest
} from "@/shared/types/ai.types"

interface ServiceConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateAiServiceConfigRequest | UpdateAiServiceConfigRequest) => Promise<void>
  serviceConfig?: AiServiceConfig | null
  providers: Array<{ id: string; displayName: string; provider: AiProviderType; isActive: boolean }>
  loading?: boolean
}

const SERVICE_TEMPLATES: Record<AiServiceType, {
  name: string
  description: string
  defaultModel: string
  defaultPriority: number
  defaultRateLimit: number
  defaultCost: number
  config: Record<string, any>
}> = {
  [AiServiceType.CHAT]: {
    name: "Chat Geral",
    description: "Conversação geral com IA",
    defaultModel: "gpt-4",
    defaultPriority: 100,
    defaultRateLimit: 60,
    defaultCost: 0.001,
    config: { temperature: 0.7, maxTokens: 1024 }
  },
  [AiServiceType.MULTIAGENT_CHAT]: {
    name: "Chat Multi-Agente",
    description: "Roteamento entre múltiplos agentes",
    defaultModel: "gpt-4",
    defaultPriority: 90,
    defaultRateLimit: 30,
    defaultCost: 0.002,
    config: { temperature: 0.5, maxTokens: 2048 }
  },
  [AiServiceType.VOICE_WORKOUT_COACH]: {
    name: "Coach de Voz",
    description: "Personal trainer por voz",
    defaultModel: "gpt-4",
    defaultPriority: 80,
    defaultRateLimit: 20,
    defaultCost: 0.003,
    config: { temperature: 0.8, maxTokens: 512 }
  },
  [AiServiceType.VIRTUAL_WORKOUT_BUDDY]: {
    name: "Parceiro Virtual",
    description: "Parceiro virtual motivador",
    defaultModel: "gpt-4",
    defaultPriority: 70,
    defaultRateLimit: 15,
    defaultCost: 0.002,
    config: { temperature: 0.9, maxTokens: 256 }
  },
  [AiServiceType.FORM_FILLING_ASSISTANT]: {
    name: "Assistente de Formulários",
    description: "Preenchimento automático de formulários",
    defaultModel: "gpt-3.5-turbo",
    defaultPriority: 60,
    defaultRateLimit: 100,
    defaultCost: 0.0005,
    config: { temperature: 0.3, maxTokens: 512 }
  },
  [AiServiceType.IMAGE_ANALYSIS]: {
    name: "Análise de Imagem",
    description: "Análise inteligente de imagens",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 85,
    defaultRateLimit: 10,
    defaultCost: 0.01,
    config: { temperature: 0.1, maxTokens: 1024 }
  },
  [AiServiceType.VIDEO_ANALYSIS]: {
    name: "Análise de Vídeo",
    description: "Análise de movimento em vídeos",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 80,
    defaultRateLimit: 5,
    defaultCost: 0.02,
    config: { temperature: 0.1, maxTokens: 2048 }
  },
  [AiServiceType.POSTURE_ANALYSIS]: {
    name: "Análise de Postura",
    description: "Correção de postura",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 75,
    defaultRateLimit: 20,
    defaultCost: 0.005,
    config: { temperature: 0.2, maxTokens: 512 }
  },
  [AiServiceType.EXERCISE_FORM_CHECKER]: {
    name: "Validador de Forma",
    description: "Validação de forma dos exercícios",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 90,
    defaultRateLimit: 15,
    defaultCost: 0.008,
    config: { temperature: 0.1, maxTokens: 1024 }
  },
  [AiServiceType.BODY_COMPOSITION_PREDICTOR]: {
    name: "Preditor de Composição",
    description: "Predição de composição corporal",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 70,
    defaultRateLimit: 10,
    defaultCost: 0.015,
    config: { temperature: 0.1, maxTokens: 512 }
  },
  [AiServiceType.NUTRITION_LABEL_SCANNER]: {
    name: "Scanner de Rótulos",
    description: "OCR de rótulos nutricionais",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 60,
    defaultRateLimit: 30,
    defaultCost: 0.003,
    config: { temperature: 0.1, maxTokens: 256 }
  },
  [AiServiceType.TRANSCRIPTION]: {
    name: "Transcrição",
    description: "Conversão de áudio para texto",
    defaultModel: "whisper-1",
    defaultPriority: 80,
    defaultRateLimit: 20,
    defaultCost: 0.006,
    config: { temperature: 0.0, maxTokens: 0 }
  },
  [AiServiceType.TEXT_TO_SPEECH]: {
    name: "Síntese de Voz",
    description: "Conversão de texto para voz",
    defaultModel: "tts-1",
    defaultPriority: 70,
    defaultRateLimit: 50,
    defaultCost: 0.015,
    config: { temperature: 0.0, maxTokens: 0 }
  },
  [AiServiceType.WORKOUT]: {
    name: "Geração de Treinos",
    description: "Geração de treinos personalizados",
    defaultModel: "gpt-4",
    defaultPriority: 95,
    defaultRateLimit: 25,
    defaultCost: 0.005,
    config: { temperature: 0.6, maxTokens: 2048 }
  },
  [AiServiceType.SMART_WARMUP_GENERATOR]: {
    name: "Gerador de Aquecimento",
    description: "Aquecimento específico por exercício",
    defaultModel: "gpt-3.5-turbo",
    defaultPriority: 70,
    defaultRateLimit: 40,
    defaultCost: 0.002,
    config: { temperature: 0.5, maxTokens: 1024 }
  },
  [AiServiceType.AUTO_SUBSTITUTE_EXERCISES]: {
    name: "Substituições Automáticas",
    description: "Substituições inteligentes",
    defaultModel: "gpt-3.5-turbo",
    defaultPriority: 80,
    defaultRateLimit: 30,
    defaultCost: 0.003,
    config: { temperature: 0.4, maxTokens: 1024 }
  },
  [AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER]: {
    name: "Ajustador de Dificuldade",
    description: "Ajuste dinâmico de dificuldade",
    defaultModel: "gpt-4",
    defaultPriority: 85,
    defaultRateLimit: 20,
    defaultCost: 0.004,
    config: { temperature: 0.3, maxTokens: 1024 }
  },
  [AiServiceType.RECOVERY_OPTIMIZER]: {
    name: "Otimizador de Recuperação",
    description: "Otimização baseada em HRV/sono",
    defaultModel: "gpt-4",
    defaultPriority: 75,
    defaultRateLimit: 15,
    defaultCost: 0.006,
    config: { temperature: 0.4, maxTokens: 1536 }
  },
  [AiServiceType.INJURY_PREDICTION]: {
    name: "Predição de Lesões",
    description: "Prevenção de lesões",
    defaultModel: "gpt-4",
    defaultPriority: 90,
    defaultRateLimit: 10,
    defaultCost: 0.008,
    config: { temperature: 0.2, maxTokens: 1024 }
  },
  [AiServiceType.NUTRITION]: {
    name: "Análise Nutricional",
    description: "Análise nutricional completa",
    defaultModel: "gpt-4",
    defaultPriority: 85,
    defaultRateLimit: 20,
    defaultCost: 0.004,
    config: { temperature: 0.5, maxTokens: 1536 }
  },
  [AiServiceType.MEAL_PLAN_GENERATION]: {
    name: "Geração de Cardápio",
    description: "Cardápio semanal personalizado",
    defaultModel: "gpt-4",
    defaultPriority: 80,
    defaultRateLimit: 10,
    defaultCost: 0.01,
    config: { temperature: 0.6, maxTokens: 2048 }
  },
  [AiServiceType.SUPPLEMENT_RECOMMENDATION]: {
    name: "Recomendação de Suplementos",
    description: "Recomendação de suplementos",
    defaultModel: "gpt-4",
    defaultPriority: 70,
    defaultRateLimit: 15,
    defaultCost: 0.005,
    config: { temperature: 0.4, maxTokens: 1024 }
  },
  [AiServiceType.MEDICAL_OCR]: {
    name: "OCR Médico",
    description: "OCR de exames médicos",
    defaultModel: "gpt-4-vision-preview",
    defaultPriority: 95,
    defaultRateLimit: 5,
    defaultCost: 0.02,
    config: { temperature: 0.0, maxTokens: 1024 }
  },
  [AiServiceType.SENTIMENT_ANALYSIS]: {
    name: "Análise de Sentimento",
    description: "Análise de sentimento do usuário",
    defaultModel: "gpt-3.5-turbo",
    defaultPriority: 60,
    defaultRateLimit: 100,
    defaultCost: 0.001,
    config: { temperature: 0.1, maxTokens: 256 }
  },
  [AiServiceType.MOTIVATION_DETECTION]: {
    name: "Detecção de Motivação",
    description: "Detecção de desmotivação",
    defaultModel: "gpt-4",
    defaultPriority: 75,
    defaultRateLimit: 30,
    defaultCost: 0.003,
    config: { temperature: 0.3, maxTokens: 512 }
  },
  [AiServiceType.MENTAL_HEALTH_MONITOR]: {
    name: "Monitor de Saúde Mental",
    description: "Monitoramento de saúde mental",
    defaultModel: "gpt-4",
    defaultPriority: 90,
    defaultRateLimit: 20,
    defaultCost: 0.005,
    config: { temperature: 0.2, maxTokens: 1024 }
  },
  [AiServiceType.ANALYTICS]: {
    name: "Analytics",
    description: "Business intelligence avançado",
    defaultModel: "gpt-4",
    defaultPriority: 85,
    defaultRateLimit: 10,
    defaultCost: 0.01,
    config: { temperature: 0.1, maxTokens: 2048 }
  },
  [AiServiceType.CHURN]: {
    name: "Predição de Churn",
    description: "Predição de cancelamento",
    defaultModel: "gpt-4",
    defaultPriority: 95,
    defaultRateLimit: 5,
    defaultCost: 0.015,
    config: { temperature: 0.1, maxTokens: 1024 }
  },
  [AiServiceType.REVENUE_PREDICTION]: {
    name: "Predição de Receita",
    description: "Previsão de receita",
    defaultModel: "gpt-4",
    defaultPriority: 90,
    defaultRateLimit: 5,
    defaultCost: 0.012,
    config: { temperature: 0.1, maxTokens: 1536 }
  },
  [AiServiceType.MARKET_INTELLIGENCE]: {
    name: "Inteligência de Mercado",
    description: "Análise de mercado",
    defaultModel: "gpt-4",
    defaultPriority: 80,
    defaultRateLimit: 8,
    defaultCost: 0.008,
    config: { temperature: 0.2, maxTokens: 2048 }
  },
  [AiServiceType.COMPETITOR_WORKOUT_DETECTOR]: {
    name: "Detector de Tendências",
    description: "Detecção de tendências",
    defaultModel: "gpt-4",
    defaultPriority: 70,
    defaultRateLimit: 15,
    defaultCost: 0.006,
    config: { temperature: 0.3, maxTokens: 1536 }
  },
  [AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT]: {
    name: "Assistente de Upgrade",
    description: "Oportunidades de upgrade",
    defaultModel: "gpt-4",
    defaultPriority: 75,
    defaultRateLimit: 20,
    defaultCost: 0.004,
    config: { temperature: 0.5, maxTokens: 1024 }
  },
  [AiServiceType.CONTENT_GENERATION]: {
    name: "Geração de Conteúdo",
    description: "Geração de conteúdo automática",
    defaultModel: "gpt-4",
    defaultPriority: 70,
    defaultRateLimit: 25,
    defaultCost: 0.003,
    config: { temperature: 0.7, maxTokens: 1536 }
  },
  [AiServiceType.AUTOMATIC_PROGRESS_REPORTS]: {
    name: "Relatórios Automáticos",
    description: "Relatórios de progresso automáticos",
    defaultModel: "gpt-4",
    defaultPriority: 80,
    defaultRateLimit: 10,
    defaultCost: 0.008,
    config: { temperature: 0.4, maxTokens: 2048 }
  },
  [AiServiceType.VIDEO_GENERATION]: {
    name: "Geração de Vídeo",
    description: "Geração de vídeos com avatar IA",
    defaultModel: "gpt-4",
    defaultPriority: 60,
    defaultRateLimit: 5,
    defaultCost: 0.05,
    config: { temperature: 0.6, maxTokens: 1024 }
  },
  [AiServiceType.PLAYLIST_GENERATION]: {
    name: "Geração de Playlist",
    description: "Playlists Spotify personalizadas",
    defaultModel: "gpt-3.5-turbo",
    defaultPriority: 50,
    defaultRateLimit: 30,
    defaultCost: 0.002,
    config: { temperature: 0.8, maxTokens: 512 }
  },
  [AiServiceType.SCHEDULING_ASSISTANT]: {
    name: "Assistente de Agendamento",
    description: "Agendamento inteligente",
    defaultModel: "gpt-4",
    defaultPriority: 85,
    defaultRateLimit: 20,
    defaultCost: 0.004,
    config: { temperature: 0.3, maxTokens: 1024 }
  },
  [AiServiceType.EMBEDDINGS]: {
    name: "Embeddings",
    description: "Vector embeddings para busca",
    defaultModel: "text-embedding-ada-002",
    defaultPriority: 90,
    defaultRateLimit: 100,
    defaultCost: 0.0001,
    config: { temperature: 0.0, maxTokens: 0 }
  },
  [AiServiceType.RAG_COACH]: {
    name: "Coach RAG",
    description: "Coach com memória contextual",
    defaultModel: "gpt-4",
    defaultPriority: 85,
    defaultRateLimit: 15,
    defaultCost: 0.006,
    config: { temperature: 0.5, maxTokens: 1536 }
  },
  [AiServiceType.RAG_NUTRITION]: {
    name: "Nutricionista RAG",
    description: "Nutricionista com contexto",
    defaultModel: "gpt-4",
    defaultPriority: 80,
    defaultRateLimit: 20,
    defaultCost: 0.005,
    config: { temperature: 0.4, maxTokens: 1536 }
  },
  [AiServiceType.RAG_MEDICAL]: {
    name: "Assistente Médico RAG",
    description: "Assistente médico contextual",
    defaultModel: "gpt-4",
    defaultPriority: 95,
    defaultRateLimit: 10,
    defaultCost: 0.01,
    config: { temperature: 0.2, maxTokens: 1536 }
  },
  [AiServiceType.CUSTOM]: {
    name: "Serviço Customizado",
    description: "Serviços customizados",
    defaultModel: "gpt-4",
    defaultPriority: 50,
    defaultRateLimit: 20,
    defaultCost: 0.005,
    config: { temperature: 0.7, maxTokens: 1024 }
  }
}

export function ServiceConfigModal({ 
  isOpen, 
  onClose, 
  onSave, 
  serviceConfig, 
  providers,
  loading = false 
}: ServiceConfigModalProps) {
  const [formData, setFormData] = useState<CreateAiServiceConfigRequest>({
    serviceType: AiServiceType.CHAT,
    serviceName: "",
    providerId: "",
    model: "",
    priority: 100,
    isActive: true,
    config: {},
    maxRequestsPerMinute: 60,
    costPerRequest: 0.001
  })

  const [error, setError] = useState<string | null>(null)

  // Initialize form data when modal opens - usar ref para evitar loops
  const prevIsOpenRef = React.useRef(false);
  const prevServiceConfigIdRef = React.useRef<string | undefined>(undefined);
  
  useEffect(() => {
    // Só inicializar quando modal abrir (mudança de false para true) ou quando serviceConfig mudar
    const isOpening = !prevIsOpenRef.current && isOpen;
    const serviceConfigChanged = serviceConfig?.id !== prevServiceConfigIdRef.current;
    
    if (isOpen && (isOpening || serviceConfigChanged)) {
      prevIsOpenRef.current = isOpen;
      prevServiceConfigIdRef.current = serviceConfig?.id;
      
      if (serviceConfig) {
        // Edit mode
        setFormData({
          serviceType: serviceConfig.serviceType,
          serviceName: serviceConfig.serviceName || "",
          providerId: serviceConfig.providerId,
          model: serviceConfig.model,
          priority: serviceConfig.priority,
          isActive: serviceConfig.isActive,
          config: serviceConfig.config || {},
          maxRequestsPerMinute: serviceConfig.maxRequestsPerMinute || 60,
          costPerRequest: serviceConfig.costPerRequest || 0.001
        })
        prevServiceTypeRef.current = serviceConfig.serviceType;
      } else {
        // Create mode - reset to defaults
        setFormData({
          serviceType: AiServiceType.CHAT,
          serviceName: "",
          providerId: "",
          model: "",
          priority: 100,
          isActive: true,
          config: {},
          maxRequestsPerMinute: 60,
          costPerRequest: 0.001
        })
        prevServiceTypeRef.current = AiServiceType.CHAT;
      }
      setError(null)
      isUpdatingRef.current = false;
    }
    
    if (!isOpen) {
      prevIsOpenRef.current = false;
    }
  }, [isOpen, serviceConfig])

  // Update form when service type changes - usar ref para evitar loops
  const prevServiceTypeRef = React.useRef<string | undefined>(undefined);
  const isUpdatingRef = React.useRef(false);
  
  useEffect(() => {
    // Proteção contra loops: só atualizar se realmente mudou e não está atualizando
    if (isUpdatingRef.current) return;
    
    if (formData.serviceType && formData.serviceType !== prevServiceTypeRef.current) {
      isUpdatingRef.current = true;
      prevServiceTypeRef.current = formData.serviceType;
      const template = SERVICE_TEMPLATES[formData.serviceType]
      if (template) {
        setFormData(prev => {
          // Só atualizar campos vazios para não sobrescrever dados do usuário
          const shouldUpdate = !prev.serviceName || !prev.model || !prev.providerId;
          if (!shouldUpdate) {
            isUpdatingRef.current = false;
            return prev;
          }
          
          isUpdatingRef.current = false;
          return {
            ...prev,
            serviceName: prev.serviceName || template.name,
            model: prev.model || template.defaultModel,
            priority: prev.priority || template.defaultPriority,
            maxRequestsPerMinute: prev.maxRequestsPerMinute || template.defaultRateLimit,
            costPerRequest: prev.costPerRequest || template.defaultCost,
            config: prev.config && Object.keys(prev.config).length > 0 ? prev.config : template.config
          }
        })
      } else {
        isUpdatingRef.current = false;
      }
    }
  }, [formData.serviceType])

  const handleSubmit = async () => {
    setError(null)

    // Validation
    if (!formData.serviceName || !formData.providerId || !formData.model) {
      setError("Nome do serviço, provedor e modelo são obrigatórios")
      return
    }

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração')
    }
  }

  const activeProviders = providers.filter(p => p.isActive)
  const selectedProvider = providers.find(p => p.id === formData.providerId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>
              {serviceConfig ? 'Editar Serviço' : 'Novo Serviço'}
            </span>
          </DialogTitle>
          <DialogDescription>
            Configure um serviço de IA para uso na aplicação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Type Selection */}
          <div>
            <Label htmlFor="serviceType">Tipo de Serviço</Label>
            <Select 
              value={formData.serviceType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, serviceType: value as AiServiceType }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de serviço" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SERVICE_TEMPLATES).map(([type, template]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center space-x-2">
                      <span>{template.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.description}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="serviceName">Nome do Serviço</Label>
              <Input
                id="serviceName"
                value={formData.serviceName}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                placeholder="Nome personalizado do serviço"
              />
            </div>

            <div>
              <Label htmlFor="providerId">Provedor</Label>
              <Select 
                value={formData.providerId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, providerId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  {activeProviders.map((provider) => (
                    <SelectItem key={provider.id} value={provider.id}>
                      <div className="flex items-center space-x-2">
                        <span>{provider.displayName}</span>
                        <Badge variant="outline" className="text-xs">
                          {provider.provider}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Nome do modelo"
              />
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Input
                id="priority"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                placeholder="100"
              />
            </div>

            <div>
              <Label htmlFor="maxRequestsPerMinute">Rate Limit (req/min)</Label>
              <Input
                id="maxRequestsPerMinute"
                type="number"
                value={formData.maxRequestsPerMinute}
                onChange={(e) => setFormData(prev => ({ ...prev, maxRequestsPerMinute: parseInt(e.target.value) }))}
                placeholder="60"
              />
            </div>

            <div>
              <Label htmlFor="costPerRequest">Custo por Request ($)</Label>
              <Input
                id="costPerRequest"
                type="number"
                step="0.001"
                value={formData.costPerRequest}
                onChange={(e) => setFormData(prev => ({ ...prev, costPerRequest: parseFloat(e.target.value) }))}
                placeholder="0.001"
              />
            </div>
          </div>

          {/* Advanced Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Configuração Avançada</CardTitle>
              <CardDescription>
                Parâmetros específicos do modelo de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.config?.temperature || 0.7}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      config: { ...(prev.config || {}), temperature: parseFloat(e.target.value) }
                    }))}
                    placeholder="0.7"
                  />
                </div>

                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={formData.config?.maxTokens || 1024}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      config: { ...(prev.config || {}), maxTokens: parseInt(e.target.value) }
                    }))}
                    placeholder="1024"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Serviço Ativo</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview da Configuração</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Tipo:</span>
                  <div className="font-medium">{SERVICE_TEMPLATES[formData.serviceType]?.name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Provedor:</span>
                  <div className="font-medium">{selectedProvider?.displayName || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Modelo:</span>
                  <div className="font-medium">{formData.model}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Prioridade:</span>
                  <div className="font-medium">{formData.priority}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Rate Limit:</span>
                  <div className="font-medium">{formData.maxRequestsPerMinute}/min</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Custo:</span>
                  <div className="font-medium">${formData.costPerRequest}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 pt-6">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Settings className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
