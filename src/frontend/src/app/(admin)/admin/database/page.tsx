'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Server,
  Database,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react'
import api from '@/lib/api'
import { DateText } from '@/components/DateText'
import { useToast } from '@/hooks/use-toast'

interface ServerHealth {
  serverId: string
  serverName: string
  os?: string
  uptimeSeconds?: number
  loadAvg?: number[]
  cpu?: {
    cores?: number
    model?: string
  }
  memory?: {
    totalBytes?: number
    usedBytes?: number
    freeBytes?: number
    availableBytes?: number
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
  postgres?: Array<{
    containerName: string
    image: string
    host: string
    hostPort?: number
    dbName?: string
    username?: string
  }>
  redis?: Array<{
    containerName: string
    image: string
    host: string
    hostPort?: number
  }>
  scannedAt?: string
}

interface DashboardStats {
  totalServers: number
  healthyServers: number
  totalDatabases: number
  totalRedis: number
}

export default function DatabaseDashboardPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [servers, setServers] = useState<ServerHealth[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalServers: 0,
    healthyServers: 0,
    totalDatabases: 0,
    totalRedis: 0,
  })

  const loadData = async () => {
    try {
      setLoading(true)

      // Carregar resultados de scan dos servidores
      const res = await api.get('/api/admin/database/servers/scan-results')

      if (res.data.success && res.data.data) {
        const serversData = Object.entries(res.data.data).map(([serverId, data]: any) => ({
          serverId,
          serverName: data.serverName || serverId,
          ...data.health,
          postgres: data.postgres || [],
          redis: data.redis || [],
          scannedAt: data.scannedAt,
        }))

        setServers(serversData)

        // Calcular estatísticas
        const totalDatabases = serversData.reduce((sum, s) => sum + (s.postgres?.length || 0), 0)
        const totalRedis = serversData.reduce((sum, s) => sum + (s.redis?.length || 0), 0)
        const healthyServers = serversData.filter(s => s.docker?.serverVersion).length

        setStats({
          totalServers: serversData.length,
          healthyServers,
          totalDatabases,
          totalRedis,
        })
      }
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      toast({
        title: 'Erro',
        description: error.response?.data?.error || 'Falha ao carregar dados',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
    toast({
      title: 'Atualizado',
      description: 'Dados atualizados com sucesso',
    })
  }

  useEffect(() => {
    loadData()

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      loadData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h`
    return `${Math.floor(seconds / 60)}m`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando dados do dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Database Dashboard</h1>
          <p className="text-muted-foreground">
            Monitoramento de servidores e bancos de dados
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Servidores</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.healthyServers} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bancos PostgreSQL</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDatabases}</div>
            <p className="text-xs text-muted-foreground">
              Instâncias detectadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Instâncias Redis</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRedis}</div>
            <p className="text-xs text-muted-foreground">
              Instâncias detectadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Containers Docker</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {servers.reduce((sum, s) => sum + (s.docker?.containers?.running || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Rodando agora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Servers Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Saúde dos Servidores
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real de CPU, memória e disco
          </CardDescription>
        </CardHeader>
        <CardContent>
          {servers.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum servidor conectado. Adicione servidores SSH em{' '}
                <a href="/super-admin/servers" className="underline">
                  Servidores SSH
                </a>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server) => {
                const memTotal = server.memory?.totalBytes || 0
                const memUsed = server.memory?.usedBytes || 0
                const memPct = memTotal > 0 ? (memUsed / memTotal) * 100 : 0

                const disk = server.disks?.[0]
                const diskPct = disk ? (disk.usedBytes / disk.sizeBytes) * 100 : 0

                return (
                  <Card key={server.serverId}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Server className="h-4 w-4" />
                          {server.serverName}
                        </span>
                        {server.docker?.serverVersion ? (
                          <Badge variant="default" className="text-xs">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Online
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            <XCircle className="mr-1 h-3 w-3" />
                            Offline
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* CPU */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Cpu className="h-3 w-3" />
                            CPU
                          </span>
                          <span className="font-medium">
                            {server.cpu?.cores || 0} cores
                          </span>
                        </div>
                        {server.loadAvg && (
                          <p className="text-xs text-muted-foreground">
                            Load: {server.loadAvg.slice(0, 3).map(l => l.toFixed(2)).join(' / ')}
                          </p>
                        )}
                      </div>

                      {/* Memory */}
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <MemoryStick className="h-3 w-3" />
                            Memória
                          </span>
                          <span className="font-medium">
                            {memPct.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={memPct} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatBytes(memUsed)} / {formatBytes(memTotal)}
                        </p>
                      </div>

                      {/* Disk */}
                      {disk && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <HardDrive className="h-3 w-3" />
                              Disco
                            </span>
                            <span className="font-medium">
                              {diskPct.toFixed(0)}%
                            </span>
                          </div>
                          <Progress value={diskPct} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatBytes(disk.usedBytes)} / {formatBytes(disk.sizeBytes)}
                          </p>
                        </div>
                      )}

                      {/* Docker */}
                      {server.docker && (
                        <div className="pt-2 border-t">
                          <p className="text-xs text-muted-foreground">
                            Docker: {server.docker.serverVersion || 'N/A'}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="text-green-600">
                              ▲ {server.docker.containers?.running || 0}
                            </span>
                            <span className="text-yellow-600">
                              ⏸ {server.docker.containers?.paused || 0}
                            </span>
                            <span className="text-red-600">
                              ■ {server.docker.containers?.stopped || 0}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Uptime */}
                      {server.uptimeSeconds && (
                        <p className="text-xs text-muted-foreground">
                          Uptime: {formatUptime(server.uptimeSeconds)}
                        </p>
                      )}

                      {/* Scan time */}
                      {server.scannedAt && (
                        <p className="text-xs text-muted-foreground">
                          Última verificação: <DateText value={server.scannedAt} preset="relative" />
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Databases Tables */}
      <Tabs defaultValue="postgres" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="postgres" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            PostgreSQL ({stats.totalDatabases})
          </TabsTrigger>
          <TabsTrigger value="redis" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Redis ({stats.totalRedis})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="postgres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bancos de Dados PostgreSQL</CardTitle>
              <CardDescription>
                Instâncias PostgreSQL detectadas nos servidores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.totalDatabases === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum banco PostgreSQL detectado
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Container</TableHead>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Servidor</TableHead>
                      <TableHead>Host:Porta</TableHead>
                      <TableHead>Database</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.flatMap((server) =>
                      (server.postgres || []).map((db, idx) => (
                        <TableRow key={`${server.serverId}-${idx}`}>
                          <TableCell className="font-medium">
                            {db.containerName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{db.image}</Badge>
                          </TableCell>
                          <TableCell>{server.serverName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {db.host}:{db.hostPort || 5432}
                          </TableCell>
                          <TableCell>{db.dbName || '-'}</TableCell>
                          <TableCell>{db.username || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="redis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Instâncias Redis</CardTitle>
              <CardDescription>
                Instâncias Redis detectadas nos servidores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.totalRedis === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Nenhuma instância Redis detectada
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Container</TableHead>
                      <TableHead>Imagem</TableHead>
                      <TableHead>Servidor</TableHead>
                      <TableHead>Host:Porta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servers.flatMap((server) =>
                      (server.redis || []).map((redis, idx) => (
                        <TableRow key={`${server.serverId}-${idx}`}>
                          <TableCell className="font-medium">
                            {redis.containerName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{redis.image}</Badge>
                          </TableCell>
                          <TableCell>{server.serverName}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {redis.host}:{redis.hostPort || 6379}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
