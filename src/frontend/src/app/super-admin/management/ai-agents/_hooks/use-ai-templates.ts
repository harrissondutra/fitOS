"use client"

import { useState, useEffect, useCallback } from 'react'

interface ProviderTemplate {
  id: string
  name: string
  displayName: string
  provider: string
  description: string
  icon: string
  color: string
  models: string[]
  features: string[]
  pricing: Array<{
    model: string
    inputCost: number
    outputCost: number
  }>
  capabilities: {
    chat: boolean
    vision: boolean
    audio: boolean
    embeddings: boolean
    functionCalling: boolean
    streaming: boolean
  }
  config: {
    baseUrl?: string
    timeout: number
    maxRetries: number
    headers?: Record<string, string>
  }
  setup: {
    requiresApiKey: boolean
    apiKeyPlaceholder: string
    apiKeyHelp: string
    additionalConfig?: Array<{
      key: string
      label: string
      type: 'text' | 'url' | 'number' | 'boolean'
      placeholder?: string
      help?: string
      required?: boolean
    }>
  }
}

interface TemplateSearchFilters {
  query?: string
  provider?: string
  capability?: string
  hasVision?: boolean
  hasAudio?: boolean
  hasEmbeddings?: boolean
  maxCost?: number
}

interface TemplateStats {
  total: number
  byProvider: Record<string, number>
  capabilities: {
    chat: number
    vision: number
    audio: number
    embeddings: number
    functionCalling: number
    streaming: number
  }
  averagePricing: {
    input: number
    output: number
  }
}

export function useAiTemplates() {
  const [templates, setTemplates] = useState<ProviderTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TemplateStats | null>(null)

  /**
   * Lista todos os templates
   */
  const listTemplates = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/super-admin/ai/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Busca template por ID
   */
  const getTemplateById = useCallback(async (id: string): Promise<ProviderTemplate | null> => {
    try {
      const response = await fetch(`/api/super-admin/ai/templates/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch template')
      return null
    }
  }, [])

  /**
   * Busca templates por provedor
   */
  const getTemplatesByProvider = useCallback(async (provider: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/super-admin/ai/templates/provider/${provider}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates by provider')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Busca templates por capacidade
   */
  const getTemplatesByCapability = useCallback(async (capability: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/super-admin/ai/templates/capability/${capability}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates by capability')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Busca templates com filtros
   */
  const searchTemplates = useCallback(async (filters: TemplateSearchFilters) => {
    setLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams()
      
      if (filters.query) queryParams.append('query', filters.query)
      if (filters.provider) queryParams.append('provider', filters.provider)
      if (filters.capability) queryParams.append('capability', filters.capability)
      if (filters.hasVision !== undefined) queryParams.append('hasVision', filters.hasVision.toString())
      if (filters.hasAudio !== undefined) queryParams.append('hasAudio', filters.hasAudio.toString())
      if (filters.hasEmbeddings !== undefined) queryParams.append('hasEmbeddings', filters.hasEmbeddings.toString())
      if (filters.maxCost !== undefined) queryParams.append('maxCost', filters.maxCost.toString())

      const response = await fetch(`/api/super-admin/ai/templates/search?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setTemplates(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search templates')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Gera configuração inicial baseada no template
   */
  const generateConfig = useCallback(async (templateId: string, apiKey?: string, additionalConfig?: Record<string, any>) => {
    try {
      const response = await fetch(`/api/super-admin/ai/templates/${templateId}/generate-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey, additionalConfig })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate config')
      return null
    }
  }, [])

  /**
   * Valida configuração baseada no template
   */
  const validateConfig = useCallback(async (templateId: string, config: any) => {
    try {
      const response = await fetch(`/api/super-admin/ai/templates/${templateId}/validate-config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to validate config')
      return { valid: false, errors: ['Validation failed'] }
    }
  }, [])

  /**
   * Obtém estatísticas dos templates
   */
  const getTemplatesStats = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/ai/templates/stats/overview', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setStats(data.data)
      return data.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch template stats')
      return null
    }
  }, [])

  /**
   * Obtém templates recomendados baseado em critérios
   */
  const getRecommendedTemplates = useCallback(async (criteria: {
    budget?: 'low' | 'medium' | 'high'
    useCase?: 'chat' | 'vision' | 'audio' | 'embeddings' | 'development'
    performance?: 'fast' | 'balanced' | 'quality'
  }) => {
    const filters: TemplateSearchFilters = {}

    // Filtrar por orçamento
    if (criteria.budget === 'low') {
      filters.maxCost = 0.001
    } else if (criteria.budget === 'medium') {
      filters.maxCost = 0.01
    }

    // Filtrar por caso de uso
    if (criteria.useCase === 'vision') {
      filters.hasVision = true
    } else if (criteria.useCase === 'audio') {
      filters.hasAudio = true
    } else if (criteria.useCase === 'embeddings') {
      filters.hasEmbeddings = true
    }

    await searchTemplates(filters)

    // Ordenar por critérios de performance
    if (criteria.performance === 'fast') {
      setTemplates(prev => [...prev].sort((a, b) => {
        // Priorizar templates com streaming e baixo custo
        const aScore = (a.capabilities.streaming ? 2 : 0) + (a.pricing[0]?.inputCost < 0.001 ? 1 : 0)
        const bScore = (b.capabilities.streaming ? 2 : 0) + (b.pricing[0]?.inputCost < 0.001 ? 1 : 0)
        return bScore - aScore
      }))
    } else if (criteria.performance === 'quality') {
      setTemplates(prev => [...prev].sort((a, b) => {
        // Priorizar templates com mais capacidades
        const aScore = Object.values(a.capabilities).filter(Boolean).length
        const bScore = Object.values(b.capabilities).filter(Boolean).length
        return bScore - aScore
      }))
    }
  }, [searchTemplates])

  /**
   * Carrega templates na inicialização
   */
  useEffect(() => {
    listTemplates()
    getTemplatesStats()
  }, [listTemplates, getTemplatesStats])

  return {
    // Estado
    templates,
    loading,
    error,
    stats,
    
    // Ações
    listTemplates,
    getTemplateById,
    getTemplatesByProvider,
    getTemplatesByCapability,
    searchTemplates,
    generateConfig,
    validateConfig,
    getTemplatesStats,
    getRecommendedTemplates,
    
    // Utilitários
    clearError: () => setError(null),
    refresh: () => {
      listTemplates()
      getTemplatesStats()
    }
  }
}
