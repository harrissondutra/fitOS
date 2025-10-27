import useSWR from 'swr';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  paymentMethod: string;
  downloadUrl: string;
}

interface PaginatedInvoices {
  items: Invoice[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch invoices');
  }
  const data = await res.json();
  return data.success ? data.data : data;
};

export function useInvoices(page = 1, limit = 10, period?: 'month' | 'quarter' | 'year') {
  const { toast } = useToast();

  // Construir URL com query params
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString()
  });

  if (period) {
    params.append('period', period);
  }

  const { data, error, isLoading, mutate } = useSWR<PaginatedInvoices>(
    `/api/billing/invoices?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minuto
      onError: (error) => {
        console.error('Invoices fetch error:', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar faturas',
          description: error.message
        });
      }
    }
  );

  return {
    invoices: data?.items || [],
    pagination: data ? {
      total: data.total,
      page: data.page,
      limit: data.limit,
      hasMore: data.hasMore
    } : null,
    isLoading,
    error,
    mutate,
    refresh: mutate
  };
}

