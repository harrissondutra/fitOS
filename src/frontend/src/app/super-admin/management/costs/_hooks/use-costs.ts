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

  // Generic API call function
  const apiCall = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
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
  const getServices = useCallback(async (categoryId?: string): Promise<CostService[]> => {
    const endpoint = categoryId 
      ? `/api/costs/services?categoryId=${categoryId}`
      : '/api/costs/services';
    
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
