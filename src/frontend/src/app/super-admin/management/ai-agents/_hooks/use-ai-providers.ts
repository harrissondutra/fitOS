import { useState, useEffect, useCallback } from 'react';
import { 
  AiProvider, 
  AiProviderType, 
  CreateAiProviderRequest, 
  UpdateAiProviderRequest,
  AiProviderFilters,
  PaginationParams,
  PaginatedResponse
} from '@/shared/types/ai.types';

/**
 * Hook para gerenciar provedores de IA
 * 
 * Fornece operações CRUD e funcionalidades de gerenciamento
 * para provedores de IA no frontend.
 */
export function useAiProviders() {
  const [providers, setProviders] = useState<AiProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  /**
   * Lista provedores com filtros e paginação
   */
  const listProviders = useCallback(async (
    filters: AiProviderFilters = {},
    paginationParams: PaginationParams = {}
  ) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Adicionar filtros
      if (filters.provider) queryParams.append('provider', filters.provider);
      if (typeof filters.isActive === 'boolean') queryParams.append('isActive', filters.isActive.toString());
      if (typeof filters.isDefault === 'boolean') queryParams.append('isDefault', filters.isDefault.toString());
      if (typeof filters.isAsync === 'boolean') queryParams.append('isAsync', filters.isAsync.toString());
      if (filters.search) queryParams.append('search', filters.search);

      // Adicionar paginação
      queryParams.append('page', (paginationParams.page || 1).toString());
      queryParams.append('limit', (paginationParams.limit || 20).toString());
      if (paginationParams.sortBy) queryParams.append('sortBy', paginationParams.sortBy);
      if (paginationParams.sortOrder) queryParams.append('sortOrder', paginationParams.sortOrder);

      const response = await fetch(`/api/super-admin/ai-providers?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: PaginatedResponse<AiProvider> = await response.json();
      
      setProviders(data.data);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca provedor por ID
   */
  const getProviderById = useCallback(async (id: string, includeDecrypted: boolean = false): Promise<AiProvider | null> => {
    try {
      const response = await fetch(`/api/super-admin/ai-providers/${id}?includeDecrypted=${includeDecrypted}`, {
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
      setError(err instanceof Error ? err.message : 'Failed to fetch provider');
      return null;
    }
  }, []);

  /**
   * Cria novo provedor
   */
  const createProvider = useCallback(async (data: CreateAiProviderRequest): Promise<AiProvider | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/super-admin/ai-providers', {
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

      const newProvider = await response.json();
      
      // Atualizar lista local
      setProviders(prev => [newProvider, ...prev]);
      
      return newProvider;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create provider');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza provedor existente
   */
  const updateProvider = useCallback(async (id: string, data: UpdateAiProviderRequest): Promise<AiProvider | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai-providers/${id}`, {
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

      const updatedProvider = await response.json();
      
      // Atualizar lista local
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p));
      
      return updatedProvider;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update provider');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Remove provedor
   */
  const deleteProvider = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai-providers/${id}`, {
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
      setProviders(prev => prev.filter(p => p.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Testa conectividade de um provedor
   */
  const testProvider = useCallback(async (id: string): Promise<{ success: boolean; error?: string; responseTime?: number }> => {
    try {
      const response = await fetch(`/api/super-admin/ai-providers/${id}/test`, {
        method: 'POST',
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
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Test failed'
      };
    }
  }, []);

  /**
   * Rotaciona chave de API de um provedor
   */
  const rotateApiKey = useCallback(async (id: string, newApiKey: string): Promise<AiProvider | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai-providers/${id}/rotate-key`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: newApiKey })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const updatedProvider = await response.json();
      
      // Atualizar lista local
      setProviders(prev => prev.map(p => p.id === id ? updatedProvider : p));
      
      return updatedProvider;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate API key');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtém estatísticas dos provedores
   */
  const getProviderStats = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/ai-providers/stats', {
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
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      return null;
    }
  }, []);

  /**
   * Lista provedores por tipo
   */
  const getProvidersByType = useCallback(async (providerType: AiProviderType): Promise<AiProvider[]> => {
    try {
      const response = await fetch(`/api/super-admin/ai-providers/by-type/${providerType}`, {
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
      setError(err instanceof Error ? err.message : 'Failed to fetch providers by type');
      return [];
    }
  }, []);

  /**
   * Carrega provedores na inicialização
   */
  useEffect(() => {
    listProviders();
  }, [listProviders]);

  return {
    // Estado
    providers,
    loading,
    error,
    pagination,
    
    // Ações
    listProviders,
    getProviderById,
    createProvider,
    updateProvider,
    deleteProvider,
    testProvider,
    rotateApiKey,
    getProviderStats,
    getProvidersByType,
    
    // Utilitários
    clearError: () => setError(null),
    refresh: () => listProviders()
  };
}
