"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Settings, 
  Shield, 
  Zap, 
  Webhook, 
  Lock, 
  Plug, 
  Cog,
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  Info,
  TestTube,
  X
} from "lucide-react"
import { useAiSettings } from "../../management/ai-agents/_hooks/use-ai-settings"

export default function AISettingsPage() {
  const {
    settings,
    loading,
    error,
    saving,
    saveGlobalSettings,
    saveRateLimitingSettings,
    saveWebhookSettings,
    saveSecuritySettings,
    saveIntegrationSettings,
    saveAdvancedSettings,
    testWebhookSettings,
    generateEncryptionKey,
    resetToDefaults,
    exportSettings,
    importSettings,
    clearError
  } = useAiSettings()

  const [activeTab, setActiveTab] = useState('global')
  const [testResults, setTestResults] = useState<any>(null)

  // Default settings if not loaded yet
  const defaultSettings = {
    global: {
      defaultProvider: 'openai',
      defaultModel: 'gpt-4',
      defaultTemperature: 0.7,
      defaultMaxTokens: 1024,
      defaultTimeout: 30000,
      enableFallback: true,
      enableRetry: true,
      maxRetries: 3,
      enableLogging: true,
      logLevel: 'info' as const
    },
    rateLimiting: {
      enabled: true,
      globalRateLimit: 1000,
      perProviderRateLimit: {},
      perServiceRateLimit: {},
      burstLimit: 100,
      windowSize: 1,
      enableQueue: true,
      queueMaxSize: 1000
    },
    webhook: {
      enabled: true,
      secret: '',
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableSignatureValidation: true,
      enableTimestampValidation: true,
      maxAge: 300,
      allowedIPs: [],
      enableLogging: true
    },
    security: {
      encryptionEnabled: true,
      encryptionKey: '',
      enableApiKeyRotation: false,
      rotationInterval: 30,
      enableAuditLog: true,
      enableAccessControl: true,
      allowedRoles: ['SUPER_ADMIN'],
      enableIPWhitelist: false,
      whitelistedIPs: []
    },
    integration: {
      n8nEnabled: false,
      n8nWebhookUrl: '',
      n8nApiKey: '',
      slackEnabled: false,
      slackWebhookUrl: '',
      discordEnabled: false,
      discordWebhookUrl: '',
      emailEnabled: false,
      emailProvider: 'smtp',
      emailConfig: {}
    },
    advanced: {
      enableMetrics: true,
      metricsRetentionDays: 30,
      enableCostTracking: true,
      costAlertThreshold: 100,
      enablePerformanceMonitoring: true,
      performanceThreshold: 5000,
      enableAutoScaling: false,
      scalingThreshold: 80,
      enableCircuitBreaker: true,
      circuitBreakerThreshold: 5,
      enableHealthChecks: true,
      healthCheckInterval: 60
    }
  }

  const currentSettings = settings || defaultSettings

  const handleTestWebhook = async () => {
    const result = await testWebhookSettings()
    setTestResults(result)
  }

  const handleGenerateKey = async () => {
    const key = await generateEncryptionKey()
    if (key) {
      await saveSecuritySettings({ encryptionKey: key })
    }
  }

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await importSettings(file)
    }
  }

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações IA</h1>
          <p className="text-muted-foreground">
            Configure comportamento global, segurança e integrações do sistema de IA
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-green-600 border-green-600">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button variant="outline" onClick={exportSettings}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
        <label htmlFor="import-settings">
          <Button variant="outline" asChild>
            <span>
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </span>
          </Button>
        </label>
        <input
          id="import-settings"
          type="file"
          accept=".json"
          onChange={handleFileImport}
          className="hidden"
        />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Resetar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetar Configurações</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja resetar todas as configurações para os valores padrão? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={resetToDefaults}>
                Resetar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={clearError}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Test Results */}
      {testResults && (
        <div className={`p-4 border rounded-md ${
          testResults.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-2">
            {testResults.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <p className={`text-sm ${testResults.success ? 'text-green-800' : 'text-red-800'}`}>
              {testResults.message}
            </p>
          </div>
        </div>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="global" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Global</span>
          </TabsTrigger>
          <TabsTrigger value="rate-limiting" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Rate Limit</span>
          </TabsTrigger>
          <TabsTrigger value="webhook" className="flex items-center space-x-2">
            <Webhook className="h-4 w-4" />
            <span>Webhook</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="integration" className="flex items-center space-x-2">
            <Plug className="h-4 w-4" />
            <span>Integração</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center space-x-2">
            <Cog className="h-4 w-4" />
            <span>Avançado</span>
          </TabsTrigger>
        </TabsList>

        {/* Global Settings */}
        <TabsContent value="global" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Configurações Globais</span>
              </CardTitle>
              <CardDescription>
                Configurações padrão para todos os serviços de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="defaultProvider">Provedor Padrão</Label>
                  <Select 
                    value={currentSettings.global.defaultProvider} 
                    onValueChange={(value) => saveGlobalSettings({ defaultProvider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="gemini">Google Gemini</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="claude">Anthropic Claude</SelectItem>
                      <SelectItem value="mistral">Mistral AI</SelectItem>
                      <SelectItem value="cohere">Cohere</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                      <SelectItem value="huggingface">Hugging Face</SelectItem>
                      <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="defaultModel">Modelo Padrão</Label>
                  <Input
                    id="defaultModel"
                    value={currentSettings.global.defaultModel}
                    onChange={(e) => saveGlobalSettings({ defaultModel: e.target.value })}
                    placeholder="gpt-4"
                  />
                </div>

                <div>
                  <Label htmlFor="defaultTemperature">Temperature</Label>
                  <Input
                    id="defaultTemperature"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={currentSettings.global.defaultTemperature}
                    onChange={(e) => saveGlobalSettings({ defaultTemperature: parseFloat(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="defaultMaxTokens">Max Tokens</Label>
                  <Input
                    id="defaultMaxTokens"
                    type="number"
                    value={currentSettings.global.defaultMaxTokens}
                    onChange={(e) => saveGlobalSettings({ defaultMaxTokens: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="defaultTimeout">Timeout (ms)</Label>
                  <Input
                    id="defaultTimeout"
                    type="number"
                    value={currentSettings.global.defaultTimeout}
                    onChange={(e) => saveGlobalSettings({ defaultTimeout: parseInt(e.target.value) })}
                  />
                </div>

                <div>
                  <Label htmlFor="maxRetries">Max Retries</Label>
                  <Input
                    id="maxRetries"
                    type="number"
                    value={currentSettings.global.maxRetries}
                    onChange={(e) => saveGlobalSettings({ maxRetries: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableFallback">Habilitar Fallback</Label>
                    <p className="text-sm text-muted-foreground">
                      Usar provedor alternativo em caso de falha
                    </p>
                  </div>
                  <Switch
                    id="enableFallback"
                    checked={currentSettings.global.enableFallback}
                    onCheckedChange={(checked) => saveGlobalSettings({ enableFallback: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableRetry">Habilitar Retry</Label>
                    <p className="text-sm text-muted-foreground">
                      Tentar novamente em caso de falha temporária
                    </p>
                  </div>
                  <Switch
                    id="enableRetry"
                    checked={currentSettings.global.enableRetry}
                    onCheckedChange={(checked) => saveGlobalSettings({ enableRetry: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableLogging">Habilitar Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as operações de IA
                    </p>
                  </div>
                  <Switch
                    id="enableLogging"
                    checked={currentSettings.global.enableLogging}
                    onCheckedChange={(checked) => saveGlobalSettings({ enableLogging: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="logLevel">Nível de Log</Label>
                  <Select 
                    value={currentSettings.global.logLevel} 
                    onValueChange={(value) => saveGlobalSettings({ logLevel: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limiting Settings */}
        <TabsContent value="rate-limiting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Rate Limiting</span>
              </CardTitle>
              <CardDescription>
                Controle de taxa de requisições por provedor e serviço
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="rateLimitEnabled">Habilitar Rate Limiting</Label>
                  <p className="text-sm text-muted-foreground">
                    Controlar taxa de requisições globalmente
                  </p>
                </div>
                <Switch
                  id="rateLimitEnabled"
                  checked={currentSettings.rateLimiting.enabled}
                  onCheckedChange={(checked) => saveRateLimitingSettings({ enabled: checked })}
                />
              </div>

              {currentSettings.rateLimiting.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="globalRateLimit">Rate Limit Global (req/min)</Label>
                    <Input
                      id="globalRateLimit"
                      type="number"
                      value={currentSettings.rateLimiting.globalRateLimit}
                      onChange={(e) => saveRateLimitingSettings({ globalRateLimit: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="burstLimit">Burst Limit</Label>
                    <Input
                      id="burstLimit"
                      type="number"
                      value={currentSettings.rateLimiting.burstLimit}
                      onChange={(e) => saveRateLimitingSettings({ burstLimit: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="windowSize">Window Size (min)</Label>
                    <Input
                      id="windowSize"
                      type="number"
                      value={currentSettings.rateLimiting.windowSize}
                      onChange={(e) => saveRateLimitingSettings({ windowSize: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="queueMaxSize">Queue Max Size</Label>
                    <Input
                      id="queueMaxSize"
                      type="number"
                      value={currentSettings.rateLimiting.queueMaxSize}
                      onChange={(e) => saveRateLimitingSettings({ queueMaxSize: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enableQueue">Habilitar Queue</Label>
                  <p className="text-sm text-muted-foreground">
                    Enfileirar requisições quando limite for atingido
                  </p>
                </div>
                <Switch
                  id="enableQueue"
                  checked={currentSettings.rateLimiting.enableQueue}
                  onCheckedChange={(checked) => saveRateLimitingSettings({ enableQueue: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook Settings */}
        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Webhook className="h-5 w-5" />
                <span>Configurações de Webhook</span>
              </CardTitle>
              <CardDescription>
                Configurações para webhooks N8N e callbacks assíncronos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="webhookEnabled">Habilitar Webhooks</Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir callbacks assíncronos via webhook
                  </p>
                </div>
                <Switch
                  id="webhookEnabled"
                  checked={currentSettings.webhook.enabled}
                  onCheckedChange={(checked) => saveWebhookSettings({ enabled: checked })}
                />
              </div>

              {currentSettings.webhook.enabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={currentSettings.webhook.secret}
                      onChange={(e) => saveWebhookSettings({ secret: e.target.value })}
                      placeholder="Secreto para validação HMAC"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="webhookTimeout">Timeout (ms)</Label>
                      <Input
                        id="webhookTimeout"
                        type="number"
                        value={currentSettings.webhook.timeout}
                        onChange={(e) => saveWebhookSettings({ timeout: parseInt(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="retryAttempts">Tentativas de Retry</Label>
                      <Input
                        id="retryAttempts"
                        type="number"
                        value={currentSettings.webhook.retryAttempts}
                        onChange={(e) => saveWebhookSettings({ retryAttempts: parseInt(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="retryDelay">Delay de Retry (ms)</Label>
                      <Input
                        id="retryDelay"
                        type="number"
                        value={currentSettings.webhook.retryDelay}
                        onChange={(e) => saveWebhookSettings({ retryDelay: parseInt(e.target.value) })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="maxAge">Max Age (segundos)</Label>
                      <Input
                        id="maxAge"
                        type="number"
                        value={currentSettings.webhook.maxAge}
                        onChange={(e) => saveWebhookSettings({ maxAge: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableSignatureValidation">Validação de Assinatura</Label>
                        <p className="text-sm text-muted-foreground">
                          Validar HMAC signature dos webhooks
                        </p>
                      </div>
                      <Switch
                        id="enableSignatureValidation"
                        checked={currentSettings.webhook.enableSignatureValidation}
                        onCheckedChange={(checked) => saveWebhookSettings({ enableSignatureValidation: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableTimestampValidation">Validação de Timestamp</Label>
                        <p className="text-sm text-muted-foreground">
                          Validar timestamp para prevenir replay attacks
                        </p>
                      </div>
                      <Switch
                        id="enableTimestampValidation"
                        checked={currentSettings.webhook.enableTimestampValidation}
                        onCheckedChange={(checked) => saveWebhookSettings({ enableTimestampValidation: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="enableWebhookLogging">Logging de Webhooks</Label>
                        <p className="text-sm text-muted-foreground">
                          Registrar todas as requisições de webhook
                        </p>
                      </div>
                      <Switch
                        id="enableWebhookLogging"
                        checked={currentSettings.webhook.enableLogging}
                        onCheckedChange={(checked) => saveWebhookSettings({ enableLogging: checked })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="allowedIPs">IPs Permitidos (separados por vírgula)</Label>
                    <Textarea
                      id="allowedIPs"
                      value={currentSettings.webhook.allowedIPs.join(', ')}
                      onChange={(e) => saveWebhookSettings({ 
                        allowedIPs: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) 
                      })}
                      placeholder="192.168.1.1, 10.0.0.1"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleTestWebhook} variant="outline">
                      <TestTube className="mr-2 h-4 w-4" />
                      Testar Webhook
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configurações de Segurança</span>
              </CardTitle>
              <CardDescription>
                Configurações de criptografia, auditoria e controle de acesso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="encryptionEnabled">Criptografia Habilitada</Label>
                  <p className="text-sm text-muted-foreground">
                    Criptografar API keys e dados sensíveis
                  </p>
                </div>
                <Switch
                  id="encryptionEnabled"
                  checked={currentSettings.security.encryptionEnabled}
                  onCheckedChange={(checked) => saveSecuritySettings({ encryptionEnabled: checked })}
                />
              </div>

              {currentSettings.security.encryptionEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="encryptionKey">Chave de Criptografia</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="encryptionKey"
                        type="password"
                        value={currentSettings.security.encryptionKey}
                        onChange={(e) => saveSecuritySettings({ encryptionKey: e.target.value })}
                        placeholder="Chave AES-256"
                      />
                      <Button onClick={handleGenerateKey} variant="outline">
                        Gerar Nova
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableApiKeyRotation">Rotação de API Keys</Label>
                    <p className="text-sm text-muted-foreground">
                      Rotacionar automaticamente API keys
                    </p>
                  </div>
                  <Switch
                    id="enableApiKeyRotation"
                    checked={currentSettings.security.enableApiKeyRotation}
                    onCheckedChange={(checked) => saveSecuritySettings({ enableApiKeyRotation: checked })}
                  />
                </div>

                {currentSettings.security.enableApiKeyRotation && (
                  <div>
                    <Label htmlFor="rotationInterval">Intervalo de Rotação (dias)</Label>
                    <Input
                      id="rotationInterval"
                      type="number"
                      value={currentSettings.security.rotationInterval}
                      onChange={(e) => saveSecuritySettings({ rotationInterval: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAuditLog">Audit Log</Label>
                    <p className="text-sm text-muted-foreground">
                      Registrar todas as ações administrativas
                    </p>
                  </div>
                  <Switch
                    id="enableAuditLog"
                    checked={currentSettings.security.enableAuditLog}
                    onCheckedChange={(checked) => saveSecuritySettings({ enableAuditLog: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableAccessControl">Controle de Acesso</Label>
                    <p className="text-sm text-muted-foreground">
                      Restringir acesso por roles
                    </p>
                  </div>
                  <Switch
                    id="enableAccessControl"
                    checked={currentSettings.security.enableAccessControl}
                    onCheckedChange={(checked) => saveSecuritySettings({ enableAccessControl: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableIPWhitelist">IP Whitelist</Label>
                    <p className="text-sm text-muted-foreground">
                      Restringir acesso por IP
                    </p>
                  </div>
                  <Switch
                    id="enableIPWhitelist"
                    checked={currentSettings.security.enableIPWhitelist}
                    onCheckedChange={(checked) => saveSecuritySettings({ enableIPWhitelist: checked })}
                  />
                </div>

                {currentSettings.security.enableIPWhitelist && (
                  <div>
                    <Label htmlFor="whitelistedIPs">IPs Permitidos (separados por vírgula)</Label>
                    <Textarea
                      id="whitelistedIPs"
                      value={currentSettings.security.whitelistedIPs.join(', ')}
                      onChange={(e) => saveSecuritySettings({ 
                        whitelistedIPs: e.target.value.split(',').map(ip => ip.trim()).filter(ip => ip) 
                      })}
                      placeholder="192.168.1.1, 10.0.0.1"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Settings */}
        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Plug className="h-5 w-5" />
                <span>Configurações de Integração</span>
              </CardTitle>
              <CardDescription>
                Integrações com serviços externos e notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* N8N Integration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="n8nEnabled">N8N Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Integração com workflows N8N
                    </p>
                  </div>
                  <Switch
                    id="n8nEnabled"
                    checked={currentSettings.integration.n8nEnabled}
                    onCheckedChange={(checked) => saveIntegrationSettings({ n8nEnabled: checked })}
                  />
                </div>

                {currentSettings.integration.n8nEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="n8nWebhookUrl">N8N Webhook URL</Label>
                      <Input
                        id="n8nWebhookUrl"
                        value={currentSettings.integration.n8nWebhookUrl}
                        onChange={(e) => saveIntegrationSettings({ n8nWebhookUrl: e.target.value })}
                        placeholder="https://n8n.example.com/webhook/ai-callback"
                      />
                    </div>

                    <div>
                      <Label htmlFor="n8nApiKey">N8N API Key</Label>
                      <Input
                        id="n8nApiKey"
                        type="password"
                        value={currentSettings.integration.n8nApiKey}
                        onChange={(e) => saveIntegrationSettings({ n8nApiKey: e.target.value })}
                        placeholder="API key do N8N"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Slack Integration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="slackEnabled">Slack Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações via Slack
                    </p>
                  </div>
                  <Switch
                    id="slackEnabled"
                    checked={currentSettings.integration.slackEnabled}
                    onCheckedChange={(checked) => saveIntegrationSettings({ slackEnabled: checked })}
                  />
                </div>

                {currentSettings.integration.slackEnabled && (
                  <div>
                    <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
                    <Input
                      id="slackWebhookUrl"
                      value={currentSettings.integration.slackWebhookUrl}
                      onChange={(e) => saveIntegrationSettings({ slackWebhookUrl: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>
                )}
              </div>

              {/* Discord Integration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="discordEnabled">Discord Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações via Discord
                    </p>
                  </div>
                  <Switch
                    id="discordEnabled"
                    checked={currentSettings.integration.discordEnabled}
                    onCheckedChange={(checked) => saveIntegrationSettings({ discordEnabled: checked })}
                  />
                </div>

                {currentSettings.integration.discordEnabled && (
                  <div>
                    <Label htmlFor="discordWebhookUrl">Discord Webhook URL</Label>
                    <Input
                      id="discordWebhookUrl"
                      value={currentSettings.integration.discordWebhookUrl}
                      onChange={(e) => saveIntegrationSettings({ discordWebhookUrl: e.target.value })}
                      placeholder="https://discord.com/api/webhooks/..."
                    />
                  </div>
                )}
              </div>

              {/* Email Integration */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailEnabled">Email Habilitado</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações por email
                    </p>
                  </div>
                  <Switch
                    id="emailEnabled"
                    checked={currentSettings.integration.emailEnabled}
                    onCheckedChange={(checked) => saveIntegrationSettings({ emailEnabled: checked })}
                  />
                </div>

                {currentSettings.integration.emailEnabled && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="emailProvider">Provedor de Email</Label>
                      <Select 
                        value={currentSettings.integration.emailProvider} 
                        onValueChange={(value) => saveIntegrationSettings({ emailProvider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="smtp">SMTP</SelectItem>
                          <SelectItem value="sendgrid">SendGrid</SelectItem>
                          <SelectItem value="mailgun">Mailgun</SelectItem>
                          <SelectItem value="ses">AWS SES</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cog className="h-5 w-5" />
                <span>Configurações Avançadas</span>
              </CardTitle>
              <CardDescription>
                Configurações de monitoramento, métricas e performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Metrics */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Métricas</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableMetrics">Habilitar Métricas</Label>
                    <p className="text-sm text-muted-foreground">
                      Coletar métricas de performance
                    </p>
                  </div>
                  <Switch
                    id="enableMetrics"
                    checked={currentSettings.advanced.enableMetrics}
                    onCheckedChange={(checked) => saveAdvancedSettings({ enableMetrics: checked })}
                  />
                </div>

                {currentSettings.advanced.enableMetrics && (
                  <div>
                    <Label htmlFor="metricsRetentionDays">Retenção de Métricas (dias)</Label>
                    <Input
                      id="metricsRetentionDays"
                      type="number"
                      value={currentSettings.advanced.metricsRetentionDays}
                      onChange={(e) => saveAdvancedSettings({ metricsRetentionDays: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              {/* Cost Tracking */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Rastreamento de Custos</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCostTracking">Habilitar Rastreamento</Label>
                    <p className="text-sm text-muted-foreground">
                      Monitorar custos por provedor e serviço
                    </p>
                  </div>
                  <Switch
                    id="enableCostTracking"
                    checked={currentSettings.advanced.enableCostTracking}
                    onCheckedChange={(checked) => saveAdvancedSettings({ enableCostTracking: checked })}
                  />
                </div>

                {currentSettings.advanced.enableCostTracking && (
                  <div>
                    <Label htmlFor="costAlertThreshold">Limite de Alerta ($)</Label>
                    <Input
                      id="costAlertThreshold"
                      type="number"
                      step="0.01"
                      value={currentSettings.advanced.costAlertThreshold}
                      onChange={(e) => saveAdvancedSettings({ costAlertThreshold: parseFloat(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              {/* Performance Monitoring */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Monitoramento de Performance</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enablePerformanceMonitoring">Habilitar Monitoramento</Label>
                    <p className="text-sm text-muted-foreground">
                      Monitorar latência e performance
                    </p>
                  </div>
                  <Switch
                    id="enablePerformanceMonitoring"
                    checked={currentSettings.advanced.enablePerformanceMonitoring}
                    onCheckedChange={(checked) => saveAdvancedSettings({ enablePerformanceMonitoring: checked })}
                  />
                </div>

                {currentSettings.advanced.enablePerformanceMonitoring && (
                  <div>
                    <Label htmlFor="performanceThreshold">Limite de Performance (ms)</Label>
                    <Input
                      id="performanceThreshold"
                      type="number"
                      value={currentSettings.advanced.performanceThreshold}
                      onChange={(e) => saveAdvancedSettings({ performanceThreshold: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              {/* Circuit Breaker */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Circuit Breaker</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableCircuitBreaker">Habilitar Circuit Breaker</Label>
                    <p className="text-sm text-muted-foreground">
                      Proteger contra falhas em cascata
                    </p>
                  </div>
                  <Switch
                    id="enableCircuitBreaker"
                    checked={currentSettings.advanced.enableCircuitBreaker}
                    onCheckedChange={(checked) => saveAdvancedSettings({ enableCircuitBreaker: checked })}
                  />
                </div>

                {currentSettings.advanced.enableCircuitBreaker && (
                  <div>
                    <Label htmlFor="circuitBreakerThreshold">Limite do Circuit Breaker</Label>
                    <Input
                      id="circuitBreakerThreshold"
                      type="number"
                      value={currentSettings.advanced.circuitBreakerThreshold}
                      onChange={(e) => saveAdvancedSettings({ circuitBreakerThreshold: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              {/* Health Checks */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Health Checks</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enableHealthChecks">Habilitar Health Checks</Label>
                    <p className="text-sm text-muted-foreground">
                      Verificar saúde dos provedores
                    </p>
                  </div>
                  <Switch
                    id="enableHealthChecks"
                    checked={currentSettings.advanced.enableHealthChecks}
                    onCheckedChange={(checked) => saveAdvancedSettings({ enableHealthChecks: checked })}
                  />
                </div>

                {currentSettings.advanced.enableHealthChecks && (
                  <div>
                    <Label htmlFor="healthCheckInterval">Intervalo de Health Check (segundos)</Label>
                    <Input
                      id="healthCheckInterval"
                      type="number"
                      value={currentSettings.advanced.healthCheckInterval}
                      onChange={(e) => saveAdvancedSettings({ healthCheckInterval: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Status */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Salvando configurações...</span>
          </div>
        </div>
      )}
    </div>
  )
}