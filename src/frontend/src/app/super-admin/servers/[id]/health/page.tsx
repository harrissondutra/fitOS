'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { useServerMetrics } from '@/hooks/use-server-metrics'
import {
  ArrowLeft,
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  Server,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Package,
  Database,
  X,
  Trash2,
  Eye,
  TrendingUp,
  Wifi,
  WifiOff,
  Zap
} from 'lucide-react'
import { DateText } from '@/components/DateText'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ServerHealth {
  os?: string
  uptimeSeconds?: number
  loadAvg?: number[]
  cpu?: {
    cores?: number
    model?: string
  }
  memory?: {
    totalBytes?: number
    freeBytes?: number
    availableBytes?: number
    usedBytes?: number
  }
  disks?: Array<{
    filesystem: string
    sizeBytes: number
    usedBytes: number
    availBytes: number
    usePercent: string
    mountpoint: string
  }>
  docker?: {
    serverVersion?: string
    containers?: {
      total?: number
      running?: number
      paused?: number
      stopped?: number
    }
    images?: number
  }
}

interface DockerImage {
  containerName?: string
  repository: string
  tag: string
  imageId: string
  created: string
  size: string
}

interface ServerInfo {
  id: string
  name: string
  host: string
  port: number
  username: string
  createdAt: string
}

