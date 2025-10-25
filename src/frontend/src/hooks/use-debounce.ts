import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseDebounceReturn {
  debouncedValue: any;
  setValue: (value: any) => void;
  clear: () => void;
}

export function useDebounce(value: any, delay: number): UseDebounceReturn {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  const setValue = useCallback((newValue: any) => {
    setDebouncedValue(newValue);
  }, []);

  const clear = useCallback(() => {
    setDebouncedValue(undefined);
  }, []);

  return {
    debouncedValue,
    setValue,
    clear,
  };
}














