import useSWR from 'swr';
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

  const { data, error, isLoading } = useSWR<Plan[]>(
    '/api/plans',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutos - planos mudam raramente
      onError: (error) => {
        console.error('Plans fetch error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar planos',
          description: error.message
        });
      }
    }
  );

  return {
    plans: data || [],
    isLoading,
    error
  };
}

