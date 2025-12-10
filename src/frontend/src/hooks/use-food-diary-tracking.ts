'use client';

/**
 * Hook for Food Diary Tracking - FitOS Sprint 7
 * 
 * Gerencia estado do tracking alimentar
 * Integração: SWR + React Hot Toast + Offline Support
 */

import useSWR from 'swr';
import { toast } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { addFoodOffline, getFoodDiarySync, manualSync, type SyncStatus } from '@/lib/db/food-diary-sync';

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch data');
  }

  return res.json();
};

interface AddFoodData {
  foodId?: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string;
  consumedAt: Date;
  notes?: string;
}

export function useFoodDiaryTracking(date: string) {
  const [isAdding, setIsAdding] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const { user } = useAuth();

  // Monitorar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Setup sync service
    const syncService = getFoodDiarySync();
    syncService.setupConnectionListener(() => {
      toast.success('Sincronização concluída!');
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // SWR data fetching
  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/nutrition/tracking/daily/${date}` : null,
    fetcher,
    {
      refreshInterval: 60000, // Refresh a cada minuto
      revalidateOnFocus: false,
      dedupingInterval: 30000
    }
  );

  // Buscar histórico
  const { data: historyData, error: historyError, mutate: mutateHistory } = useSWR(
    user ? `/api/nutrition/tracking/history?days=30` : null,
    fetcher,
    {
      refreshInterval: 300000, // Refresh a cada 5 minutos
      revalidateOnFocus: false
    }
  );

  /**
   * Adiciona alimento ao diário (com suporte offline)
   */
  const addFood = async (foodData: AddFoodData) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setIsAdding(true);

    try {
      // Se estiver offline, salvar localmente
      if (!isOnline) {
        const entryId = await addFoodOffline({
          ...foodData,
          foodId: foodData.foodId,
          name: foodData.name,
          quantity: foodData.quantity,
          unit: foodData.unit,
          mealType: foodData.mealType,
          consumedAt: foodData.consumedAt,
          notes: foodData.notes,
        });
        
        toast.success('Alimento adicionado (modo offline) - será sincronizado quando voltar online');
        return { id: entryId };
      }

      // Se estiver online, tentar enviar ao servidor
      const token = localStorage.getItem('token');
      
      try {
        const res = await fetch('/api/nutrition/tracking/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...foodData,
            clientId: user.id,
            tenantId: user.tenantId
          })
        });

        if (!res.ok) {
          // Se falhar, salvar offline
          throw new Error('Network error');
        }

        const result = await res.json();
        
        toast.success('Alimento adicionado ao diário!');
        await mutate();
        await mutateHistory();
        
        return result.data;
      } catch (networkError) {
        // Se falhar por erro de rede, salvar offline
        const entryId = await addFoodOffline({
          ...foodData,
          foodId: foodData.foodId,
          name: foodData.name,
          quantity: foodData.quantity,
          unit: foodData.unit,
          mealType: foodData.mealType,
          consumedAt: foodData.consumedAt,
          notes: foodData.notes,
        });
        
        toast.success('Alimento adicionado (modo offline) - será sincronizado quando voltar online');
        return { id: entryId };
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao adicionar alimento');
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  /**
   * Sincronizar manualmente
   */
  const syncNow = async () => {
    const status = await manualSync();
    setSyncStatus(status);
    
    if (status.syncing) {
      toast.loading('Sincronizando...');
    } else if (status.error) {
      toast.error(`Erro: ${status.error}`);
    } else {
      toast.success('Sincronização concluída!');
      await mutate();
      await mutateHistory();
    }
  };

  /**
   * Remove alimento do diário
   */
  const deleteEntry = async (entryId: string) => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      const res = await fetch(`/api/nutrition/tracking/entries/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao remover alimento');
      }

      toast.success('Alimento removido');
      await mutate();
      await mutateHistory();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover alimento');
      throw error;
    }
  };

  /**
   * Refresh manual
   */
  const refresh = async () => {
    await Promise.all([mutate(), mutateHistory()]);
  };

  return {
    // Daily data
    dailyTotals: data?.data,
    isLoadingDaily: isLoading,
    errorDaily: error,

    // History data
    history: historyData?.data,
    isLoadingHistory: !historyData && !historyError,
    errorHistory: historyError,

    // Actions
    addFood,
    deleteEntry,
    refresh,
    syncNow,
    isAdding,

    // Utils
    hasData: !!data?.data,
    adherence: data?.data?.adherence || 0,
    isOnline,
    syncStatus
  };
}

