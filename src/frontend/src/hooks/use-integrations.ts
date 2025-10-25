"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { GlobalLimitsConfig, IntegrationConfig, IntegrationTemplate } from "@/shared/types/integrations.types"

// Hook para gerenciar limites globais
export function useGlobalLimits() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: limits, mutate } = useSWR<GlobalLimitsConfig[]>(
    '/api/super-admin/global-limits',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch limits')
      return response.json()
    }
  )

  const updateLimits = async (plan: string, data: Partial<GlobalLimitsConfig>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/global-limits/${plan}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to update limits')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const createOverride = async (tenantId: string, overrides: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/super-admin/global-limits/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, overrides })
      })
      
      if (!response.ok) throw new Error('Failed to create override')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteOverride = async (overrideId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/global-limits/overrides/${overrideId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete override')
      
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    limits,
    loading,
    error,
    updateLimits,
    createOverride,
    deleteOverride,
    refetch: mutate
  }
}

// Hook para gerenciar integrações
export function useIntegrations(filters?: {
  category?: string
  status?: string
  search?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const queryParams = new URLSearchParams()
  if (filters?.category) queryParams.append('category', filters.category)
  if (filters?.status) queryParams.append('status', filters.status)
  if (filters?.search) queryParams.append('search', filters.search)

  const { data: integrations, mutate } = useSWR<IntegrationConfig[]>(
    `/api/super-admin/integrations?${queryParams.toString()}`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch integrations')
      return response.json()
    }
  )

  const createIntegration = async (data: Partial<IntegrationConfig>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/super-admin/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create integration')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateIntegration = async (integration: string, data: Partial<IntegrationConfig>) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/integrations/${integration}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to update integration')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteIntegration = async (integration: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/integrations/${integration}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete integration')
      
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const toggleActive = async (integration: string, isActive: boolean) => {
    return updateIntegration(integration, { isActive })
  }

  return {
    integrations,
    loading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    toggleActive,
    refetch: mutate
  }
}

// Hook para uma integração específica
export function useIntegration(integration: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, mutate } = useSWR<IntegrationConfig>(
    `/api/super-admin/integrations/${integration}`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch integration')
      return response.json()
    }
  )

  const updateConfig = async (config: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/integrations/${integration}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (!response.ok) throw new Error('Failed to update config')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/integrations/${integration}/test`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to test connection')
      
      const result = await response.json()
      await mutate()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getUsage = async (period: string = '30d') => {
    try {
      const response = await fetch(`/api/super-admin/integrations/${integration}/usage?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch usage')
      return response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  const getLogs = async (filters?: any) => {
    try {
      const queryParams = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) queryParams.append(key, String(value))
        })
      }
      
      const response = await fetch(`/api/super-admin/integrations/${integration}/logs?${queryParams.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch logs')
      return response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  return {
    data,
    loading,
    error,
    updateConfig,
    testConnection,
    getUsage,
    getLogs,
    refetch: mutate
  }
}

// Hook para templates de integração
export function useIntegrationTemplate(integration: string) {
  const { data: template, error, mutate } = useSWR<IntegrationTemplate>(
    `/api/super-admin/integrations/${integration}/template`,
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch template')
      return response.json()
    }
  )

  return {
    template,
    loading: !template && !error,
    error,
    refetch: mutate
  }
}

// Hook para listar todos os templates
export function useIntegrationTemplates() {
  const { data: templates, error, mutate } = useSWR<IntegrationTemplate[]>(
    '/api/super-admin/integrations/templates/list',
    async (url: string) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch templates')
      return response.json()
    }
  )

  return {
    templates,
    loading: !templates && !error,
    error,
    refetch: mutate
  }
}

// Hook para uso de integração
export function useIntegrationUsage(integration: string, period: string = '30d') {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: usage, mutate } = useSWR(
    `/api/super-admin/integrations/${integration}/usage?period=${period}`,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch usage')
      return response.json()
    }
  )

  const { data: logs, mutate: mutateLogs } = useSWR(
    `/api/super-admin/integrations/${integration}/logs?period=${period}`,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch logs')
      return response.json()
    }
  )

  const refetch = async () => {
    setLoading(true)
    try {
      await Promise.all([mutate(), mutateLogs()])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return {
    usage,
    logs,
    loading,
    error,
    refetch
  }
}

// Hook para overrides de tenant
export function useTenantOverride(tenantId?: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: overrides, mutate } = useSWR(
    tenantId ? `/api/super-admin/global-limits/overrides?tenantId=${tenantId}` : null,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch overrides')
      return response.json()
    }
  )

  const createOverride = async (data: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/super-admin/global-limits/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to create override')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateOverride = async (overrideId: string, data: any) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/global-limits/overrides/${overrideId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Failed to update override')
      
      await mutate()
      return await response.json()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteOverride = async (overrideId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/super-admin/global-limits/overrides/${overrideId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete override')
      
      await mutate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    overrides,
    loading,
    error,
    createOverride,
    updateOverride,
    deleteOverride,
    refetch: mutate
  }
}

// Hook para estatísticas gerais
export function useManagementStats() {
  const { data: stats, error, mutate } = useSWR(
    '/api/super-admin/management/stats',
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch stats')
      return response.json()
    }
  )

  return {
    stats,
    loading: !stats && !error,
    error,
    refetch: mutate
  }
}

// Hook para logs de auditoria
export function useAuditLogs(filters?: {
  type?: string
  dateFrom?: string
  dateTo?: string
  limit?: number
}) {
  const queryParams = new URLSearchParams()
  if (filters?.type) queryParams.append('type', filters.type)
  if (filters?.dateFrom) queryParams.append('dateFrom', filters.dateFrom)
  if (filters?.dateTo) queryParams.append('dateTo', filters.dateTo)
  if (filters?.limit) queryParams.append('limit', String(filters.limit))

  const { data: logs, error, mutate } = useSWR(
    `/api/super-admin/audit-logs?${queryParams.toString()}`,
    async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch audit logs')
      return response.json()
    }
  )

  return {
    logs,
    loading: !logs && !error,
    error,
    refetch: mutate
  }
}

