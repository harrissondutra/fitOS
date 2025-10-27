import useSWR from 'swr';
import { useToast } from '@/hooks/use-toast';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix' | 'boleto';
  provider: 'stripe' | 'mercadopago';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch payment methods');
  }
  const data = await res.json();
  return data.success ? data.data : data;
};

export function usePaymentMethods() {
  const { toast } = useToast();

  const { data, error, isLoading, mutate } = useSWR<PaymentMethod[]>(
    '/api/billing/payment-methods',
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      onError: (error) => {
        console.error('Payment methods fetch error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar formas de pagamento',
          description: error.message
        });
      }
    }
  );

  return {
    paymentMethods: data || [],
    isLoading,
    error,
    mutate,
    refresh: mutate
  };
}

