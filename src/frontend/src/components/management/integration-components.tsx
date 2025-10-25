"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Settings,
  Edit,
  Save,
  Trash2,
  Plus,
  Minus,
  Cpu,
  Cloud,
  Shield,
  Zap,
  DollarSign,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  BarChart3,
  PieChart,
  Database,
  Server,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Play,
  Pause,
  PlayCircle,
  PauseCircle,
  StopCircle,
  CheckCircle2,
  Clock2,
  Info,
  ExternalLink,
  Download,
  Upload,
  Copy,
  Share,
  MoreHorizontal,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize,
  Minimize,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  FastForward,
  Rewind,
  Volume2,
  VolumeX,
  Volume1,
  Volume,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image,
  ImageIcon,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
  FileJson,
  Crown,
  Calendar,
} from "lucide-react"
import { GlobalLimitsConfig, IntegrationConfig } from "@/shared/types/integrations.types"

// Componente para card de configuração de limites
interface LimitConfigCardProps {
  plan: string
  limits: GlobalLimitsConfig
  onEdit: (plan: string, limits: Partial<GlobalLimitsConfig>) => void
  onDelete?: (plan: string) => void
  isEditing?: boolean
  onSave?: () => void
  onCancel?: () => void
}

export function LimitConfigCard({ 
  plan, 
  limits, 
  onEdit, 
  onDelete, 
  isEditing = false,
  onSave,
  onCancel 
}: LimitConfigCardProps) {
  const [editData, setEditData] = useState(limits)

  const handleSave = () => {
    onEdit(plan, editData)
    onSave?.()
  }

  const handleCancel = () => {
    setEditData(limits)
    onCancel?.()
  }

  const formatNumber = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
    return value.toString()
  }

  const getPlanIcon = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'starter': return Target
      case 'professional': return Shield
      case 'enterprise': return Crown
      default: return Building2
    }
  }

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'starter': return 'text-blue-600'
      case 'professional': return 'text-green-600'
      case 'enterprise': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const PlanIcon = getPlanIcon(plan)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <PlanIcon className={`h-5 w-5 ${getPlanColor(plan)}`} />
          <CardTitle className="text-lg font-semibold capitalize">{plan}</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(plan, limits)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
              {onDelete && (
                <Button variant="outline" size="sm" onClick={() => onDelete(plan)}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Deletar
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Limites de IA */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <Label className="text-sm font-medium">Limites de IA</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Tokens Mensais</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.aiLimits.maxTokensPerMonth}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    aiLimits: {
                      ...prev.aiLimits,
                      maxTokensPerMonth: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="h-8"
                />
              ) : (
                <div className="text-sm font-medium">
                  {formatNumber(limits.aiLimits.maxTokensPerMonth)}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Orçamento</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.aiLimits.monthlyBudget || 0}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    aiLimits: {
                      ...prev.aiLimits,
                      monthlyBudget: parseFloat(e.target.value) || 0
                    }
                  }))}
                  className="h-8"
                />
              ) : (
                <div className="text-sm font-medium">
                  ${limits.aiLimits.monthlyBudget || 0}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Limites de Storage */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4 text-green-600 dark:text-green-400" />
            <Label className="text-sm font-medium">Limites de Storage</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Storage Total</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.uploadLimits.totalStorage}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    uploadLimits: {
                      ...prev.uploadLimits,
                      totalStorage: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="h-8"
                />
              ) : (
                <div className="text-sm font-medium">
                  {limits.uploadLimits.totalStorage}MB
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Upload Mensal</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.uploadLimits.monthlyUploadQuota}
                  onChange={(e) => setEditData(prev => ({
                    ...prev,
                    uploadLimits: {
                      ...prev.uploadLimits,
                      monthlyUploadQuota: parseInt(e.target.value) || 0
                    }
                  }))}
                  className="h-8"
                />
              ) : (
                <div className="text-sm font-medium">
                  {limits.uploadLimits.monthlyUploadQuota}MB
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            <Label className="text-sm font-medium">Rate Limits</Label>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Requests por Minuto</Label>
            {isEditing ? (
              <Input
                type="number"
                value={editData.rateLimits.apiRequestsPerMinute}
                onChange={(e) => setEditData(prev => ({
                  ...prev,
                  rateLimits: {
                    ...prev.rateLimits,
                    apiRequestsPerMinute: parseInt(e.target.value) || 0
                  }
                }))}
                className="h-8"
              />
            ) : (
              <div className="text-sm font-medium">
                {limits.rateLimits.apiRequestsPerMinute}/min
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para card de status de integração
interface IntegrationStatusCardProps {
  integration: IntegrationConfig
  onConfigure: (integration: string) => void
  onEdit: (integration: string) => void
  onDelete: (integration: string) => void
  onToggle: (integration: string, isActive: boolean) => void
  onTest?: (integration: string) => void
}

export function IntegrationStatusCard({
  integration,
  onConfigure,
  onEdit,
  onDelete,
  onToggle,
  onTest
}: IntegrationStatusCardProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return CheckCircle
      case 'failure': return XCircle
      case 'warning': return AlertTriangle
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'failure': return 'text-red-600'
      case 'warning': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'ai': return Cpu
      case 'payment': return DollarSign
      case 'communication': return Users
      case 'storage': return Cloud
      case 'calendar': return Calendar
      case 'automation': return Zap
      case 'analytics': return BarChart3
      default: return Settings
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'ai': return 'text-blue-600'
      case 'payment': return 'text-green-600'
      case 'communication': return 'text-purple-600'
      case 'storage': return 'text-orange-600'
      case 'calendar': return 'text-red-600'
      case 'automation': return 'text-yellow-600'
      case 'analytics': return 'text-indigo-600'
      default: return 'text-gray-600'
    }
  }

  const StatusIcon = getStatusIcon(integration.lastTestStatus || 'pending')
  const CategoryIcon = getCategoryIcon(integration.category)

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100`}>
            <CategoryIcon className={`h-5 w-5 ${getCategoryColor(integration.category)}`} />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold">{integration.displayName}</CardTitle>
            <CardDescription className="text-sm">{integration.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={integration.isActive}
            onCheckedChange={(checked) => onToggle(integration.integration, checked)}
          />
          <Badge variant={integration.isActive ? "default" : "secondary"}>
            {integration.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Conexão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-4 w-4 ${getStatusColor(integration.lastTestStatus || 'pending')}`} />
            <span className="text-sm font-medium">Status da Conexão</span>
          </div>
          <Badge variant={integration.lastTestStatus === 'success' ? "default" : "secondary"}>
            {integration.lastTestStatus === 'success' ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Categoria</Label>
            <div className="font-medium capitalize">{integration.category}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Ambiente</Label>
            <div className="font-medium capitalize">{integration.environment}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Configurado</Label>
            <div className="font-medium">{integration.isConfigured ? 'Sim' : 'Não'}</div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Último Teste</Label>
            <div className="font-medium">
              {integration.lastTested ? new Date(integration.lastTested).toLocaleDateString() : 'Nunca'}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onConfigure(integration.integration)}
            className="flex-1"
          >
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(integration.integration)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {onTest && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onTest(integration.integration)}
            >
              <Play className="h-4 w-4" />
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDelete(integration.integration)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Mensagem de Status */}
        {integration.lastTestMessage && (
          <Alert className={integration.lastTestStatus === 'success' ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}>
            <AlertDescription className="text-sm">
              {integration.lastTestMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

// Componente para override de limites por tenant
interface TenantLimitOverrideProps {
  tenantId: string
  tenantName: string
  currentLimits: any
  onSave: (tenantId: string, overrides: any) => void
  onCancel: () => void
}

export function TenantLimitOverride({
  tenantId,
  tenantName,
  currentLimits,
  onSave,
  onCancel
}: TenantLimitOverrideProps) {
  const [overrides, setOverrides] = useState(currentLimits)
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = () => {
    onSave(tenantId, overrides)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setOverrides(currentLimits)
    setIsEditing(false)
    onCancel()
  }

  const updateOverride = (path: string, value: any) => {
    setOverrides((prev: any) => {
      const newOverrides = { ...prev }
      const keys = path.split('.')
      let current = newOverrides
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {}
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      return newOverrides
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Override para {tenantName}</span>
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Configure limites customizados para este tenant, sobrescrevendo as configurações do plano.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Limites de IA */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Limites de IA</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ai-tokens">Tokens Mensais</Label>
              {isEditing ? (
                <Input
                  id="ai-tokens"
                  type="number"
                  value={overrides.aiLimits?.globalMonthlyTokens || ''}
                  onChange={(e) => updateOverride('aiLimits.globalMonthlyTokens', parseInt(e.target.value) || 0)}
                  placeholder="Deixe vazio para usar limite do plano"
                />
              ) : (
                <div className="text-sm font-medium">
                  {overrides.aiLimits?.globalMonthlyTokens || 'Usar limite do plano'}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="ai-budget">Orçamento ($)</Label>
              {isEditing ? (
                <Input
                  id="ai-budget"
                  type="number"
                  value={overrides.aiLimits?.monthlyBudget || ''}
                  onChange={(e) => updateOverride('aiLimits.monthlyBudget', parseFloat(e.target.value) || 0)}
                  placeholder="Deixe vazio para usar limite do plano"
                />
              ) : (
                <div className="text-sm font-medium">
                  ${overrides.aiLimits?.monthlyBudget || 'Usar limite do plano'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Limites de Storage */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Cloud className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold">Limites de Storage</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="storage-total">Storage Total (GB)</Label>
              {isEditing ? (
                <Input
                  id="storage-total"
                  type="number"
                  value={overrides.uploadLimits?.totalStorageGB || ''}
                  onChange={(e) => updateOverride('uploadLimits.totalStorageGB', parseInt(e.target.value) || 0)}
                  placeholder="Deixe vazio para usar limite do plano"
                />
              ) : (
                <div className="text-sm font-medium">
                  {overrides.uploadLimits?.totalStorageGB || 'Usar limite do plano'}GB
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="storage-monthly">Upload Mensal (GB)</Label>
              {isEditing ? (
                <Input
                  id="storage-monthly"
                  type="number"
                  value={overrides.uploadLimits?.monthlyUploadQuotaGB || ''}
                  onChange={(e) => updateOverride('uploadLimits.monthlyUploadQuotaGB', parseInt(e.target.value) || 0)}
                  placeholder="Deixe vazio para usar limite do plano"
                />
              ) : (
                <div className="text-sm font-medium">
                  {overrides.uploadLimits?.monthlyUploadQuotaGB || 'Usar limite do plano'}GB
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Rate Limits */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Rate Limits</h3>
          </div>
          <div>
            <Label htmlFor="rate-limit">Requests por Minuto</Label>
            {isEditing ? (
              <Input
                id="rate-limit"
                type="number"
                value={overrides.rateLimits?.apiRequestsPerMinute || ''}
                onChange={(e) => updateOverride('rateLimits.apiRequestsPerMinute', parseInt(e.target.value) || 0)}
                placeholder="Deixe vazio para usar limite do plano"
              />
            ) : (
              <div className="text-sm font-medium">
                {overrides.rateLimits?.apiRequestsPerMinute || 'Usar limite do plano'}/min
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold">Features</h3>
          </div>
          <div className="space-y-2">
            {Object.entries(overrides.featureLimits || {}).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between">
                <Label htmlFor={`feature-${feature}`} className="capitalize">
                  {feature.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                {isEditing ? (
                  <Switch
                    id={`feature-${feature}`}
                    checked={Boolean(enabled)}
                    onCheckedChange={(checked) => updateOverride(`featureLimits.${feature}`, checked)}
                  />
                ) : (
                  <Badge variant={enabled ? "default" : "secondary"}>
                    {enabled ? 'Habilitado' : 'Desabilitado'}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Componente para formulário dinâmico de configuração
interface DynamicConfigFormProps {
  schema: any
  initialValues: any
  onSubmit: (values: any) => void
  onTest?: () => void
  loading?: boolean
}

export function DynamicConfigForm({
  schema,
  initialValues,
  onSubmit,
  onTest,
  loading = false
}: DynamicConfigFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(values)
  }

  const handleChange = (field: string, value: any) => {
    setValues((prev: any) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }))
    }
  }

  const renderField = (field: any) => {
    const { name, type, required, description, validation, options } = field

    switch (type) {
      case 'password':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {name} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={name}
              type="password"
              value={values[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              placeholder={description}
              className={errors[name] ? 'border-red-500' : ''}
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {errors[name] && (
              <p className="text-xs text-red-500">{errors[name]}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {name} {required && <span className="text-red-500">*</span>}
            </Label>
            <Select
              value={values[name] || ''}
              onValueChange={(value) => handleChange(name, value)}
            >
              <SelectTrigger className={errors[name] ? 'border-red-500' : ''}>
                <SelectValue placeholder={description} />
              </SelectTrigger>
              <SelectContent>
                {options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {errors[name] && (
              <p className="text-xs text-red-500">{errors[name]}</p>
            )}
          </div>
        )

      case 'toggle':
        return (
          <div key={name} className="flex items-center justify-between">
            <Label htmlFor={name}>
              {name} {required && <span className="text-red-500">*</span>}
            </Label>
            <Switch
              id={name}
              checked={Boolean(values[name])}
              onCheckedChange={(checked) => handleChange(name, checked)}
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {name} {required && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id={name}
              value={values[name] || ''}
              onChange={(e) => handleChange(name, e.target.value)}
              placeholder={description}
              className={`w-full min-h-[80px] px-3 py-2 border rounded-md ${errors[name] ? 'border-red-500' : ''}`}
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {errors[name] && (
              <p className="text-xs text-red-500">{errors[name]}</p>
            )}
          </div>
        )

      default:
        return (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>
              {name} {required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={name}
              type={type === 'number' ? 'number' : 'text'}
              value={values[name] || ''}
              onChange={(e) => handleChange(name, type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
              placeholder={description}
              className={errors[name] ? 'border-red-500' : ''}
            />
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {errors[name] && (
              <p className="text-xs text-red-500">{errors[name]}</p>
            )}
          </div>
        )
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4">
        {schema.requiredFields?.map((field: any) => renderField(field))}
        {schema.optionalFields?.map((field: any) => renderField(field))}
      </div>

      <div className="flex space-x-2">
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Configuração
        </Button>
        {onTest && (
          <Button type="button" variant="outline" onClick={onTest} disabled={loading}>
            <Play className="h-4 w-4 mr-2" />
            Testar Conexão
          </Button>
        )}
      </div>
    </form>
  )
}

