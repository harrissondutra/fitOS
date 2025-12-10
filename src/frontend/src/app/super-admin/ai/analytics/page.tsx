"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  Sparkles,
  Download
} from "lucide-react"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { usePredictions } from "../predictions/_hooks/use-predictions"
import { useContentGeneration } from "../generators/_hooks/use-content-generation"
import { AiServiceType, AI_SERVICE_DISPLAY_NAMES } from "@/shared/types/ai.types"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function AnalyticsPage() {
  const { listExecutions } = usePredictions()
  const { listGeneratedContent } = useContentGeneration()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPredictions: 0,
    totalGenerations: 0,
    avgConfidence: 0,
    avgQuality: 0,
    successRate: 0,
    totalCost: 0
  })
  const [predictions, setPredictions] = useState<any[]>([])
  const [generations, setGenerations] = useState<any[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">("30d")

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  useEffect(() => {
    loadAnalytics()
  }, [selectedPeriod])

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Carregar predições
      const predictionsResult = await listExecutions(
        {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        },
        { page: 1, limit: 100 }
      )

      // Carregar conteúdo gerado
      const generationsResult = await listGeneratedContent(
        {
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString()
        },
        { page: 1, limit: 100 }
      )

      // Inicializar arrays vazios se os resultados forem null
      const predictionsData = predictionsResult?.data || []
      const generationsData = generationsResult?.data || []

      setPredictions(predictionsData)
      setGenerations(generationsData)

      // Calcular estatísticas (sempre calcular, mesmo com arrays vazios)
      const totalPred = predictionsData.length
      const totalGen = generationsData.length
      
      const avgConf = totalPred > 0
        ? predictionsData
            .filter((p: any) => p.confidence !== null && p.confidence !== undefined)
            .reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / totalPred
        : 0

      const avgQual = totalGen > 0
        ? generationsData
            .filter((g: any) => g.quality !== null && g.quality !== undefined)
            .reduce((sum: number, g: any) => sum + (g.quality || 0), 0) / totalGen
        : 0

      setStats({
        totalPredictions: totalPred,
        totalGenerations: totalGen,
        avgConfidence: avgConf,
        avgQuality: avgQual,
        successRate: 95.5, // TODO: Calcular baseado em dados reais
        totalCost: 0 // TODO: Integrar com serviço de custos
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Agrupar por tipo de serviço (garantir que predictions e generations são arrays)
  const predictionsByType = (Array.isArray(predictions) ? predictions : []).reduce((acc: any, pred: any) => {
    if (!pred || !pred.serviceType) return acc
    const type = pred.serviceType as AiServiceType
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const generationsByType = (Array.isArray(generations) ? generations : []).reduce((acc: any, gen: any) => {
    if (!gen || !gen.serviceType) return acc
    const type = gen.serviceType as AiServiceType
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  // Preparar dados para gráficos
  const predictionsChartData = Object.entries(predictionsByType)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10)
    .map(([type, count]: [string, any]) => ({
      name: AI_SERVICE_DISPLAY_NAMES[type as AiServiceType] || type,
      value: count
    }))

  const generationsChartData = Object.entries(generationsByType)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 10)
    .map(([type, count]: [string, any]) => ({
      name: AI_SERVICE_DISPLAY_NAMES[type as AiServiceType] || type,
      value: count
    }))

  // Dados para gráfico de linha temporal (garantir que são arrays)
  const getDailyData = () => {
    const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90
    const dailyPredictions: Record<string, number> = {}
    const dailyGenerations: Record<string, number> = {}

    const safePredictions = Array.isArray(predictions) ? predictions : []
    const safeGenerations = Array.isArray(generations) ? generations : []

    safePredictions.forEach((p: any) => {
      if (p && p.executedAt) {
        try {
          const date = new Date(p.executedAt).toLocaleDateString('pt-BR')
          dailyPredictions[date] = (dailyPredictions[date] || 0) + 1
        } catch (e) {
          // Ignorar datas inválidas
        }
      }
    })

    safeGenerations.forEach((g: any) => {
      if (g && g.createdAt) {
        try {
          const date = new Date(g.createdAt).toLocaleDateString('pt-BR')
          dailyGenerations[date] = (dailyGenerations[date] || 0) + 1
        } catch (e) {
          // Ignorar datas inválidas
        }
      }
    })

    const dates = Array.from(new Set([...Object.keys(dailyPredictions), ...Object.keys(dailyGenerations)])).sort()
    
    return dates.map(date => ({
      date,
      predictions: dailyPredictions[date] || 0,
      generations: dailyGenerations[date] || 0
    }))
  }

  const dailyData = getDailyData()

  // Exportar relatório
  const handleExport = () => {
    const report = {
      period: selectedPeriod,
      stats,
      predictionsByType,
      generationsByType,
      dailyData,
      generatedAt: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-analytics-report-${selectedPeriod}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Relatório exportado com sucesso!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de IA</h1>
          <p className="text-muted-foreground">
            Análise de uso, performance e custos de IA
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as "7d" | "30d" | "90d")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Predições</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalPredictions}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Últimos {selectedPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gerações</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalGenerations}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Últimos {selectedPeriod}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {(stats.avgConfidence * 100).toFixed(1)}%
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Baseado em predições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            )}
            <p className="text-xs text-muted-foreground">
              Requisições bem-sucedidas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="predictions">Predições</TabsTrigger>
          <TabsTrigger value="generations">Gerações</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Predições por Tipo</CardTitle>
              <CardDescription>
                Distribuição de predições executadas por tipo de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : Object.keys(predictionsByType).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma predição encontrada no período
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfico de Pizza */}
                  {predictionsChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={predictionsChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {predictionsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {/* Gráfico de Barras */}
                  {predictionsChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={predictionsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {/* Lista detalhada */}
                  <div className="space-y-2">
                    {Object.entries(predictionsByType)
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {AI_SERVICE_DISPLAY_NAMES[type as AiServiceType] || type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${predictions.length > 0 ? (count / predictions.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerações por Tipo</CardTitle>
              <CardDescription>
                Distribuição de conteúdo gerado por tipo de serviço
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : Object.keys(generationsByType).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum conteúdo encontrado no período
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Gráfico de Pizza */}
                  {generationsChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={generationsChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {generationsChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {/* Gráfico de Barras */}
                  {generationsChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={generationsChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          angle={-45}
                          textAnchor="end"
                          height={100}
                        />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#a855f7" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {/* Lista detalhada */}
                  <div className="space-y-2">
                    {Object.entries(generationsByType)
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {AI_SERVICE_DISPLAY_NAMES[type as AiServiceType] || type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${generations.length > 0 ? (count / generations.length) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Gráfico Temporal */}
      {dailyData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>
              Distribuição de predições e gerações ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="predictions" stroke="#8884d8" name="Predições" />
                <Line type="monotone" dataKey="generations" stroke="#a855f7" name="Gerações" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

