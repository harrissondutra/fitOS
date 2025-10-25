import { useState, useEffect, useCallback } from 'react';
import { TenantAnalytics, TrainerAnalytics, ClientAnalytics, GlobalAnalytics } from '../../../shared/types';

interface UseAnalyticsOptions {
  tenantId?: string;
  trainerId?: string;
  clientId?: string;
  enabled?: boolean;
}

interface UseAnalyticsReturn {
  analytics: TenantAnalytics | TrainerAnalytics | ClientAnalytics | GlobalAnalytics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const { tenantId, trainerId, clientId, enabled = true } = options;
  const [analytics, setAnalytics] = useState<TenantAnalytics | TrainerAnalytics | ClientAnalytics | GlobalAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = '/api/analytics/global'; // Default to global analytics
      
      if (tenantId) {
        url = `/api/analytics/tenant/${tenantId}`;
      } else if (trainerId) {
        url = `/api/analytics/trainer/${trainerId}`;
      } else if (clientId) {
        url = `/api/analytics/member/${clientId}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.data);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [tenantId, trainerId, clientId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refetch: fetchAnalytics,
  };
}
