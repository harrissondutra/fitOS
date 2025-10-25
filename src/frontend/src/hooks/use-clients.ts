import { useState, useEffect, useCallback } from 'react';
import { Client, ClientFilters, ClientFormData } from '../../../shared/types';

interface UseClientsOptions {
  filters?: ClientFilters;
  enabled?: boolean;
}

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  refetch: () => void;
  createClient: (data: ClientFormData) => Promise<Client>;
  updateClient: (id: string, data: Partial<ClientFormData>) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
  assignTrainer: (clientId: string, trainerId: string) => Promise<void>;
  unassignTrainer: (clientId: string, trainerId: string) => Promise<void>;
}

export function useClients(options: UseClientsOptions = {}): UseClientsReturn {
  const { filters = {}, enabled = true } = options;
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  const fetchMembers = useCallback(async () => {
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
      const response = await fetch(`/api/clients?${queryParams.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }

      const data = await response.json();
      
      if (data.success) {
        setClients(data.data.clients);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error?.message || 'Failed to fetch clients');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const createClient = useCallback(async (data: ClientFormData): Promise<Client> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch('/api/clients', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create client');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchMembers(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to create client');
    }
  }, [fetchMembers]);

  const updateClient = useCallback(async (id: string, data: Partial<ClientFormData>): Promise<Client> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update client');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchMembers(); // Refresh the list
      return result.data;
    } else {
      throw new Error(result.error?.message || 'Failed to update client');
    }
  }, [fetchMembers]);

  const deleteClient = useCallback(async (id: string): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/clients/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete client');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchMembers(); // Refresh the list
    } else {
      throw new Error(result.error?.message || 'Failed to delete client');
    }
  }, [fetchMembers]);

  const assignTrainer = useCallback(async (clientId: string, trainerId: string): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/clients/${clientId}/assign-trainer`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ trainerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to assign trainer');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchMembers(); // Refresh the list
    } else {
      throw new Error(result.error?.message || 'Failed to assign trainer');
    }
  }, [fetchMembers]);

  const unassignTrainer = useCallback(async (clientId: string, trainerId: string): Promise<void> => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(`/api/clients/${clientId}/unassign-trainer`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
      },
      body: JSON.stringify({ trainerId }),
    });

    if (!response.ok) {
      throw new Error('Failed to unassign trainer');
    }

    const result = await response.json();
    
    if (result.success) {
      await fetchMembers(); // Refresh the list
    } else {
      throw new Error(result.error?.message || 'Failed to unassign trainer');
    }
  }, [fetchMembers]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    clients,
    loading,
    error,
    pagination,
    refetch: fetchMembers,
    createClient,
    updateClient,
    deleteClient,
    assignTrainer,
    unassignTrainer,
  };
}
