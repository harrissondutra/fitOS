/**
 * Hook para obter dados do usuário atual
 * 
 * Este hook obtém dados atualizados do usuário do servidor
 * e mantém o estado sincronizado com o contexto de autenticação
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
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

  // Sincronizar com o contexto de autenticação - usar useRef para evitar loops
  const prevContextUserRef = React.useRef<User | null>(null);
  
  useEffect(() => {
    // Apenas atualizar se contextUser realmente mudou
    if (contextUser !== prevContextUserRef.current) {
      prevContextUserRef.current = contextUser;
      setUser(contextUser);
    }
  }, [contextUser]);

  // Obter dados atualizados quando o componente montar - remover refetch das dependências
  const hasFetchedRef = React.useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && !user && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refetch();
    }
    // Reset flag se desautenticado
    if (!isAuthenticated) {
      hasFetchedRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user]); // refetch é estável (useCallback)

  return {
    user,
    isLoading,
    error,
    refetch,
  };
}
