import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseLocalStorageReturn {
  getItem: <T>(key: string, defaultValue?: T) => T | null;
  setItem: <T>(key: string, value: T) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  hasItem: (key: string) => boolean;
  keys: () => string[];
}

export function useLocalStorage(): UseLocalStorageReturn {
  const getItem = useCallback(<T>(key: string, defaultValue?: T): T | null => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return defaultValue || null;
    }
  }, []);

  const setItem = useCallback(<T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, []);

  const removeItem = useCallback((key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, []);

  const clear = useCallback((): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, []);

  const hasItem = useCallback((key: string): boolean => {
    return localStorage.getItem(key) !== null;
  }, []);

  const keys = useCallback((): string[] => {
    return Object.keys(localStorage);
  }, []);

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    hasItem,
    keys,
  };
}














