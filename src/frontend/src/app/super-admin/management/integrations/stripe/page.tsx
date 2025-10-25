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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CreditCard, 
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
  CreditCard as CardIcon,
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
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
  Building2 as Building2Icon,
  UserCog as UserCogIcon,
  PieChart as PieChartIcon,
  BarChart3 as BarChart3Icon,
  Receipt as ReceiptIcon,
  Wallet as WalletIcon,
  Calculator as CalculatorIcon,
} from "lucide-react"
import Link from "next/link"

interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  environment: 'test' | 'live';
  timeout: number;
  maxRetries: number;
  apiVersion: string;
}

interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  avgTransactionValue: number;
  last30Days: {
    transactions: number;
    amount: number;
  };
  byCurrency: {
    [currency: string]: {
      transactions: number;
      amount: number;
    };
  };
  byPaymentMethod: {
    [method: string]: {
      transactions: number;
      amount: number;
    };
  };
}

interface TestResult {
  success: boolean;
  message: string;
  responseTime?: number;
  accountInfo?: any;
  timestamp: Date;
}

export default function StripeIntegrationPage() {
  const [config, setConfig] = useState<StripeConfig>({
    secretKey: '',
    publishableKey: '',
    webhookSecret: '',
    environment: 'test',
    timeout: 30000,
    maxRetries: 3,
    apiVersion: '2023-10-16'
  });

  const [paymentStats, setPaymentStats] = useState<PaymentStats>({
    totalTransactions: 1250,
    totalAmount: 125000.50,
    successRate: 98.2,
    avgTransactionValue: 100.00,
    last30Days: {
      transactions: 320,
      amount: 32000.75
    },
    byCurrency: {
      'usd': { transactions: 800, amount: 80000 },
      'brl': { transactions: 300, amount: 150000 },
      'eur': { transactions: 150, amount: 15000 }
    },
    byPaymentMethod: {
      'card': { transactions: 1000, amount: 100000 },
      'pix': { transactions: 200, amount: 20000 },
      'boleto': { transactions: 50, amount: 5000 }
    }
  });

  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isActive, setIsActive] = useState(true);

  const apiVersions = [
    { value: '2023-10-16', label: '2023-10-16 (Latest)' },
    { value: '2023-08-16', label: '2023-08-16' },
    { value: '2023-06-16', label: '2023-06-16' },
    { value: '2023-04-16', label: '2023-04-16' }
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
        responseTime: 0.8,
        accountInfo: {
          id: 'acct_1234567890',
          country: 'BR',
          currency: 'brl',
          type: 'standard'
        },
        timestamp: new Date()
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Falha na conexão: Verifique suas chaves de API',
        timestamp: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency.toUpperCase()
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
        <span className="text-foreground">Stripe</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stripe</h1>
            <p className="text-muted-foreground">
              Configuração da integração com Stripe para processamento de pagamentos
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
              {testResult.accountInfo && (
                <span className="ml-2 text-sm text-muted-foreground">
                  • Conta: {testResult.accountInfo.id} ({testResult.accountInfo.country?.toUpperCase()})
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>
      )}

      <Tabs defaultValue="config" className="space-y-4">
        <TabsList>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
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
                  Chaves de API e configurações básicas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="environment">Ambiente</Label>
                  <Select value={config.environment} onValueChange={(value: 'test' | 'live') => setConfig(prev => ({ ...prev, environment: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Teste (Test Mode)</SelectItem>
                      <SelectItem value="live">Produção (Live Mode)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="secret-key">Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="secret-key"
                      type={showSecretKey ? "text" : "password"}
                      value={config.secretKey}
                      onChange={(e) => setConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                      placeholder="sk_test_... ou sk_live_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                    >
                      {showSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="publishable-key">Publishable Key</Label>
                  <Input
                    id="publishable-key"
                    value={config.publishableKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, publishableKey: e.target.value }))}
                    placeholder="pk_test_... ou pk_live_..."
                  />
                </div>

                <div>
                  <Label htmlFor="webhook-secret">Webhook Secret</Label>
                  <div className="relative">
                    <Input
                      id="webhook-secret"
                      type={showWebhookSecret ? "text" : "password"}
                      value={config.webhookSecret}
                      onChange={(e) => setConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      placeholder="whsec_..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    >
                      {showWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
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

            {/* Configurações Avançadas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <span>Configurações Avançadas</span>
                </CardTitle>
                <CardDescription>
                  Configurações técnicas da API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-version">API Version</Label>
                  <Select value={config.apiVersion} onValueChange={(value) => setConfig(prev => ({ ...prev, apiVersion: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {apiVersions.map((version) => (
                        <SelectItem key={version.value} value={version.value}>
                          {version.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Informações da Conta</h4>
                  {testResult?.accountInfo ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ID da Conta:</span>
                        <span className="font-mono">{testResult.accountInfo.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>País:</span>
                        <span>{testResult.accountInfo.country?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Moeda:</span>
                        <span>{testResult.accountInfo.currency?.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tipo:</span>
                        <span className="capitalize">{testResult.accountInfo.type}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Execute um teste de conexão para ver as informações da conta
                    </p>
                  )}
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
                    <a href="https://stripe.com/docs" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Stripe Docs
                    </a>
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">SDK Instalado</h4>
                  <Badge variant="outline">stripe@^14.0.0</Badge>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Dashboard Stripe</h4>
                  <Button variant="outline" asChild>
                    <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Dashboard
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(paymentStats.totalTransactions)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatNumber(paymentStats.last30Days.transactions)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(paymentStats.totalAmount)}</div>
                <p className="text-xs text-muted-foreground">
                  +{formatCurrency(paymentStats.last30Days.amount)} este mês
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{paymentStats.successRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Valor médio: {formatCurrency(paymentStats.avgTransactionValue)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Moedas Suportadas</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Object.keys(paymentStats.byCurrency).length}</div>
                <p className="text-xs text-muted-foreground">
                  USD, BRL, EUR
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Pagamentos por Moeda</CardTitle>
                <CardDescription>
                  Distribuição de transações por moeda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(paymentStats.byCurrency).map(([currency, stats]) => (
                    <div key={currency} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{currency.toUpperCase()}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(stats.transactions)} transações
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(stats.amount, currency)}</div>
                        <div className="text-sm text-muted-foreground">
                          {((stats.transactions / paymentStats.totalTransactions) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
                <CardDescription>
                  Distribuição por método de pagamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(paymentStats.byPaymentMethod).map(([method, stats]) => (
                    <div key={method} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium capitalize">{method}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(stats.transactions)} transações
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(stats.amount)}</div>
                        <div className="text-sm text-muted-foreground">
                          {((stats.transactions / paymentStats.totalTransactions) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Webhooks</CardTitle>
              <CardDescription>
                Configure os eventos do Stripe que devem ser enviados para sua aplicação
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <Input
                    id="webhook-url"
                    value="https://api.fitOS.com/webhooks/stripe"
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Esta URL será configurada automaticamente no dashboard do Stripe
                  </p>
                </div>

                <div>
                  <Label>Eventos Configurados</Label>
                  <div className="grid gap-2 mt-2">
                    {[
                      'payment_intent.succeeded',
                      'payment_intent.payment_failed',
                      'customer.created',
                      'customer.updated',
                      'subscription.created',
                      'subscription.updated',
                      'subscription.deleted',
                      'invoice.payment_succeeded',
                      'invoice.payment_failed'
                    ].map((event) => (
                      <div key={event} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-mono">{event}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Status do Webhook</h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full"></div>
                    <span className="text-sm">Webhook ativo e funcionando</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Última verificação: há 2 minutos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Webhooks</CardTitle>
              <CardDescription>
                Últimos eventos recebidos do Stripe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">payment_intent.succeeded</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:30:25</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">pi_1234567890</div>
                    <div className="text-sm text-muted-foreground">200ms</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">customer.created</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:28:10</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">cus_1234567890</div>
                    <div className="text-sm text-muted-foreground">150ms</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium">payment_intent.payment_failed</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:25:45</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">pi_0987654321</div>
                    <div className="text-sm text-red-600">Timeout</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Transações</CardTitle>
              <CardDescription>
                Histórico detalhado de todas as transações processadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Pagamento Aprovado</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:30:25</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(150.00)}</div>
                    <div className="text-sm text-muted-foreground">Cartão •••• 4242</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Pagamento Aprovado</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:28:10</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(75.50)}</div>
                    <div className="text-sm text-muted-foreground">PIX</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium">Pagamento Recusado</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:25:45</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(200.00)}</div>
                    <div className="text-sm text-red-600">Cartão •••• 0005</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Pagamento Aprovado</p>
                      <p className="text-sm text-muted-foreground">15/01/2024 14:20:30</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{formatCurrency(300.00)}</div>
                    <div className="text-sm text-muted-foreground">Boleto</div>
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

