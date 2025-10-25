"use client"

import { useState } from 'react'
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
  ChevronLeft, 
  ChevronRight, 
  Check, 
  AlertCircle,
  Server,
  Key,
  Settings,
  Zap,
  Globe,
  Shield,
  Search,
  Filter,
  Star
} from "lucide-react"
import { useAiProviders } from "../_hooks/use-ai-providers"
import { useAiTemplates } from "../_hooks/use-ai-templates"
import { AiProviderType, CreateAiProviderRequest } from "@/shared/types/ai.types"
import { TemplateCard } from "./template-card"

interface ProviderWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ProviderWizard({ isOpen, onClose, onSuccess }: ProviderWizardProps) {
  const { createProvider } = useAiProviders()
  const { templates, generateConfig, validateConfig, getRecommendedTemplates } = useAiTemplates()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCapability, setFilterCapability] = useState<string>("all")
  
  const [formData, setFormData] = useState<CreateAiProviderRequest>({
    name: "",
    displayName: "",
    provider: AiProviderType.OPENAI,
    apiKey: "",
    baseUrl: "",
    models: [],
    isDefault: false,
    isAsync: false,
    timeout: 30000,
    maxRetries: 3,
    config: {},
    headers: {}
  })

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleTemplateSelect = async (template: any) => {
    setSelectedTemplate(template)
    
    try {
      const config = await generateConfig(template.id)
      if (config) {
        setFormData(prev => ({
          ...prev,
          provider: template.provider,
          name: template.name.toLowerCase().replace(/\s+/g, '-'),
          displayName: template.displayName,
          baseUrl: config.config?.baseUrl || template.config.baseUrl,
          models: config.models || template.models,
          timeout: config.timeout || template.config.timeout,
          maxRetries: config.maxRetries || template.config.maxRetries,
          config: config.config || template.config,
          headers: config.config?.headers || template.config.headers
        }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar configuração')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    try {
      // Validar configuração se template foi selecionado
      if (selectedTemplate) {
        const validation = await validateConfig(selectedTemplate.id, formData)
        if (!validation.valid) {
          setError(`Configuração inválida: ${validation.errors.join(', ')}`)
          return
        }
      }

      await createProvider(formData)
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar provedor')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep(1)
    setSelectedTemplate(null)
    setSearchQuery("")
    setFilterCapability("all")
    setFormData({
      name: "",
      displayName: "",
      provider: AiProviderType.OPENAI,
      apiKey: "",
      baseUrl: "",
      models: [],
      isDefault: false,
      isAsync: false,
      timeout: 30000,
      maxRetries: 3,
      config: {},
      headers: {}
    })
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCapability = filterCapability === "all" || 
                             template.capabilities[filterCapability as keyof typeof template.capabilities]
    
    return matchesSearch && matchesCapability
  })

  const getRecommendedTemplatesForStep = () => {
    // Templates recomendados baseado no caso de uso
    const recommended = templates.filter(template => 
      template.capabilities.chat && template.capabilities.streaming
    ).slice(0, 3)
    
    return recommended
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Server className="h-5 w-5" />
            <span>Adicionar Provedor de IA</span>
            <Badge variant="outline">{currentStep}/3</Badge>
          </DialogTitle>
          <DialogDescription>
            Configure um novo provedor de IA para sua aplicação
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Step 1: Template Selection */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Escolha um Template</h3>
              <p className="text-sm text-muted-foreground">
                Selecione um template pré-configurado ou configure manualmente
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex space-x-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterCapability} onValueChange={setFilterCapability}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por capacidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as capacidades</SelectItem>
                  <SelectItem value="chat">Chat</SelectItem>
                  <SelectItem value="vision">Visão</SelectItem>
                  <SelectItem value="audio">Áudio</SelectItem>
                  <SelectItem value="embeddings">Embeddings</SelectItem>
                  <SelectItem value="functionCalling">Function Calling</SelectItem>
                  <SelectItem value="streaming">Streaming</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recommended Templates */}
            {searchQuery === "" && filterCapability === "all" && (
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <h4 className="text-sm font-medium">Recomendados</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {getRecommendedTemplatesForStep().map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onSelect={handleTemplateSelect}
                      recommended={true}
                    />
                  ))}
                </div>
                <Separator className="my-6" />
              </div>
            )}

            {/* All Templates */}
            <div>
              <h4 className="text-sm font-medium mb-4">
                {searchQuery || filterCapability !== "all" ? "Resultados" : "Todos os Templates"}
                <Badge variant="outline" className="ml-2">{filteredTemplates.length}</Badge>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onSelect={handleTemplateSelect}
                    selected={selectedTemplate?.id === template.id}
                  />
                ))}
              </div>
            </div>

            {/* Custom Option */}
            <Card className="border-dashed">
              <CardContent className="p-6">
                <div className="text-center space-y-2">
                  <Settings className="h-8 w-8 mx-auto text-muted-foreground" />
                  <h4 className="font-medium">Configuração Personalizada</h4>
                  <p className="text-sm text-muted-foreground">
                    Configure um provedor personalizado sem usar templates
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSelectedTemplate(null)
                      handleNext()
                    }}
                  >
                    Configurar Manualmente
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Configuration */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Configuração</h3>
              <p className="text-sm text-muted-foreground">
                {selectedTemplate ? `Configure o ${selectedTemplate.displayName}` : 'Configure o provedor personalizado'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações Básicas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="openai"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Nome de Exibição</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="OpenAI GPT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="provider">Provedor</Label>
                    <Select 
                      value={formData.provider} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value as AiProviderType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(AiProviderType).map((provider) => (
                          <SelectItem key={provider} value={provider}>
                            {provider}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* API Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configuração da API</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder={selectedTemplate?.setup?.apiKeyPlaceholder || "sk-..."}
                    />
                    {selectedTemplate?.setup?.apiKeyHelp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedTemplate.setup.apiKeyHelp}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="baseUrl">Base URL</Label>
                    <Input
                      id="baseUrl"
                      value={formData.baseUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                      placeholder="https://api.openai.com/v1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="models">Modelos (separados por vírgula)</Label>
                    <Textarea
                      id="models"
                      value={(formData.models || []).join(', ')}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        models: e.target.value.split(',').map(m => m.trim()).filter(m => m)
                      }))}
                      placeholder="gpt-4, gpt-3.5-turbo"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Configurações Avançadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={formData.timeout}
                      onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxRetries">Max Retries</Label>
                    <Input
                      id="maxRetries"
                      type="number"
                      value={formData.maxRetries}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="isDefault">Provedor Padrão</Label>
                      <p className="text-xs text-muted-foreground">
                        Usar como padrão para novos serviços
                      </p>
                    </div>
                    <Switch
                      id="isDefault"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Revisão</h3>
              <p className="text-sm text-muted-foreground">
                Revise as configurações antes de criar o provedor
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <span className="text-sm font-medium">{formData.displayName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Provedor:</span>
                    <Badge variant="outline">{formData.provider}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Base URL:</span>
                    <span className="text-sm font-medium">{formData.baseUrl}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Modelos:</span>
                    <span className="text-sm font-medium">{(formData.models || []).length}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Configurações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Timeout:</span>
                    <span className="text-sm font-medium">{formData.timeout}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Max Retries:</span>
                    <span className="text-sm font-medium">{formData.maxRetries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Padrão:</span>
                    <Badge variant={formData.isDefault ? "default" : "secondary"}>
                      {formData.isDefault ? "Sim" : "Não"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">API Key:</span>
                    <Badge variant={formData.apiKey ? "default" : "destructive"}>
                      {formData.apiKey ? "Configurada" : "Não configurada"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedTemplate && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Template Selecionado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedTemplate.icon}</span>
                    <div>
                      <div className="font-medium">{selectedTemplate.displayName}</div>
                      <div className="text-sm text-muted-foreground">{selectedTemplate.description}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between pt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>

          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            
            {currentStep < 3 ? (
              <Button onClick={handleNext}>
                Próximo
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Criar Provedor
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}