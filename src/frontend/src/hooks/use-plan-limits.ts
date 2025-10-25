import { useState, useEffect, useCallback } from 'react';
import { PlanLimits } from '../../../shared/types';

// Tipo específico para usage stats do plan limits
interface PlanUsageStats {
  users: Record<string, number>;
  treinos: number;
  exercises: number;
  clients: number;
  storage: number;
  limits: PlanLimits;
}

interface UsePlanLimitsOptions {
  enabled?: boolean;
}

interface UsePlanLimitsReturn {
  planLimits: PlanLimits | null;
  usageStats: PlanUsageStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  checkLimit: (resource: 'treinos' | 'clients' | 'storage') => Promise<boolean>;
  trackEvent: (event: {
    type: string;
    resource: string;
    metadata?: any;
  }) => Promise<void>;
}

export function usePlanLimits(options: UsePlanLimitsOptions = {}): UsePlanLimitsReturn {
  const { enabled = true } = options;
  // Auth removed - using default values
  const user = { tenantId: 'default-tenant', role: 'SUPER_ADMIN' as const };
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [usageStats, setUsageStats] = useState<PlanUsageStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlanLimits = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // SUPER_ADMIN não tem limitações - é o dono do sistema
      if (user?.role === 'SUPER_ADMIN') {
        setPlanLimits({
          super_admin: -1,
          owner: -1,
          admin: -1,
          trainer: -1,
          client: -1,
          treinos: -1,
          exercises: -1,
          storage: -1
        });
        setUsageStats({
          users: {
            super_admin: 0,
            owner: 0,
            admin: 0,
            trainer: 0,
            client: 0
          },
          treinos: 0,
          exercises: 0,
          clients: 0,
          storage: 0,
          limits: {
            super_admin: -1,
            owner: -1,
            admin: -1,
            trainer: -1,
            client: -1,
            treinos: -1,
            exercises: -1,
            storage: -1
          }
        });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/plan-limits', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch plan limits');
      }

      const data = await response.json();
      
      if (data.success) {
        setPlanLimits(data.data.planLimits);
        setUsageStats(data.data.usageStats);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch plan limits');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  const checkLimit = useCallback(async (resource: 'treinos' | 'clients' | 'storage'): Promise<boolean> => {
    try {
      // SUPER_ADMIN sempre pode - não tem limitações
      if (user?.role === 'SUPER_ADMIN') {
        return true;
      }

      const response = await fetch(`/api/plan-limits/check/${resource}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check limit');
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data.allowed;
      } else {
        throw new Error(data.error?.message || 'Failed to check limit');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [user?.role]);

  const trackEvent = useCallback(async (event: {
    type: string;
    resource: string;
    metadata?: any;
  }): Promise<void> => {
    try {
      // SUPER_ADMIN não precisa trackear eventos - não tem limitações
      if (user?.role === 'SUPER_ADMIN') {
        return;
      }

      const response = await fetch('/api/plan-limits/track-event', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to track event');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchPlanLimits(); // Refresh the data
      } else {
        throw new Error(data.error?.message || 'Failed to track event');
      }
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [fetchPlanLimits, user?.role]);

  useEffect(() => {
    if (enabled) {
      fetchPlanLimits();
    }
  }, [fetchPlanLimits, enabled]);

  return {
    planLimits,
    usageStats,
    loading,
    error,
    refetch: fetchPlanLimits,
    checkLimit,
    trackEvent,
  };
}
