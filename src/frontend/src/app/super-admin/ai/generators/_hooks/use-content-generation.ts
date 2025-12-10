import { useState, useCallback } from 'react';
import { AiServiceType } from '@/shared/types/ai.types';

export interface GenerationInput {
  serviceType: AiServiceType;
  tenantId?: string;
  userId?: string;
  input: Record<string, any>;
  options?: {
    template?: string;
    temperature?: number;
    maxTokens?: number;
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
  providerId: string;
  model: string;
  input: Record<string, any>;
  output: any;
  quality?: number;
  feedback?: any;
  createdAt: string;
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

  const generateContent = useCallback(async (input: GenerationInput): Promise<{ success: boolean; data?: GenerationResult; error?: string }> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/generators/${input.serviceType.toLowerCase().replace(/_/g, '-')}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          input: input.input,
          options: input.options
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate content');
      }

      return {
        success: true,
        data: result.data,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate content';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const listGeneratedContent = useCallback(async (
    filters?: GenerationFilters,
    pagination?: { page: number; limit: number }
  ): Promise<{ data: GeneratedContent[]; pagination: any } | null> => {
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
      const response = await fetch(`${apiUrl}/api/super-admin/ai/generators?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to list generated content');
      }

      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to list generated content';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getContent = useCallback(async (contentId: string): Promise<GeneratedContent | null> => {
    try {
      setLoading(true);
      setError(null);

      // Obter token de autenticação
      const accessToken = localStorage.getItem('accessToken') || '';
      if (!accessToken) {
        throw new Error('Token de autenticação não encontrado');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${apiUrl}/api/super-admin/ai/generators/${contentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get content');
      }

      return result.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get content';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addFeedback = useCallback(async (
    contentId: string,
    feedback: { rating: number; comment?: string; improvements?: string[] }
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
      const response = await fetch(`${apiUrl}/api/super-admin/ai/generators/${contentId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(feedback),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add feedback');
      }

      return { success: true };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add feedback';
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
    generateContent,
    listGeneratedContent,
    getContent,
    addFeedback,
  };
}

