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
import { useAuth } from './use-auth';

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
  const { user } = useAuth();
  const [view, setViewState] = useState<SidebarView>('standard');
  const [hasMounted, setHasMounted] = useState(false);

  // Marcar como montado no cliente
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Carregar preferência salva do localStorage apenas no cliente
  useEffect(() => {
    if (!hasMounted) return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'standard' || saved === 'admin')) {
        setViewState(saved as SidebarView);
      }
    } catch (error) {
      console.warn('Erro ao carregar preferência da sidebar:', error);
    }
  }, [hasMounted]);

  // Função para definir nova visão
  const setView = useCallback((newView: SidebarView) => {
    setViewState(newView);
    try {
      localStorage.setItem(STORAGE_KEY, newView);
    } catch (error) {
      console.warn('Erro ao salvar preferência da sidebar:', error);
    }
  }, []);

  // Função para obter URL do dashboard baseado na role e visão - MOVIDO PARA CIMA para ser usado no toggleView
  const getDashboardUrl = useCallback((role: UserRole, targetView?: SidebarView): string => {
    const currentView = targetView || view;

    switch (role) {
      case 'SUPER_ADMIN':
        return currentView === 'admin'
          ? '/super-admin/dashboard'
          : '/dashboard';
      case 'OWNER':
      case 'ADMIN':
        return currentView === 'admin'
          ? '/admin/dashboard'
          : '/dashboard';
      case 'TRAINER':
        return currentView === 'admin'
          ? '/trainer/analytics'
          : '/dashboard';
      case 'CLIENT':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  }, [view]);

  // Função para alternar entre visões
  const toggleView = useCallback(() => {
    const newView = view === 'standard' ? 'admin' : 'standard';
    setView(newView);

    // Navegar para o dashboard correto
    const role = (user?.role as UserRole) || 'CLIENT';
    const destination = getDashboardUrl(role, newView);

    router.push(destination);
  }, [view, setView, router, user, getDashboardUrl]);

  return {
    view,
    setView,
    toggleView,
    isAdminView: view === 'admin',
    isStandardView: view === 'standard',
    getDashboardUrl,
  };
}
