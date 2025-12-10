"use client"

import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Settings, 
  MoreHorizontal, 
  Play, 
  Pause, 
  Edit, 
  Copy,
  Trash2,
  Zap,
  Clock,
  DollarSign,
  Activity,
  CheckCircle,
  AlertCircle,
  Brain
} from "lucide-react"
import { AiServiceConfig, AiServiceType } from "@/shared/types/ai.types"

interface ServiceCardProps {
  serviceConfig: AiServiceConfig
  onEdit: (config: AiServiceConfig) => void
  onToggle: (id: string, isActive: boolean) => void
  onDuplicate: (config: AiServiceConfig) => void
  onDelete: (id: string) => void
  onTest: (id: string) => void
}

const SERVICE_ICONS: Record<AiServiceType, string> = {
  [AiServiceType.CHAT]: "💬",
  [AiServiceType.MULTIAGENT_CHAT]: "🤖",
  [AiServiceType.VOICE_WORKOUT_COACH]: "🎤",
  [AiServiceType.VIRTUAL_WORKOUT_BUDDY]: "🏃",
  [AiServiceType.FORM_FILLING_ASSISTANT]: "📝",
  [AiServiceType.IMAGE_ANALYSIS]: "📸",
  [AiServiceType.VIDEO_ANALYSIS]: "🎥",
  [AiServiceType.POSTURE_ANALYSIS]: "🧍",
  [AiServiceType.EXERCISE_FORM_CHECKER]: "✅",
  [AiServiceType.BODY_COMPOSITION_PREDICTOR]: "📊",
  [AiServiceType.NUTRITION_LABEL_SCANNER]: "🏷️",
  [AiServiceType.TRANSCRIPTION]: "🎙️",
  [AiServiceType.TEXT_TO_SPEECH]: "🔊",
  [AiServiceType.WORKOUT]: "🏋️",
  [AiServiceType.SMART_WARMUP_GENERATOR]: "🔥",
  [AiServiceType.AUTO_SUBSTITUTE_EXERCISES]: "🔄",
  [AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER]: "⚖️",
  [AiServiceType.RECOVERY_OPTIMIZER]: "😴",
  [AiServiceType.INJURY_PREDICTION]: "⚠️",
  [AiServiceType.NUTRITION]: "🥗",
  [AiServiceType.MEAL_PLAN_GENERATION]: "📅",
  [AiServiceType.SUPPLEMENT_RECOMMENDATION]: "💊",
  [AiServiceType.MEDICAL_OCR]: "🏥",
  [AiServiceType.SENTIMENT_ANALYSIS]: "😊",
  [AiServiceType.MOTIVATION_DETECTION]: "💪",
  [AiServiceType.MENTAL_HEALTH_MONITOR]: "🧠",
  [AiServiceType.ANALYTICS]: "📈",
  [AiServiceType.CHURN]: "📉",
  [AiServiceType.REVENUE_PREDICTION]: "💰",
  [AiServiceType.MARKET_INTELLIGENCE]: "🔍",
  [AiServiceType.COMPETITOR_WORKOUT_DETECTOR]: "🏆",
  [AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT]: "⬆️",
  [AiServiceType.CONTENT_GENERATION]: "✍️",
  [AiServiceType.AUTOMATIC_PROGRESS_REPORTS]: "📋",
  [AiServiceType.VIDEO_GENERATION]: "🎬",
  [AiServiceType.PLAYLIST_GENERATION]: "🎵",
  [AiServiceType.SCHEDULING_ASSISTANT]: "📅",
  [AiServiceType.EMBEDDINGS]: "🔗",
  [AiServiceType.RAG_COACH]: "🎯",
  [AiServiceType.RAG_NUTRITION]: "🍎",
  [AiServiceType.RAG_MEDICAL]: "🩺",
  [AiServiceType.CUSTOM]: "⚙️"
}

