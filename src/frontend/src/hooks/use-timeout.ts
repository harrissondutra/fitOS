import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseTimeoutReturn {
  isActive: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useTimeout(callback: () => void, delay: number | null): UseTimeoutReturn {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive && delay !== null) {
      const timeout = setTimeout(callback, delay);
      return () => clearTimeout(timeout);
    }
  }, [isActive, delay, callback]);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    start,
    stop,
    reset,
  };
}














