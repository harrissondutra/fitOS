import { useState, useCallback } from 'react';
import { AiServiceType } from '@/shared/types/ai.types';

export interface GenerationInput {
  serviceType: AiServiceType;
  tenantId?: string;
  userId?: string;
  input: Record<string, any>;
  options?: {
    temperature?: number;
    maxTokens?: number;
    template?: string;
  };
}

export interface GenerationResult {
  contentId: string;
  serviceType: AiServiceType;
  output: any;
  metadata?: Record<string, any>;
}

export interface GeneratedContent {
  id: string;
  serviceType: string;
  tenantId: string;
  userId?: string;
  providerId?: string;
  model?: string;
  input: Record<string, any>;
  output: any;
  metadata: Record<string, any>;
  quality?: number;
  feedback?: any;
  createdAt: string;
  updatedAt: string;
  provider?: {
    id: string;
    displayName: string;
    provider: string;
  };
}

export interface GenerationFilters {
  serviceType?: AiServiceType;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook para gerenciar geração de conteúdo com IA
 */
export function useContentGeneration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Gera conteúdo usando IA
   */
  const generateContent = useCallback(async (
    input: GenerationInput
  ): Promise<{ success: boolean; data?: GenerationResult; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const serviceTypePath = input.serviceType.toLowerCase().replace(/_/g, '-');
      const response = await fetch(`/api/super-admin/ai/generators/${serviceTypePath}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tenantId: input.tenantId,
          userId: input.userId,
          input: input.input,
          options: input.options
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result.data };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lista conteúdo gerado
   */
  const listGeneratedContent = useCallback(async (
    filters: GenerationFilters = {},
    pagination: { page: number; limit: number } = { page: 1, limit: 20 }
  ): Promise<{ data: GeneratedContent[]; pagination: any } | null> => {
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

      const response = await fetch(`/api/super-admin/ai/generators?${queryParams}`, {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch generated content';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtém detalhes de conteúdo gerado
   */
  const getContent = useCallback(async (contentId: string): Promise<GeneratedContent | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai/generators/${contentId}`, {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Submete feedback sobre conteúdo gerado
   */
  const submitFeedback = useCallback(async (
    contentId: string,
    feedback: {
      rating?: number;
      comment?: string;
      improvements?: string[];
    }
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/super-admin/ai/generators/${contentId}/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(feedback)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit feedback';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateContent,
    listGeneratedContent,
    getContent,
    submitFeedback
  };
}



