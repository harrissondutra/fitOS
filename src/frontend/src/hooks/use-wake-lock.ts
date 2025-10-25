// Hook para gerenciar Screen Wake Lock API
'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  isReleased: boolean;
  error: string | null;
}

export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: false,
    isActive: false,
    isReleased: false,
    error: null,
  });

  const [wakeLock, setWakeLock] = useState<any | null>(null);

  // Verificar suporte
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 'wakeLock' in navigator;
    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Solicitar wake lock
  const requestWakeLock = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Screen Wake Lock não é suportado neste navegador',
      }));
      return false;
    }

    try {
      const wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
      
      setWakeLock(wakeLockSentinel);
      setState(prev => ({
        ...prev,
        isActive: true,
        isReleased: false,
        error: null,
      }));

      // Listener para quando o wake lock é liberado
      wakeLockSentinel.addEventListener('release', () => {
        setState(prev => ({
          ...prev,
          isActive: false,
          isReleased: true,
        }));
        setWakeLock(null);
      });

      return true;
    } catch (error) {
      console.error('[Wake Lock] Error requesting wake lock:', error);
      setState(prev => ({
        ...prev,
        error: `Erro ao solicitar wake lock: ${error instanceof Error ? error.message : String(error)}`,
      }));
      return false;
    }
  }, [state.isSupported]);

  // Liberar wake lock
  const releaseWakeLock = useCallback(async (): Promise<boolean> => {
    if (!wakeLock) {
      setState(prev => ({
        ...prev,
        error: 'Nenhum wake lock ativo para liberar',
      }));
      return false;
    }

    try {
      await wakeLock.release();
      setWakeLock(null);
      setState(prev => ({
        ...prev,
        isActive: false,
        isReleased: true,
        error: null,
      }));
      return true;
    } catch (error) {
      console.error('[Wake Lock] Error releasing wake lock:', error);
      setState(prev => ({
        ...prev,
        error: `Erro ao liberar wake lock: ${error instanceof Error ? error.message : String(error)}`,
      }));
      return false;
    }
  }, [wakeLock]);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Liberar wake lock quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (wakeLock) {
        wakeLock.release().catch(console.error);
      }
    };
  }, [wakeLock]);

  // Liberar wake lock quando a página for ocultada
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && wakeLock) {
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [wakeLock, releaseWakeLock]);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
    clearError,
  };
}
