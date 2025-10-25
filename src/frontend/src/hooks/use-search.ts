import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseSearchReturn {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  debouncedSearchTerm: string;
  loading: boolean;
  error: string | null;
  search: (term: string) => Promise<any[]>;
  clearSearch: () => void;
}

export function useSearch(
  searchFunction: (term: string) => Promise<any[]>,
  delay: number = 300
): UseSearchReturn {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  const search = useCallback(async (term: string): Promise<any[]> => {
    setLoading(true);
    setError(null);

    try {
      const results = await searchFunction(term);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchFunction]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    loading,
    error,
    search,
    clearSearch,
  };
}














