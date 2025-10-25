import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { authenticatedApiRequest, API_ENDPOINTS } from '@/lib/api-url';

interface Company {
  id: string;
  name: string;
  subdomain?: string;
  plan: string;
  status: string;
  tenantType: 'individual' | 'business';
  _count: {
    users: number;
    members: number;
  };
}

interface UseCompaniesReturn {
  companies: Company[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCompanies(): UseCompaniesReturn {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchCompanies = useCallback(async () => {
    // Debounce: evitar chamadas muito frequentes (máximo 1 por segundo)
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;
    
    try {
      setLoading(true);
      setError(null);
      
      const accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        throw new Error('Token de acesso não encontrado. Faça login novamente.');
      }

      const response = await authenticatedApiRequest(API_ENDPOINTS.SUPER_ADMIN.TENANTS);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Usuário não autenticado. Faça login para continuar.');
        } else if (response.status === 403) {
          throw new Error('Acesso negado. Apenas super administradores podem acessar esta funcionalidade.');
        } else if (response.status === 500) {
          try {
            const errorData = await response.json();
            throw new Error(`Erro interno do servidor: ${errorData.error?.message || 'Erro desconhecido'}`);
          } catch {
            throw new Error('Erro interno do servidor. Verifique se o backend está rodando.');
          }
        } else {
          throw new Error(`Erro ao buscar empresas: ${response.status}`);
        }
      }

      const data = await response.json();
      const companies = data.data?.tenants || [];
      
      setCompanies(companies);
    } catch (err) {
      console.error('useCompanies: Error:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies needed since we use ref

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]); // Incluído fetchCompanies

  // Memoizar o retorno para evitar re-renderizações desnecessárias
  return useMemo(() => ({
    companies,
    loading,
    error,
    refetch: fetchCompanies
  }), [companies, loading, error, fetchCompanies]); // Incluído fetchCompanies
}
