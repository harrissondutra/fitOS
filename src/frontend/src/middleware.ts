/**
 * Middleware Next.js para Proteção de Rotas - FitOS
 * 
 * Middleware para proteger rotas baseado em autenticação e roles
 * Redireciona usuários não autenticados e verifica permissões
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRole, DEFAULT_ROLE_REDIRECTS } from './types/auth-middleware';

// ============================================================================
// CONFIGURAÇÕES DE ROTAS
// ============================================================================

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
  '/',
  '/demo',
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/api/health',
  '/_next',
  '/favicon.ico',
  '/manifest.json',
  '/sw.js',
  '/offline.html',
  '/robots.txt',
  '/sitemap.xml',
  // PWA assets
  '/icons/',
  '/screenshots/'
];

// Rotas de autenticação (redirecionam se já autenticado)
const AUTH_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password'
];

// Rotas protegidas por role
const ROLE_PROTECTED_ROUTES: Record<string, UserRole[]> = {
  // Rotas do SUPER_ADMIN (acesso total)
  '/super-admin': ['SUPER_ADMIN'],
  '/empresas': ['SUPER_ADMIN'],
  '/users': ['SUPER_ADMIN'],
  '/clients': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'],
  '/exercises': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'],
  '/workouts': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'],
  '/plans': ['SUPER_ADMIN'],
  '/custom-plans': ['SUPER_ADMIN'],
  '/ai-agents': ['SUPER_ADMIN'],
  '/marketplace': ['SUPER_ADMIN'],
  '/wearables': ['SUPER_ADMIN'],
  '/analytics': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'],
  
  // Rotas do ADMIN (incluindo SUPER_ADMIN)
  '/admin': ['SUPER_ADMIN', 'OWNER', 'ADMIN'],
  
  // Rotas do TRAINER (incluindo SUPER_ADMIN)
  '/trainer': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER'],
  
  // Rotas do CLIENT (todos podem acessar)
  '/dashboard': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'CLIENT'],
  '/client': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'TRAINER', 'CLIENT']
};

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Verifica se uma rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  });
}

/**
 * Verifica se uma rota é de autenticação
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Obtém a role necessária para uma rota
 */
function getRequiredRole(pathname: string): UserRole[] | null {
  for (const [route, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      return roles;
    }
  }
  return null;
}

/**
 * Verifica se o usuário tem a role necessária
 */
function hasRequiredRole(userRole: string, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole as UserRole);
}

/**
 * Obtém o caminho de redirecionamento baseado na role
 */
function getRedirectPathByRole(role: string): string {
  return DEFAULT_ROLE_REDIRECTS[role as keyof typeof DEFAULT_ROLE_REDIRECTS] || '/dashboard';
}

/**
 * Verifica se o token JWT é válido
 */
function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    const isValid = payload.exp > now;
    console.log('🔍 Middleware - Verificando token:', {
      exp: payload.exp,
      now: now,
      isValid: isValid,
      expiresIn: payload.exp - now
    });
    return isValid;
  } catch (error) {
    console.log('❌ Middleware - Erro ao verificar token:', error);
    return false;
  }
}

/**
 * Obtém dados do usuário do token
 */
function getUserFromToken(token: string): { role: string; tenantId: string } | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      role: payload.role,
      tenantId: payload.tenantId
    };
  } catch {
    return null;
  }
}

// ============================================================================
// MIDDLEWARE PRINCIPAL
// ============================================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  console.log('🔍 Middleware - Rota:', pathname);
  
  // Permitir rotas públicas (otimização: verificação rápida)
  if (isPublicRoute(pathname)) {
    console.log('✅ Middleware - Rota pública, permitindo acesso');
    return NextResponse.next();
  }

  // Obter token de autenticação (otimização: verificação única)
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  console.log('🔑 Middleware - Token encontrado:', token ? `${token.substring(0, 20)}...` : 'Nenhum');

  // Verificar se está em rota de autenticação
  if (isAuthRoute(pathname)) {
    console.log('🔐 Middleware - Rota de autenticação');
    // Se tem token válido, redirecionar para dashboard
    if (token && isTokenValid(token)) {
      const userData = getUserFromToken(token);
      if (userData) {
        const redirectPath = getRedirectPathByRole(userData.role);
        console.log('🔄 Middleware - Redirecionando usuário autenticado para:', redirectPath);
        return NextResponse.redirect(new URL(redirectPath, request.url));
      }
    }
    // Permitir acesso às rotas de auth
    console.log('✅ Middleware - Permitindo acesso à rota de auth');
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  if (!token || !isTokenValid(token)) {
    console.log('❌ Middleware - Token inválido ou ausente, redirecionando para login');
    // Redirecionar para login com returnUrl (otimização: redirecionamento direto)
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname); // Usar 'from' em vez de 'returnUrl' para consistência
    return NextResponse.redirect(loginUrl);
  }

  // Obter dados do usuário
  const userData = getUserFromToken(token);
  if (!userData) {
    console.log('❌ Middleware - Dados do usuário inválidos, redirecionando para login');
    // Token inválido, redirecionar para login
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar permissões por role
  const requiredRoles = getRequiredRole(pathname);
  
  // SUPER_ADMIN tem acesso total a todas as rotas
  if (userData.role === 'SUPER_ADMIN') {
    console.log('✅ Middleware - SUPER_ADMIN, acesso total permitido');
    // SUPER_ADMIN pode acessar qualquer rota, não precisa verificar permissões
  } else if (requiredRoles && !hasRequiredRole(userData.role, requiredRoles)) {
    console.log('❌ Middleware - Usuário não tem permissão para esta rota');
    // Usuário não tem permissão, redirecionar para dashboard apropriado
    const redirectPath = getRedirectPathByRole(userData.role);
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  console.log('✅ Middleware - Acesso permitido para:', userData.role);
  // Adicionar headers com informações do usuário (otimização: apenas se necessário)
  const response = NextResponse.next();
  response.headers.set('X-User-Role', userData.role);
  response.headers.set('X-Tenant-ID', userData.tenantId);

  return response;
}

// ============================================================================
// CONFIGURAÇÃO DO MIDDLEWARE
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
