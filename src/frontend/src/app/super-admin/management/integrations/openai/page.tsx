"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
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
  CreditCard,
  Building2,
  UserCog,
  PieChart,
  BarChart3,
  Activity as ActivityIcon,
  Users as UsersIcon,
  Calendar as CalendarIcon,
  MessageSquare as MessageSquareIcon,
  FileText as FileTextIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Trash2 as Trash2Icon,
  Edit as EditIcon,
  Plus as PlusIcon,
  Minus as MinusIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Target as TargetIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Unlock as UnlockIcon,
  Globe as GlobeIcon,
  Server as ServerIcon,
  Monitor as MonitorIcon,
  Smartphone as SmartphoneIcon,
  Watch as WatchIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  CreditCard as CreditCardIcon,
  Building2 as Building2Icon,
  UserCog as UserCogIcon,
  PieChart as PieChartIcon,
  BarChart3 as BarChart3Icon,
} from "lucide-react"
import Link from "next/link"

interface OpenAIConfig {
  apiKey: string;
  organizationId?: string;
  timeout: number;
  maxRetries: number;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  successRate: number;
  avgResponseTime: number;
  last30Days: {
    requests: number;
    tokens: number;
    cost: number;
  };
  byModel: {
    [model: string]: {
      requests: number;
      tokens: number;
      cost: number;
    };
  };
}

interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  model?: string;
  timestamp: Date;
}

export default function OpenAIIntegrationPage() {
  const [config, setConfig] = useState<OpenAIConfig>({
    apiKey: '',
    organizationId: '',
    timeout: 60000,
    maxRetries: 3,
    defaultModel: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  });

  const [usageStats, setUsageStats] = useState<UsageStats>({
    totalRequests: 15420,
    totalTokens: 1250000,
    totalCost: 1250.50,
    successRate: 98.5,
    avgResponseTime: 1.2,
    last30Days: {
      requests: 3200,
      tokens: 280000,
      cost: 280.75
    },
    byModel: {
      'gpt-4': { requests: 8000, tokens: 600000, cost: 600 },
      'gpt-3.5-turbo': { requests: 7420, tokens: 650000, cost: 650.50 }
    }
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const models = [
    { value: 'gpt-4', label: 'GPT-4', description: 'Modelo mais avançado' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Versão otimizada do GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Modelo rápido e econômico' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K', description: 'Contexto estendido' }
  ];

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
        responseTime: 1.2,
        model: config.defaultModel,
        timestamp: new Date()
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Falha na conexão: Verifique sua API Key',
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
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
        <span className="text-foreground">OpenAI</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
            <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OpenAI</h1>
            <p className="text-muted-foreground">
              Configuração da integração com OpenAI API
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
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="usage">Uso e Estatísticas</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
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
                  Credenciais e configurações básicas da API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-key">API Key</Label>
                  <div className="relative">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
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
                  <Label htmlFor="organization-id">Organization ID (Opcional)</Label>
                  <Input
                    id="organization-id"
                    value={config.organizationId}
                    onChange={(e) => setConfig(prev => ({ ...prev, organizationId: e.target.value }))}
                    placeholder="org-..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={config.timeout}
                      onChange={(e) => setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-retries">Max Retries</Label>
                    <Input
                      id="max-retries"
                      type="number"
                      value={config.maxRetries}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) }))}
                    />
                  </div>
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

            {/* Configurações de Modelo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações do Modelo</span>
                </CardTitle>
                <CardDescription>
                  Parâmetros padrão para geração de texto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default-model">Modelo Padrão</Label>
                  <Select value={config.defaultModel} onValueChange={(value) => setConfig(prev => ({ ...prev, defaultModel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          <div>
                            <div className="font-medium">{model.label}</div>
                            <div className="text-xs text-muted-foreground">{model.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="temperature">Temperature</Label>
                    <Input
                      id="temperature"
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={config.temperature}
                      onChange={(e) => setConfig(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens"
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="top-p">Top P</Label>
                    <Input
                      id="top-p"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={config.topP}
                      onChange={(e) => setConfig(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="frequency-penalty">Frequency Penalty</Label>
                    <Input
                      id="frequency-penalty"
                      type="number"
                      step="0.1"
                      min="-2"
                      max="2"
                      value={config.frequencyPenalty}
                      onChange={(e) => setConfig(prev => ({ ...prev, frequencyPenalty: parseFloat(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="presence-penalty">Presence Penalty</Label>
                  <Input
                    id="presence-penalty"
                    type="number"
                    step="0.1"
                    min="-2"
                    max="2"
                    value={config.presencePenalty}
                    onChange={(e) => setConfig(prev => ({ ...prev, presencePenalty: parseFloat(e.target.value) }))}
                  />
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
                  <h4 className="font-medium">Documentação Oficial</h4>
                  <Button variant="outline" asChild>
                    <a href="https://platform.openai.com/docs" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      OpenAI Docs
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">SDK Instalado</h4>
                  <Badge variant="outline">openai@^4.0.0</Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Última Atualização</h4>
                  <span className="text-sm text-muted-foreground">15/01/2024</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(usageStats.totalRequests)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(usageStats.last30Days.requests)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(usageStats.totalTokens)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(usageStats.last30Days.tokens)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Custo Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(usageStats.totalCost)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(usageStats.last30Days.cost)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {usageStats.avgResponseTime}s tempo médio
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso por Modelo</CardTitle>
              <CardDescription>
                Distribuição de uso entre os diferentes modelos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(usageStats.byModel).map(([model, stats]) => (
                  <div key={model} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{model}</h4>
                      <p className="text-sm text-muted-foreground">
                        {formatNumber(stats.requests)} requests • {formatNumber(stats.tokens)} tokens
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(stats.cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        {((stats.requests / usageStats.totalRequests) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modelos Disponíveis</CardTitle>
              <CardDescription>
                Lista de modelos OpenAI disponíveis para uso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.value} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{model.label}</h4>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={model.value === config.defaultModel ? "default" : "outline"}>
                        {model.value === config.defaultModel ? "Padrão" : "Disponível"}
                      </Badge>
                      {model.value !== config.defaultModel && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfig(prev => ({ ...prev, defaultModel: model.value }))}
                        >
                          Definir como Padrão
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Uso</CardTitle>
              <CardDescription>
                Histórico de chamadas para a API OpenAI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Chat Completion - GPT-4</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:30:25</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">1,250 tokens</div>
                    <div className="text-sm text-muted-foreground">$0.0125</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Chat Completion - GPT-3.5 Turbo</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:28:10</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">850 tokens</div>
                    <div className="text-sm text-muted-foreground">$0.0017</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium">Chat Completion - GPT-4</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:25:45</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-600">Rate limit exceeded</div>
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

