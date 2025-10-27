/**
 * Frontend Route Protection Middleware - FitOS Sprint 4
 * 
 * Middleware para proteger rotas do frontend baseado em roles de usuário
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/shared/types/auth.types';

// Configuração de rotas protegidas
const PROTECTED_ROUTES = {
  // Rotas de nutricionista (apenas profissionais)
  '/nutritionist': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'],
  
  // Rotas de cliente nutricional (todos os usuários autenticados)
  '/nutrition-client': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST', 'CLIENT'],
  
  // Rotas de CRM (apenas profissionais)
  '/professional/crm': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'],
  
  // Rotas de WhatsApp (apenas profissionais)
  '/professional/whatsapp': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'NUTRITIONIST'],
  
  // Rotas de Marketing (apenas OWNER/ADMIN)
  '/professional/marketing': ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  
  // Rotas de admin (apenas SUPER_ADMIN, OWNER, ADMIN)
  '/admin': ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
} as const;

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/contact',
  '/pricing',
  '/features',
] as const;

// Rotas de autenticação
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
] as const;

export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'));
}

export function getRequiredRoles(pathname: string): UserRole[] | null {
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles as UserRole[];
    }
  }
  return null;
}

export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

export function getRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'OWNER':
    case 'ADMIN':
      return '/admin/dashboard';
    case 'NUTRITIONIST':
      return '/nutritionist/dashboard';
    case 'TRAINER':
      return '/trainer/dashboard';
    case 'CLIENT':
      return '/nutrition-client/dashboard';
    default:
      return '/dashboard';
  }
}

/**
 * Middleware principal de proteção de rotas
 */
export function routeProtectionMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Se for rota pública, permite acesso
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Se for rota de autenticação, permite acesso
  if (isAuthRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Para rotas protegidas, verificar autenticação e permissões
  const requiredRoles = getRequiredRoles(pathname);
  
  if (requiredRoles) {
    // TODO: Implementar verificação de token JWT
    // Por enquanto, retorna next() - implementação completa requer integração com auth
    return NextResponse.next();
  }
  
  // Rota não encontrada nas configurações, permite acesso
  return NextResponse.next();
}

/**
 * Hook para verificar permissões de rota no cliente
 */
export function useRoutePermissions() {
  const checkPermission = (pathname: string, userRole: UserRole): boolean => {
    const requiredRoles = getRequiredRoles(pathname);
    
    if (!requiredRoles) {
      return true; // Rota não protegida
    }
    
    return hasRequiredRole(userRole, requiredRoles);
  };
  
  const getAccessibleRoutes = (userRole: UserRole): string[] => {
    const accessibleRoutes: string[] = [];
    
    for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
      if (hasRequiredRole(userRole, roles as UserRole[])) {
        accessibleRoutes.push(route);
      }
    }
    
    return accessibleRoutes;
  };
  
  return {
    checkPermission,
    getAccessibleRoutes,
    getRequiredRoles,
    hasRequiredRole,
    getRedirectPath
  };
}

