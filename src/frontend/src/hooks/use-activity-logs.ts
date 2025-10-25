import { useState, useEffect, useCallback } from 'react';
import { ActivityLog, ActivityLogFilters } from '../../../shared/types';

interface UseActivityLogsOptions {
  filters?: ActivityLogFilters;
  enabled?: boolean;
}

interface UseActivityLogsReturn {
  activityLogs: ActivityLog[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  logActivity: (data: {
    clientId: string;
    type: string;
    description: string;
    metadata?: any;
  }) => Promise<ActivityLog>;
}

export function useActivityLogs(options: UseActivityLogsOptions = {}): UseActivityLogsReturn {
  const { filters = {}, enabled = true } = options;
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchActivityLogs = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/activity-logs?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }

      const data = await response.json();
      
      if (data.success) {
        setActivityLogs(data.data.activityLogs);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch activity logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters, enabled]);

  const logActivity = useCallback(async (data: {
    clientId: string;
    type: string;
    description: string;
    metadata?: any;
  }): Promise<ActivityLog> => {
    const response = await fetch('/api/activity-logs', {
      method: 'POST',
      credentials: 'include',
        headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to log activity');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchActivityLogs(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to log activity');
    }
  }, [fetchActivityLogs]);

  useEffect(() => {
    fetchActivityLogs();
  }, [fetchActivityLogs]);

  return {
    activityLogs,
    loading,
    error,
    pagination,
    refetch: fetchActivityLogs,
    logActivity,
  };
}



