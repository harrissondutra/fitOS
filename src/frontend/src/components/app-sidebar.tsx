"use client"

import * as React from "react"
import Link from "next/link"
import {
  Command,
  Users,
  BarChart3,
  Building2,
  CreditCard,
  Building,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavProjects } from "@/components/sidebar/nav-projects"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuth } from "@/components/providers/auth-provider"
import { useCompanies } from "@/hooks/use-companies"
import { UserRole } from "../../../shared/types"

// Função para gerar menu items baseado no role do usuário
const getMenuItems = (userRole: UserRole, companies: any[] = []) => {
  switch (userRole) {
    case 'SUPER_ADMIN':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/super-admin/dashboard",
            icon: BarChart3,
          },
          {
            title: "Empresas",
            url: "/super-admin/empresas",
            icon: Building2,
          },
          {
            title: "Usuários",
            url: "/super-admin/users",
            icon: Users,
          },
          {
            title: "Planos",
            url: "/super-admin/plans",
            icon: CreditCard,
            items: [
              { title: "Planos Base", url: "/super-admin/plans" },
              { title: "Planos Customizados", url: "/super-admin/custom-plans" },
            ],
          },
        ],
        projects: companies.map(company => ({
          name: company.name,
          url: `/super-admin/empresas/${company.id}`,
          icon: Building,
        })),
        teams: companies.map(company => ({
          name: company.name,
          plan: company.plan,
          logo: Building,
        })),
      };
    case 'ADMIN':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: BarChart3,
          },
          {
            title: "Usuários",
            url: "/admin/users",
            icon: Users,
          },
        ],
      };
    case 'TRAINER':
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/trainer/dashboard",
            icon: BarChart3,
          },
        ],
      };
    case 'MEMBER':
    default:
      return {
        navMain: [
          {
            title: "Dashboard",
            url: "/dashboard",
            icon: BarChart3,
          },
        ],
      };
  }
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { companies, loading: companiesLoading } = useCompanies()
  const userRole = user?.role || 'MEMBER'
  const menuItems = getMenuItems(userRole, companies)

  // Dados do usuário para o NavUser
  const userData = {
    name: user?.name || "Usuário",
    email: user?.email || "usuario@exemplo.com",
    avatar: "/avatars/default.jpg",
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            {userRole === 'SUPER_ADMIN' ? (
              <TeamSwitcher teams={menuItems.teams} />
            ) : (
              <SidebarMenuButton size="lg" asChild>
                <Link href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">FitOS</span>
                    <span className="truncate text-xs">
                      {userRole === 'ADMIN' ? 'Administrador' :
                       userRole === 'TRAINER' ? 'Personal Trainer' : 'Membro'}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuItems.navMain} />
        {userRole === 'SUPER_ADMIN' && menuItems.projects && (
          <NavProjects projects={menuItems.projects} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}