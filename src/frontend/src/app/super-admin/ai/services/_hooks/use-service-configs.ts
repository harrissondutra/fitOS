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
import { authenticatedFetch } from '../../../management/ai-agents/_hooks/_utils/fetch-helper';

/**
 * Hook para gerenciar configurações de serviços de IA
 * 
 * Fornece operações CRUD e funcionalidades de gerenciamento
 * para configurações de serviços de IA no frontend.
 */
export function useServiceConfigs() {
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
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const queryParams = new URLSearchParams();
      
      // Adicionar filtros
      if (filters.serviceType) queryParams.append('serviceType', filters.serviceType);
      if (filters.providerId) queryParams.append('providerId', filters.providerId);
      if (typeof filters.isActive === 'boolean') queryParams.append('isActive', filters.isActive.toString());
      if (filters.search) queryParams.append('search', filters.search);

      // Adicionar paginação
      queryParams.append('page', (paginationParams.page || 1).toString());
      queryParams.append('pageSize', (paginationParams.limit || 20).toString());
      if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy);
      if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await authenticatedFetch(`${apiUrl}/api/super-admin/ai/service-configs?${queryParams}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PaginatedResponse<AiServiceConfig> = await response.json();
      
      // Garantir que data e pagination existem
      setServiceConfigs(data?.data || []);
      setPagination(data?.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        pages: 0
      });
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
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
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
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/service-configs/by-type/${serviceType}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service configs by type');
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
    getServiceConfigsByType,
    toggleServiceConfig,
    
    // Utilitários
    clearError: () => setError(null),
    refresh: () => listServiceConfigs()
  };
}



