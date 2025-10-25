"use client"

import * as React from "react"
import { Building, Command } from "lucide-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import Image from "next/image"

interface SimpleBrandProps {
  userRole?: string
  companyName?: string
  companyPlan?: string
  showCompanyInfo?: boolean
  customIcon?: React.ComponentType<{ className?: string }>
  customTitle?: string
  customSubtitle?: string
  companyLogo?: string
}

export function SimpleBrand({
  userRole = 'MEMBER',
  companyName,
  companyPlan,
  showCompanyInfo = false,
  customIcon: CustomIcon,
  customTitle,
  customSubtitle,
  companyLogo,
}: SimpleBrandProps) {
  // Determinar o ícone baseado no role ou usar customizado
  const IconComponent = CustomIcon || (userRole === 'SUPER_ADMIN' ? Building : Command)
  
  // Determinar o título
  const title = customTitle || (userRole === 'SUPER_ADMIN' ? 'FitOS' : 'FitOS')
  
  // Determinar o subtítulo
  const subtitle = customSubtitle || 
    (showCompanyInfo && companyName ? companyName :
     userRole === 'SUPER_ADMIN' ? 'Sistema' :
     userRole === 'ADMIN' ? 'Administrador' :
     userRole === 'TRAINER' ? 'Personal Trainer' : 'Membro')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" asChild tooltip={title}>
          <Link href="/">
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
              {companyLogo ? (
                <Image
                  src={companyLogo}
                  alt="Company Logo"
                  width={24}
                  height={24}
                  className="size-6 object-contain"
                />
              ) : (
                <IconComponent className="size-4" />
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{title}</span>
              <span className="truncate text-xs">{subtitle}</span>
              {showCompanyInfo && companyPlan && (
                <span className="truncate text-xs text-muted-foreground">{companyPlan}</span>
              )}
            </div>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}


