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

  const executePrediction = useCallback(async (input: PredictionInput): Promise<{ success: boolean; data?: PredictionResult; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/predictions/${input.serviceType.toLowerCase().replace(/_/g, '-')}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          data: input.data
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to execute prediction');
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to execute prediction';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const listExecutions = useCallback(async (
    filters?: PredictionFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ data: PredictionExecution[]; pagination: any } | null> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const params = new URLSearchParams();
      if (filters?.serviceType) {
        params.append('serviceType', filters.serviceType);
      }
      if (filters?.userId) {
        params.append('userId', filters.userId);
      }
      if (filters?.startDate) {
        params.append('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.append('endDate', filters.endDate);
      }
      if (pagination) {
        params.append('page', pagination.page.toString());
        params.append('limit', pagination.limit.toString());
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/predictions?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to list executions');
      }

      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to list executions';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getExecution = useCallback(async (executionId: string): Promise<PredictionExecution | null> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/predictions/${executionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get execution');
      }

      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get execution';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const validatePrediction = useCallback(async (
    executionId: string,
    actualResult: any
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/predictions/${executionId}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ actualResult }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate prediction');
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to validate prediction';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
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
    validatePrediction,
  };
}

