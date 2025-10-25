"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  MessageCircle, 
  Settings, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Play,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Key,
  ExternalLink,
  BarChart,
  Activity,
  DollarSign,
  Zap,
  Database,
  Users,
  Calendar,
  MessageSquare,
  FileText,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Lock,
  Unlock,
  Globe,
  Server,
  Monitor,
  Smartphone,
  Watch,
  Mail,
  Phone,
  MapPin,
  Building2,
  UserCog,
  PieChart,
  BarChart3,
  Receipt,
  Wallet,
  Calculator,
  Send,
  QrCode,
  Smartphone as PhoneIcon,
  Bot,
  Headphones,
  Mic,
  Video,
  Image as ImageIcon,
  File,
  Link as LinkIcon,
  Copy,
  Share,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Star,
  Flag,
  Archive,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
} from "lucide-react"
import Link from "next/link"

interface WhatsAppConfig {
  instanceName: string;
  apiUrl: string;
  apiKey: string;
  webhookUrl: string;
  qrCodeUrl?: string;
  sessionStatus: 'disconnected' | 'connecting' | 'connected' | 'qr_required';
  headless: boolean;
  timeout: number;
  maxRetries: number;
}

interface MessageStats {
  totalMessages: number;
  sentMessages: number;
  receivedMessages: number;
  deliveredMessages: number;
  failedMessages: number;
  last30Days: {
    messages: number;
    sent: number;
    received: number;
  };
  byType: {
    [type: string]: {
      count: number;
      percentage: number;
    };
  };
  byStatus: {
    [status: string]: {
      count: number;
      percentage: number;
    };
  };
}

interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  qrCode?: string;
  sessionInfo?: any;
  timestamp: Date;
}

