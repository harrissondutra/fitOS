"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { ExternalLink, RefreshCw, Info, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { ProviderIcon } from "@/components/ui/provider-icon"
import { AiProviderType } from "@/shared/types/ai.types"
import apiClient from "@/lib/api-client"

interface Template {
  id: string
  name: string
  displayName: string
  provider: AiProviderType
  description: string
  icon: string
  iconUrl?: string
  color: string
  models: string[]
  pricing: { model: string; inputCost: number; outputCost: number }[]
  capabilities: {
    chat: boolean
    vision: boolean
    audio: boolean
    embeddings: boolean
    functionCalling: boolean
    streaming: boolean
  }
  setup: { requiresApiKey: boolean; apiKeyHelp: string }
  documentationUrl?: string
}

interface HelpResponse {
  success: boolean
  data: {
    templates: Template[]
    stats: { totalProviders: number; totalModels: number; byCapability: Record<string, number> }
    useCaseRecommendations?: Record<string, Array<{ provider: string; models: string[]; description: string }>>
  }
}

export default function AIHelpPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [stats, setStats] = useState<{ totalProviders: number; totalModels: number; byCapability: Record<string, number> } | null>(null)
  const [search, setSearch] = useState("")
  const [syncing, setSyncing] = useState(false)
  const [sortBy, setSortBy] = useState<'provider' | 'model' | 'input' | 'output' | 'average'>('provider')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<HelpResponse>('/api/super-admin/ai/providers/help')
      setTemplates(response.data.data.templates)
      setStats(response.data.data.stats)
    } catch (e: any) {
      const errorMessage = e.response?.data?.error?.message || e.message || 'Erro ao carregar'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  async function syncPrices() {
    setSyncing(true)
    try {
      await apiClient.post('/api/super-admin/ai/providers/help/sync-prices')
      await load()
    } catch (e: any) {
      const errorMessage = e.response?.data?.error?.message || e.message || 'Erro ao sincronizar preços'
      setError(errorMessage)
    } finally {
      setSyncing(false)
    }
  }

  const filtered = templates.filter(t =>
    t.displayName.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase()) ||
    t.models.some(m => m.toLowerCase().includes(search.toLowerCase()))
  )

  // Preparar dados da tabela de preços
  const pricingData = templates.flatMap(t => {
    // Se tem pricing, usar os modelos do pricing
    if (t.pricing && t.pricing.length > 0) {
      return t.pricing.map(p => ({
        provider: t.displayName,
        providerId: t.id,
        providerIcon: t.icon,
        providerIconUrl: t.iconUrl,
        model: p.model,
        inputCost: p.inputCost,
        outputCost: p.outputCost,
        averageCost: (p.inputCost + p.outputCost) / 2
      }))
    }
    // Se não tem pricing mas tem models, criar entradas sem preço
    if (t.models && t.models.length > 0) {
      return t.models.map(m => ({
        provider: t.displayName,
        providerId: t.id,
        providerIcon: t.icon,
        providerIconUrl: t.iconUrl,
        model: m,
        inputCost: 0,
        outputCost: 0,
        averageCost: 0
      }))
    }
    return []
  })

  // Função de ordenação
  const sortedPricingData = [...pricingData].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'provider':
        comparison = a.provider.localeCompare(b.provider)
        break
      case 'model':
        comparison = a.model.localeCompare(b.model)
        break
      case 'input':
        comparison = a.inputCost - b.inputCost
        break
      case 'output':
        comparison = a.outputCost - b.outputCost
        break
      case 'average':
        comparison = a.averageCost - b.averageCost
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      // Alternar ordem se já estiver ordenando por esta coluna
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      // Nova coluna, ordem ascendente por padrão
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
    }
    return sortOrder === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Ajuda – Provedores LLM</h1>
          <p className="text-muted-foreground text-sm">Preços em USD, capacidades e documentação</p>
        </div>
        <Button variant="outline" onClick={syncPrices} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Sincronizar preços
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Provedores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalProviders}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Modelos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalModels}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Visão</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.byCapability?.vision ?? 0}</div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Streaming</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.byCapability?.streaming ?? 0}</div></CardContent></Card>
        </div>
      )}

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="providers">Provedores</TabsTrigger>
          <TabsTrigger value="pricing">Preços</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Provedores</CardTitle>
              <CardDescription>Pesquise por nome, descrição ou modelo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-4">
                <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(t => (
                  <Card key={t.id} className="hover:shadow-sm transition">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <ProviderIcon providerId={t.id} iconUrl={t.iconUrl} emoji={t.icon} size={28} />
                          <div>
                            <CardTitle className="text-base">{t.displayName}</CardTitle>
                            <CardDescription className="text-xs">{t.provider}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline">{t.models.length} modelos</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Capacidades:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {t.capabilities.chat && <Badge variant="outline" className="text-xs">Chat</Badge>}
                          {t.capabilities.vision && <Badge variant="outline" className="text-xs">Visão</Badge>}
                          {t.capabilities.audio && <Badge variant="outline" className="text-xs">Áudio</Badge>}
                          {t.capabilities.embeddings && <Badge variant="outline" className="text-xs">Embeddings</Badge>}
                          {t.capabilities.functionCalling && <Badge variant="outline" className="text-xs">Functions</Badge>}
                          {t.capabilities.streaming && <Badge variant="outline" className="text-xs">Streaming</Badge>}
                        </div>
                      </div>

                      {t.documentationUrl && (
                        <Button variant="ghost" size="sm" className="w-full h-8" onClick={() => window.open(t.documentationUrl!, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-1" /> Documentação
                        </Button>
                      )}

                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Info className="h-3 w-3" /> {t.setup.requiresApiKey ? 'Requer API Key' : 'Sem API Key'}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">Nenhum provedor encontrado</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Tabela Comparativa de Preços (USD / 1K tokens)</CardTitle>
                  <CardDescription>Valores médios por modelo - Clique nos cabeçalhos para ordenar</CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Ordenar por..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider">Provedor</SelectItem>
                      <SelectItem value="model">Modelo</SelectItem>
                      <SelectItem value="input">Preço Input</SelectItem>
                      <SelectItem value="output">Preço Output</SelectItem>
                      <SelectItem value="average">Preço Médio</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Ordenar ${sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
                  >
                    {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none">
                        <button
                          onClick={() => handleSort('provider')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors font-medium"
                        >
                          Provedor
                          <SortIcon column="provider" />
                        </button>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none">
                        <button
                          onClick={() => handleSort('model')}
                          className="flex items-center gap-2 hover:text-foreground transition-colors font-medium"
                        >
                          Modelo
                          <SortIcon column="model" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none">
                        <button
                          onClick={() => handleSort('input')}
                          className="flex items-center justify-end gap-2 ml-auto hover:text-foreground transition-colors font-medium"
                        >
                          Input (USD)
                          <SortIcon column="input" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none">
                        <button
                          onClick={() => handleSort('output')}
                          className="flex items-center justify-end gap-2 ml-auto hover:text-foreground transition-colors font-medium"
                        >
                          Output (USD)
                          <SortIcon column="output" />
                        </button>
                      </TableHead>
                      <TableHead className="text-right cursor-pointer select-none">
                        <button
                          onClick={() => handleSort('average')}
                          className="flex items-center justify-end gap-2 ml-auto hover:text-foreground transition-colors font-medium"
                        >
                          Média (USD)
                          <SortIcon column="average" />
                        </button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPricingData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum modelo encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedPricingData.map((item, i) => (
                        <TableRow key={`${item.providerId}-${item.model}-${i}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <ProviderIcon 
                                providerId={item.providerId} 
                                iconUrl={item.providerIconUrl} 
                                emoji={item.providerIcon} 
                                size={20} 
                              />
                              <span className="font-medium text-sm">{item.provider}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">{item.model}</code>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.inputCost === 0 && item.outputCost === 0 ? (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            ) : item.inputCost === 0 ? (
                              <Badge variant="secondary" className="text-xs">Grátis</Badge>
                            ) : (
                              `$${item.inputCost.toFixed(4)}`
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.inputCost === 0 && item.outputCost === 0 ? (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            ) : item.outputCost === 0 ? (
                              <Badge variant="secondary" className="text-xs">Grátis</Badge>
                            ) : (
                              `$${item.outputCost.toFixed(4)}`
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.averageCost === 0 && item.inputCost === 0 && item.outputCost === 0 ? (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            ) : item.averageCost === 0 ? (
                              <Badge variant="secondary" className="text-xs">Grátis</Badge>
                            ) : (
                              <span className="font-medium">${item.averageCost.toFixed(4)}</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                Total: {sortedPricingData.length} modelos
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