const SERVICE_CATEGORIES: Record<string, { name: string; color: string; services: AiServiceType[] }> = {
  conversation: {
    name: "Conversação",
    color: "bg-blue-100 text-blue-800",
    services: [
      AiServiceType.CHAT,
      AiServiceType.MULTIAGENT_CHAT,
      AiServiceType.VOICE_WORKOUT_COACH,
      AiServiceType.VIRTUAL_WORKOUT_BUDDY,
      AiServiceType.FORM_FILLING_ASSISTANT
    ]
  },
  visual: {
    name: "Visual",
    color: "bg-purple-100 text-purple-800",
    services: [
      AiServiceType.IMAGE_ANALYSIS,
      AiServiceType.VIDEO_ANALYSIS,
      AiServiceType.POSTURE_ANALYSIS,
      AiServiceType.EXERCISE_FORM_CHECKER,
      AiServiceType.BODY_COMPOSITION_PREDICTOR,
      AiServiceType.NUTRITION_LABEL_SCANNER
    ]
  },
  audio: {
    name: "Áudio",
    color: "bg-green-100 text-green-800",
    services: [
      AiServiceType.TRANSCRIPTION,
      AiServiceType.TEXT_TO_SPEECH
    ]
  },
  workout: {
    name: "Treinos",
    color: "bg-orange-100 text-orange-800",
    services: [
      AiServiceType.WORKOUT,
      AiServiceType.SMART_WARMUP_GENERATOR,
      AiServiceType.AUTO_SUBSTITUTE_EXERCISES,
      AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER,
      AiServiceType.RECOVERY_OPTIMIZER,
      AiServiceType.INJURY_PREDICTION
    ]
  },
  nutrition: {
    name: "Nutrição",
    color: "bg-yellow-100 text-yellow-800",
    services: [
      AiServiceType.NUTRITION,
      AiServiceType.MEAL_PLAN_GENERATION,
      AiServiceType.SUPPLEMENT_RECOMMENDATION
    ]
  },
  health: {
    name: "Saúde",
    color: "bg-red-100 text-red-800",
    services: [
      AiServiceType.MEDICAL_OCR,
      AiServiceType.SENTIMENT_ANALYSIS,
      AiServiceType.MOTIVATION_DETECTION,
      AiServiceType.MENTAL_HEALTH_MONITOR
    ]
  },
  business: {
    name: "Business",
    color: "bg-indigo-100 text-indigo-800",
    services: [
      AiServiceType.ANALYTICS,
      AiServiceType.CHURN,
      AiServiceType.REVENUE_PREDICTION,
      AiServiceType.MARKET_INTELLIGENCE,
      AiServiceType.COMPETITOR_WORKOUT_DETECTOR,
      AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT
    ]
  },
  content: {
    name: "Conteúdo",
    color: "bg-pink-100 text-pink-800",
    services: [
      AiServiceType.CONTENT_GENERATION,
      AiServiceType.AUTOMATIC_PROGRESS_REPORTS,
      AiServiceType.VIDEO_GENERATION,
      AiServiceType.PLAYLIST_GENERATION
    ]
  },
  automation: {
    name: "Automação",
    color: "bg-gray-100 text-gray-800",
    services: [
      AiServiceType.SCHEDULING_ASSISTANT
    ]
  },
  rag: {
    name: "RAG",
    color: "bg-cyan-100 text-cyan-800",
    services: [
      AiServiceType.EMBEDDINGS,
      AiServiceType.RAG_COACH,
      AiServiceType.RAG_NUTRITION,
      AiServiceType.RAG_MEDICAL
    ]
  },
  custom: {
    name: "Customizado",
    color: "bg-slate-100 text-slate-800",
    services: [
      AiServiceType.CUSTOM
    ]
  }
}

