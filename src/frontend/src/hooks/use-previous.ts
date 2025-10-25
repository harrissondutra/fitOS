import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UsePreviousReturn<T> {
  previousValue: T | undefined;
  currentValue: T;
}

export function usePrevious<T>(value: T): UsePreviousReturn<T> {
  const [previousValue, setPreviousValue] = useState<T | undefined>(undefined);
  const [currentValue, setCurrentValue] = useState<T>(value);

  useEffect(() => {
    setPreviousValue(currentValue);
    setCurrentValue(value);
  }, [value, currentValue]);

  return {
    previousValue,
    currentValue,
  };
}














