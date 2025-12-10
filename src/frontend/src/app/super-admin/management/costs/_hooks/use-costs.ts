import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CostCategory, CostService, CostEntry, CostBudget, CostAlert, CostGoal, ScheduledReport } from '@/types/costs';

// Type for fetch options
type RequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

// Types
export interface CostDashboard {
  totalCost: number;
  totalCostPreviousMonth: number;
  costVariation: number;
  projectedCost: number;
  categories: CategorySummary[];
  topServices: ServiceSummary[];
  alerts: AlertSummary[];
  trends: TrendData[];
  fixedVsVariable: {
    fixed: number;
    variable: number;
    fixedPercentage: number;
    variablePercentage: number;
  };
}

export interface CategorySummary {
  id: string;
  name: string;
  displayName: string;
  icon: string;
  color: string;
  totalCost: number;
  percentage: number;
  previousMonthCost: number;
  variation: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ServiceSummary {
  id: string;
  name: string;
  displayName: string;
  categoryName: string;
  totalCost: number;
  percentage: number;
  requestCount: number;
  averageCost: number;
  trend: 'up' | 'down' | 'stable';
}

export interface AlertSummary {
  id: string;
  type: string;
  severity: string;
  message: string;
  currentAmount: number;
  limitAmount?: number;
  percentage?: number;
  createdAt: string;
}

export interface TrendData {
  date: string;
  totalCost: number;
  categories: Record<string, number>;
}






export interface CostFilters {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  serviceId?: string;
  tags?: string[];
  tenantId?: string;
  clientId?: string;
}

export interface CostEntryInput {
  categoryId: string;
  serviceId: string;
  amount: number;
  currency?: string;
  date?: string;
  description?: string;
  tags?: string[];
  metadata?: any;
  revenueGenerated?: number;
  tenantId?: string;
  clientId?: string;
}

export interface BudgetInput {
  categoryId?: string;
  monthlyLimit: number;
  currency?: string;
  alertAt75?: boolean;
  alertAt90?: boolean;
  startDate: string;
  endDate?: string;
}

export interface SmartComparison {
  currentVsAverage: {
    current: number;
    average: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  anomalies: Array<{
    service: string;
    current: number;
    average: number;
    deviation: number;
  }>;
  trends: Array<{
    category: string;
    growth: number;
    trend: 'up' | 'down' | 'stable';
  }>;
}

export interface PaginatedResponse<T> {
  entries: T[];
  total: number;
  page: number;
  totalPages: number;
}

// API Base URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Custom hook for cost management
export function useCosts() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // REMOVIDO: Mock data - SEMPRE usar dados reais do backend

    // Generic API call function - SEM dados mockados
  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;
    
    // Função para limpar recursos
    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    try {
      // Configurar timeout com reason para evitar erro genérico
      timeoutId = setTimeout(() => {
        cleanup();
        controller.abort('Request timeout after 30 seconds');
      }, 30000); // 30 second timeout

      // Obter token do localStorage para autenticação
      const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;                                                                 

      // Verificar se token existe
      if (!token && typeof window !== 'undefined') {
        console.warn('⚠️ Token de autenticação não encontrado no localStorage');
        // Não mostrar toast para evitar spam, apenas log
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };

      // Adicionar token no header se disponível
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Adicionar tenant ID se disponível
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;                                                                 
      if (tenantId) {
        headers['X-Tenant-Id'] = tenantId;
      }

      const url = `${API_BASE}${endpoint}`;
      console.log(`🔄 API Call: ${options.method || 'GET'} ${url}`, {
        hasToken: !!token,
        hasTenantId: !!tenantId,
      });

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        credentials: 'include',
        signal: controller.signal,
        body: options.body,
      });

      // Limpar timeout ao receber resposta
      cleanup();

      // Verificar se é erro de autenticação
      if (response.status === 401 || response.status === 403) {
        const errorMessage = 'Sessão expirada. Por favor, faça login novamente.';
        setError(errorMessage);
        console.error(`❌ Erro de autenticação (${response.status}):`, endpoint);
        
        toast({
          title: 'Erro de autenticação',
          description: errorMessage,
          variant: 'destructive',
        });
        
        // Redirecionar para login se for erro de autenticação
        if (typeof window !== 'undefined' && response.status === 401) {
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        }
        
        throw new Error(errorMessage);
      }

