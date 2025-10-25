"use client"

import React, { useState } from "react"
import {
  Bell,
  LogOut,
  Settings,
  User,
  Palette,
  Shield,
  ChevronDown,
  LayoutDashboard,
  Cog,
  Users,
  Target,
  CreditCard,
  Crown,
  UserCheck,
  GraduationCap,
  UserCircle,
} from "lucide-react"
import Link from "next/link"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useSidebarView } from "@/hooks/use-sidebar-view"
import { useAuth } from "@/hooks/use-auth"
import { UserRole } from "../../../shared/types/auth.types"

// Interface para itens do menu
interface NavUserMenuItem {
  title: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  onClick?: () => void
  show?: boolean
}

export function NavUser() {
  const { user, logout } = useAuth()
  const { view, toggleView, isAdminView } = useSidebarView()
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    try {
      if (logout) {
        await logout()
      } else {
        console.log('🚪 Logout - No logout function provided')
      }
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }

  const userRole = user?.role || 'CLIENT'
  const userName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email || "Usuário"
  const userEmail = user?.email || "usuario@exemplo.com"
  const userAvatar = user?.image || '/avatars/default.jpg'
  const userInitials = user?.firstName && user?.lastName ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : user?.email?.charAt(0)?.toUpperCase() || 'U'

  // Ícones por role
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN': return Crown
      case 'OWNER': return UserCheck
      case 'ADMIN': return Shield
      case 'TRAINER': return GraduationCap
      case 'CLIENT': return UserCircle
      default: return UserCircle
    }
  }

  const RoleIcon = getRoleIcon(userRole)

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="relative p-1 rounded-xl hover:bg-accent/50 transition-all duration-200 ease-in-out hover:scale-105 cursor-pointer group">
          <Avatar className="h-10 w-10 ring-2 ring-background shadow-lg group-hover:ring-primary/20 transition-all duration-200">
            <AvatarImage src={userAvatar} alt={userName} />
            <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-primary/10">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          {/* Ícone da coroa para Super Admin */}
          {userRole === 'SUPER_ADMIN' && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1 shadow-lg">
              <Crown className="h-3 w-3 text-white" />
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 rounded-xl shadow-xl border-0 bg-background/95 backdrop-blur-sm"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        {/* Header do usuário */}
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-xl">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={userAvatar} alt={userName} />
              <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 to-primary/10">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground truncate">{userName}</span>
                <RoleIcon className="h-4 w-4 text-primary flex-shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground truncate">{userEmail}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={isAdminView ? "default" : "secondary"} className="text-xs">
                  {isAdminView ? 'Visão Administrativa' : 'Visão Padrão'}
                </Badge>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        {/* Menu principal */}
        <DropdownMenuGroup className="p-2">
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href="/settings/profile" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
              <User className="h-4 w-4 text-primary" />
              <span>Meu Perfil</span>
            </Link>
          </DropdownMenuItem>

          {/* Itens da Visão Administrativa */}
          {isAdminView && (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' || userRole === 'OWNER') && (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/admin/settings/platform" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                <Settings className="h-4 w-4 text-primary" />
                <span>Configurações da Plataforma</span>
              </Link>
            </DropdownMenuItem>
          )}
          {isAdminView && userRole === 'SUPER_ADMIN' && (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/super-admin/users" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                <Shield className="h-4 w-4 text-primary" />
                <span>Gerenciar Usuários</span>
              </Link>
            </DropdownMenuItem>
          )}
          {isAdminView && (userRole === 'OWNER' || userRole === 'ADMIN') && (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/admin/users" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                <Users className="h-4 w-4 text-primary" />
                <span>Gerenciar Membros</span>
              </Link>
            </DropdownMenuItem>
          )}
          {isAdminView && userRole === 'TRAINER' && (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/trainer/workouts" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                <Target className="h-4 w-4 text-primary" />
                <span>Gerenciar Treinos</span>
              </Link>
            </DropdownMenuItem>
          )}
          {isAdminView && userRole === 'CLIENT' && (
            <DropdownMenuItem asChild className="rounded-lg">
              <Link href="/client/settings/account" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                <CreditCard className="h-4 w-4 text-primary" />
                <span>Minha Assinatura</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        {/* Configurações */}
        <DropdownMenuGroup className="p-2">
          <DropdownMenuItem asChild className="rounded-lg">
            <Link href="/settings/theme" className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
              <Palette className="h-4 w-4 text-primary" />
              <span>Personalizar Tema</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors rounded-lg">
            <Bell className="h-4 w-4 text-primary" />
            <span>Notificações</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        {/* Toggle de visão */}
        <div className="p-2">
          <DropdownMenuItem 
            onClick={toggleView} 
            className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors rounded-lg cursor-pointer"
          >
            {isAdminView ? (
              <>
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span>Alternar para Visão Padrão</span>
              </>
            ) : (
              <>
                <Cog className="h-4 w-4 text-primary" />
                <span>Alternar para Visão Administrativa</span>
              </>
            )}
          </DropdownMenuItem>
        </div>
        
        <DropdownMenuSeparator className="bg-border/50" />
        
        {/* Logout */}
        <div className="p-2">
          <DropdownMenuItem 
            onClick={handleLogout} 
            className="flex items-center gap-3 p-3 hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sair</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}