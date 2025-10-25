/**
 * Hook para obter dados do usuário atual
 * 
 * Este hook obtém dados atualizados do usuário do servidor
 * e mantém o estado sincronizado com o contexto de autenticação
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/auth-context';
import { User } from '../../../shared/types/auth.types';

interface UseCurrentUserReturn {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useCurrentUser(): UseCurrentUserReturn {
  const { user: contextUser, fetchMe, isAuthenticated } = useAuth();
  const [user, setUser] = useState<User | null>(contextUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) {
      setUser(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userData = await fetchMe();
      if (userData) {
        setUser(userData);
        console.log('🔍 useCurrentUser - Dados atualizados:', userData);
      } else {
        setError('Falha ao obter dados do usuário');
      }
    } catch (err) {
      console.error('Erro ao obter dados do usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  }, [fetchMe, isAuthenticated]);

  // Sincronizar com o contexto de autenticação
  useEffect(() => {
    setUser(contextUser);
  }, [contextUser]);

  // Obter dados atualizados quando o componente montar
  useEffect(() => {
    if (isAuthenticated && !user) {
      refetch();
    }
  }, [isAuthenticated, user, refetch]); // Incluído refetch

  return {
    user,
    isLoading,
    error,
    refetch,
  };
}