      if (!response.ok) {
        let errorData: any = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorData = { error: await response.text() };
          }
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        const errorMessage = errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorMessage);
        console.error(`❌ API call failed for ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        });
        
        // Não mostrar toast para todos os erros, apenas para erros críticos
        if (response.status >= 500) {
          toast({
            title: 'Erro do servidor',
            description: errorMessage,
            variant: 'destructive',
          });
        }
        
        throw new Error(errorMessage);
      }

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.warn(`⚠️ Resposta não é JSON para ${endpoint}:`, text);
        throw new Error('Resposta inválida do servidor');
      }

      const data = await response.json();
      console.log(`✅ API Call success: ${endpoint}`, { data: data?.data || data });
      return data.data || data;
        } catch (err) {
      // Sempre limpar timeout em caso de erro
      cleanup();
      
      // Tratar erros específicos
      let errorMessage = 'Erro desconhecido';
      let shouldShowToast = true;

      if (err instanceof Error) {
        // AbortError pode ser por timeout ou cancelamento - tratar silenciosamente se for cancelamento
        if (err.name === 'AbortError') {
          // Se a mensagem é sobre timeout, mostrar erro ao usuário
          const isTimeout = err.message === 'Request timeout after 30 seconds';
          
          if (isTimeout) {
            errorMessage = 'A requisição demorou muito para responder. Tente novamente.';
            console.warn(`⏱️ Request timeout for ${endpoint}`);
          } else {
            // Cancelamento intencional (navegação, unmount, etc.) - não mostrar erro
            console.log(`ℹ️ Request cancelled for ${endpoint}`);
            shouldShowToast = false;
            errorMessage = ''; // Não definir erro para cancelamentos
          }
        } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Erro de conexão. Verifique se o backend está rodando e acessível.';
        } else {
          errorMessage = err.message;
        }
      }

      // Só definir erro e mostrar toast se necessário
      if (shouldShowToast && errorMessage) {
        setError(errorMessage);
        console.error(`❌ API call failed for ${endpoint}:`, err);
        
        // Mostrar toast apenas para erros reais (não para cancelamentos silenciosos ou autenticação)
        if (!errorMessage.includes('Sessão expirada') && errorMessage) {
          toast({
            title: 'Erro ao carregar dados',
            description: errorMessage,
            variant: 'destructive',
          });
        }
      }

      // Re-lançar erro apenas se não for cancelamento intencional
      if (shouldShowToast) {
        throw err;
      }
      
      // Retornar null para cancelamentos intencionais
      return null as T;
    } finally {
      // Garantir cleanup final
      cleanup();
      setLoading(false);
    }
  }, [toast]);

  // Dashboard
  const getDashboard = useCallback(async (filters: CostFilters = {}): Promise<CostDashboard> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/costs/dashboard${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<CostDashboard>(endpoint);
  }, [apiCall]);

  // Categories
  const getCategories = useCallback(async (): Promise<CostCategory[]> => {
    return apiCall<CostCategory[]>('/api/costs/categories');
  }, [apiCall]);

  // Services
  const getServices = useCallback(async (filters?: CostFilters | string): Promise<CostService[]> => {
    // Aceitar tanto string (categoryId) quanto objeto (filters)
    let categoryId: string | undefined;
    let filtersObj: CostFilters | undefined;
    
    if (typeof filters === 'string') {
      categoryId = filters;
    } else if (filters && typeof filters === 'object') {
      filtersObj = filters;
      // Extrair categoryId do objeto filters (aceitar tanto categoryId quanto category)
      categoryId = filters.categoryId || (filters as any).category;
    }

    // Construir query params
    const queryParams = new URLSearchParams();
    if (categoryId) {
      queryParams.set('categoryId', categoryId);
    }
    
    // Adicionar outros filtros se for objeto
    if (filtersObj) {
      Object.entries(filtersObj).forEach(([key, value]) => {
        // Ignorar 'category' já que convertemos para 'categoryId', mas processar outros campos
        if (value !== undefined && value !== null && key !== 'category') {
          if (Array.isArray(value)) {
            queryParams.set(key, value.join(','));
          } else {
            queryParams.set(key, String(value));
          }
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = `/api/costs/services${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<CostService[]>(endpoint);
  }, [apiCall]);

  // Cost Entries
  const getCostEntries = useCallback(async (
    filters: CostFilters = {},
    page = 1,
    limit = 50
  ): Promise<PaginatedResponse<CostEntry>> => {
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/costs/entries?${queryString}`;
    
    return apiCall<PaginatedResponse<CostEntry>>(endpoint);
  }, [apiCall]);

  const createCostEntry = useCallback(async (input: CostEntryInput): Promise<CostEntry> => {
    return apiCall<CostEntry>('/api/costs/entries', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }, [apiCall]);

  const updateCostEntry = useCallback(async (id: string, input: Partial<CostEntryInput>): Promise<CostEntry> => {
    return apiCall<CostEntry>(`/api/costs/entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }, [apiCall]);

  const deleteCostEntry = useCallback(async (id: string): Promise<void> => {
    return apiCall<void>(`/api/costs/entries/${id}`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  // Summary
  const getSummary = useCallback(async (filters: CostFilters = {}): Promise<{
    totalCost: number;
    totalCostPreviousMonth: number;
    costVariation: number;
    projectedCost: number;
    fixedVsVariable: {
      fixed: number;
      variable: number;
      fixedPercentage: number;
      variablePercentage: number;
    };
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/costs/summary${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  }, [apiCall]);

  // Trends
  const getTrends = useCallback(async (months = 6): Promise<TrendData[]> => {
    return apiCall<TrendData[]>(`/api/costs/trends?months=${months}`);
  }, [apiCall]);

  // Comparison
  const getComparison = useCallback(async (filters: CostFilters = {}): Promise<SmartComparison> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/costs/comparison${queryString ? `?${queryString}` : ''}`;
    
    return apiCall<SmartComparison>(endpoint);
  }, [apiCall]);

  // Projection
  const getProjection = useCallback(async (filters: CostFilters = {}): Promise<{
    projectedCost: number;
    currentCost: number;
    daysRemaining: number;
  }> => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.set(key, value.join(','));
        } else {
          queryParams.set(key, String(value));
        }
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/api/costs/projection${queryString ? `?${queryString}` : ''}`;
    
    return apiCall(endpoint);
  }, [apiCall]);

  // Budgets
  const getBudgets = useCallback(async (): Promise<CostBudget[]> => {
    return apiCall<CostBudget[]>('/api/costs/budgets');
  }, [apiCall]);

  const createBudget = useCallback(async (input: BudgetInput): Promise<CostBudget> => {
    return apiCall<CostBudget>('/api/costs/budgets', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }, [apiCall]);

  const updateBudget = useCallback(async (id: string, input: Partial<BudgetInput>): Promise<CostBudget> => {
    return apiCall<CostBudget>(`/api/costs/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }, [apiCall]);

  const deleteBudget = useCallback(async (id: string): Promise<void> => {
    return apiCall<void>(`/api/costs/budgets/${id}`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  // Alerts
  const getAlerts = useCallback(async (status?: string): Promise<CostAlert[]> => {
    const endpoint = status 
      ? `/api/costs/alerts?status=${status}`
      : '/api/costs/alerts';
    
    return apiCall<CostAlert[]>(endpoint);
  }, [apiCall]);

  const acknowledgeAlert = useCallback(async (id: string): Promise<CostAlert> => {
    return apiCall<CostAlert>(`/api/costs/alerts/${id}/acknowledge`, {
      method: 'PUT',
    });
  }, [apiCall]);

  const deleteAlert = useCallback(async (id: string): Promise<void> => {
    return apiCall<void>(`/api/costs/alerts/${id}`, {
      method: 'DELETE',
    });
  }, [apiCall]);

  // Export
  const exportReport = useCallback(async (
    format: 'csv' | 'json',
    filters: CostFilters = {}
  ): Promise<Blob> => {
    const response = await fetch(`${API_BASE}/api/costs/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ format, filters }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.blob();
  }, []);

  // Track usage (for testing)
  const trackUsage = useCallback(async (data: {
    categoryName: string;
    serviceName: string;
    usage: {
      quantity: number;
      unit: string;
      metadata?: any;
    };
  }): Promise<void> => {
    return apiCall<void>('/api/costs/track', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }, [apiCall]);

  return {
    // State
    loading,
    error,
    
    // Dashboard
    getDashboard,
    
    // Categories & Services
    getCategories,
    getServices,
    
    // Cost Entries
    getCostEntries,
    createCostEntry,
    updateCostEntry,
    deleteCostEntry,
    
    // Analytics
    getSummary,
    getTrends,
    getComparison,
    getProjection,
    
    // Budgets
    getBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
    
    // Alerts
    getAlerts,
    acknowledgeAlert,
    deleteAlert,
    
    // Export
    exportReport,
    
    // Track
    trackUsage,
  };
}
