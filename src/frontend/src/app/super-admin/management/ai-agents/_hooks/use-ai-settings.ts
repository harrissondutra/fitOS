"use client"

import { useState, useEffect, useCallback } from 'react'

interface GlobalSettings {
  defaultProvider: string
  defaultModel: string
  defaultTemperature: number
  defaultMaxTokens: number
  defaultTimeout: number
  enableFallback: boolean
  enableRetry: boolean
  maxRetries: number
  enableLogging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

interface RateLimitingSettings {
  enabled: boolean
  globalRateLimit: number // requests per minute
  perProviderRateLimit: Record<string, number>
  perServiceRateLimit: Record<string, number>
  burstLimit: number
  windowSize: number // minutes
  enableQueue: boolean
  queueMaxSize: number
}

interface WebhookSettings {
  enabled: boolean
  secret: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  enableSignatureValidation: boolean
  enableTimestampValidation: boolean
  maxAge: number // seconds
  allowedIPs: string[]
  enableLogging: boolean
}

interface SecuritySettings {
  encryptionEnabled: boolean
  encryptionKey: string
  enableApiKeyRotation: boolean
  rotationInterval: number // days
  enableAuditLog: boolean
  enableAccessControl: boolean
  allowedRoles: string[]
  enableIPWhitelist: boolean
  whitelistedIPs: string[]
}

interface IntegrationSettings {
  n8nEnabled: boolean
  n8nWebhookUrl: string
  n8nApiKey: string
  slackEnabled: boolean
  slackWebhookUrl: string
  discordEnabled: boolean
  discordWebhookUrl: string
  emailEnabled: boolean
  emailProvider: string
  emailConfig: Record<string, any>
}

interface AdvancedSettings {
  enableMetrics: boolean
  metricsRetentionDays: number
  enableCostTracking: boolean
  costAlertThreshold: number
  enablePerformanceMonitoring: boolean
  performanceThreshold: number // ms
  enableAutoScaling: boolean
  scalingThreshold: number
  enableCircuitBreaker: boolean
  circuitBreakerThreshold: number
  enableHealthChecks: boolean
  healthCheckInterval: number // seconds
}

interface AiSettings {
  global: GlobalSettings
  rateLimiting: RateLimitingSettings
  webhook: WebhookSettings
  security: SecuritySettings
  integration: IntegrationSettings
  advanced: AdvancedSettings
}

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  /**
   * Carrega configurações do servidor
   */
  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Obter token do localStorage como fallback
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      // Adicionar token no header se disponível
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings', {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setSettings(result.success ? result.data : result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Salva configurações globais
   */
  const saveGlobalSettings = useCallback(async (data: Partial<GlobalSettings>) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/global', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedSettings = result.success ? result.data : result
      setSettings(prev => prev ? { ...prev, global: updatedSettings } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save global settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Salva configurações de rate limiting
   */
  const saveRateLimitingSettings = useCallback(async (data: Partial<RateLimitingSettings>) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/rate-limiting', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedSettings = result.success ? result.data : result
      setSettings(prev => prev ? { ...prev, rateLimiting: updatedSettings } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rate limiting settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Salva configurações de webhook
   */
  const saveWebhookSettings = useCallback(async (data: Partial<WebhookSettings>) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/webhook', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedSettings = result.success ? result.data : result
      setSettings(prev => prev ? { ...prev, webhook: updatedSettings } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save webhook settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Salva configurações de segurança
   */
  const saveSecuritySettings = useCallback(async (data: Partial<SecuritySettings>) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/security', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedSettings = result.success ? result.data : result
      setSettings(prev => prev ? { ...prev, security: updatedSettings } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save security settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Salva configurações de integração
   */
  const saveIntegrationSettings = useCallback(async (data: Partial<IntegrationSettings>) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/integration', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedSettings = result.success ? result.data : result
      setSettings(prev => prev ? { ...prev, integration: updatedSettings } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save integration settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Salva configurações avançadas
   */
  const saveAdvancedSettings = useCallback(async (data: Partial<AdvancedSettings>) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/advanced', {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      const updatedSettings = result.success ? result.data : result
      setSettings(prev => prev ? { ...prev, advanced: updatedSettings } : null)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save advanced settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Testa configurações de webhook
   */
  const testWebhookSettings = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/webhook/test', {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to test webhook settings')
      return null
    }
  }, [])

  /**
   * Gera nova chave de criptografia
   */
  const generateEncryptionKey = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/security/generate-key', {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.key
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate encryption key')
      return null
    }
  }, [])

  /**
   * Reseta configurações para padrão
   */
  const resetToDefaults = useCallback(async () => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/reset', {
        method: 'POST',
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setSettings(result.success ? result.data : result)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Exporta configurações
   */
  const exportSettings = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/settings/export', {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export settings')
      return false
    }
  }, [])

  /**
   * Importa configurações
   */
  const importSettings = useCallback(async (file: File) => {
    setSaving(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {}
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/super-admin/ai/settings/import', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setSettings(result.success ? result.data : result)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import settings')
      return false
    } finally {
      setSaving(false)
    }
  }, [])

  /**
   * Carrega configurações na inicialização
   */
  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    // Estado
    settings,
    loading,
    error,
    saving,
    
    // Ações
    loadSettings,
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
    
    // Utilitários
    clearError: () => setError(null),
    refresh: loadSettings
  }
}
