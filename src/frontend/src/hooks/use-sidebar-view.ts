/**
 * Hook para Gerenciar Visão da Sidebar - FitOS
 * 
 * Gerencia o estado da visão da sidebar (padrão vs administrativa)
 * com persistência em localStorage e redirecionamento automático
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarView, UserRole } from '../../../shared/types/auth.types';

interface UseSidebarViewReturn {
  view: SidebarView;
  setView: (view: SidebarView) => void;
  toggleView: () => void;
  isAdminView: boolean;
  isStandardView: boolean;
  getDashboardUrl: (role: UserRole, view?: SidebarView) => string;
}

const STORAGE_KEY = 'sidebar_view_preference';

export function useSidebarView(): UseSidebarViewReturn {
  const router = useRouter();
  const [view, setViewState] = useState<SidebarView>('standard');

  // Carregar preferência salva do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'standard' || saved === 'admin')) {
        setViewState(saved as SidebarView);
      }
    } catch (error) {
      console.warn('Erro ao carregar preferência da sidebar:', error);
    }
  }, []);

  // Função para definir nova visão
  const setView = useCallback((newView: SidebarView) => {
    setViewState(newView);
    try {
      localStorage.setItem(STORAGE_KEY, newView);
    } catch (error) {
      console.warn('Erro ao salvar preferência da sidebar:', error);
    }
  }, []);

  // Função para alternar entre visões
  const toggleView = useCallback(() => {
    const newView = view === 'standard' ? 'admin' : 'standard';
    setView(newView);
    
    // Forçar refresh da página para atualizar todos os componentes
    setTimeout(() => {
      router.refresh();
      // Forçar re-render adicional para garantir que todos os componentes se atualizem
      window.location.reload();
    }, 100);
  }, [view, setView, router]);

  // Função para obter URL do dashboard baseado na role e visão
  const getDashboardUrl = useCallback((role: UserRole, targetView?: SidebarView): string => {
    const currentView = targetView || view;
    
    switch (role) {
      case 'SUPER_ADMIN':
        return currentView === 'admin' 
          ? '/super-admin/dashboard' 
          : '/super-admin/dashboard';
      case 'OWNER':
      case 'ADMIN':
        return currentView === 'admin' 
          ? '/admin/dashboard' 
          : '/admin/dashboard';
      case 'TRAINER':
        return currentView === 'admin' 
          ? '/trainer/analytics' 
          : '/trainer/dashboard';
      case 'CLIENT':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  }, [view]);

  return {
    view,
    setView,
    toggleView,
    isAdminView: view === 'admin',
    isStandardView: view === 'standard',
    getDashboardUrl,
  };
}
