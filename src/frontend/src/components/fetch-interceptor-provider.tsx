'use client';

/**
 * Fetch Interceptor Provider
 * 
 * Componente que inicializa o interceptor global de fetch
 * para detectar tokens expirados e redirecionar automaticamente
 */

import { useEffect } from 'react';

// Importar o interceptor (executa imediatamente ao importar)
import '../lib/fetch-interceptor';

export function FetchInterceptorProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // O interceptor já é executado ao importar o módulo
    // Este useEffect apenas garante que está ativo
    console.debug('Fetch interceptor initialized');
  }, []);

  return <>{children}</>;
}

