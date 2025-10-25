import { useState, useEffect, useCallback } from 'react';
import { Exercise, ExerciseFilters, ExerciseFormData } from '../../../shared/types';

interface UseExercisesOptions {
  filters?: ExerciseFilters;
  enabled?: boolean;
}

interface UseExercisesReturn {
  exercises: Exercise[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  createExercise: (data: ExerciseFormData) => Promise<Exercise>;
  updateExercise: (id: string, data: Partial<ExerciseFormData>) => Promise<Exercise>;
  deleteExercise: (id: string) => Promise<void>;
}

export function useExercises(filters?: ExerciseFilters): UseExercisesReturn {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchExercises = useCallback(async () => {
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
      const response = await fetch(`/api/exercises?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch exercises');
      }

      const data = await response.json();
      
      if (data.success) {
        setExercises(data.data.exercises);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch exercises');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createExercise = useCallback(async (data: ExerciseFormData): Promise<Exercise> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch('/api/exercises', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create exercise');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchExercises(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to create exercise');
    }
  }, [fetchExercises]);

  const updateExercise = useCallback(async (id: string, data: Partial<ExerciseFormData>): Promise<Exercise> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/exercises/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update exercise');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchExercises(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to update exercise');
    }
  }, [fetchExercises]);

  const deleteExercise = useCallback(async (id: string): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/exercises/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete exercise');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchExercises(); // Refresh the list
    } else {
      throw new Error(result.error?.message || 'Failed to delete exercise');
    }
  }, [fetchExercises]);

  useEffect(() => {
    fetchExercises();
  }, [fetchExercises]);

  return {
    exercises,
    loading,
    error,
    pagination,
    refetch: fetchExercises,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}
