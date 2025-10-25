"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Filter, 
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
  Zap
} from "lucide-react"
import { useAiProviders } from "../_hooks/use-ai-providers"
import { AiProvider, AiProviderType } from "@/shared/types/ai.types"
import { ProviderWizard } from "./provider-wizard"

export function ProvidersTab() {
  const {
    providers,
    loading,
    error,
    pagination,
    listProviders,
    deleteProvider,
    testProvider,
    rotateApiKey,
    refresh
  } = useAiProviders()

  const [searchTerm, setSearchTerm] = useState("")
  const [providerFilter, setProviderFilter] = useState<AiProviderType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [showWizard, setShowWizard] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<AiProvider | null>(null)

  // Aplicar filtros
  useEffect(() => {
    const filters: any = {}
    
    if (searchTerm) filters.search = searchTerm
    if (providerFilter !== "all") filters.provider = providerFilter
    if (statusFilter !== "all") {
      filters.isActive = statusFilter === "active"
    }

    listProviders(filters, { page: 1, limit: 20 })
  }, [searchTerm, providerFilter, statusFilter, listProviders])

  const handleTestProvider = async (provider: AiProvider) => {
    const result = await testProvider(provider.id)
    if (result.success) {
      // Mostrar toast de sucesso
      console.log(`Provider ${provider.name} testado com sucesso`)
    } else {
      // Mostrar toast de erro
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

  if (loading && providers.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <Clock className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando provedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
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

      {/* Tabela de provedores */}
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
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}

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

          {providers.length === 0 && !loading && (
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

      {/* Wizard Modal */}
      {showWizard && (
        <ProviderWizard
          isOpen={showWizard}
          onClose={() => setShowWizard(false)}
          onSuccess={() => {
            setShowWizard(false)
            refresh()
          }}
        />
      )}
    </div>
  )
}
