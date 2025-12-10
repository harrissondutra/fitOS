'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  limits: {
    users: number;
    clients: number;
    storageGB: number;
    apiCalls: number;
  };
  highlight?: boolean; // Para destacar plano "Mais Popular"
  stripePriceId?: string;
  mercadopagoPlanId?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch plans');
  }
  const data = await res.json();
  return data.success ? data.data : data;
};

export function usePlans() {
  const { toast } = useToast();

  // Use native fetch para buscar planos
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const data = await fetcher('/api/plans');
        setPlans(data);
      } catch (err) {
        setError(err as Error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar planos',
          description: (err as Error).message
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  return {
    plans,
    isLoading,
    error
  };
}

