import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseIntervalReturn {
  isActive: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useInterval(callback: () => void, delay: number | null): UseIntervalReturn {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (isActive && delay !== null) {
      const interval = setInterval(callback, delay);
      return () => clearInterval(interval);
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

















