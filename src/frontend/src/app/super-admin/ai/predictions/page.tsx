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
  Brain, 
  Play, 
  Search, 
  Filter,
  TrendingUp,
  Activity,
  Calendar,
  User,
  Eye,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react"
import { usePredictions, PredictionFilters } from "./_hooks/use-predictions"
import { AiServiceType, AI_SERVICE_DISPLAY_NAMES } from "@/shared/types/ai.types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { PredictionDetailModal } from "./_components/prediction-detail-modal"

// Tipos de predição disponíveis
const PREDICTION_TYPES = [
  AiServiceType.PERFORMANCE_PREDICTION,
  AiServiceType.RECOVERY_TIME_PREDICTION,
  AiServiceType.MUSCLE_GAIN_PREDICTION,
  AiServiceType.STRENGTH_PREDICTION,
  AiServiceType.WEIGHT_LOSS_PREDICTION,
  AiServiceType.ADHERENCE_PREDICTION,
  AiServiceType.PLATEAU_PREDICTION,
  AiServiceType.METABOLIC_AGE_PREDICTION,
  AiServiceType.SLEEP_QUALITY_PREDICTION,
  AiServiceType.STRESS_LEVEL_PREDICTION,
] as const

export default function PredictionsPage() {
  const { 
    loading, 
    error, 
    executePrediction, 
    listExecutions, 
    getExecution,
    validatePrediction 
  } = usePredictions()

  const [activeTab, setActiveTab] = useState<"list" | "execute">("list")
  const [executions, setExecutions] = useState<any[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<AiServiceType | "all">("all")
  const [showExecuteDialog, setShowExecuteDialog] = useState(false)
  const [executeLoading, setExecuteLoading] = useState(false)
  const [executeForm, setExecuteForm] = useState({
    serviceType: AiServiceType.PERFORMANCE_PREDICTION,
    data: "{}"
  })
  const [selectedExecution, setSelectedExecution] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  // Carregar execuções
  useEffect(() => {
    loadExecutions()
  }, [selectedType, searchTerm, pagination.page])

  const loadExecutions = async () => {
    const filters: PredictionFilters = {}
    if (selectedType !== "all") {
      filters.serviceType = selectedType
    }

    const result = await listExecutions(filters, {
      page: pagination.page,
      limit: pagination.limit
    })

    if (result) {
      setExecutions(result.data || [])
      setPagination(result.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      })
    } else {
      // Se result for null, garantir arrays vazios
      setExecutions([])
      setPagination({
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      })
    }
  }

  const handleExecute = async () => {
    try {
      setExecuteLoading(true)
      const data = JSON.parse(executeForm.data)
      
      const result = await executePrediction({
        serviceType: executeForm.serviceType,
        data
      })

      if (result.success && result.data) {
        toast.success("Predição executada com sucesso!")
        setShowExecuteDialog(false)
        setExecuteForm({ serviceType: AiServiceType.PERFORMANCE_PREDICTION, data: "{}" })
        loadExecutions()
      } else {
        toast.error(result.error || "Erro ao executar predição")
      }
    } catch (err) {
      toast.error("Erro ao processar dados JSON")
    } finally {
      setExecuteLoading(false)
    }
  }

  const filteredExecutions = (Array.isArray(executions) ? executions : []).filter(exec => {
    if (!exec) return false // Pular execuções inválidas
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        (exec.id || "").toLowerCase().includes(searchLower) ||
        (exec.serviceType || "").toLowerCase().includes(searchLower) ||
        (exec.model?.modelName || "").toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predições de IA</h1>
          <p className="text-muted-foreground">
            Execute e gerencie predições usando modelos de IA
          </p>
        </div>
        <Dialog open={showExecuteDialog} onOpenChange={setShowExecuteDialog}>
          <DialogTrigger asChild>
            <Button>
              <Play className="h-4 w-4 mr-2" />
              Executar Predição
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Executar Nova Predição</DialogTitle>
              <DialogDescription>
                Selecione o tipo de predição e forneça os dados de entrada
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceType">Tipo de Predição</Label>
                <Select
                  value={executeForm.serviceType}
                  onValueChange={(value) => setExecuteForm({ ...executeForm, serviceType: value as AiServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDICTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AI_SERVICE_DISPLAY_NAMES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="data">Dados de Entrada (JSON)</Label>
                <Textarea
                  id="data"
                  value={executeForm.data}
                  onChange={(e) => setExecuteForm({ ...executeForm, data: e.target.value })}
                  placeholder='{"age": 30, "gender": "male", "activityLevel": "high"}'
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
              <Button 
                onClick={handleExecute} 
                disabled={executeLoading}
                className="w-full"
              >
                {executeLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Predição
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "list" | "execute")}>
        <TabsList>
          <TabsTrigger value="list">Histórico</TabsTrigger>
          <TabsTrigger value="execute">Executar</TabsTrigger>
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
                    <SelectValue placeholder="Tipo de predição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {PREDICTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AI_SERVICE_DISPLAY_NAMES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Execuções */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Execuções</CardTitle>
              <CardDescription>
                {pagination.total} execuções encontradas
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
              ) : filteredExecutions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma execução encontrada
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Confiança</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExecutions.map((exec) => {
                      if (!exec || !exec.id) return null // Pular execuções inválidas
                      return (
                        <TableRow key={exec.id}>
                          <TableCell className="font-mono text-xs">
                            {exec.id?.slice(0, 8) || "N/A"}...
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {AI_SERVICE_DISPLAY_NAMES[exec.serviceType as AiServiceType] || exec.serviceType || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {exec.confidence !== null && exec.confidence !== undefined ? (
                              <Badge variant={exec.confidence > 0.8 ? "default" : exec.confidence > 0.5 ? "secondary" : "destructive"}>
                                {(exec.confidence * 100).toFixed(1)}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {exec.model?.modelName || "N/A"}
                          </TableCell>
                          <TableCell>
                            {exec.executedAt ? new Date(exec.executedAt).toLocaleString('pt-BR') : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (exec.id) {
                                  const fullExecution = await getExecution(exec.id)
                                  if (fullExecution) {
                                    setSelectedExecution(fullExecution)
                                    setShowDetailModal(true)
                                  }
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
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

        <TabsContent value="execute">
          <Card>
            <CardHeader>
              <CardTitle>Executar Nova Predição</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para executar uma predição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="execute-serviceType">Tipo de Predição</Label>
                <Select
                  value={executeForm.serviceType}
                  onValueChange={(value) => setExecuteForm({ ...executeForm, serviceType: value as AiServiceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDICTION_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {AI_SERVICE_DISPLAY_NAMES[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="execute-data">Dados de Entrada (JSON)</Label>
                <Textarea
                  id="execute-data"
                  value={executeForm.data}
                  onChange={(e) => setExecuteForm({ ...executeForm, data: e.target.value })}
                  placeholder='{"age": 30, "gender": "male", "activityLevel": "high"}'
                  className="font-mono text-sm"
                  rows={10}
                />
              </div>
              <Button 
                onClick={handleExecute} 
                disabled={executeLoading}
                className="w-full"
              >
                {executeLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Executando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Executar Predição
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes */}
      <PredictionDetailModal
        execution={selectedExecution}
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
      />
    </div>
  )
}

