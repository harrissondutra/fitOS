import { useState, useCallback } from 'react';
import { AiServiceType } from '@/shared/types/ai.types';

export interface PredictionInput {
  serviceType: AiServiceType;
  tenantId?: string;
  userId?: string;
  data: Record<string, any>;
}

export interface PredictionResult {
  predictionId: string;
  serviceType: AiServiceType;
  prediction: any;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface PredictionExecution {
  id: string;
  modelId: string;
  tenantId: string;
  userId?: string;
  inputData: Record<string, any>;
  prediction: any;
  confidence?: number;
  actualResult?: any;
  accuracy?: number;
  executedAt: string;
  model?: {
    id: string;
    serviceType: string;
    modelName: string;
    version: string;
  };
}

export interface PredictionFilters {
  serviceType?: AiServiceType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook para gerenciar predições de IA
 */
export function usePredictions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Executa uma predição
   */
  const executePrediction = useCallback(async (
    input: PredictionInput
  ): Promise<{ success: boolean; data?: PredictionResult; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const serviceTypePath = input.serviceType.toLowerCase().replace(/_/g, '-');
      const response = await fetch(`/api/super-admin/ai/predictions/${serviceTypePath}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: input.tenantId,
          userId: input.userId,
          data: input.data
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute prediction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lista execuções de predição
   */
  const listExecutions = useCallback(async (
    filters: PredictionFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ data: PredictionExecution[]; pagination: any } | null> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.page.toString());
      queryParams.append('limit', pagination.limit.toString());
      
      if (filters.serviceType) queryParams.append('serviceType', filters.serviceType);
      if (filters.userId) queryParams.append('userId', filters.userId);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`/api/super-admin/ai/predictions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch predictions';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtém detalhes de uma execução
   */
  const getExecution = useCallback(async (executionId: string): Promise<PredictionExecution | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai/predictions/${executionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch execution';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Valida uma predição com resultado real
   */
  const validatePrediction = useCallback(async (
    executionId: string,
    actualResult: any
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai/predictions/${executionId}/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ actualResult })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate prediction';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    executePrediction,
    listExecutions,
    getExecution,
    validatePrediction
  };
}