export default function ServerHealthPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const serverId = params.id as string

  // WebSocket real-time metrics
  const { 
    health: realtimeHealth, 
    isConnected, 
    error: wsError, 
    lastUpdate,
    reconnect: reconnectWS 
  } = useServerMetrics(serverId)

  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [health, setHealth] = useState<ServerHealth | null>(null)
  const [dockerImages, setDockerImages] = useState<DockerImage[]>([])
  const [metricsHistory, setMetricsHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  // Docker action states
  const [containerAction, setContainerAction] = useState<{ action: string; containerId: string; name: string } | null>(null)
  const [logsDialogOpen, setLogsDialogOpen] = useState(false)
  const [containerLogs, setContainerLogs] = useState('')
  const [selectedContainer, setSelectedContainer] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)
  
  // Image management states
  const [pullImageDialogOpen, setPullImageDialogOpen] = useState(false)
  const [newImageName, setNewImageName] = useState('')
  const [imageAction, setImageAction] = useState<{ action: string; imageId: string; name: string } | null>(null)

  useEffect(() => {
    if (serverId) {
      loadServerData()
    }
  }, [serverId])

  // Update local health when WebSocket receives new data
  useEffect(() => {
    if (realtimeHealth) {
      setHealth(realtimeHealth)
    }
  }, [realtimeHealth])

  // Show WebSocket errors
  useEffect(() => {
    if (wsError) {
      toast({
        title: 'Erro de Conexão',
        description: wsError,
        variant: 'destructive',
      })
    }
  }, [wsError, toast])

  const loadServerData = async () => {
    try {
      setLoading(true)
      
      // Carregar informações do servidor
      const serverRes = await api.get('/api/admin/database/servers')
      const serverData = serverRes.data
      if (serverData.success) {
        const server = serverData.data.items?.find((s: ServerInfo) => s.id === serverId)
        if (server) {
          setServerInfo(server)
        }
      }

      // Carregar health
      await loadHealth()
      
      // Carregar scan results (docker images)
      await loadDockerImages()
      
      // Carregar histórico de métricas
      await loadMetricsHistory()
    } catch (error) {
      console.error('Error loading server data:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do servidor',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMetricsHistory = async () => {
    try {
      const res = await api.get(`/api/admin/database/servers/${serverId}/metrics/history?hours=24&limit=200`)
      const data = res.data
      if (data.success && data.data && data.data.metrics) {
        setMetricsHistory(data.data.metrics)
      }
    } catch (error) {
      console.error('Error loading metrics history:', error)
    }
  }

  const loadHealth = async () => {
    try {
      const res = await api.get(`/api/admin/database/servers/${serverId}/health`)
      const data = res.data
      if (data.success && data.data) {
        setHealth(data.data)
      }
    } catch (error) {
      console.error('Error loading health:', error)
    }
  }

  const loadDockerImages = async () => {
    try {
      const res = await api.get(`/api/admin/database/servers/${serverId}/scan-results`)
      const data = res.data
      if (data.success && data.data) {
        // Extrair informações de containers Docker do scan
        const postgres = data.data.postgres || []
        const redis = data.data.redis || []
        
        // Criar lista de imagens Docker encontradas
        const images: DockerImage[] = []
        
        postgres.forEach((container: any) => {
          if (container.image) {
            const [repo, tag] = container.image.split(':')
            images.push({
              containerName: container.containerName || repo,
              repository: repo,
              tag: tag || 'latest',
              imageId: container.containerId || '',
              created: container.createdAt || '',
              size: container.size || 'N/A'
            })
          }
        })
        
        redis.forEach((container: any) => {
          if (container.image) {
            const [repo, tag] = container.image.split(':')
            images.push({
              containerName: container.containerName || repo,
              repository: repo,
              tag: tag || 'latest',
              imageId: container.containerId || '',
              created: container.createdAt || '',
              size: container.size || 'N/A'
            })
          }
        })
        
        setDockerImages(images)
      }
    } catch (error) {
      console.error('Error loading docker images:', error)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      // Forçar novo scan
      await api.post(`/api/admin/database/servers/${serverId}/scan-now`)
      
      // Aguardar um pouco e recarregar
      setTimeout(() => {
        loadHealth()
        loadDockerImages()
        toast({
          title: 'Sucesso',
          description: 'Dados atualizados com sucesso',
        })
      }, 2000)
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados',
        variant: 'destructive',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const handleDelete = async () => {
    try {
      const res = await api.delete(`/api/admin/database/servers/${serverId}`)

      const data = res.data
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Servidor removido com sucesso',
        })
        router.push('/super-admin/servers')
      } else {
        throw new Error(data.error || 'Erro ao remover servidor')
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Não foi possível remover o servidor',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
    }
  }

  // Docker Container Actions
  const handleContainerAction = async (action: 'start' | 'stop' | 'restart', containerId: string, name: string) => {
    setContainerAction({ action, containerId, name })
  }

  const executeContainerAction = async () => {
    if (!containerAction) return

    setActionLoading(true)
    try {
      await api.post(
        `/api/admin/database/servers/${serverId}/docker/containers/${containerAction.containerId}/${containerAction.action}`
      )

      toast({
        title: 'Sucesso',
        description: `Container ${containerAction.name} ${
          containerAction.action === 'start' ? 'iniciado' : 
          containerAction.action === 'stop' ? 'parado' : 'reiniciado'
        } com sucesso`,
      })

      // Recarregar dados
      await loadHealth()
      await loadDockerImages()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao executar ação',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
      setContainerAction(null)
    }
  }

  const handleViewLogs = async (containerId: string, name: string) => {
    setSelectedContainer({ id: containerId, name })
    setLogsDialogOpen(true)
    setContainerLogs('Carregando logs...')

    try {
      const res = await api.get(
        `/api/admin/database/servers/${serverId}/docker/containers/${containerId}/logs?tail=100`
      )

      if (res.data.success) {
        setContainerLogs(res.data.data.logs || 'Nenhum log disponível')
      } else {
        setContainerLogs('Erro ao carregar logs')
      }
    } catch (error: any) {
      setContainerLogs(`Erro: ${error.response?.data?.error || error.message}`)
    }
  }

  // Docker Image Actions
  const handlePullImage = async () => {
    if (!newImageName.trim()) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da imagem',
        variant: 'destructive',
      })
      return
    }

    setActionLoading(true)
    try {
      await api.post(`/api/admin/database/servers/${serverId}/docker/images/pull`, {
        imageName: newImageName,
      })

      toast({
        title: 'Sucesso',
        description: `Imagem ${newImageName} baixada com sucesso`,
      })

      setNewImageName('')
      setPullImageDialogOpen(false)

      // Recarregar imagens
      await loadDockerImages()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao baixar imagem',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveImage = async (imageId: string, name: string) => {
    setImageAction({ action: 'remove', imageId, name })
  }

  const executeImageRemoval = async () => {
    if (!imageAction) return

    setActionLoading(true)
    try {
      await api.delete(`/api/admin/database/servers/${serverId}/docker/images/${imageAction.imageId}`)

      toast({
        title: 'Sucesso',
        description: `Imagem ${imageAction.name} removida com sucesso`,
      })

      // Recarregar imagens
      await loadDockerImages()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao remover imagem',
        variant: 'destructive',
      })
    } finally {
      setActionLoading(false)
      setImageAction(null)
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!serverInfo) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Servidor não encontrado</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/super-admin/servers')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{serverInfo.name}</h1>
              {/* WebSocket Connection Indicator */}
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-500/10 text-green-700 border-green-500/20">
                    <Zap className="h-3 w-3 animate-pulse" />
                    <Wifi className="h-3 w-3" />
                    <span className="text-xs font-medium">Tempo Real</span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="flex items-center gap-1 bg-gray-500/10 text-gray-600 border-gray-500/20">
                    <WifiOff className="h-3 w-3" />
                    <span className="text-xs font-medium">Desconectado</span>
                  </Badge>
                )}
                {lastUpdate > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(lastUpdate).toLocaleTimeString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            <p className="text-muted-foreground">
              {serverInfo.host}:{serverInfo.port} • {serverInfo.username}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isConnected && (
            <Button 
              variant="outline" 
              onClick={reconnectWS}
              className="border-orange-500/20 text-orange-600 hover:bg-orange-500/10"
            >
              <Wifi className="mr-2 h-4 w-4" />
              Reconectar
            </Button>
          )}
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Atualizar
          </Button>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        </div>
      </div>

      {/* Server Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Informações do Servidor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Host</p>
              <p className="font-mono font-medium">{serverInfo.host}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Porta</p>
              <p className="font-medium">{serverInfo.port}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuário</p>
              <p className="font-medium">{serverInfo.username}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cadastrado em</p>
              <p className="font-medium">
                <DateText value={serverInfo.createdAt} preset="datetime" />
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CPU */}
          {health.cpu && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.loadAvg && health.loadAvg.length > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">{health.loadAvg[0].toFixed(2)}</span>
                        <Badge variant={health.loadAvg[0] > 2 ? 'destructive' : health.loadAvg[0] > 1 ? 'default' : 'secondary'}>
                          {health.loadAvg[0] > 2 ? 'Alto' : health.loadAvg[0] > 1 ? 'Médio' : 'Normal'}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min((health.loadAvg[0] / (health.cpu.cores || 1)) * 100, 100)} 
                        className={
                          health.loadAvg[0] > 2 
                            ? '[&>div]:bg-red-500' 
                            : health.loadAvg[0] > 1 
                            ? '[&>div]:bg-yellow-500' 
                            : '[&>div]:bg-green-500'
                        }
                      />
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {health.cpu.cores || 'N/A'} núcleo{(health.cpu.cores || 0) !== 1 ? 's' : ''}
                    {health.cpu.model && ` • ${health.cpu.model}`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Memory */}
          {health.memory && health.memory.totalBytes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MemoryStick className="h-4 w-4" />
                  Memória
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.memory.usedBytes !== undefined && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {((health.memory.usedBytes / health.memory.totalBytes) * 100).toFixed(1)}%
                        </span>
                        <Badge variant={
                          (health.memory.usedBytes / health.memory.totalBytes) > 0.8 ? 'destructive' : 
                          (health.memory.usedBytes / health.memory.totalBytes) > 0.6 ? 'default' : 'secondary'
                        }>
                          {(health.memory.usedBytes / health.memory.totalBytes) > 0.8 ? 'Alto' : 
                           (health.memory.usedBytes / health.memory.totalBytes) > 0.6 ? 'Médio' : 'Normal'}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min((health.memory.usedBytes / health.memory.totalBytes) * 100, 100)}
                        className={
                          (health.memory.usedBytes / health.memory.totalBytes) > 0.8 
                            ? '[&>div]:bg-red-500' 
                            : (health.memory.usedBytes / health.memory.totalBytes) > 0.6 
                            ? '[&>div]:bg-yellow-500' 
                            : '[&>div]:bg-green-500'
                        }
                      />
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(health.memory.usedBytes || 0)} / {formatBytes(health.memory.totalBytes)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disk */}
          {health.disks && health.disks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Disco ({health.disks[0].mountpoint})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {health.disks[0] && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {parseInt(health.disks[0].usePercent.replace('%', ''))}%
                        </span>
                        <Badge variant={
                          parseInt(health.disks[0].usePercent.replace('%', '')) > 80 ? 'destructive' : 
                          parseInt(health.disks[0].usePercent.replace('%', '')) > 60 ? 'default' : 'secondary'
                        }>
                          {parseInt(health.disks[0].usePercent.replace('%', '')) > 80 ? 'Alto' : 
                           parseInt(health.disks[0].usePercent.replace('%', '')) > 60 ? 'Médio' : 'Normal'}
                        </Badge>
                      </div>
                      <Progress 
                        value={Math.min(parseInt(health.disks[0].usePercent.replace('%', '')), 100)}
                        className={
                          parseInt(health.disks[0].usePercent.replace('%', '')) > 80 
                            ? '[&>div]:bg-red-500' 
                            : parseInt(health.disks[0].usePercent.replace('%', '')) > 60 
                            ? '[&>div]:bg-yellow-500' 
                            : '[&>div]:bg-green-500'
                        }
                      />
                    </>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(health.disks[0].usedBytes)} / {formatBytes(health.disks[0].sizeBytes)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Additional Info */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Status do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {health.uptimeSeconds && (
                  <div>
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-lg font-semibold">{formatUptime(health.uptimeSeconds)}</p>
                  </div>
                )}
                {health.os && (
                  <div>
                    <p className="text-sm text-muted-foreground">Sistema Operacional</p>
                    <p className="text-lg font-semibold">{health.os}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {health.docker && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Docker
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {health.docker.serverVersion && (
                    <div>
                      <p className="text-sm text-muted-foreground">Versão</p>
                      <p className="text-lg font-semibold">{health.docker.serverVersion}</p>
                    </div>
                  )}
                  {health.docker.containers && (
                    <div>
                      <p className="text-sm text-muted-foreground">Containers</p>
                      <p className="text-lg font-semibold">
                        {health.docker.containers.running || 0} rodando / {health.docker.containers.total || 0} total
                      </p>
                    </div>
                  )}
                  {health.docker.images !== undefined && (
                    <div>
                      <p className="text-sm text-muted-foreground">Imagens</p>
                      <p className="text-lg font-semibold">{health.docker.images}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Histórico de Métricas - Gráficos */}
      {metricsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Histórico de Métricas (Últimas 24h)
            </CardTitle>
            <CardDescription>
              Monitoramento de CPU, Memória e Disco ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cpu" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cpu">CPU</TabsTrigger>
                <TabsTrigger value="memory">Memória</TabsTrigger>
                <TabsTrigger value="disk">Disco</TabsTrigger>
              </TabsList>

              {/* CPU Chart */}
              <TabsContent value="cpu" className="space-y-4">
                <div className="h-[300px] w-full">
                  <ChartContainer
                    config={{
                      cpu: {
                        label: 'Load Average',
                        color: 'hsl(var(--chart-1))',
                      },
                    }}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={metricsHistory.map((m) => ({
                        time: new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        cpu: m.data?.loadAvg?.[0] || 0,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="cpu"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#cpuGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </TabsContent>

              {/* Memory Chart */}
              <TabsContent value="memory" className="space-y-4">
                <div className="h-[300px] w-full">
                  <ChartContainer
                    config={{
                      memory: {
                        label: 'Uso de Memória (%)',
                        color: 'hsl(var(--chart-2))',
                      },
                    }}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={metricsHistory.map((m) => ({
                        time: new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        memory: m.data?.memory?.totalBytes
                          ? ((m.data.memory.usedBytes / m.data.memory.totalBytes) * 100).toFixed(1)
                          : 0,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="memoryGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="memory"
                        stroke="hsl(var(--chart-2))"
                        fill="url(#memoryGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </TabsContent>

              {/* Disk Chart */}
              <TabsContent value="disk" className="space-y-4">
                <div className="h-[300px] w-full">
                  <ChartContainer
                    config={{
                      disk: {
                        label: 'Uso de Disco (%)',
                        color: 'hsl(var(--chart-3))',
                      },
                    }}
                    className="h-full w-full"
                  >
                    <AreaChart
                      data={metricsHistory.map((m) => ({
                        time: new Date(m.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                        disk: m.data?.disks?.[0]?.sizeBytes
                          ? ((m.data.disks[0].usedBytes / m.data.disks[0].sizeBytes) * 100).toFixed(1)
                          : 0,
                      }))}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="diskGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 100]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="disk"
                        stroke="hsl(var(--chart-3))"
                        fill="url(#diskGradient)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Docker: Containers e Imagens */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Docker: Containers e Imagens
          </CardTitle>
          <CardDescription>
            Containers e imagens Docker detectados no servidor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="containers" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="containers" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                Containers
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Imagens
              </TabsTrigger>
            </TabsList>

            {/* Tab: Containers */}
            <TabsContent value="containers" className="space-y-4">
              {health?.docker?.containers ? (
                <div className="space-y-3">
                  {/* Stats de Containers */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {health.docker.containers.running || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Rodando</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-yellow-600">
                            {health.docker.containers.paused || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Pausados</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-red-600">
                            {health.docker.containers.stopped || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Parados</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {health.docker.containers.total || 0}
                          </p>
                          <p className="text-xs text-muted-foreground">Total</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Containers Docker Detectados */}
                  {dockerImages.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground">
                        Containers Detectados:
                      </h4>
                      {dockerImages.map((image, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{image.containerName || image.repository}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="text-xs">{image.repository}</span>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  {image.tag}
                                </Badge>
                                <span>•</span>
                                <span className="font-mono text-xs">
                                  ID: {image.imageId.substring(0, 12)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{image.size}</Badge>
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Rodando
                            </Badge>
                            
                            {/* Action Buttons */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewLogs(image.imageId, image.containerName || image.repository)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContainerAction('restart', image.imageId, image.containerName || image.repository)}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleContainerAction('stop', image.imageId, image.containerName || image.repository)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhum container Docker detectado. Execute um scan para descobrir containers.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Informações de containers Docker não disponíveis.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Tab: Imagens */}
            <TabsContent value="images" className="space-y-4">
              {dockerImages.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma imagem Docker encontrada. Execute um scan para descobrir imagens.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">
                        {dockerImages.length} imagem{dockerImages.length !== 1 ? 'ns' : ''} encontrada{dockerImages.length !== 1 ? 's' : ''}
                      </p>
                      <Badge variant="outline">
                        Docker {health?.docker?.serverVersion || 'N/A'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setPullImageDialogOpen(true)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Baixar Imagem
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    {dockerImages.map((image, index) => (
                      <Card key={index} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-blue-500/10">
                                <Database className="h-5 w-5 text-blue-500" />
                              </div>
                              <div className="space-y-1">
                                <p className="font-semibold">{image.containerName || image.repository}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground">{image.repository}</span>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <Badge variant="secondary" className="text-xs">
                                    Tag: {image.tag}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {image.imageId.substring(0, 12)}
                                  </span>
                                </div>
                                {image.created && (
                                  <p className="text-xs text-muted-foreground">
                                    Criado: <DateText value={image.created} preset="relative" />
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right space-y-2">
                              <Badge variant="outline" className="font-mono">
                                {image.size}
                              </Badge>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveImage(image.imageId, `${image.repository}:${image.tag}`)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Remover
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Servidor</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o servidor <strong>{serverInfo?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Container Action Confirmation Dialog */}
      <Dialog open={!!containerAction} onOpenChange={() => setContainerAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {containerAction?.action === 'start' && 'Iniciar Container'}
              {containerAction?.action === 'stop' && 'Parar Container'}
              {containerAction?.action === 'restart' && 'Reiniciar Container'}
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja {
                containerAction?.action === 'start' ? 'iniciar' : 
                containerAction?.action === 'stop' ? 'parar' : 'reiniciar'
              } o container <strong>{containerAction?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContainerAction(null)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={executeContainerAction} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Container Logs Dialog */}
      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Logs do Container</DialogTitle>
            <DialogDescription>
              Container: <strong>{selectedContainer?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto bg-black text-green-400 p-4 rounded-md font-mono text-xs">
            <pre className="whitespace-pre-wrap">{containerLogs}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLogsDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pull Image Dialog */}
      <Dialog open={pullImageDialogOpen} onOpenChange={setPullImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Baixar Imagem Docker</DialogTitle>
            <DialogDescription>
              Digite o nome da imagem Docker que deseja baixar (ex: nginx:latest)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="imageName" className="text-sm font-medium">
                Nome da Imagem
              </label>
              <input
                id="imageName"
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                placeholder="nginx:latest"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                disabled={actionLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPullImageDialogOpen(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handlePullImage} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Baixando...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Baixar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Image Confirmation Dialog */}
      <Dialog open={!!imageAction} onOpenChange={() => setImageAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover Imagem Docker</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover a imagem <strong>{imageAction?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageAction(null)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={executeImageRemoval} disabled={actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

