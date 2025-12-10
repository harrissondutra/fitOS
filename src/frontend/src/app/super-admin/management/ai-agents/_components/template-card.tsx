"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ProviderIcon } from '@/components/ui/provider-icon'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Eye, 
  Zap, 
  DollarSign, 
  CheckCircle, 
  XCircle,
  Info,
  Star,
  Clock,
  Shield,
  Mic,
  Image,
  Code,
  Database,
  Settings,
  Gift,
  CheckCircle2
} from "lucide-react"

interface ProviderTemplate {
  id: string
  name: string
  displayName: string
  provider: string
  description: string
  icon: string
  color: string
  models: string[]
  features: string[]
  pricing: Array<{
    model: string
    inputCost: number
    outputCost: number
  }>
  capabilities: {
    chat: boolean
    vision: boolean
    audio: boolean
    embeddings: boolean
    functionCalling: boolean
    streaming: boolean
  }
  config: {
    baseUrl?: string
    timeout: number
    maxRetries: number
    headers?: Record<string, string>
  }
  setup: {
    requiresApiKey: boolean
    apiKeyPlaceholder: string
    apiKeyHelp: string
    additionalConfig?: Array<{
      key: string
      label: string
      type: 'text' | 'url' | 'number' | 'boolean'
      placeholder?: string
      help?: string
      required?: boolean
    }>
  }
  freeTier?: {
    description: string
    credits?: string
    details?: string
  }
  iconUrl?: string
}

interface TemplateCardProps {
  template: ProviderTemplate
  onSelect?: (template: ProviderTemplate) => void
  onPreview?: (template: ProviderTemplate) => void
  selected?: boolean
  recommended?: boolean
  isInstalled?: boolean
}

