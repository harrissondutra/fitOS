import { useState, useEffect } from 'react';

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

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/super-admin/tenants', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Usuário não autenticado. Faça login para continuar.');
        } else if (response.status === 403) {
          throw new Error('Acesso negado. Apenas super administradores podem acessar esta funcionalidade.');
        } else {
          throw new Error(`Erro ao buscar empresas: ${response.status}`);
        }
      }

      const data = await response.json();
      setCompanies(data.data?.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies
  };
}
