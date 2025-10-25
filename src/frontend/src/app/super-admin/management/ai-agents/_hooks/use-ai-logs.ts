"use client"

import { useState, useEffect, useCallback } from 'react'

interface AiWebhookLog {
  id: string
  providerId: string
  tenantId: string
  direction: 'INBOUND' | 'OUTBOUND'
  requestUrl: string
  requestMethod: string
  requestHeaders: Record<string, string>
  requestBody: any
  responseStatus?: number
  responseHeaders?: Record<string, string>
  responseBody?: any
  duration?: number
  error?: string
  jobId?: string
  createdAt: Date
  provider?: {
    id: string
    name: string
    displayName: string
    provider: string
  }
}

interface AiJob {
  id: string
  serviceType: string
  providerId: string
  tenantId: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  input: string
  output?: string
  error?: string
  startedAt?: Date
  completedAt?: Date
  attempts: number
  userId?: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

interface LogFilters {
  providerId?: string
  direction?: 'INBOUND' | 'OUTBOUND'
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function useAiLogs() {
  const [webhookLogs, setWebhookLogs] = useState<AiWebhookLog[]>([])
  const [jobs, setJobs] = useState<AiJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  /**
   * Lista logs de webhooks
   */
  const listWebhookLogs = useCallback(async (
    filters: LogFilters = {},
    paginationParams: PaginationParams = {}
  ) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      // Adicionar filtros
      if (filters.providerId) queryParams.append('providerId', filters.providerId)
      if (filters.direction) queryParams.append('direction', filters.direction)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)
      if (filters.search) queryParams.append('search', filters.search)

      // Adicionar paginação
      queryParams.append('page', (paginationParams.page || 1).toString())
      queryParams.append('limit', (paginationParams.limit || 20).toString())
      if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy)
      if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder)

      const response = await fetch(`/api/webhooks/ai-callbacks/logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: PaginatedResponse<AiWebhookLog> = await response.json()
      
      setWebhookLogs(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhook logs')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Busca log específico por ID
   */
  const getWebhookLogById = useCallback(async (id: string): Promise<AiWebhookLog | null> => {
    try {
      const response = await fetch(`/api/webhooks/ai-callbacks/logs/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch webhook log')
      return null
    }
  }, [])

  /**
   * Lista jobs assíncronos
   */
  const listJobs = useCallback(async (
    filters: LogFilters = {},
    paginationParams: PaginationParams = {}
  ) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      // Adicionar filtros
      if (filters.providerId) queryParams.append('providerId', filters.providerId)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)
      if (filters.search) queryParams.append('search', filters.search)

      // Adicionar paginação
      queryParams.append('page', (paginationParams.page || 1).toString())
      queryParams.append('limit', (paginationParams.limit || 20).toString())
      if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy)
      if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder)

      const response = await fetch(`/api/super-admin/ai-jobs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: PaginatedResponse<AiJob> = await response.json()
      
      setJobs(data.data)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Busca job específico por ID
   */
  const getJobById = useCallback(async (id: string): Promise<AiJob | null> => {
    try {
      const response = await fetch(`/api/super-admin/ai-jobs/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job')
      return null
    }
  }, [])

  /**
   * Cancela job em execução
   */
  const cancelJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/super-admin/ai-jobs/${id}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Atualizar lista local
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, status: 'cancelled' as const } : job
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel job')
      return false
    }
  }, [])

  /**
   * Retry job falhado
   */
  const retryJob = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/super-admin/ai-jobs/${id}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Atualizar lista local
      setJobs(prev => prev.map(job => 
        job.id === id ? { ...job, status: 'pending' as const, attempts: job.attempts + 1 } : job
      ))

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry job')
      return false
    }
  }, [])

  /**
   * Obtém estatísticas dos logs
   */
  const getLogStats = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/ai-logs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch log stats')
      return null
    }
  }, [])

  /**
   * Exporta logs para CSV
   */
  const exportLogs = useCallback(async (filters: LogFilters = {}, format: 'csv' | 'json' = 'csv') => {
    try {
      const queryParams = new URLSearchParams()
      
      // Adicionar filtros
      if (filters.providerId) queryParams.append('providerId', filters.providerId)
      if (filters.direction) queryParams.append('direction', filters.direction)
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) queryParams.append('dateTo', filters.dateTo)
      
      queryParams.append('format', format)

      const response = await fetch(`/api/super-admin/ai-logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ai-logs-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs')
      return false
    }
  }, [])

  /**
   * Carrega logs na inicialização
   */
  useEffect(() => {
    listWebhookLogs()
  }, [listWebhookLogs])

  return {
    // Estado
    webhookLogs,
    jobs,
    loading,
    error,
    pagination,
    
    // Ações
    listWebhookLogs,
    getWebhookLogById,
    listJobs,
    getJobById,
    cancelJob,
    retryJob,
    getLogStats,
    exportLogs,
    
    // Utilitários
    clearError: () => setError(null),
    refresh: () => listWebhookLogs()
  }
}
