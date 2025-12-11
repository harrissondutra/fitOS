"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import ModeToggle from '@/components/mode-toggle'
import { NavUser } from '@/components/nav-user'
import { BreadcrumbNav } from '@/components/breadcrumb-nav'
import { useAuth } from '@/hooks/use-auth'
import { useSidebarView } from '@/hooks/use-sidebar-view'
import { Badge } from '@/components/ui/badge'
import { LayoutDashboard, Cog } from 'lucide-react'
import { AdHeader } from '@/components/advertisements/AdHeader'
import { AdFooter } from '@/components/advertisements/AdFooter'
import { MobileNav } from '@/components/mobile-nav'
import { InstallPrompt } from '@/components/install-prompt'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { isAdminView } = useSidebarView()

  // Rotas públicas que não devem ter sidebar
  const publicRoutes = [
    '/',
    '/demo',
    '/auth/login',
    '/auth/signup',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/verify-email',
    '/pricing',
    '/marketplace',
    '/store',
    '/checkout'
  ]

  // Rotas que têm layouts específicos com sidebar próprio
  const routesWithOwnLayout: string[] = [
    // Todas as rotas agora usam o layout global condicional
  ]

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') return pathname === '/'
    return pathname?.startsWith(route) || false
  })

  // Verificar se é uma rota com layout próprio
  const hasOwnLayout = routesWithOwnLayout.some(route => {
    return pathname?.startsWith(route) || false
  })

  // Se for rota pública, renderizar sem header
  if (isPublicRoute) {
    return (
      <div className="min-h-screen">
        {children}
        <InstallPrompt />
      </div>
    )
  }

  // Se for rota com layout próprio, renderizar sem header adicional
  if (hasOwnLayout) {
    return (
      <div className="min-h-screen">
        {children}
        <InstallPrompt />
      </div>
    )
  }

  // Para rotas protegidas sem layout próprio, renderizar com sidebar completa
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AdHeader />
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/40">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex flex-1 justify-between items-center px-6">
            <BreadcrumbNav />
            <div className="flex items-center gap-4">
              {/* Badge de visão */}
              <Badge
                variant="outline"
                className={`flex items-center gap-2 px-3 py-1 ${isAdminView
                  ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300'
                  : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  }`}
              >
                {isAdminView ? (
                  <>
                    <Cog className="h-3 w-3" />
                    <span className="text-xs font-medium">Administrativa</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="h-3 w-3" />
                    <span className="text-xs font-medium">Padrão</span>
                  </>
                )}
              </Badge>
              <ModeToggle />
              <NavUser />
            </div>
          </div>
        </header>
        {/* Adicionado padding bottom no mobile para não cobrir conteudo com a nav bar */}
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0 min-h-screen pb-28 md:pb-4">
          {children}
        </div>
        <AdFooter />
      </SidebarInset>
      <MobileNav />
      <InstallPrompt />
    </SidebarProvider>
  )
}