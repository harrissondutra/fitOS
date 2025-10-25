"use client"

import { useState, useEffect, useCallback } from 'react'

interface CostSummary {
  totalCost: number
  totalInputTokens: number
  totalOutputTokens: number
  requestCount: number
  averageCostPerRequest: number
  costByModel: Record<string, number>
  costByProvider: Record<string, number>
  costByService: Record<string, number>
  costByClient: Record<string, number>
  dailyCosts: Array<{
    date: string
    cost: number
    requests: number
  }>
}

interface CostProjection {
  projectedCost: number
  currentDailyAverage: number
  confidence: number
  trend: 'INCREASING' | 'DECREASING' | 'STABLE'
}

interface CostAlert {
  id: string
  clientId: string
  alertType: 'WARNING' | 'CRITICAL' | 'LIMIT_REACHED'
  currentCost: number
  limit: number
  percentage: number
  message: string
  createdAt: string
  isActive: boolean
}

interface ProviderStats {
  name: string
  modelCount: number
  avgInputPrice: number
  avgOutputPrice: number
  hasDiscount: boolean
  timezone: string
}

interface ModelPricing {
  model: string
  provider: string
  pricing: {
    standard: {
      inputTokensPerMillion: number
      outputTokensPerMillion: number
      currency: string
    }
    discounted?: {
      inputTokensPerMillion: number
      outputTokensPerMillion: number
      currency: string
      description?: string
    }
    cacheHit?: {
      inputTokensPerMillion: number
      outputTokensPerMillion: number
      currency: string
    }
    cacheMiss?: {
      inputTokensPerMillion: number
      outputTokensPerMillion: number
      currency: string
    }
  }
  contextLength: number
  maxOutput: number
  features: {
    jsonOutput: boolean
    functionCalling: boolean
    vision: boolean
    audio: boolean
    streaming: boolean
  }
}

interface TopExpensiveService {
  serviceType: string
  serviceName: string
  cost: number
  requestCount: number
}

interface TopExpensiveProvider {
  providerId: string
  providerName: string
  cost: number
  requestCount: number
}

interface CostMetrics {
  summary: CostSummary
  projection: CostProjection
  alerts: CostAlert[]
  providerStats: ProviderStats[]
  topExpensiveServices: TopExpensiveService[]
  topExpensiveProviders: TopExpensiveProvider[]
  costByProvider: Record<string, number>
  costByService: Record<string, number>
  period: {
    start: string
    end: string
    days: number
  }
}

interface CostFilters {
  startDate?: string
  endDate?: string
  clientId?: string
  provider?: string
  model?: string
  period?: '7d' | '30d' | '90d' | '1y'
}

interface CostHistoryItem {
  id: string
  clientId: string
  model: string
  provider: string
  inputTokens: number
  outputTokens: number
  cost: number
  currency: string
  timestamp: string
  isCacheHit: boolean
  metadata: Record<string, any>
}

