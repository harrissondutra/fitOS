'use client';

import * as React from 'react';
import useSWR from 'swr';
import { SidebarMenuItem } from '@/shared/types/sidebar.types';
import api from '@/lib/api';

const fetcher = async (url: string) => {
  const tenantId = localStorage.getItem('tenantId') || process.env.NEXT_PUBLIC_TENANT_ID;
  const cacheKey = `sidebar_cache_${tenantId || 'global'}`;

  try {
    const res = await api.get(url, {
      headers: {
        ...(tenantId && { 'X-Tenant-Id': String(tenantId) })
      }
    });

    if (res.data?.success) {
      // Cachear por 5 min
      localStorage.setItem(cacheKey, JSON.stringify(res.data.data));
      return res.data.data as SidebarMenuItem[];
    }

    // Tentar cache em caso de falha
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw new Error(res.data?.error || 'Failed to fetch sidebar config');
  } catch (err) {
    // Timeout/Erro de rede → usar cache se existir
    const cached = localStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
    throw err;
  }
};

export function useSidebarConfig() {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || '') : '';
  const errorRef = React.useRef(false);

  // Só requisita quando já existir token → evita 401 logo após login
  // Usar errorRef para evitar múltiplas tentativas em caso de erro persistente
  const { data, error, isLoading, mutate } = useSWR<SidebarMenuItem[]>(
    token ? `/api/sidebar/config` : null,
    async (url: string) => {
      // Se já teve erro antes, não tentar novamente
      if (errorRef.current) {
        const cacheKey = `sidebar_cache_${localStorage.getItem('tenantId') || 'global'}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) return JSON.parse(cached);
        throw new Error('Sidebar config failed previously');
      }
      return fetcher(url);
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateOnMount: false, // Não revalidar ao montar
      dedupingInterval: 300000, // 5 minutos - evita requests duplicadas
      shouldRetryOnError: false,
      onError: () => {
        // Marcar que houve erro para evitar loops
        errorRef.current = true;
      },
      onSuccess: () => {
        // Resetar flag se bem-sucedido
        errorRef.current = false;
      }
    }
  );

  return {
    menuItems: data || [],
    isLoading,
    isError: error,
    refresh: mutate,
  };
}