export const ServiceCard = React.memo(function ServiceCard({ 
  serviceConfig, 
  onEdit, 
  onToggle, 
  onDuplicate, 
  onDelete, 
  onTest 
}: ServiceCardProps) {
  const [isToggling, setIsToggling] = useState(false)

  const getCategory = useCallback((serviceType: AiServiceType) => {
    for (const [key, category] of Object.entries(SERVICE_CATEGORIES)) {
      if (category.services.includes(serviceType)) {
        return { key, ...category }
      }
    }
    return { key: 'custom', name: 'Customizado', color: 'bg-slate-100 text-slate-800', services: [] }
  }, [])

  const category = getCategory(serviceConfig.serviceType)
  const icon = SERVICE_ICONS[serviceConfig.serviceType] || "⚙️"

  const handleToggle = useCallback(async () => {
    setIsToggling(true)
    try {
      await onToggle(serviceConfig.id, !serviceConfig.isActive)
    } finally {
      setIsToggling(false)
    }
  }, [serviceConfig.id, serviceConfig.isActive, onToggle])

  const getServiceDescription = useCallback((serviceType: AiServiceType): string => {
    const descriptions: Record<AiServiceType, string> = {
      [AiServiceType.CHAT]: "Conversação geral com IA",
      [AiServiceType.MULTIAGENT_CHAT]: "Roteamento entre múltiplos agentes",
      [AiServiceType.VOICE_WORKOUT_COACH]: "Personal trainer por voz",
      [AiServiceType.VIRTUAL_WORKOUT_BUDDY]: "Parceiro virtual motivador",
      [AiServiceType.FORM_FILLING_ASSISTANT]: "Preenchimento automático de formulários",
      [AiServiceType.IMAGE_ANALYSIS]: "Análise inteligente de imagens",
      [AiServiceType.VIDEO_ANALYSIS]: "Análise de movimento em vídeos",
      [AiServiceType.POSTURE_ANALYSIS]: "Correção de postura",
      [AiServiceType.EXERCISE_FORM_CHECKER]: "Validação de forma dos exercícios",
      [AiServiceType.BODY_COMPOSITION_PREDICTOR]: "Predição de composição corporal",
      [AiServiceType.NUTRITION_LABEL_SCANNER]: "OCR de rótulos nutricionais",
      [AiServiceType.TRANSCRIPTION]: "Conversão de áudio para texto",
      [AiServiceType.TEXT_TO_SPEECH]: "Conversão de texto para voz",
      [AiServiceType.WORKOUT]: "Geração de treinos personalizados",
      [AiServiceType.SMART_WARMUP_GENERATOR]: "Aquecimento específico por exercício",
      [AiServiceType.AUTO_SUBSTITUTE_EXERCISES]: "Substituições inteligentes",
      [AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER]: "Ajuste dinâmico de dificuldade",
      [AiServiceType.RECOVERY_OPTIMIZER]: "Otimização baseada em HRV/sono",
      [AiServiceType.INJURY_PREDICTION]: "Prevenção de lesões",
      [AiServiceType.NUTRITION]: "Análise nutricional completa",
      [AiServiceType.MEAL_PLAN_GENERATION]: "Cardápio semanal personalizado",
      [AiServiceType.SUPPLEMENT_RECOMMENDATION]: "Recomendação de suplementos",
      [AiServiceType.MEDICAL_OCR]: "OCR de exames médicos",
      [AiServiceType.SENTIMENT_ANALYSIS]: "Análise de sentimento do usuário",
      [AiServiceType.MOTIVATION_DETECTION]: "Detecção de desmotivação",
      [AiServiceType.MENTAL_HEALTH_MONITOR]: "Monitoramento de saúde mental",
      [AiServiceType.ANALYTICS]: "Business intelligence avançado",
      [AiServiceType.CHURN]: "Predição de cancelamento",
      [AiServiceType.REVENUE_PREDICTION]: "Previsão de receita",
      [AiServiceType.MARKET_INTELLIGENCE]: "Análise de mercado",
      [AiServiceType.COMPETITOR_WORKOUT_DETECTOR]: "Detecção de tendências",
      [AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT]: "Oportunidades de upgrade",
      [AiServiceType.CONTENT_GENERATION]: "Geração de conteúdo automática",
      [AiServiceType.AUTOMATIC_PROGRESS_REPORTS]: "Relatórios de progresso automáticos",
      [AiServiceType.VIDEO_GENERATION]: "Geração de vídeos com avatar IA",
      [AiServiceType.PLAYLIST_GENERATION]: "Playlists Spotify personalizadas",
      [AiServiceType.SCHEDULING_ASSISTANT]: "Agendamento inteligente",
      [AiServiceType.EMBEDDINGS]: "Vector embeddings para busca",
      [AiServiceType.RAG_COACH]: "Coach com memória contextual",
      [AiServiceType.RAG_NUTRITION]: "Nutricionista com contexto",
      [AiServiceType.RAG_MEDICAL]: "Assistente médico contextual",
      [AiServiceType.CUSTOM]: "Serviços customizados"
    }
    return descriptions[serviceType] || "Serviço personalizado"
  }, [])

  const serviceDescription = getServiceDescription(serviceConfig.serviceType)

  // Memoizar handlers de dropdown para evitar recriação
  const handleTest = useCallback(() => {
    onTest(serviceConfig.id)
  }, [serviceConfig.id, onTest])

  const handleEdit = useCallback(() => {
    onEdit(serviceConfig)
  }, [serviceConfig, onEdit])

  const handleDuplicate = useCallback(() => {
    onDuplicate(serviceConfig)
  }, [serviceConfig, onDuplicate])

  const handleDelete = useCallback(() => {
    onDelete(serviceConfig.id)
  }, [serviceConfig.id, onDelete])

  return (
    <Card className={`transition-all hover:shadow-md ${!serviceConfig.isActive ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{icon}</span>
            <div>
              <CardTitle className="text-base">{serviceConfig.serviceName}</CardTitle>
              <CardDescription className="text-sm">
                {serviceDescription}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={category.color}>
              {category.name}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleTest}>
                  <Play className="mr-2 h-4 w-4" />
                  Testar Serviço
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {serviceConfig.isActive ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {serviceConfig.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <Switch
              checked={serviceConfig.isActive}
              onCheckedChange={handleToggle}
              disabled={isToggling}
            />
          </div>

          {/* Configuration Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <Brain className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Modelo:</span>
              <span className="font-medium">{serviceConfig.model}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Prioridade:</span>
              <span className="font-medium">{serviceConfig.priority}</span>
            </div>
            {serviceConfig.maxRequestsPerMinute && (
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-medium">{serviceConfig.maxRequestsPerMinute}/min</span>
              </div>
            )}
            {serviceConfig.costPerRequest && (
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Custo:</span>
                <span className="font-medium">${serviceConfig.costPerRequest}</span>
              </div>
            )}
          </div>

          {/* Provider Info */}
          <div className="text-xs text-muted-foreground">
            <span>Provedor: </span>
            <span className="font-medium">{serviceConfig.provider?.displayName || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}, (prevProps, nextProps) => {
  // Comparação customizada para React.memo
  return (
    prevProps.serviceConfig.id === nextProps.serviceConfig.id &&
    prevProps.serviceConfig.isActive === nextProps.serviceConfig.isActive &&
    prevProps.serviceConfig.serviceName === nextProps.serviceConfig.serviceName &&
    prevProps.serviceConfig.model === nextProps.serviceConfig.model &&
    prevProps.serviceConfig.priority === nextProps.serviceConfig.priority &&
    prevProps.serviceConfig.maxRequestsPerMinute === nextProps.serviceConfig.maxRequestsPerMinute &&
    prevProps.serviceConfig.costPerRequest === nextProps.serviceConfig.costPerRequest &&
    prevProps.serviceConfig.provider?.displayName === nextProps.serviceConfig.provider?.displayName
  )
})
