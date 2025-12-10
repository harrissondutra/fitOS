'use client';

/**
 * AdWrapper - Componente wrapper que verifica se o tenant tem anúncios habilitados                                                                             
 * Renderiza anúncios apenas se o plano do tenant permitir
 */

import React, { useEffect, useState } from 'react';
import { useAdvertisements } from '@/hooks/useAdvertisements';
import { useAuth } from '@/hooks/use-auth';
import { AdContainer } from './AdContainer';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface AdWrapperProps {
  position: string;
  className?: string;
  limit?: number;
  enabled?: boolean;
  fallback?: React.ReactNode;
}

interface TenantPlanInfo {
  plan: string;
  adsEnabled: boolean;
  tenantType?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function AdWrapper({
  position,
  className,
  limit = 1,
  enabled = true,
  fallback,
}: AdWrapperProps) {
  const [planInfo, setPlanInfo] = useState<TenantPlanInfo | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [errorPlan, setErrorPlan] = useState<Error | null>(null);

  const { user } = useAuth();

  // Verificar se o tenant tem anúncios habilitados
  useEffect(() => {
    const fetchTenantPlan = async () => {
      // Se não houver usuário/tenant, não buscar (ou assumir padrão sem anúncios)
      const tenantId = user?.tenantId || localStorage.getItem('tenantId');

      if (!tenantId || tenantId === 'default') {
        setPlanInfo({ plan: 'unknown', adsEnabled: false });
        setIsLoadingPlan(false);
        return;
      }

      setIsLoadingPlan(true);
      setErrorPlan(null);

      try {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_URL}/tenants/public/${tenantId}/plan-info`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });

        if (!response.ok) {
          // Se for 404, apenas assumir que não tem anúncios, sem erro no console
          if (response.status === 404) {
            setPlanInfo({ plan: 'unknown', adsEnabled: false });
            return;
          }
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch tenant plan info');
        }

        const data: { success: boolean; data: TenantPlanInfo } = await response.json();

        if (data.success) {
          setPlanInfo(data.data);
        } else {
          throw new Error('Failed to fetch tenant plan info');
        }
      } catch (error) {
        console.warn('Warning fetching tenant plan info:', error);
        // Não setar erro crítico para não quebrar a UI, apenas desabilitar anúncios
        setPlanInfo({ plan: 'unknown', adsEnabled: false });
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchTenantPlan();
  }, [user?.tenantId]);

  const shouldFetchAds = enabled && !isLoadingPlan && planInfo?.adsEnabled;

  const { ads, isLoading, isError } = useAdvertisements({
    position,
    limit,
    enabled: shouldFetchAds || false,
  });

  // Se estiver carregando informações do plano, mostrar skeleton
  if (isLoadingPlan) {
    return fallback || <Skeleton className={cn('h-24 w-full', className)} />;
  }

  // Se houver erro ao buscar informações do plano, não renderizar anúncios
  if (errorPlan) {
    console.error('Error in AdWrapper fetching plan info:', errorPlan);
    return null;
  }

  // Se o tenant não tiver anúncios habilitados, não renderizar nada
  if (!planInfo?.adsEnabled) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return fallback || <Skeleton className={cn('h-24 w-full', className)} />;
  }

  // Error state - não mostrar nada ou fallback
  if (isError || !ads || ads.length === 0) {
    return null;
  }

  // Renderizar anúncios
  return (
    <div className={cn('ad-wrapper', className)}>
      {ads.map((ad) => (
        <AdContainer key={ad.id} ad={ad} className="mb-4" />
      ))}
    </div>
  );
}
