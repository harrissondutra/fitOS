import { useState, useEffect, useCallback } from 'react';
import { 
  AiServiceConfig, 
  AiServiceType, 
  CreateAiServiceConfigRequest, 
  UpdateAiServiceConfigRequest,
  AiServiceConfigFilters,
  PaginationParams,
  PaginatedResponse
} from '@/shared/types/ai.types';

/**
 * Hook para gerenciar configurações de serviços de IA
 * 
 * Fornece operações CRUD e funcionalidades de gerenciamento
 * para configurações de serviços de IA no frontend.
 */
export function useAiServices() {
  const [serviceConfigs, setServiceConfigs] = useState<AiServiceConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  /**
   * Lista configurações de serviços com filtros e paginação
   */
  const listServiceConfigs = useCallback(async (
    filters: AiServiceConfigFilters = {},
    paginationParams: PaginationParams = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros
      if (filters.serviceType) queryParams.append('serviceType', filters.serviceType);
      if (filters.providerId) queryParams.append('providerId', filters.providerId);
      if (typeof filters.isActive === 'boolean') queryParams.append('isActive', filters.isActive.toString());
      if (filters.search) queryParams.append('search', filters.search);

      // Adicionar paginação
      queryParams.append('page', (paginationParams.page || 1).toString());
      queryParams.append('limit', (paginationParams.limit || 20).toString());
      if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy);
      if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder);

      const response = await fetch(`/api/super-admin/ai-service-configs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PaginatedResponse<AiServiceConfig> = await response.json();
      
      setServiceConfigs(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service configs');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca configuração de serviço por ID
   */
  const getServiceConfigById = useCallback(async (id: string): Promise<AiServiceConfig | null> => {
    try {
      const response = await fetch(`/api/super-admin/ai-service-configs/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service config');
      return null;
    }
  }, []);

  /**
   * Cria nova configuração de serviço
   */
  const createServiceConfig = useCallback(async (data: CreateAiServiceConfigRequest): Promise<AiServiceConfig | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/super-admin/ai-service-configs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const newServiceConfig = await response.json();
      
      // Atualizar lista local
      setServiceConfigs(prev => [newServiceConfig, ...prev]);
      
      return newServiceConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create service config');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza configuração de serviço existente
   */
  const updateServiceConfig = useCallback(async (id: string, data: UpdateAiServiceConfigRequest): Promise<AiServiceConfig | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai-service-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedServiceConfig = await response.json();
      
      // Atualizar lista local
      setServiceConfigs(prev => prev.map(sc => sc.id === id ? updatedServiceConfig : sc));
      
      return updatedServiceConfig;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update service config');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove configuração de serviço
   */
  const deleteServiceConfig = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai-service-configs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remover da lista local
      setServiceConfigs(prev => prev.filter(sc => sc.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete service config');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lista configurações por tipo de serviço
   */
  const getServiceConfigsByType = useCallback(async (serviceType: AiServiceType): Promise<AiServiceConfig[]> => {
    try {
      const response = await fetch(`/api/super-admin/ai-service-configs/by-type/${serviceType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service configs by type');
      return [];
    }
  }, []);

  /**
   * Lista configurações por provedor
   */
  const getServiceConfigsByProvider = useCallback(async (providerId: string): Promise<AiServiceConfig[]> => {
    try {
      const response = await fetch(`/api/super-admin/ai-service-configs/by-provider/${providerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service configs by provider');
      return [];
    }
  }, []);

  /**
   * Ativa/desativa configuração de serviço
   */
  const toggleServiceConfig = useCallback(async (id: string, isActive: boolean): Promise<AiServiceConfig | null> => {
    return updateServiceConfig(id, { id, isActive });
  }, [updateServiceConfig]);

  /**
   * Atualiza prioridade de configuração de serviço
   */
  const updateServicePriority = useCallback(async (id: string, priority: number): Promise<AiServiceConfig | null> => {
    return updateServiceConfig(id, { id, priority });
  }, [updateServiceConfig]);

  /**
   * Atualiza custo por request de configuração de serviço
   */
  const updateServiceCost = useCallback(async (id: string, costPerRequest: number): Promise<AiServiceConfig | null> => {
    return updateServiceConfig(id, { id, costPerRequest });
  }, [updateServiceConfig]);

  /**
   * Atualiza limite de requests por minuto
   */
  const updateServiceRateLimit = useCallback(async (id: string, maxRequestsPerMinute: number): Promise<AiServiceConfig | null> => {
    return updateServiceConfig(id, { id, maxRequestsPerMinute });
  }, [updateServiceConfig]);

  /**
   * Obtém estatísticas dos serviços
   */
  const getServiceStats = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/ai-service-configs/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service stats');
      return null;
    }
  }, []);

  /**
   * Agrupa configurações por categoria
   */
  const getServiceConfigsByCategory = useCallback(() => {
    const categories = {
      'Conversação': [AiServiceType.CHAT, AiServiceType.MULTIAGENT_CHAT, AiServiceType.VOICE_WORKOUT_COACH, AiServiceType.VIRTUAL_WORKOUT_BUDDY, AiServiceType.FORM_FILLING_ASSISTANT],
      'Visual': [AiServiceType.IMAGE_ANALYSIS, AiServiceType.VIDEO_ANALYSIS, AiServiceType.POSTURE_ANALYSIS, AiServiceType.EXERCISE_FORM_CHECKER, AiServiceType.BODY_COMPOSITION_PREDICTOR, AiServiceType.NUTRITION_LABEL_SCANNER],
      'Áudio': [AiServiceType.TRANSCRIPTION, AiServiceType.TEXT_TO_SPEECH],
      'Treinos': [AiServiceType.WORKOUT, AiServiceType.SMART_WARMUP_GENERATOR, AiServiceType.AUTO_SUBSTITUTE_EXERCISES, AiServiceType.WORKOUT_DIFFICULTY_ADJUSTER, AiServiceType.RECOVERY_OPTIMIZER, AiServiceType.INJURY_PREDICTION],
      'Nutrição': [AiServiceType.NUTRITION, AiServiceType.MEAL_PLAN_GENERATION, AiServiceType.SUPPLEMENT_RECOMMENDATION],
      'Saúde': [AiServiceType.MEDICAL_OCR, AiServiceType.SENTIMENT_ANALYSIS, AiServiceType.MOTIVATION_DETECTION, AiServiceType.MENTAL_HEALTH_MONITOR],
      'Business': [AiServiceType.ANALYTICS, AiServiceType.CHURN, AiServiceType.REVENUE_PREDICTION, AiServiceType.MARKET_INTELLIGENCE, AiServiceType.COMPETITOR_WORKOUT_DETECTOR, AiServiceType.MEMBERSHIP_UPSELL_ASSISTANT],
      'Conteúdo': [AiServiceType.CONTENT_GENERATION, AiServiceType.AUTOMATIC_PROGRESS_REPORTS, AiServiceType.VIDEO_GENERATION, AiServiceType.PLAYLIST_GENERATION],
      'Automação': [AiServiceType.SCHEDULING_ASSISTANT],
      'RAG': [AiServiceType.EMBEDDINGS, AiServiceType.RAG_COACH, AiServiceType.RAG_NUTRITION, AiServiceType.RAG_MEDICAL],
      'Customizado': [AiServiceType.CUSTOM]
    };

    const grouped: Record<string, AiServiceConfig[]> = {};
    
    Object.entries(categories).forEach(([category, serviceTypes]) => {
      grouped[category] = serviceConfigs.filter(sc => serviceTypes.includes(sc.serviceType));
    });

    return grouped;
  }, [serviceConfigs]);

  /**
   * Duplica configuração de serviço
   */
  const duplicateServiceConfig = useCallback(async (id: string, options: { newServiceName?: string; newProviderId?: string } = {}): Promise<AiServiceConfig | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai-service-configs/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const duplicatedConfig = await response.json();
      
      // Atualizar lista local
      setServiceConfigs(prev => [...prev, duplicatedConfig.config]);
      
      return duplicatedConfig.config;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to duplicate service config');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega configurações de serviços na inicialização
   */
  useEffect(() => {
    listServiceConfigs();
  }, [listServiceConfigs]);

  return {
    // Estado
    serviceConfigs,
    loading,
    error,
    pagination,
    
    // Ações
    listServiceConfigs,
    getServiceConfigById,
    createServiceConfig,
    updateServiceConfig,
    deleteServiceConfig,
    duplicateServiceConfig,
    getServiceConfigsByType,
    getServiceConfigsByProvider,
    toggleServiceConfig,
    updateServicePriority,
    updateServiceCost,
    updateServiceRateLimit,
    getServiceStats,
    getServiceConfigsByCategory,
    
    // Utilitários
    clearError: () => setError(null),
    refresh: () => listServiceConfigs()
  };
}
