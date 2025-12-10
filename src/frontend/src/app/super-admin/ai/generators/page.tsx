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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Sparkles, 
  Play, 
  Search, 
  FileText,
  Calendar,
  User,
  Eye,
  Star,
  Loader2,
  Copy,
  Check
} from "lucide-react"
import { useContentGeneration, GenerationFilters } from "./_hooks/use-content-generation"
import { AiServiceType, AI_SERVICE_DISPLAY_NAMES } from "@/shared/types/ai.types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { ContentDetailModal } from "./_components/content-detail-modal"

// Tipos de geração disponíveis
const GENERATION_TYPES = [
  AiServiceType.PERSONALIZED_EMAIL_GENERATION,
  AiServiceType.SOCIAL_MEDIA_CONTENT_GENERATION,
  AiServiceType.PROGRESS_REPORT_GENERATION,
  AiServiceType.MOTIVATIONAL_MESSAGE_GENERATION,
  AiServiceType.ADAPTIVE_WORKOUT_GENERATION,
  AiServiceType.RECIPE_GENERATION,
  AiServiceType.SHOPPING_LIST_GENERATION,
  AiServiceType.MEAL_PREP_PLAN_GENERATION,
  AiServiceType.PERIODIZATION_GENERATION,
] as const

export default function GeneratorsPage() {
  const { 
    loading, 
    error, 
    generateContent, 
    listGeneratedContent,
    getContent,
    addFeedback
  } = useContentGeneration()

  const [activeTab, setActiveTab] = useState<"list" | "generate">("list")
  const [content, setContent] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<AiServiceType | "all">("all")
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    serviceType: AiServiceType.PERSONALIZED_EMAIL_GENERATION,
    input: "{}",
    options: {
      temperature: 0.8,
      maxTokens: 2000
    }
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedContent, setSelectedContent] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Carregar conteúdo gerado
  useEffect(() => {
    loadContent()
  }, [selectedType, searchTerm, pagination.page])

  const loadContent = async () => {
    const filters: GenerationFilters = {}
    if (selectedType !== "all") {
      filters.serviceType = selectedType
    }

    const result = await listGeneratedContent(filters, {
      page: pagination.page,
      limit: pagination.limit
    })

    if (result) {
      setContent(result.data || [])
      setPagination(result.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      })
    } else {
      // Se result for null, garantir arrays vazios
      setContent([])
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      })
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerateLoading(true)
      const input = JSON.parse(generateForm.input)
      
      const result = await generateContent({
        serviceType: generateForm.serviceType,
        input,
        options: generateForm.options
      })

      if (result.success && result.data) {
        toast.success("Conteúdo gerado com sucesso!")
        setShowGenerateDialog(false)
        setGenerateForm({ 
          serviceType: AiServiceType.PERSONALIZED_EMAIL_GENERATION, 
          input: "{}",
          options: { temperature: 0.8, maxTokens: 2000 }
        })
        loadContent()
      } else {
        toast.error(result.error || "Erro ao gerar conteúdo")
      }
    } catch (err) {
      toast.error("Erro ao processar dados JSON")
    } finally {
      setGenerateLoading(false)
    }
  }

  const handleCopyContent = async (contentId: string, output: any) => {
    try {
      const text = typeof output === 'string' ? output : JSON.stringify(output, null, 2)
      await navigator.clipboard.writeText(text)
      setCopiedId(contentId)
      toast.success("Conteúdo copiado!")
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      toast.error("Erro ao copiar conteúdo")
    }
  }

  const filteredContent = content.filter(item => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        item.id.toLowerCase().includes(searchLower) ||
        item.serviceType.toLowerCase().includes(searchLower) ||
        (item.model || "").toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Geração de Conteúdo</h1>
          <p className="text-muted-foreground">
            Gere conteúdo personalizado usando modelos de IA
          </p>
        </div>
        <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Gerar Novo Conteúdo</DialogTitle>
              <DialogDescription>
                Selecione o tipo de conteúdo e forneça os dados de entrada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceType">Tipo de Conteúdo</Label>
                <Select
                  value={generateForm.serviceType}
                  onValueChange={(value) => setGenerateForm({ ...generateForm, serviceType: value as AiServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AI_SERVICE_DISPLAY_NAMES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="input">Dados de Entrada (JSON)</Label>
                <Textarea
                  id="input"
                  value={generateForm.input}
                  onChange={(e) => setGenerateForm({ ...generateForm, input: e.target.value })}
                  placeholder='{"client": {"name": "João"}, "context": {...}}'
                  className="font-mono text-sm"
                  rows={8}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature (0-1)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={generateForm.options.temperature}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      options: { ...generateForm.options, temperature: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={generateForm.options.maxTokens}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      options: { ...generateForm.options, maxTokens: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={generateLoading}
                className="w-full"
              >
                {generateLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Conteúdo
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "generate")}>
        <TabsList>
          <TabsTrigger value="list">Histórico</TabsTrigger>
          <TabsTrigger value="generate">Gerar</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={selectedType}
                  onValueChange={(value) => setSelectedType(value as AiServiceType | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de conteúdo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {GENERATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AI_SERVICE_DISPLAY_NAMES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo Gerado</CardTitle>
              <CardDescription>
                {pagination.total} itens encontrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : filteredContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum conteúdo encontrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Qualidade</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-xs">
                          {item.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {AI_SERVICE_DISPLAY_NAMES[item.serviceType as AiServiceType] || item.serviceType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.model || "N/A"}
                          </div>
                          {item.provider && (
                            <div className="text-xs text-muted-foreground">
                              {item.provider.displayName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.quality !== null && item.quality !== undefined ? (
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < item.quality
                                      ? "fill-yellow-400 text-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyContent(item.id, item.output)}
                            >
                              {copiedId === item.id ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                const fullContent = await getContent(item.id)
                                if (fullContent) {
                                  setSelectedContent(fullContent)
                                  setShowDetailModal(true)
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.pages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Novo Conteúdo</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para gerar conteúdo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="generate-serviceType">Tipo de Conteúdo</Label>
                <Select
                  value={generateForm.serviceType}
                  onValueChange={(value) => setGenerateForm({ ...generateForm, serviceType: value as AiServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENERATION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AI_SERVICE_DISPLAY_NAMES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="generate-input">Dados de Entrada (JSON)</Label>
                <Textarea
                  id="generate-input"
                  value={generateForm.input}
                  onChange={(e) => setGenerateForm({ ...generateForm, input: e.target.value })}
                  placeholder='{"client": {"name": "João"}, "context": {...}}'
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="generate-temperature">Temperature (0-1)</Label>
                  <Input
                    id="generate-temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={generateForm.options.temperature}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      options: { ...generateForm.options, temperature: parseFloat(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="generate-maxTokens">Max Tokens</Label>
                  <Input
                    id="generate-maxTokens"
                    type="number"
                    value={generateForm.options.maxTokens}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      options: { ...generateForm.options, maxTokens: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={generateLoading}
                className="w-full"
              >
                {generateLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Conteúdo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      <ContentDetailModal
        content={selectedContent}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </div>
  )
}

