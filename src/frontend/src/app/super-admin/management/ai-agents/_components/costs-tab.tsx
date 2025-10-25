"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Activity
} from "lucide-react"
import { useAiCosts } from "../_hooks/use-ai-costs"

export function CostsTab() {
  const {
    costMetrics,
    costHistory,
    loading,
    error,
    getCostMetrics,
    getCostHistory,
    getCostProjection,
    getCostAlerts,
    exportCostReport,
    refresh
  } = useAiCosts()

  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'projections' | 'alerts'>('overview')
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day')

  // Load data on mount
  useEffect(() => {
    refresh()
  }, [refresh])

  // Apply filters when they change
  useEffect(() => {
    const filters: any = {}
    
    const now = new Date()
    const dateFrom = new Date()
    
    switch (dateRange) {
      case '7d':
        dateFrom.setDate(now.getDate() - 7)
        break
      case '30d':
        dateFrom.setDate(now.getDate() - 30)
        break
      case '90d':
        dateFrom.setDate(now.getDate() - 90)
        break
      case '1y':
        dateFrom.setFullYear(now.getFullYear() - 1)
        break
    }
    
    filters.dateFrom = dateFrom.toISOString().split('T')[0]
    filters.dateTo = now.toISOString().split('T')[0]
    filters.groupBy = groupBy

    getCostMetrics(filters)
    getCostHistory(filters)
  }, [dateRange, groupBy, getCostMetrics, getCostHistory])

  const handleExportReport = async () => {
    const filters: any = {}
    
    const now = new Date()
    const dateFrom = new Date()
    
    switch (dateRange) {
      case '7d':
        dateFrom.setDate(now.getDate() - 7)
        break
      case '30d':
        dateFrom.setDate(now.getDate() - 30)
        break
      case '90d':
        dateFrom.setDate(now.getDate() - 90)
        break
      case '1y':
        dateFrom.setFullYear(now.getFullYear() - 1)
        break
    }
    
    filters.dateFrom = dateFrom.toISOString().split('T')[0]
    filters.dateTo = now.toISOString().split('T')[0]
    filters.groupBy = groupBy

    await exportCostReport(filters, 'csv')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num)
  }

  if (loading && !costMetrics) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando métricas de custos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={groupBy} onValueChange={(value) => setGroupBy(value as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Agrupar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Por dia</SelectItem>
              <SelectItem value="week">Por semana</SelectItem>
              <SelectItem value="month">Por mês</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costMetrics ? formatCurrency(costMetrics.summary.totalCost) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              {costMetrics ? formatNumber(costMetrics.summary.requestCount) : '0'} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costMetrics ? formatCurrency(costMetrics.summary.averageCostPerRequest) : 'R$ 0,00'}
            </div>
            <p className="text-xs text-muted-foreground">
              por request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provedores</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costMetrics ? Object.keys(costMetrics.costByProvider).length : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              em uso
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costMetrics ? Object.keys(costMetrics.costByService).length : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              ativos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Análise de Custos</span>
            <Badge variant="outline">{dateRange}</Badge>
          </CardTitle>
          <CardDescription>
            Monitore custos por provedor, serviço e período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4" />
                <span>Visão Geral</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Histórico</span>
              </TabsTrigger>
              <TabsTrigger value="projections" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Projeções</span>
              </TabsTrigger>
              <TabsTrigger value="alerts" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Alertas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {error && (
                <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                  </div>
                </div>
              )}

              {/* Top Expensive Services */}
              {costMetrics && costMetrics.topExpensiveServices.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Serviços Mais Caros</CardTitle>
                      <CardDescription>
                        Top 5 serviços por custo total
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {costMetrics.topExpensiveServices.slice(0, 5).map((service, index) => (
                          <div key={service.serviceType} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <div>
                                <div className="text-sm font-medium">{service.serviceName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatNumber(service.requestCount)} requests
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(service.cost)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(service.cost / service.requestCount)}/req
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Top Expensive Providers */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Provedores Mais Caros</CardTitle>
                      <CardDescription>
                        Top 5 provedores por custo total
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {costMetrics.topExpensiveProviders.slice(0, 5).map((provider, index) => (
                          <div key={provider.providerId} className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <div>
                                <div className="text-sm font-medium">{provider.providerName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatNumber(provider.requestCount)} requests
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(provider.cost)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(provider.cost / provider.requestCount)}/req
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Cost Distribution */}
              {costMetrics && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Distribuição de Custos</CardTitle>
                    <CardDescription>
                      Custos por provedor e serviço
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-sm font-medium mb-3">Por Provedor</h4>
                        <div className="space-y-2">
                          {Object.entries(costMetrics.costByProvider).map(([providerId, cost]) => (
                            <div key={providerId} className="flex items-center justify-between">
                              <span className="text-sm">{providerId}</span>
                              <span className="text-sm font-medium">{formatCurrency(cost)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-3">Por Serviço</h4>
                        <div className="space-y-2">
                          {Object.entries(costMetrics.costByService).map(([serviceType, cost]) => (
                            <div key={serviceType} className="flex items-center justify-between">
                              <span className="text-sm">{serviceType}</span>
                              <span className="text-sm font-medium">{formatCurrency(cost)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Histórico de Custos</CardTitle>
                  <CardDescription>
                    Evolução dos custos ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {costHistory && costHistory.costs && costHistory.costs.length > 0 ? (
                    <div className="space-y-4">
                      {costHistory.costs.slice(0, 10).map((dataPoint, index) => (
                        <div key={dataPoint.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline">{new Date(dataPoint.timestamp).toLocaleDateString()}</Badge>
                            <div className="text-sm text-muted-foreground">
                              {dataPoint.model} - {dataPoint.provider}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">{formatCurrency(dataPoint.cost)}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(dataPoint.inputTokens + dataPoint.outputTokens)} tokens
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">Nenhum histórico encontrado</h3>
                      <p className="text-muted-foreground">
                        Os dados de custos aparecerão aqui conforme o uso
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projections" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Projeções de Custos</CardTitle>
                  <CardDescription>
                    Estimativas baseadas no uso atual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Projeções em Desenvolvimento</h3>
                    <p className="text-muted-foreground">
                      Esta funcionalidade será implementada em breve
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alertas de Custos</CardTitle>
                  <CardDescription>
                    Notificações sobre limites e anomalias
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sistema de Alertas</h3>
                    <p className="text-muted-foreground">
                      Configure alertas para monitorar custos em tempo real
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}