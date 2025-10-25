import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserRole } from '../../../shared/types';

interface UseClickOutsideReturn {
  ref: React.RefObject<HTMLElement>;
  isOutside: boolean;
  setIsOutside: (value: boolean) => void;
}

export function useClickOutside(callback: () => void): UseClickOutsideReturn {
  const [isOutside, setIsOutside] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOutside(true);
        callback();
      } else {
        setIsOutside(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return {
    ref,
    isOutside,
    setIsOutside,
  };
}