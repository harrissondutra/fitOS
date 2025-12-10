"use client"

import { useState, useEffect, useMemo } from 'react'
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
  Search, 
  MoreHorizontal, 
  Eye, 
  Download,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Database,
  Calendar
} from "lucide-react"
import { useAiConsumptionLogs } from "../../management/ai-agents/_hooks/use-ai-consumption-logs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function AILogsPage() {
  const {
    logs,
    stats,
    tenants,
    loading,
    error,
    pagination,
    loadLogs,
    loadStats,
    refresh
  } = useAiConsumptionLogs()

  const [selectedTenant, setSelectedTenant] = useState<string>("all")
  const [selectedProvider, setSelectedProvider] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Carregar dados na inicialização e quando filtros mudarem
  useEffect(() => {
    const filters: any = {}
    if (selectedTenant !== "all") filters.tenantId = selectedTenant
    if (selectedProvider !== "all") filters.provider = selectedProvider
    if (dateFrom) filters.dateFrom = dateFrom
    if (dateTo) filters.dateTo = dateTo
    if (searchTerm) filters.search = searchTerm

    loadLogs(filters, { page: currentPage, limit: 20 })
    loadStats(filters)
  }, [selectedTenant, selectedProvider, dateFrom, dateTo, searchTerm, currentPage, loadLogs, loadStats])

  // Formatar dados para gráficos
  const chartData = useMemo(() => {
    if (!stats) return null

    return {
      daily: stats.byDay.map(item => ({
        date: new Date(item.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
        cost: item.cost,
        tokens: item.tokens,
        requests: item.requestCount
      })),
      byProvider: stats.byProvider.map(item => ({
        name: item.provider,
        value: item.cost,
        tokens: item.tokens,
        requests: item.requestCount
      })),
      byModel: stats.byModel.slice(0, 10).map(item => ({
        name: item.model.length > 20 ? item.model.substring(0, 20) + '...' : item.model,
        cost: item.cost,
        tokens: item.tokens,
        requests: item.requestCount
      })),
      byTenant: stats.byTenant.map(item => ({
        name: item.tenantName || 'Sem tenant',
        cost: item.totalCost,
        tokens: item.totalTokens,
        requests: item.requestCount
      }))
    }
  }, [stats])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logs de Consumo de IA</h1>
          <p className="text-muted-foreground">
            Monitore o uso e consumo de IA na aplicação
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(stats.total.logs)}</div>
              <p className="text-xs text-muted-foreground">
                Total de chamadas de IA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.total.cost)}</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.total.tokens)} tokens utilizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Cache</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.cacheHitRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                {formatNumber(stats.total.cacheHits)} hits de cache
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.byTenant.length}</div>
              <p className="text-xs text-muted-foreground">
                Tenants com consumo de IA
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant</label>
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tenants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tenants</SelectItem>
                  {tenants.map(tenant => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Provedor</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os provedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os provedores</SelectItem>
                  {stats?.byProvider.map(item => (
                    <SelectItem key={item.provider} value={item.provider}>
                      {item.provider}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por modelo, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos */}
      {chartData && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Consumo por Dia */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo por Dia</CardTitle>
              <CardDescription>Custo e tokens utilizados ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                cost: { label: "Custo (USD)", color: "hsl(var(--chart-1))" },
                tokens: { label: "Tokens", color: "hsl(var(--chart-2))" }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="cost" 
                      stroke="hsl(var(--chart-1))" 
                      fill="hsl(var(--chart-1))" 
                      fillOpacity={0.6}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="tokens" 
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Consumo por Provedor */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo por Provedor</CardTitle>
              <CardDescription>Distribuição de custos por provedor</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                value: { label: "Custo (USD)" }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.byProvider}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.byProvider.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Top Modelos */}
          <Card>
            <CardHeader>
              <CardTitle>Top Modelos</CardTitle>
              <CardDescription>Modelos mais utilizados</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                cost: { label: "Custo (USD)" }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.byModel}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="cost" fill="hsl(var(--chart-1))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Consumo por Tenant */}
          <Card>
            <CardHeader>
              <CardTitle>Consumo por Tenant</CardTitle>
              <CardDescription>Distribuição de custos por tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{
                cost: { label: "Custo (USD)" }
              }}>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.byTenant.slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="cost" fill="hsl(var(--chart-2))" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Consumo</CardTitle>
          <CardDescription>
            Lista detalhada de todas as requisições de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Provedor</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Custo</TableHead>
                <TableHead>Cache</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {log.tenantName || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {log.clientName || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.provider}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">
                      {log.model.length > 20 ? log.model.substring(0, 20) + '...' : log.model}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatNumber(log.totalTokens)}
                      <div className="text-xs text-muted-foreground">
                        In: {formatNumber(log.inputTokens)} | Out: {formatNumber(log.outputTokens)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">
                      {formatCurrency(log.cost)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {log.isCacheHit ? (
                      <Badge variant="default" className="bg-green-500">Hit</Badge>
                    ) : (
                      <Badge variant="secondary">Miss</Badge>
                    )}
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
                        <DropdownMenuItem onClick={() => console.log('View details:', log.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {logs.length === 0 && !loading && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                Os logs de consumo aparecerão aqui quando houver atividade de IA
              </p>
            </div>
          )}

          {/* Paginação */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.pages} ({pagination.total} total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={pagination.page === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={!pagination.hasMore}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
