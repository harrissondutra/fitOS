/**
 * Hooks de Autenticação - FitOS
 * 
 * Hooks personalizados para facilitar o uso do contexto de autenticação
 * Inclui hooks para diferentes cenários de uso
 */

"use client";

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth as useAuthContext, useRequireAuth as useRequireAuthContext } from '../contexts/auth-context';
import { User, UserRole } from '../../../shared/types/auth.types';

// ============================================================================
// HOOKS BÁSICOS
// ============================================================================

/**
 * Hook principal de autenticação
 * Retorna todos os dados e funções do contexto de autenticação
 */
export const useAuth = useAuthContext;
export const useRequireAuth = useRequireAuthContext;

// ============================================================================
// HOOKS ESPECIALIZADOS
// ============================================================================

/**
 * Hook para verificar se o usuário tem uma role específica
 */
export function useHasRole(roles: UserRole | UserRole[]): boolean {
  const { hasRole } = useAuthContext();
  const roleArray = Array.isArray(roles) ? roles : [roles];
  return hasRole(roleArray);
}

/**
 * Hook para verificar se o usuário pode acessar uma funcionalidade
 */
export function useCanAccess(requiredRoles: UserRole[]): boolean {
  const { canAccess } = useAuthContext();
  return canAccess(requiredRoles);
}

/**
 * Hook para obter dados do usuário atual
 */
export function useCurrentUser(): User | null {
  const { user } = useAuthContext();
  return user;
}

/**
 * Hook para verificar se o usuário está autenticado
 */
export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuthContext();
  return isAuthenticated;
}

/**
 * Hook para verificar se a autenticação está carregando
 */
export function useIsAuthLoading(): boolean {
  const { isLoading } = useAuthContext();
  return isLoading;
}

// ============================================================================
// HOOKS DE REDIRECIONAMENTO
// ============================================================================

/**
 * Hook para redirecionar usuários não autenticados
 */
export function useRequireLogin(redirectTo?: string) {
  const { isAuthenticated, isLoading, isInitialized } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && !isAuthenticated) {
      router.push(redirectTo || '/auth/login');
    }
  }, [isAuthenticated, isLoading, isInitialized, router, redirectTo]);

  return { isAuthenticated, isLoading };
}

/**
 * Hook para redirecionar usuários autenticados
 */
export function useRedirectIfAuthenticated(redirectTo?: string) {
  const { isAuthenticated, isLoading, isInitialized, getRedirectPath } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated) {
      const redirectPath = redirectTo || getRedirectPath();
      console.log('🔀 Redirecionando usuário autenticado para:', redirectPath);
      router.push(redirectPath);
    }
  }, [isAuthenticated, isLoading, isInitialized, router, redirectTo, getRedirectPath]); // Incluído getRedirectPath

  return { isAuthenticated, isLoading };
}

/**
 * Hook para redirecionar baseado em role
 */
export function useRequireRole(requiredRoles: UserRole[], redirectTo?: string) {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && isAuthenticated && user) {
      const hasRequiredRole = requiredRoles.includes(user.role as UserRole);
      if (!hasRequiredRole) {
        router.push(redirectTo || '/unauthorized');
      }
    }
  }, [user, isAuthenticated, isLoading, isInitialized, requiredRoles, router, redirectTo]);

  return { 
    hasRequiredRole: user ? requiredRoles.includes(user.role as UserRole) : false,
    isLoading 
  };
}

// ============================================================================
// HOOKS DE AÇÕES
// ============================================================================

/**
 * Hook para logout com callback
 */
export function useLogout(onLogout?: () => void) {
  const { logout } = useAuthContext();

  const handleLogout = useCallback(async () => {
    await logout();
    onLogout?.();
  }, [logout, onLogout]);

  return handleLogout;
}

/**
 * Hook para atualizar dados do usuário
 */
export function useUpdateUser() {
  const { updateUser } = useAuthContext();

  const handleUpdateUser = useCallback((userData: Partial<User>) => {
    updateUser(userData);
  }, [updateUser]);

  return handleUpdateUser;
}

// ============================================================================
// HOOKS DE PERMISSÕES
// ============================================================================

/**
 * Hook para verificar se o usuário é super admin
 */
export function useIsSuperAdmin(): boolean {
  return useHasRole('SUPER_ADMIN');
}

/**
 * Hook para verificar se o usuário é admin ou superior
 */
export function useIsAdminOrAbove(): boolean {
  return useHasRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']);
}

/**
 * Hook para verificar se o usuário é trainer ou superior
 */
export function useIsTrainerOrAbove(): boolean {
  return useHasRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER']);
}

/**
 * Hook para verificar se o usuário é cliente
 */
export function useIsClient(): boolean {
  return useHasRole('CLIENT');
}

// ============================================================================
// HOOKS DE DASHBOARD
// ============================================================================

/**
 * Hook para obter o caminho do dashboard baseado na role
 */
export function useDashboardPath(): string {
  const { user, getRedirectPath } = useAuthContext();
  
  if (!user) return '/auth/login';
  return getRedirectPath();
}

/**
 * Hook para verificar se o usuário pode acessar um dashboard específico
 */
export function useCanAccessDashboard(dashboard: 'super-admin' | 'admin' | 'trainer' | 'member'): boolean {
  const { user } = useAuthContext();
  
  if (!user) return false;
  
  switch (dashboard) {
    case 'super-admin':
      return user.role === 'SUPER_ADMIN';
    case 'admin':
      return ['SUPER_ADMIN', 'OWNER', 'ADMIN'].includes(user.role);
    case 'trainer':
      return ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'].includes(user.role);
    case 'member':
      return true; // Todos os usuários podem acessar o dashboard de membro
    default:
      return false;
  }
}

// ============================================================================
// HOOKS DE SESSÃO
// ============================================================================

/**
 * Hook para verificar se a sessão está ativa
 */
export function useSessionStatus() {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  
  return {
    isActive: isAuthenticated && !!user,
    isLoading,
    user,
    lastLogin: user?.lastLogin
  };
}

/**
 * Hook para monitorar atividade do usuário
 */
export function useActivityMonitor() {
  const { isAuthenticated } = useAuthContext();
  
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleActivity = () => {
      // A atividade é automaticamente rastreada pelo AuthProvider
      // Este hook pode ser usado para lógica adicional se necessário
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated]);
}

// ============================================================================
// HOOKS DE UTILIDADE
// ============================================================================

/**
 * Hook para obter informações do tenant atual
 */
export function useCurrentTenant() {
  const { user } = useAuthContext();
  
  return {
    tenantId: user?.tenantId,
    isSystemTenant: user?.tenantId === 'sistema',
    isDefaultTenant: user?.tenantId === 'default-tenant'
  };
}

/**
 * Hook para obter avatar do usuário
 */
export function useUserAvatar() {
  const { user } = useAuthContext();
  
  return {
    avatar: user?.image || '/avatars/default.svg',
    initials: user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() : '',
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.email
  };
}

/**
 * Hook para obter configurações do usuário
 */
export function useUserSettings() {
  const { user } = useAuthContext();
  
  return {
    profile: user?.profile || {},
    preferences: user?.profile?.preferences || {},
    theme: user?.profile?.preferences?.theme || 'light',
    language: user?.profile?.preferences?.language || 'pt-BR',
    notifications: user?.profile?.preferences?.notifications ?? true
  };
}
