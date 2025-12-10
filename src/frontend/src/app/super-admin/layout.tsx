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
  return <>{children}</>;
}
