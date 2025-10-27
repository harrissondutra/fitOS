import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UseResponsiveReturn {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function useResponsive(): UseResponsiveReturn {
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [screenHeight, setScreenHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);

  const updateScreenSize = useCallback(() => {
    setScreenWidth(window.innerWidth);
    setScreenHeight(window.innerHeight);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateScreenSize);
      return () => window.removeEventListener('resize', updateScreenSize);
    }
  }, [updateScreenSize]);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  const getBreakpoint = useCallback((): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' => {
    if (screenWidth < 640) return 'xs';
    if (screenWidth < 768) return 'sm';
    if (screenWidth < 1024) return 'md';
    if (screenWidth < 1280) return 'lg';
    if (screenWidth < 1536) return 'xl';
    return '2xl';
  }, [screenWidth]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    breakpoint: getBreakpoint(),
  };
}

















