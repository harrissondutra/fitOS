"use client"

import { useState, useEffect, useCallback } from 'react'

export interface AiConsumptionLog {
  id: string
  tenantId: string | null
  tenantName: string | null
  clientId: string
  clientName: string | null
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  currency: string
  isCacheHit: boolean
  metadata: any
  timestamp: Date
  createdAt: Date
}

export interface AiLogsStats {
  total: {
    logs: number
    cost: number
    tokens: number
    cacheHits: number
    cacheHitRate: number
  }
  byProvider: Array<{
    provider: string
    cost: number
    tokens: number
    requestCount: number
  }>
  byModel: Array<{
    model: string
    cost: number
    tokens: number
    requestCount: number
  }>
  byTenant: Array<{
    tenantId: string | null
    tenantName: string | null
    totalCost: number
    totalTokens: number
    requestCount: number
  }>
  byDay: Array<{
    date: string
    cost: number
    tokens: number
    requestCount: number
  }>
}

export interface Tenant {
  id: string
  name: string
  domain: string
  createdAt: Date
}

interface LogFilters {
  tenantId?: string
  provider?: string
  model?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

interface PaginationParams {
  page?: number
  limit?: number
}

interface PaginatedResponse {
  data: AiConsumptionLog[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    hasMore: boolean
  }
}

export function useAiConsumptionLogs() {
  const [logs, setLogs] = useState<AiConsumptionLog[]>([])
  const [stats, setStats] = useState<AiLogsStats | null>(null)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
    hasMore: false
  })

  /**
   * Carrega lista de tenants
   */
  const loadTenants = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/super-admin/ai/logs/tenants', {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setTenants(result.success ? result.data : result)
    } catch (err) {
      console.error('Failed to load tenants:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tenants')
    }
  }, [])

  /**
   * Carrega logs de consumo
   */
  const loadLogs = useCallback(async (
    filters: LogFilters = {},
    paginationParams: PaginationParams = {}
  ) => {
    setLoading(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const queryParams = new URLSearchParams()
      
      // Adicionar filtros
      if (filters.tenantId) queryParams.append('tenantId', filters.tenantId)
      if (filters.provider) queryParams.append('provider', filters.provider)
      if (filters.model) queryParams.append('model', filters.model)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)
      if (filters.search) queryParams.append('search', filters.search)

      // Adicionar paginação
      queryParams.append('page', (paginationParams.page || 1).toString())
      queryParams.append('limit', (paginationParams.limit || 20).toString())

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/super-admin/ai/logs?${queryParams}`, {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: PaginatedResponse = await response.json()
      
      setLogs(result.data)
      setPagination(result.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Carrega estatísticas
   */
  const loadStats = useCallback(async (filters: LogFilters = {}) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
      const queryParams = new URLSearchParams()
      
      if (filters.tenantId) queryParams.append('tenantId', filters.tenantId)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/super-admin/ai/logs/stats?${queryParams}`, {
        headers,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      setStats(result.success ? result.data : result)
    } catch (err) {
      console.error('Failed to load stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    }
  }, [])

  // Carregar tenants na inicialização
  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  return {
    // Estado
    logs,
    stats,
    tenants,
    loading,
    error,
    pagination,
    
    // Ações
    loadLogs,
    loadStats,
    loadTenants,
    clearError: () => setError(null),
    refresh: () => {
      loadLogs()
      loadStats()
    }
  }
}

