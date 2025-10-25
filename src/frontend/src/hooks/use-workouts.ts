import { useState, useEffect, useCallback } from 'react';
import { Treino, TreinoFilters, TreinoFormData } from '../../../shared/types';

interface UseWorkoutsOptions {
  filters?: TreinoFilters;
  enabled?: boolean;
}

interface UseWorkoutsReturn {
  treinos: Treino[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  createTreino: (data: TreinoFormData) => Promise<Treino>;
  updateTreino: (id: string, data: Partial<TreinoFormData>) => Promise<Treino>;
  deleteTreino: (id: string) => Promise<void>;
  completeTreino: (id: string, feedback?: any) => Promise<Treino>;
  cloneTreino: (id: string, newName: string, newMemberId: string) => Promise<Treino>;
}

export function useWorkouts(options: UseWorkoutsOptions = {}): UseWorkoutsReturn {
  const { filters = {}, enabled = true } = options;
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchTreinos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
          }
        });
      }

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/workouts?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch treinos');
      }

      const data = await response.json();
      
      if (data.success) {
        setTreinos(data.data.treinos);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch treinos');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createTreino = useCallback(async (data: TreinoFormData): Promise<Treino> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch('/api/workouts', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create treino');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchTreinos(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to create treino');
    }
  }, [fetchTreinos]);

  const updateTreino = useCallback(async (id: string, data: Partial<TreinoFormData>): Promise<Treino> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/workouts/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update treino');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchTreinos(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to update treino');
    }
  }, [fetchTreinos]);

  const deleteTreino = useCallback(async (id: string): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/workouts/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete treino');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchTreinos(); // Refresh the list
    } else {
      throw new Error(result.error?.message || 'Failed to delete treino');
    }
  }, [fetchTreinos]);

  const completeTreino = useCallback(async (id: string, feedback?: any): Promise<Treino> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/workouts/${id}/complete`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ feedback }),
    });

    if (!response.ok) {
      throw new Error('Failed to complete treino');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchTreinos(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to complete treino');
    }
  }, [fetchTreinos]);

  const cloneTreino = useCallback(async (id: string, newName: string, newMemberId: string): Promise<Treino> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/workouts/${id}/clone`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ newName, newMemberId }),
    });

    if (!response.ok) {
      throw new Error('Failed to clone treino');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchTreinos(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to clone treino');
    }
  }, [fetchTreinos]);

  useEffect(() => {
    fetchTreinos();
  }, [fetchTreinos]);

  return {
    treinos: treinos || [],
    loading,
    error,
    pagination,
    refetch: fetchTreinos,
    createTreino,
    updateTreino,
    deleteTreino,
    completeTreino,
    cloneTreino,
  };
}