export default function WhatsAppIntegrationPage() {
  const [config, setConfig] = useState<WhatsAppConfig>({
    instanceName: '',
    apiUrl: '',
    apiKey: '',
    webhookUrl: '',
    sessionStatus: 'disconnected',
    headless: true,
    timeout: 30000,
    maxRetries: 3
  });

  const [messageStats, setMessageStats] = useState<MessageStats>({
    totalMessages: 5420,
    sentMessages: 3200,
    receivedMessages: 2220,
    deliveredMessages: 3150,
    failedMessages: 50,
    last30Days: {
      messages: 1200,
      sent: 800,
      received: 400
    },
    byType: {
      'text': { count: 3000, percentage: 55.4 },
      'image': { count: 1200, percentage: 22.1 },
      'audio': { count: 800, percentage: 14.8 },
      'video': { count: 300, percentage: 5.5 },
      'document': { count: 120, percentage: 2.2 }
    },
    byStatus: {
      'sent': { count: 3200, percentage: 59.0 },
      'delivered': { count: 3150, percentage: 58.1 },
      'read': { count: 2800, percentage: 51.7 },
      'failed': { count: 50, percentage: 0.9 }
    }
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      // Simular API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsConfigured(true);
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    try {
      // Simular teste de conexão
      await new Promise(resolve => setTimeout(resolve, 2000));
      setTestResult({
        success: true,
        message: 'Conexão estabelecida com sucesso',
        responseTime: 1.5,
        sessionInfo: {
          instanceName: config.instanceName,
          status: 'connected',
          phoneNumber: '+5511999999999',
          batteryLevel: 85,
          signalStrength: 'high'
        },
        timestamp: new Date()
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Falha na conexão: Verifique suas configurações',
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    try {
      // Simular início de sessão
      await new Promise(resolve => setTimeout(resolve, 3000));
      setConfig(prev => ({ ...prev, sessionStatus: 'qr_required' }));
      setTestResult({
        success: true,
        message: 'Sessão iniciada - QR Code gerado',
        qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        timestamp: new Date()
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Falha ao iniciar sessão',
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600';
      case 'connecting': return 'text-yellow-600';
      case 'qr_required': return 'text-blue-600';
      case 'disconnected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return CheckCircle;
      case 'connecting': return Clock;
      case 'qr_required': return QrCode;
      case 'disconnected': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Link href="/super-admin/management" className="hover:text-foreground">
          Gerenciamento
        </Link>
        <span>/</span>
        <Link href="/super-admin/management/integrations" className="hover:text-foreground">
          Integrações
        </Link>
        <span>/</span>
        <span className="text-foreground">WhatsApp</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
            <p className="text-muted-foreground">
              Configuração da integração com WhatsApp para comunicação com clientes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Ativo" : "Inativo"}
          </Badge>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>

      {/* Status Alert */}
      {testResult && (
        <Alert className={testResult.success ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
          <div className="flex items-center space-x-2">
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <AlertDescription>
              {testResult.message}
              {testResult.responseTime && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({testResult.responseTime}s)
                </span>
              )}
              {testResult.sessionInfo && (
                <span className="ml-2 text-sm text-muted-foreground">
                  • {testResult.sessionInfo.phoneNumber}
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      {/* QR Code Modal */}
      {testResult?.qrCode && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <QrCode className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Escaneie o QR Code com seu WhatsApp para conectar:</p>
              <div className="flex justify-center">
                <Image 
                  src={testResult.qrCode} 
                  alt="QR Code" 
                  width={128}
                  height={128}
                  className="w-32 h-32 border rounded"
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                QR Code válido por 2 minutos
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="session">Sessão</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configuração Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="h-5 w-5" />
                  <span>Configuração Principal</span>
                </CardTitle>
                <CardDescription>
                  Configurações da API e instância
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="instance-name">Nome da Instância</Label>
                  <Input
                    id="instance-name"
                    value={config.instanceName}
                    onChange={(e) => setConfig(prev => ({ ...prev, instanceName: e.target.value }))}
                    placeholder="minha-instancia"
                  />
                </div>

                <div>
                  <Label htmlFor="api-url">URL da API</Label>
                  <Input
                    id="api-url"
                    value={config.apiUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiUrl: e.target.value }))}
                    placeholder="https://api.evolution.com"
                  />
                </div>

                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sua-api-key"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="webhook-url">Webhook URL</Label>
                  <Input
                    id="webhook-url"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://api.fitOS.com/webhooks/whatsapp"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="headless"
                    checked={config.headless}
                    onCheckedChange={(checked) => setConfig(prev => ({ ...prev, headless: checked }))}
                  />
                  <Label htmlFor="headless">Modo Headless</Label>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSaveConfig} disabled={isLoading}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Configuração
                  </Button>
                  <Button variant="outline" onClick={handleTestConnection} disabled={isLoading}>
                    <Play className="h-4 w-4 mr-2" />
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Status da Sessão */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smartphone className="h-5 w-5" />
                  <span>Status da Sessão</span>
                </CardTitle>
                <CardDescription>
                  Informações sobre a conexão atual
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const StatusIcon = getStatusIcon(config.sessionStatus);
                      return <StatusIcon className={`h-4 w-4 ${getStatusColor(config.sessionStatus)}`} />;
                    })()}
                    <span className={`text-sm ${getStatusColor(config.sessionStatus)}`}>
                      {config.sessionStatus === 'connected' ? 'Conectado' :
                       config.sessionStatus === 'connecting' ? 'Conectando' :
                       config.sessionStatus === 'qr_required' ? 'QR Code Necessário' :
                       'Desconectado'}
                    </span>
                  </div>
                </div>

                {testResult?.sessionInfo && (
                  <div className="space-y-2 pt-4 border-t">
                    <h4 className="font-medium">Informações da Sessão</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Número:</span>
                        <span className="font-mono">{testResult.sessionInfo.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Bateria:</span>
                        <div className="flex items-center space-x-1">
                          <Battery className="h-3 w-3" />
                          <span>{testResult.sessionInfo.batteryLevel}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Sinal:</span>
                        <div className="flex items-center space-x-1">
                          <SignalHigh className="h-3 w-3" />
                          <span className="capitalize">{testResult.sessionInfo.signalStrength}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleStartSession} 
                    disabled={isLoading || config.sessionStatus === 'connected'}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {config.sessionStatus === 'connected' ? 'Sessão Ativa' : 'Iniciar Sessão'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="h-5 w-5" />
                <span>Documentação e Recursos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Evolution API</h4>
                  <Button variant="outline" asChild>
                    <a href="https://doc.evolution-api.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">WhatsApp Web.js</h4>
                  <Button variant="outline" asChild>
                    <a href="https://wwebjs.dev" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Documentação
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">SDK Instalado</h4>
                  <Badge variant="outline">whatsapp-web.js@^1.23.0</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="session" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status da Conexão</CardTitle>
                <Wifi className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {config.sessionStatus === 'connected' ? 'Online' : 'Offline'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Última conexão: há 2 minutos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bateria</CardTitle>
                <Battery className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">
                  Carregando
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sinal</CardTitle>
                <SignalHigh className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Alto</div>
                <p className="text-xs text-muted-foreground">
                  4 barras
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Controles da Sessão</CardTitle>
              <CardDescription>
                Gerencie a sessão do WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button variant="outline" className="h-20 flex-col">
                  <Play className="h-6 w-6 mb-2" />
                  <span className="text-sm">Iniciar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <RefreshCw className="h-6 w-6 mb-2" />
                  <span className="text-sm">Reconectar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col">
                  <Archive className="h-6 w-6 mb-2" />
                  <span className="text-sm">Pausar</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col text-red-600">
                  <XCircle className="h-6 w-6 mb-2" />
                  <span className="text-sm">Desconectar</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Mensagens</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(messageStats.totalMessages)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(messageStats.last30Days.messages)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                <Send className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(messageStats.sentMessages)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(messageStats.last30Days.sent)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recebidas</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(messageStats.receivedMessages)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(messageStats.last30Days.received)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Entrega</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((messageStats.deliveredMessages / messageStats.sentMessages) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {messageStats.failedMessages} falharam
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens por Tipo</CardTitle>
                <CardDescription>
                  Distribuição de mensagens por tipo de mídia
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(messageStats.byType).map(([type, stats]) => (
                    <div key={type} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {type === 'text' && <FileText className="h-4 w-4 text-blue-600" />}
                        {type === 'image' && <ImageIcon className="h-4 w-4 text-green-600" />}
                        {type === 'audio' && <Mic className="h-4 w-4 text-purple-600" />}
                        {type === 'video' && <Video className="h-4 w-4 text-red-600" />}
                        {type === 'document' && <File className="h-4 w-4 text-orange-600" />}
                        <div>
                          <h4 className="font-medium capitalize">{type}</h4>
                          <p className="text-sm text-muted-foreground">
                            {formatNumber(stats.count)} mensagens
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stats.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status das Mensagens</CardTitle>
                <CardDescription>
                  Distribuição por status de entrega
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(messageStats.byStatus).map(([status, stats]) => (
                    <div key={status} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">{status}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(stats.count)} mensagens
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{stats.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Mensagens</CardTitle>
              <CardDescription>
                Histórico detalhado de todas as mensagens enviadas e recebidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Send className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Mensagem Enviada</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:30:25</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">+5511999999999</div>
                    <div className="text-sm text-muted-foreground">Texto</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Mensagem Recebida</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:28:10</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">+5511888888888</div>
                    <div className="text-sm text-muted-foreground">Imagem</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium">Falha no Envio</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:25:45</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">+5511777777777</div>
                    <div className="text-sm text-red-600">Número inválido</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Send className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Mensagem Enviada</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:20:30</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">+5511666666666</div>
                    <div className="text-sm text-muted-foreground">Áudio</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

