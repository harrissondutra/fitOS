"use client"

import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/auth-provider'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  // Páginas públicas que não devem ter sidebar
  const publicPages = [
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/demo'
  ]

  // Verificar se é uma página pública
  const isPublicPage = pathname ? publicPages.includes(pathname) : false

  // Se for página pública ou usuário não estiver logado, renderizar sem sidebar
  if (isPublicPage || !user || isLoading) {
    return <>{children}</>
  }

  // Se usuário estiver logado e não for página pública, renderizar com sidebar
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div className="flex flex-1 justify-end px-4">
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
