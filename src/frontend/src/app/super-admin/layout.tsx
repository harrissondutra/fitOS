'use client';

import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import ModeToggle from '@/components/mode-toggle';
import { NavUser } from '@/components/nav-user';
import { BreadcrumbNav } from '@/components/breadcrumb-nav';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Cog } from 'lucide-react';
import { useSidebarView } from '@/hooks/use-sidebar-view';

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAdminView } = useSidebarView();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
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
                className={`flex items-center gap-2 px-3 py-1 ${
                  isAdminView 
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
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
