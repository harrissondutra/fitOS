'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Server, 
  Key, 
  Scan, 
  RefreshCw, 
  Trash2, 
  MoreVertical,
  Activity,
  Cpu,
  Database,
  AlertCircle,
  CheckCircle2,
  Plus,
  Edit,
  Loader2,
  ShieldCheck,
  ShieldX,
  Upload,
  FileText,
  Eye,
  LogOut,
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DateText } from '@/components/DateText'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { apiUrl } from '@/lib/api-url'
import api from '@/lib/api'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ServerConfig {
  id: string
  name: string
  host: string
  port: number
  username: string
  createdAt: string
}

interface ServerKeyStatus {
  exists: boolean
}

export default function ServersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [servers, setServers] = useState<ServerConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [keyDialogOpen, setKeyDialogOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState<ServerConfig | null>(null)
  const [scanning, setScanning] = useState<string | null>(null)
  const [expandedServer, setExpandedServer] = useState<string | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '22',
    username: '',
    privateKey: '',
  })
  const [createServerKeyMethod, setCreateServerKeyMethod] = useState<'upload' | 'paste'>('paste')

  // Key form state
  const [keyData, setKeyData] = useState({
    privateKey: '',
  })
  const [keyInputMethod, setKeyInputMethod] = useState<'upload' | 'paste'>('paste')

  // Key status cache
  const [keyStatuses, setKeyStatuses] = useState<Record<string, boolean>>({})

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/admin/database/servers')
      const data = res.data
      if (data.success) {
        setServers(data.data.items || [])
        // Carregar status das chaves
        await loadKeyStatuses(data.data.items || [])
      }
    } catch (error) {
      console.error('Error loading servers:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os servidores',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const loadKeyStatuses = async (serverList: ServerConfig[]) => {
    const statuses: Record<string, boolean> = {}
    await Promise.all(
      serverList.map(async (server) => {
        try {
          const res = await api.get(`/api/admin/database/servers/${server.id}/key/status`)
          const data = res.data
          statuses[server.id] = data.success && data.data.exists
        } catch (error) {
          statuses[server.id] = false
        }
      })
    )
    setKeyStatuses(statuses)
  }

  const handleCreateServerKeyUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar extensão
    const validExtensions = ['.key', '.pem', '.pub', '.ssh']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validExtensions.some(ext => fileExtension === ext) && !file.name.includes('id_')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo de chave SSH (.key, .pem, .pub ou sem extensão)',
        variant: 'destructive',
      })
      return
    }

    try {
      const text = await file.text()
      setFormData({ ...formData, privateKey: text })
      toast({
        title: 'Arquivo carregado',
        description: `Chave SSH carregada do arquivo ${file.name}`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao ler arquivo',
        description: error.message || 'Não foi possível ler o arquivo',
        variant: 'destructive',
      })
    }
  }

  const handleCreateServer = async () => {
    try {
      // Criar servidor primeiro usando api do axios (com auth token automático)
      const res = await api.post('/api/admin/database/servers', {
        name: formData.name,
        host: formData.host,
        port: parseInt(formData.port) || 22,
        username: formData.username,
      })

      const data = res.data
      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar servidor')
      }

      const serverId = data.data.server?.id || data.data.id

      // Se tem chave SSH, salvar também
      if (formData.privateKey.trim()) {
        try {
          const keyRes = await api.put(`/api/admin/database/servers/${serverId}/key`, {
            privateKey: formData.privateKey,
          })

          const keyData = keyRes.data
          if (!keyData.success) {
            toast({
              title: 'Aviso',
              description: 'Servidor criado, mas houve erro ao salvar a chave SSH. Você pode adicioná-la depois.',
              variant: 'default',
            })
          }
        } catch (keyError) {
          toast({
            title: 'Aviso',
            description: 'Servidor criado, mas houve erro ao salvar a chave SSH. Você pode adicioná-la depois.',
            variant: 'default',
          })
        }
      }

      toast({
        title: 'Sucesso',
        description: 'Servidor criado com sucesso' + (formData.privateKey.trim() ? ' e chave SSH configurada' : ''),
      })
      setDialogOpen(false)
      resetForm()
      loadServers()
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Não foi possível criar o servidor',
        variant: 'destructive',
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validar extensão
    const validExtensions = ['.key', '.pem', '.pub', '.ssh']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validExtensions.some(ext => fileExtension === ext) && !file.name.includes('id_')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione um arquivo de chave SSH (.key, .pem, .pub ou sem extensão)',
        variant: 'destructive',
      })
      return
    }

    try {
      const text = await file.text()
      setKeyData({ privateKey: text })
      toast({
        title: 'Arquivo carregado',
        description: `Chave SSH carregada do arquivo ${file.name}`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao ler arquivo',
        description: error.message || 'Não foi possível ler o arquivo',
        variant: 'destructive',
      })
    }
  }

  const handleSaveKey = async () => {
    if (!selectedServer) return

    if (!keyData.privateKey.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, carregue um arquivo ou cole a chave SSH',
        variant: 'destructive',
      })
      return
    }

    try {
      const res = await api.put(`/api/admin/database/servers/${selectedServer.id}/key`, {
        privateKey: keyData.privateKey,
      })

      const data = res.data
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Chave SSH salva com sucesso',
        })
        setKeyDialogOpen(false)
        setKeyData({ privateKey: '' })
        setKeyInputMethod('paste')
        setKeyStatuses((prev) => ({ ...prev, [selectedServer.id]: true }))
      } else {
        throw new Error(data.error || 'Erro ao salvar chave')
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Não foi possível salvar a chave SSH',
        variant: 'destructive',
      })
    }
  }

  const handleDeleteServer = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este servidor?')) return

    try {
      const res = await api.delete(`/api/admin/database/servers/${id}`)

      const data = res.data
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Servidor deletado com sucesso',
        })
        loadServers()
      } else {
        throw new Error(data.error || 'Erro ao deletar servidor')
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Não foi possível deletar o servidor',
        variant: 'destructive',
      })
    }
  }

  const handleScanServer = async (id: string) => {
    try {
      setScanning(id)
      const res = await api.post(`/api/admin/database/servers/${id}/scan-now`)

      const data = res.data
      if (data.success) {
        toast({
          title: 'Sucesso',
          description: 'Scan iniciado com sucesso',
        })
      } else {
        throw new Error(data.error || 'Erro ao iniciar scan')
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.error || error.message || 'Não foi possível iniciar o scan',
        variant: 'destructive',
      })
    } finally {
      setScanning(null)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      host: '',
      port: '22',
      username: '',
      privateKey: '',
    })
    setCreateServerKeyMethod('paste')
    setSelectedServer(null)
  }

  const openKeyDialog = (server: ServerConfig) => {
    setSelectedServer(server)
    setKeyDialogOpen(true)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Servidores SSH</h1>
          <p className="text-muted-foreground">
            Gerenciar servidores SSH para descoberta automática de bancos de dados
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Servidor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
            <div className="p-6 pb-0">
              <DialogHeader>
                <DialogTitle>Adicionar Servidor SSH</DialogTitle>
                <DialogDescription>
                  Configure as credenciais de acesso SSH do servidor
                </DialogDescription>
              </DialogHeader>
            </div>
            <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
              <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Servidor</Label>
                <Input
                  id="name"
                  placeholder="Ex: Servidor Principal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="host">Host / IP</Label>
                <Input
                  id="host"
                  placeholder="Ex: 192.168.1.100 ou exemplo.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">Porta SSH</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="22"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    placeholder="Ex: root ou ubuntu"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Chave SSH */}
              <div className="pt-4 border-t">
                <Label className="text-base font-semibold mb-3 block">Chave Privada SSH (Opcional)</Label>
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Você pode adicionar a chave SSH agora ou depois. Necessário para Oracle Cloud e outros serviços que requerem autenticação por chave.
                  </AlertDescription>
                </Alert>

                <Tabs value={createServerKeyMethod} onValueChange={(value) => setCreateServerKeyMethod(value as 'upload' | 'paste')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Carregar Arquivo
                    </TabsTrigger>
                    <TabsTrigger value="paste" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Colar Chave
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="createServerKeyFile">Selecionar Arquivo de Chave SSH</Label>
                      <Input
                        id="createServerKeyFile"
                        type="file"
                        accept=".key,.pem,.pub,.ssh,text/plain"
                        onChange={handleCreateServerKeyUpload}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Formatos aceitos: .key, .pem, .pub, .ssh ou arquivos sem extensão (ex: id_rsa, oracle-cloud.key)
                      </p>
                      {formData.privateKey && (
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Arquivo carregado com sucesso. Verifique o conteúdo na aba "Colar Chave" se necessário.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="createServerPrivateKey">Chave Privada SSH</Label>
                      <Textarea
                        id="createServerPrivateKey"
                        placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                        className="font-mono text-xs"
                        rows={6}
                        value={formData.privateKey}
                        onChange={(e) => setFormData({ ...formData, privateKey: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Cole a chave privada SSH completa (formato OpenSSH ou PEM)
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                {formData.privateKey && (
                  <Alert className="mt-4">
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Chave carregada ({formData.privateKey.split('\n').length} linhas). 
                      {formData.privateKey.includes('BEGIN') && formData.privateKey.includes('END') 
                        ? ' Formato válido detectado.' 
                        : ' Verifique se a chave está completa.'}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              </div>
            </ScrollArea>
            <div className="p-6 pt-0">
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateServer}
                  disabled={!formData.name || !formData.host || !formData.username}
                  className="w-full sm:w-auto"
                >
                  Criar Servidor{formData.privateKey.trim() ? ' e Configurar Chave' : ''}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Servidores */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : servers.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum servidor cadastrado. Clique em "Adicionar Servidor" para começar.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {servers.length} servidor{servers.length !== 1 ? 'es' : ''} cadastrado{servers.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {servers.map((server) => (
              <Card key={server.id} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{server.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/super-admin/servers/${server.id}/health`)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openKeyDialog(server)}>
                          <Key className="mr-2 h-4 w-4" />
                          {keyStatuses[server.id] ? 'Atualizar Chave SSH' : 'Adicionar Chave SSH'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleScanServer(server.id)}
                          disabled={!keyStatuses[server.id] || scanning === server.id}
                        >
                          {scanning === server.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Scan className="mr-2 h-4 w-4" />
                          )}
                          Escanear Agora
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteServer(server.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-sm font-mono">
                    {server.host}:{server.port || 22}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Dados Básicos */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Host:</span>
                        <span className="font-mono text-xs">{server.host}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Usuário:</span>
                        <span className="font-medium">{server.username}</span>
                      </div>
                    </div>

                    {/* SSH Key Status */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-muted-foreground">Chave SSH:</span>
                      {keyStatuses[server.id] ? (
                        <Badge variant="default" className="bg-green-600">
                          <ShieldCheck className="mr-1 h-3 w-3" />
                          Configurada
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <ShieldX className="mr-1 h-3 w-3" />
                          Não configurada
                        </Badge>
                      )}
                    </div>

                    {/* Created At */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Cadastrado:</span>
                      <DateText value={server.createdAt} preset="relative" />
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => router.push(`/super-admin/servers/${server.id}/health`)}
                      >
                        <Activity className="mr-2 h-4 w-4" />
                        Ver Saúde
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleScanServer(server.id)}
                        disabled={!keyStatuses[server.id] || scanning === server.id}
                      >
                        {scanning === server.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedServer(expandedServer === server.id ? null : server.id)}
                      >
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Old table code (hidden but kept for fallback) */}
      <div className="hidden">
        <Card>
          <CardContent>
            {servers.length > 0 && (
            <Table>
              {/* Table mantida para fallback mas não é exibida */}
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Host</TableHead>
                  <TableHead>Porta</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Chave SSH</TableHead>
                  <TableHead>Cadastrado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servers.map((server) => (
                  <React.Fragment key={server.id}>
                    <TableRow 
                      className="cursor-pointer hover:bg-muted/50" 
                      onClick={() => {
                        setSelectedServer(server);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      <TableCell className="font-medium">{server.name}</TableCell>
                      <TableCell className="font-mono text-sm">{server.host}</TableCell>
                      <TableCell>{server.port || 22}</TableCell>
                      <TableCell>{server.username}</TableCell>
                      <TableCell>
                        {keyStatuses[server.id] ? (
                          <Badge variant="default" className="bg-green-500">
                            <ShieldCheck className="mr-1 h-3 w-3" />
                            Configurada
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <ShieldX className="mr-1 h-3 w-3" />
                            Não configurada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DateText value={server.createdAt} preset="datetime" />
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                openKeyDialog(server);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              {keyStatuses[server.id] ? 'Atualizar Chave SSH' : 'Adicionar Chave SSH'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleScanServer(server.id);
                              }}
                              disabled={!keyStatuses[server.id] || scanning === server.id}
                            >
                              {scanning === server.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Scan className="mr-2 h-4 w-4" />
                              )}
                              Escanear Agora
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteServer(server.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedServer === server.id && keyStatuses[server.id] && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          <Card className="m-4">
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                  <Server className="h-5 w-5" />
                                  {server.name}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedServer(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </CardTitle>
                              <CardDescription>
                                {server.host}:{server.port} • {server.username}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Host</p>
                                  <p className="font-mono font-medium">{server.host}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Porta</p>
                                  <p className="font-medium">{server.port || 22}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Usuário</p>
                                  <p className="font-medium">{server.username}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Cadastrado em</p>
                                  <p className="font-medium">
                                    <DateText value={server.createdAt} preset="datetime" />
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 pt-4 border-t">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => router.push(`/super-admin/servers/${server.id}/health`)}
                                >
                                  <Activity className="mr-2 h-4 w-4" />
                                  Ver Saúde
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setExpandedServer(null)
                                    toast({
                                      title: 'Desconectado',
                                      description: 'Conexão SSH fechada',
                                    })
                                  }}
                                >
                                  <LogOut className="mr-2 h-4 w-4" />
                                  Desconectar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setExpandedServer(null)
                                    openKeyDialog(server)
                                  }}
                                >
                                  <Key className="mr-2 h-4 w-4" />
                                  Gerenciar Chave
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setExpandedServer(null)
                                    handleDeleteServer(server.id)
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Dialog para adicionar/atualizar chave SSH */}
      <Dialog open={keyDialogOpen} onOpenChange={(open) => {
        setKeyDialogOpen(open)
        if (!open) {
          setKeyData({ privateKey: '' })
          setKeyInputMethod('paste')
        }
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col p-0">
          <div className="p-6 pb-0">
            <DialogHeader>
              <DialogTitle>
                {selectedServer && keyStatuses[selectedServer.id] 
                  ? 'Atualizar Chave SSH' 
                  : 'Adicionar Chave SSH'}
              </DialogTitle>
              <DialogDescription>
                {selectedServer && (
                  <>Configure a chave privada SSH para o servidor <strong>{selectedServer.name}</strong></>
                )}
              </DialogDescription>
            </DialogHeader>
          </div>
          <ScrollArea className="max-h-[calc(90vh-140px)] px-6">
            <div className="space-y-4 py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                A chave privada será armazenada de forma criptografada e usada apenas para automação de scans.
              </AlertDescription>
            </Alert>

            <Tabs value={keyInputMethod} onValueChange={(value) => setKeyInputMethod(value as 'upload' | 'paste')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Carregar Arquivo
                </TabsTrigger>
                <TabsTrigger value="paste" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Colar Chave
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="keyFile">Selecionar Arquivo de Chave SSH</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="keyFile"
                      type="file"
                      accept=".key,.pem,.pub,.ssh,text/plain"
                      onChange={handleFileUpload}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: .key, .pem, .pub, .ssh ou arquivos sem extensão (ex: id_rsa)
                  </p>
                  {keyData.privateKey && (
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Arquivo carregado com sucesso. Verifique o conteúdo abaixo ou alterne para a aba "Colar Chave" para editar.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="paste" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="privateKey">Chave Privada SSH</Label>
                  <Textarea
                    id="privateKey"
                    placeholder="-----BEGIN OPENSSH PRIVATE KEY-----&#10;...&#10;-----END OPENSSH PRIVATE KEY-----"
                    className="font-mono text-xs"
                    rows={6}
                    value={keyData.privateKey}
                    onChange={(e) => setKeyData({ privateKey: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Cole a chave privada SSH completa (formato OpenSSH ou PEM)
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {keyData.privateKey && (
              <Alert>
                <Key className="h-4 w-4" />
                <AlertDescription>
                  Chave carregada ({keyData.privateKey.split('\n').length} linhas). 
                  {keyData.privateKey.includes('BEGIN') && keyData.privateKey.includes('END') 
                    ? ' Formato válido detectado.' 
                    : ' Verifique se a chave está completa.'}
                </AlertDescription>
              </Alert>
            )}
            </div>
          </ScrollArea>
          <div className="p-6 pt-0">
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => {
                setKeyDialogOpen(false)
                setKeyData({ privateKey: '' })
                setKeyInputMethod('paste')
              }} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveKey}
                disabled={!keyData.privateKey.trim()}
                className="w-full sm:w-auto"
              >
                Salvar Chave
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Detalhes do Servidor */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Servidor</DialogTitle>
            <DialogDescription>
              Informações e ações rápidas para o servidor selecionado
            </DialogDescription>
          </DialogHeader>

          {selectedServer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Nome</div>
                  <div className="font-medium">{selectedServer.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Host</div>
                  <div className="font-mono">{selectedServer.host}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Porta</div>
                  <div>{selectedServer.port || 22}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Usuário</div>
                  <div>{selectedServer.username}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Chave SSH</div>
                  <div>
                    {keyStatuses[selectedServer.id] ? (
                      <Badge variant="default" className="bg-green-500">
                        <ShieldCheck className="mr-1 h-3 w-3" />
                        Configurada
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <ShieldX className="mr-1 h-3 w-3" />
                        Não configurada
                      </Badge>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Cadastrado em</div>
                  <div>
                    <DateText value={selectedServer.createdAt} preset="datetime" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    openKeyDialog(selectedServer);
                  }}
                >
                  <Key className="mr-2 h-4 w-4" />
                  {keyStatuses[selectedServer.id] ? 'Atualizar Chave SSH' : 'Adicionar Chave SSH'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    handleScanServer(selectedServer.id);
                  }}
                  disabled={!keyStatuses[selectedServer.id] || scanning === selectedServer.id}
                >
                  {scanning === selectedServer.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Scan className="mr-2 h-4 w-4" />
                  )}
                  Escanear Agora
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailsDialogOpen(false);
                    setExpandedServer(expandedServer === selectedServer.id ? null : selectedServer.id);
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes Expandidos
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Tem certeza que deseja deletar este servidor?')) {
                      setDetailsDialogOpen(false);
                      handleDeleteServer(selectedServer.id);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Deletar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