export function TemplateCard({ 
  template, 
  onSelect, 
  onPreview, 
  selected = false, 
  recommended = false,
  isInstalled = false
}: TemplateCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'chat':
        return <Zap className="h-4 w-4" />
      case 'vision':
        return <Image className="h-4 w-4" aria-label="Vision" />
      case 'audio':
        return <Mic className="h-4 w-4" />
      case 'embeddings':
        return <Database className="h-4 w-4" />
      case 'functionCalling':
        return <Code className="h-4 w-4" />
      case 'streaming':
        return <Clock className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
    }
  }

  const getCapabilityLabel = (capability: string) => {
    switch (capability) {
      case 'chat':
        return 'Chat'
      case 'vision':
        return 'Visão'
      case 'audio':
        return 'Áudio'
      case 'embeddings':
        return 'Embeddings'
      case 'functionCalling':
        return 'Funções'
      case 'streaming':
        return 'Streaming'
      default:
        return capability
    }
  }

  const formatCost = (cost: number) => {
    if (cost === 0) return 'Grátis'
    if (cost < 0.001) return `$${(cost * 1000).toFixed(2)}/1K`
    return `$${cost.toFixed(4)}/1K`
  }

  const getLowestCost = () => {
    const costs = template.pricing.map(p => Math.min(p.inputCost, p.outputCost))
    return Math.min(...costs)
  }

  const getCapabilities = () => {
    return Object.entries(template.capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability, _]) => capability)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Evitar click se já estiver instalado
    if (isInstalled) return
    
    // Evitar click se o target for um botão ou link
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[data-dialog-trigger]')
    ) {
      return
    }
    
    // Selecionar template e avançar
    if (onSelect) {
      onSelect(template)
    }
  }

  return (
    <>
      <Card 
        className={`relative bg-card text-foreground border border-border transition-all duration-200 ${
          selected ? 'ring-2 ring-primary' : ''
        } ${recommended ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' : ''} ${
          isInstalled 
            ? 'opacity-75 cursor-not-allowed' 
            : 'cursor-pointer hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98]'
        }`}
        onClick={handleCardClick}
      >
        <div className="absolute -top-2 -right-2 z-10 flex gap-1">
          {isInstalled && (
            <Badge className="bg-green-500 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Instalado
            </Badge>
          )}
          {recommended && !isInstalled && (
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Recomendado
            </Badge>
          )}
        </div>
        
        <CardHeader className="py-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <ProviderIcon 
                providerId={template.id} 
                iconUrl={template.iconUrl}
                emoji={template.icon}
                size={24}
              />
              <div>
                <CardTitle className="text-sm">{template.displayName}</CardTitle>
                <CardDescription className="text-xs">
                  {template.name}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="h-5 px-2 text-[10px]">
              {template.models.length} modelos
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 px-4 pb-4">
          {/* Description */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {template.description}
          </p>

          {/* Pricing */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-green-600" />
                <span className="text-xs font-medium">
                  A partir de {formatCost(getLowestCost())}
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground">{template.provider}</div>
            </div>
            {/* Free Tier */}
            {template.freeTier && (
              <div className="flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                <Gift className="h-3 w-3" />
                <span>{template.freeTier.description}</span>
              </div>
            )}
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground">Capacidades:</div>
            <div className="flex flex-wrap gap-1">
              {getCapabilities().map((capability) => (
                <Badge key={capability} variant="outline" className="h-5 px-2 text-[10px]">
                  {getCapabilityIcon(capability)}
                  <span className="ml-1">{getCapabilityLabel(capability)}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="text-[11px] font-medium text-muted-foreground">Principais recursos:</div>
            <div className="flex flex-wrap gap-1">
              {template.features.slice(0, 3).map((feature) => (
                <Badge key={feature} variant="secondary" className="h-5 px-2 text-[10px]">
                  {feature}
                </Badge>
              ))}
              {template.features.length > 3 && (
                <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                  +{template.features.length - 3} mais
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 flex-1"
                  data-dialog-trigger
                >
                  <Eye className="h-3 w-3 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
            </Dialog>
            
            {onSelect && !isInstalled && (
              <div className="flex-1 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">
                  Ou clique no card
                </p>
                <Button 
                  size="sm" 
                  className="h-7 w-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(template)
                  }}
                >
                  Selecionar
                </Button>
              </div>
            )}
            {isInstalled && (
              <div className="flex-1 text-center">
                <p className="text-[10px] text-muted-foreground">
                  Já instalado
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <ProviderIcon 
                providerId={template.id} 
                iconUrl={template.iconUrl}
                emoji={template.icon}
                size={32}
              />
              <div>
                <div>{template.displayName}</div>
                <div className="text-sm font-normal text-muted-foreground">
                  {template.name} • {template.provider}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription>
              {template.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Capabilities */}
            <div>
              <h4 className="text-sm font-medium mb-3">Capacidades</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(template.capabilities).map(([capability, enabled]) => (
                  <div key={capability} className="flex items-center space-x-2">
                    {enabled ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm">{getCapabilityLabel(capability)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Models */}
            <div>
              <h4 className="text-sm font-medium mb-3">Modelos Disponíveis</h4>
              <div className="grid grid-cols-2 gap-2">
                {template.models.map((model) => (
                  <Badge key={model} variant="outline" className="text-xs">
                    {model}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h4 className="text-sm font-medium mb-3">Preços</h4>
              {template.freeTier && (
                <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-200">
                      Free Tier
                    </span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-300">
                    {template.freeTier.description}
                  </div>
                  {template.freeTier.credits && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Créditos: {template.freeTier.credits}
                    </div>
                  )}
                  {template.freeTier.details && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {template.freeTier.details}
                    </div>
                  )}
                </div>
              )}
              <div className="space-y-2">
                {template.pricing.length > 0 ? (
                  template.pricing.map((price, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm font-medium">{price.model}</span>
                      <div className="text-xs text-muted-foreground">
                        <div>Input: {formatCost(price.inputCost)}</div>
                        <div>Output: {formatCost(price.outputCost)}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground p-2">
                    Informações de preço não disponíveis
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium mb-3">Recursos</h4>
              <div className="flex flex-wrap gap-2">
                {template.features.map((feature) => (
                  <Badge key={feature} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Setup Requirements */}
            <div>
              <h4 className="text-sm font-medium mb-3">Configuração</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {template.setup.requiresApiKey ? 'Requer API Key' : 'Não requer API Key'}
                  </span>
                </div>
                {template.setup.requiresApiKey && (
                  <div className="text-xs text-muted-foreground ml-6">
                    {template.setup.apiKeyHelp}
                  </div>
                )}
                {template.setup.additionalConfig && template.setup.additionalConfig.length > 0 && (
                  <div className="text-xs text-muted-foreground ml-6">
                    Configurações adicionais: {template.setup.additionalConfig.length}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsPreviewOpen(false)}
                className="flex-1"
              >
                Fechar
              </Button>
              {onSelect && (
                <Button 
                  onClick={() => {
                    onSelect(template)
                    setIsPreviewOpen(false)
                  }}
                  className="flex-1"
                >
                  Usar este Template
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
