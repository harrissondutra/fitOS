import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseAuditLogReturn {
  auditLogs: any[];
  loading: boolean;
  error: string | null;
  fetchAuditLogs: (filters?: any) => Promise<void>;
  logAction: (action: string, resource: string, details?: any) => Promise<void>;
}

export function useAuditLog(): UseAuditLogReturn {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = useCallback(async (filters: any = {}): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value));
        }
      });

      const response = await fetch(`/api/audit-logs?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit logs');
      }

      const data = await response.json();
      
      if (data.success) {
        setAuditLogs(data.data.auditLogs);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const logAction = useCallback(async (action: string, resource: string, details?: any): Promise<void> => {
    try {
      const response = await fetch('/api/audit-logs', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, resource, details }),
      });

      if (!response.ok) {
        throw new Error('Failed to log action');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchAuditLogs(); // Refresh the list
      } else {
        throw new Error(data.error?.message || 'Failed to log action');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  }, [fetchAuditLogs]);

  return {
    auditLogs,
    loading,
    error,
    fetchAuditLogs,
    logAction,
  };
}














