import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseCacheReturn {
  get: <T>(key: string) => T | null;
  set: <T>(key: string, value: T, ttl?: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
  keys: () => string[];
}

export function useCache(): UseCacheReturn {
  const [cache, setCache] = useState<Map<string, { value: any; expires: number }>>(new Map());

  const get = useCallback(<T>(key: string): T | null => {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return null;
    }

    return item.value;
  }, [cache]);

  const set = useCallback(<T>(key: string, value: T, ttl: number = 300000): void => {
    const expires = Date.now() + ttl;
    setCache(prev => new Map(prev).set(key, { value, expires }));
  }, []);

  const remove = useCallback((key: string): void => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  }, []);

  const clear = useCallback((): void => {
    setCache(new Map());
  }, []);

  const has = useCallback((key: string): boolean => {
    const item = cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expires) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      return false;
    }

    return true;
  }, [cache]);

  const keys = useCallback((): string[] => {
    return Array.from(cache.keys());
  }, [cache]);

  // Clean up expired items periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCache(prev => {
        const newCache = new Map();
        const now = Date.now();
        
        for (const [key, item] of prev) {
          if (now <= item.expires) {
            newCache.set(key, item);
          }
        }
        
        return newCache;
      });
    }, 60000); // Clean up every minute

    return () => clearInterval(interval);
  }, []);

  return {
    get,
    set,
    remove,
    clear,
    has,
    keys,
  };
}














