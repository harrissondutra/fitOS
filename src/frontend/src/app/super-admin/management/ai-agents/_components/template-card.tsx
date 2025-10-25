"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  Settings
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
}

interface TemplateCardProps {
  template: ProviderTemplate
  onSelect?: (template: ProviderTemplate) => void
  onPreview?: (template: ProviderTemplate) => void
  selected?: boolean
  recommended?: boolean
}

export function TemplateCard({ 
  template, 
  onSelect, 
  onPreview, 
  selected = false, 
  recommended = false 
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

  return (
    <>
      <Card className={`relative transition-all duration-200 hover:shadow-lg ${
        selected ? 'ring-2 ring-primary' : ''
      } ${recommended ? 'border-yellow-300 bg-yellow-50' : ''}`}>
        {recommended && (
          <div className="absolute -top-2 -right-2 z-10">
            <Badge className="bg-yellow-500 text-white">
              <Star className="h-3 w-3 mr-1" />
              Recomendado
            </Badge>
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{template.icon}</div>
              <div>
                <CardTitle className="text-lg">{template.displayName}</CardTitle>
                <CardDescription className="text-sm">
                  {template.name}
                </CardDescription>
              </div>
            </div>
            <Badge className={template.color}>
              {template.provider}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                A partir de {formatCost(getLowestCost())}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {template.models.length} modelos
            </div>
          </div>

          {/* Capabilities */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Capacidades:</div>
            <div className="flex flex-wrap gap-1">
              {getCapabilities().map((capability) => (
                <Badge key={capability} variant="outline" className="text-xs">
                  {getCapabilityIcon(capability)}
                  <span className="ml-1">{getCapabilityLabel(capability)}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Principais recursos:</div>
            <div className="flex flex-wrap gap-1">
              {template.features.slice(0, 3).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {template.features.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.features.length - 3} mais
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </DialogTrigger>
            </Dialog>
            
            {onSelect && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onSelect(template)}
              >
                Selecionar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <span className="text-2xl">{template.icon}</span>
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
              <div className="space-y-2">
                {template.pricing.map((price, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{price.model}</span>
                    <div className="text-xs text-muted-foreground">
                      <div>Input: {formatCost(price.inputCost)}</div>
                      <div>Output: {formatCost(price.outputCost)}</div>
                    </div>
                  </div>
                ))}
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
