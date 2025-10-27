import useSWR from 'swr';
import { useToast } from '@/hooks/use-toast';

interface Subscription {
  id: string;
  status: 'active' | 'pending' | 'canceled' | 'past_due';
  planId: string;
  planName: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    users: number;
    usersLimit: number;
    clients: number;
    clientsLimit: number;
    storageGB: number;
    storageLimitGB: number;
  };
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch subscription');
  }
  const data = await res.json();
  return data.success ? data.data : data;
};

export function useSubscription() {
  const { toast } = useToast();

  const { data, error, isLoading, mutate } = useSWR<Subscription>(
    '/api/billing/subscription',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minuto
      onError: (error) => {
        console.error('Subscription fetch error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar assinatura',
          description: error.message
        });
      }
    }
  );

  return {
    subscription: data,
    isLoading,
    error,
    mutate,
    refresh: mutate
  };
}

