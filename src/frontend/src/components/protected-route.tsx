"use client"

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
  fallback?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requiredRoles = [], 
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Aguardar inicialização
    if (!isInitialized || isLoading) {
      return
    }

    // Se não está autenticado, redirecionar para login
    if (!isAuthenticated) {
      console.log('🔒 ProtectedRoute - Usuário não autenticado, redirecionando para login')
      const loginUrl = `/auth/login?returnUrl=${encodeURIComponent(pathname || '/')}`
      router.push(loginUrl)
      return
    }

    // Se tem roles específicas requeridas, verificar permissões
    if (requiredRoles.length > 0 && user) {
      const hasRequiredRole = requiredRoles.includes(user.role)
      if (!hasRequiredRole) {
        console.log('🔒 ProtectedRoute - Usuário não tem permissão para acessar esta página')
        // Redirecionar para dashboard baseado no role do usuário
        const redirectPath = getRedirectPathByRole(user.role)
        router.push(redirectPath)
        return
      }
    }
  }, [isAuthenticated, isLoading, isInitialized, user?.role, router, pathname, requiredRoles, user]); // Incluídas todas as dependências

  // Mostrar loading enquanto inicializa
  if (!isInitialized || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não está autenticado, mostrar fallback ou loading
  if (!isAuthenticated) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Redirecionando para login...</p>
        </div>
      </div>
    )
  }

  // Se tem roles específicas e usuário não tem permissão
  if (requiredRoles.length > 0 && user && !requiredRoles.includes(user.role)) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    )
  }

  // Usuário autenticado e com permissões, renderizar conteúdo
  return <>{children}</>
}

// Função auxiliar para obter caminho de redirecionamento baseado no role
function getRedirectPathByRole(role: string): string {
  const roleRedirects: { [key: string]: string } = {
    'SUPER_ADMIN': '/super-admin/dashboard',
    'ADMIN': '/admin/dashboard',
    'PROFESSIONAL': '/professional/dashboard',
    'TRAINER': '/trainer/dashboard',
    'CLIENT': '/dashboard',
    'USER': '/dashboard'
  }
  
  return roleRedirects[role] || '/dashboard'
}
