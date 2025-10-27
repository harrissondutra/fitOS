'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCheck,
  DollarSign,
  BarChart3,
  Target,
  FileText,
  Shield,
  Settings,
  TrendingUp,
  Trophy,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Activity
} from 'lucide-react';

const navigation = [
  { 
    name: 'Dashboard', 
    href: '/admin/dashboard', 
    icon: LayoutDashboard,
    current: false
  },
  
  // System Health
  { 
    name: 'System Health', 
    href: '/admin/system-health', 
    icon: Activity,
    current: false
  },
  
  // Gestão
  { 
    name: 'Gestão', 
    icon: Building2,
    children: [
      { name: 'Tenants', href: '/admin/tenants/list' },
      { name: 'Dashboard Tenants', href: '/admin/tenants/dashboard' },
      { name: 'Usuários', href: '/admin/users' },
      { name: 'Analytics Usuários', href: '/admin/users/analytics' },
      { name: 'Atividade Usuários', href: '/admin/users/activity' },
      { name: 'Membros', href: '/admin/members' },
    ]
  },
  
  // Financeiro
  { 
    name: 'Financeiro', 
    icon: DollarSign,
    children: [
      { name: 'Revenue Dashboard', href: '/admin/revenue' },
      { name: 'Billing Issues', href: '/admin/revenue/billing' },
    ]
  },
  
  // Analytics
  { 
    name: 'Analytics', 
    icon: BarChart3,
    children: [
      { name: 'Visão Geral', href: '/admin/analytics/overview' },
      { name: 'Platform Overview', href: '/admin/platform/overview' },
      { name: 'Growth Analytics', href: '/admin/platform/growth' },
      { name: 'Feature Adoption', href: '/admin/platform/features' },
    ]
  },
  
  // Customer Success
  { 
    name: 'Customer Success', 
    icon: Target,
    children: [
      { name: 'Health Scores', href: '/admin/customers/health' },
      { name: 'Em Risco', href: '/admin/customers/at-risk' },
      { name: 'Comunicação', href: '/admin/customers/communication' },
    ]
  },
  
  // Relatórios
  { 
    name: 'Relatórios', 
    icon: FileText,
    children: [
      { name: 'Reports Builder', href: '/admin/reports/builder' },
      { name: 'Executive Dashboard', href: '/admin/reports/executive' },
    ]
  },
  
  // Auditoria
  { 
    name: 'Auditoria', 
    icon: Shield,
    children: [
      { name: 'Ações Admin', href: '/admin/audit/actions' },
      { name: 'Acesso a Dados', href: '/admin/audit/access' },
      { name: 'Compliance', href: '/admin/audit/compliance' },
    ]
  },
  
  // Configurações
  { 
    name: 'Configurações', 
    icon: Settings,
    children: [
      { name: 'Global Settings', href: '/admin/settings/global' },
      { name: 'Feature Flags', href: '/admin/settings/features' },
      { name: 'Integrações', href: '/admin/settings/integrations' },
      { name: 'Limites', href: '/admin/settings/limits' },
    ]
  },
  
  // Marketing
  { 
    name: 'Marketing', 
    icon: TrendingUp,
    children: [
      { name: 'Acquisition Funnel', href: '/admin/marketing/funnel' },
      { name: 'Campanhas', href: '/admin/marketing/campaigns' },
    ]
  },
  
  // Gamification
  { 
    name: 'Gamification', 
    icon: Trophy,
    children: [
      { name: 'Leaderboards', href: '/admin/gamification/leaderboards' },
      { name: 'Histórias de Sucesso', href: '/admin/gamification/success-stories' },
    ]
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['Gestão', 'Analytics']);
  const pathname = usePathname();

  const toggleSection = (sectionName: string) => {
    setOpenSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  const isActive = (href: string) => {
    return pathname === href;
  };

  const hasActiveChild = (children: any[]) => {
    return children.some(child => isActive(child.href));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-background border-r">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <h1 className="text-lg font-semibold">Admin Panel</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => (
              <NavigationItem
                key={item.name}
                item={item}
                isActive={isActive}
                hasActiveChild={hasActiveChild}
                openSections={openSections}
                toggleSection={toggleSection}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex h-16 items-center px-4 border-b">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </div>
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavigationItem
              key={item.name}
              item={item}
              isActive={isActive}
              hasActiveChild={hasActiveChild}
              openSections={openSections}
              toggleSection={toggleSection}
            />
          ))}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex-1 text-sm font-semibold leading-6 text-foreground">
            Admin Panel
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

interface NavigationItemProps {
  item: any;
  isActive: (href: string) => boolean;
  hasActiveChild: (children: any[]) => boolean;
  openSections: string[];
  toggleSection: (sectionName: string) => void;
}

function NavigationItem({ 
  item, 
  isActive, 
  hasActiveChild, 
  openSections, 
  toggleSection 
}: NavigationItemProps) {
  const isOpen = openSections.includes(item.name);
  const hasChildren = item.children && item.children.length > 0;
  const isItemActive = item.href ? isActive(item.href) : false;
  const hasActiveChildren = hasChildren ? hasActiveChild(item.children) : false;

  if (hasChildren) {
    return (
      <Collapsible open={isOpen} onOpenChange={() => toggleSection(item.name)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-between",
              hasActiveChildren && "bg-accent text-accent-foreground"
            )}
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 ml-4">
          {item.children.map((child: any) => (
            <Link
              key={child.href}
              href={child.href}
              className={cn(
                "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                isActive(child.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {child.name}
              {child.badge && (
                <Badge variant="secondary" className="ml-auto">
                  {child.badge}
                </Badge>
              )}
            </Link>
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
        isItemActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent"
      )}
    >
      <item.icon className="mr-3 h-4 w-4" />
      {item.name}
      {item.badge && (
        <Badge variant="secondary" className="ml-auto">
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}