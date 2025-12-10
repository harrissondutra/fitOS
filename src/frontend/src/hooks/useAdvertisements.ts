/**
 * Hook para buscar anúncios da API
 * Usa SWR para cache e revalidação automática
 */

import useSWR from 'swr';
import { Advertisement } from '@/shared/types/advertisements.types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface UseAdvertisementsOptions {
  position?: string;
  context?: string;
  limit?: number;
  enabled?: boolean;
}

interface UseAdvertisementsResult {
  ads: Advertisement[];
  isLoading: boolean;
  isError: boolean;
  error: Error | undefined;
  mutate: () => Promise<Advertisement[] | undefined>;
}

const fetcher = async (url: string): Promise<Advertisement[]> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': localStorage.getItem('tenantId') || '',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch advertisements');
  }

  const data = await response.json();
  return data.success ? data.data : [];
};

/**
 * Hook para buscar anúncios ativos
 */
export function useAdvertisements(
  options: UseAdvertisementsOptions = {}
): UseAdvertisementsResult {
  const { position, context, limit = 3, enabled = true } = options;

  const params = new URLSearchParams();
  if (position) params.append('position', position);
  if (context) params.append('context', context);
  if (limit) params.append('limit', limit.toString());

  const url = enabled
    ? `${API_URL}/advertisements?${params.toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<Advertisement[]>(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // Cache por 1 minuto
      refreshInterval: 300000, // Revalidar a cada 5 minutos
    }
  );

  return {
    ads: data || [],
    isLoading,
    isError: !!error,
    error: error as Error | undefined,
    mutate,
  };
}

/**
 * Hook para trackear visualização de anúncio
 */
export function useTrackAdView() {
  const trackView = async (adId: string, position?: string) => {
    try {
      await fetch(`${API_URL}/advertisements/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
        },
        body: JSON.stringify({
          adId,
          eventType: 'view',
          position,
        }),
      });
    } catch (error) {
      console.error('Error tracking ad view:', error);
    }
  };

  return { trackView };
}

/**
 * Hook para trackear clique em anúncio
 */
export function useTrackAdClick() {
  const trackClick = async (adId: string, position?: string) => {
    try {
      await fetch(`${API_URL}/advertisements/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': localStorage.getItem('tenantId') || '',
        },
        body: JSON.stringify({
          adId,
          eventType: 'click',
          position,
        }),
      });
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  return { trackClick };
}
