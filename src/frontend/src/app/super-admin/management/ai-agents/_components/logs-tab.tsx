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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Server,
  ArrowUpDown,
  ArrowDownUp,
  Calendar,
  TrendingUp
} from "lucide-react"
import { LogDetailsModal } from "./log-details-modal"
import { useAiLogs } from "../_hooks/use-ai-logs"

export function LogsTab() {
  const {
    webhookLogs,
    jobs,
    loading,
    error,
    pagination,
    listWebhookLogs,
    listJobs,
    exportLogs,
    refresh
  } = useAiLogs()

  const [activeTab, setActiveTab] = useState<'webhooks' | 'jobs'>('webhooks')
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [directionFilter, setDirectionFilter] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<{ id: string; type: 'webhook' | 'job' } | null>(null)

  // Load logs on mount
  useEffect(() => {
    listWebhookLogs()
    listJobs()
  }, [listWebhookLogs, listJobs])

  // Apply filters
  useEffect(() => {
    const filters: any = {}
    
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== "all") filters.status = statusFilter
    if (directionFilter !== "all") filters.direction = directionFilter

    if (activeTab === 'webhooks') {
      listWebhookLogs(filters, { page: 1, limit: 20 })
    } else {
      listJobs(filters, { page: 1, limit: 20 })
    }
  }, [searchTerm, statusFilter, directionFilter, activeTab, listWebhookLogs, listJobs])

  const handleViewLog = (id: string, type: 'webhook' | 'job') => {
    setSelectedLog({ id, type })
  }

  const handleExportLogs = async () => {
    const filters: any = {}
    if (searchTerm) filters.search = searchTerm
    if (statusFilter !== "all") filters.status = statusFilter
    if (directionFilter !== "all") filters.direction = directionFilter

    await exportLogs(filters, 'csv')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case '200':
      case '201':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
      case 'cancelled':
      case '400':
      case '401':
      case '403':
      case '404':
      case '500':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      'completed': { variant: 'default', label: 'Completed' },
      'failed': { variant: 'destructive', label: 'Failed' },
      'cancelled': { variant: 'secondary', label: 'Cancelled' },
      'pending': { variant: 'outline', label: 'Pending' },
      'processing': { variant: 'outline', label: 'Processing' },
      '200': { variant: 'default', label: 'Success' },
      '201': { variant: 'default', label: 'Created' },
      '400': { variant: 'destructive', label: 'Bad Request' },
      '401': { variant: 'destructive', label: 'Unauthorized' },
      '403': { variant: 'destructive', label: 'Forbidden' },
      '404': { variant: 'destructive', label: 'Not Found' },
      '500': { variant: 'destructive', label: 'Server Error' }
    }

    const statusInfo = statusMap[status] || { variant: 'outline' as const, label: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A'
    if (duration < 1000) return `${duration}ms`
    return `${(duration / 1000).toFixed(2)}s`
  }

  if (loading && webhookLogs.length === 0 && jobs.length === 0) {
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
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="completed">Sucesso</SelectItem>
              <SelectItem value="failed">Erro</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="processing">Processando</SelectItem>
            </SelectContent>
          </Select>

          {activeTab === 'webhooks' && (
            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Direção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="INBOUND">Entrada</SelectItem>
                <SelectItem value="OUTBOUND">Saída</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" onClick={refresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Atualizar
          </Button>
          <Button onClick={handleExportLogs}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookLogs.length + jobs.length}</div>
            <p className="text-xs text-muted-foreground">
              Webhooks + Jobs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{webhookLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              {webhookLogs.filter(log => log.responseStatus && log.responseStatus < 400).length} sucessos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
            <p className="text-xs text-muted-foreground">
              {jobs.filter(job => job.status === 'completed').length} completos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                ((webhookLogs.filter(log => log.responseStatus && log.responseStatus < 400).length + 
                  jobs.filter(job => job.status === 'completed').length) / 
                 Math.max(webhookLogs.length + jobs.length, 1)) * 100
              )}%
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24h
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Logs e Monitoramento</span>
            <Badge variant="outline">{activeTab === 'webhooks' ? webhookLogs.length : jobs.length}</Badge>
          </CardTitle>
          <CardDescription>
            Monitore webhooks, jobs assíncronos e atividade do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'webhooks' | 'jobs')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="webhooks" className="flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span>Webhooks</span>
                <Badge variant="outline">{webhookLogs.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>Jobs</span>
                <Badge variant="outline">{jobs.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="webhooks" className="space-y-4">
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
                    <TableHead>Status</TableHead>
                    <TableHead>Direção</TableHead>
                    <TableHead>Provedor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webhookLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(String(log.responseStatus))}
                          {getStatusBadge(String(log.responseStatus))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {log.direction === 'INBOUND' ? (
                            <ArrowDownUp className="h-4 w-4 text-blue-500" />
                          ) : (
                            <ArrowUpDown className="h-4 w-4 text-green-500" />
                          )}
                          <span className="text-sm">{log.direction}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {log.provider?.displayName || 'Unknown'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.requestMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDuration(log.duration)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
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
                            <DropdownMenuItem onClick={() => handleViewLog(log.id, 'webhook')}>
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

              {webhookLogs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum webhook encontrado</h3>
                  <p className="text-muted-foreground">
                    Os logs de webhook aparecerão aqui quando houver atividade
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="jobs" className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo de Serviço</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Iniciado</TableHead>
                    <TableHead>Completado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(job.status)}
                          {getStatusBadge(job.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{job.serviceType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{job.attempts}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {job.startedAt ? new Date(job.startedAt).toLocaleString() : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {job.completedAt ? new Date(job.completedAt).toLocaleString() : 'N/A'}
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
                            <DropdownMenuItem onClick={() => handleViewLog(job.id, 'job')}>
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

              {jobs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum job encontrado</h3>
                  <p className="text-muted-foreground">
                    Os jobs assíncronos aparecerão aqui quando houver atividade
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {selectedLog && (
        <LogDetailsModal
          isOpen={!!selectedLog}
          onClose={() => setSelectedLog(null)}
          logId={selectedLog.id}
          logType={selectedLog.type}
        />
      )}
    </div>
  )
}