interface CostHistory {
  costs: CostHistoryItem[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useAiCosts() {
  const [costMetrics, setCostMetrics] = useState<CostMetrics | null>(null)
  const [costHistory, setCostHistory] = useState<CostHistory | null>(null)
  const [models, setModels] = useState<ModelPricing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Obtém métricas de custos
   */
  const getCostMetrics = useCallback(async (filters: CostFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.clientId) queryParams.append('clientId', filters.clientId)
      if (filters.provider) queryParams.append('provider', filters.provider)
      if (filters.model) queryParams.append('model', filters.model)
      if (filters.period) queryParams.append('period', filters.period)

      const response = await fetch(`/api/super-admin/ai-costs/summary?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setCostMetrics(data.data)
      } else {
        throw new Error(data.error?.message || 'Erro ao carregar métricas de custos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar métricas de custos')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtém histórico de custos
   */
  const getCostHistory = useCallback(async (filters: CostFilters = {}) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate)
      if (filters.endDate) queryParams.append('endDate', filters.endDate)
      if (filters.clientId) queryParams.append('clientId', filters.clientId)
      if (filters.provider) queryParams.append('provider', filters.provider)
      if (filters.model) queryParams.append('model', filters.model)

      const response = await fetch(`/api/super-admin/ai-costs/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setCostHistory(data.data)
      } else {
        throw new Error(data.error?.message || 'Erro ao carregar histórico de custos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar histórico de custos')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtém modelos disponíveis
   */
  const getModels = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/ai-costs/models', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        setModels(data.data.models)
      } else {
        throw new Error(data.error?.message || 'Erro ao carregar modelos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar modelos')
    }
  }, [])

  /**
   * Obtém projeção de custos
   */
  const getCostProjection = useCallback(async (clientId?: string, days: number = 30) => {
    try {
      const queryParams = new URLSearchParams()
      if (clientId) queryParams.append('clientId', clientId)
      queryParams.append('days', days.toString())

      const response = await fetch(`/api/super-admin/ai-costs/projection?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Erro ao carregar projeção de custos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar projeção de custos')
      return null
    }
  }, [])

  /**
   * Obtém alertas de custos
   */
  const getCostAlerts = useCallback(async (clientId?: string, alertType?: string) => {
    try {
      const queryParams = new URLSearchParams()
      if (clientId) queryParams.append('clientId', clientId)
      if (alertType) queryParams.append('alertType', alertType)

      const response = await fetch(`/api/super-admin/ai-costs/alerts?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Erro ao carregar alertas')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar alertas')
      return []
    }
  }, [])

  /**
   * Define limite de custos para um cliente
   */
  const setClientCostLimit = useCallback(async (clientId: string, monthlyLimit: number, currency: string = 'USD') => {
    try {
      const response = await fetch('/api/super-admin/ai-costs/limits', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ clientId, monthlyLimit, currency })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Erro ao definir limite de custos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao definir limite de custos')
      return null
    }
  }, [])

  /**
   * Obtém limite de custos de um cliente
   */
  const getClientCostLimit = useCallback(async (clientId: string) => {
    try {
      const response = await fetch(`/api/super-admin/ai-costs/limits/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Erro ao carregar limite de custos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar limite de custos')
      return null
    }
  }, [])

  /**
   * Exporta relatório de custos
   */
  const exportCostReport = useCallback(async (startDate: string, endDate: string, format: 'CSV' | 'JSON' = 'CSV', clientId?: string) => {
    try {
      const response = await fetch('/api/super-admin/ai-costs/export', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ startDate, endDate, format, clientId })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-costs-report-${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar relatório')
      return false
    }
  }, [])

  /**
   * Registra uso de IA (para testes)
   */
  const trackUsage = useCallback(async (data: {
    clientId: string
    model: string
    provider: string
    inputTokens: number
    outputTokens: number
    isCacheHit?: boolean
    metadata?: Record<string, any>
  }) => {
    try {
      const response = await fetch('/api/super-admin/ai-costs/track', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return result.data
      } else {
        throw new Error(result.error?.message || 'Erro ao registrar uso')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao registrar uso')
      return null
    }
  }, [])

  /**
   * Dispensa um alerta
   */
  const dismissAlert = useCallback(async (alertId: string) => {
    try {
      const response = await fetch(`/api/super-admin/ai-costs/alerts/${alertId}/dismiss`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success) {
        return data.data
      } else {
        throw new Error(data.error?.message || 'Erro ao dispensar alerta')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao dispensar alerta')
      return null
    }
  }, [])

  /**
   * Carrega dados na inicialização
   */
  useEffect(() => {
    getCostMetrics()
    getCostHistory()
    getModels()
  }, [getCostMetrics, getCostHistory, getModels])

  return {
    // Estado
    costMetrics,
    costHistory,
    models,
    loading,
    error,
    
    // Ações
    getCostMetrics,
    getCostHistory,
    getModels,
    getCostProjection,
    getCostAlerts,
    setClientCostLimit,
    getClientCostLimit,
    exportCostReport,
    trackUsage,
    dismissAlert,
    
    // Utilitários
    clearError: () => setError(null),
    refresh: () => {
      getCostMetrics()
      getCostHistory()
      getModels()
    }
  }
}