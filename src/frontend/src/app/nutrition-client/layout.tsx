'use client';

import { Sidebar } from '@/components/sidebar/simple-brand';
import { SidebarProvider } from '@/components/ui/sidebar';
import { 
  Home, 
  BookOpen, 
  UtensilsCrossed, 
  TrendingUp, 
  MessageSquare, 
  User,
  Bell,
  Search,
  Calendar,
  Target,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const clientNavItems = [
  {
    title: "Dashboard",
    url: "/nutrition-client/dashboard",
    icon: Home,
    isActive: true
  },
  {
    title: "Diário Alimentar",
    url: "/nutrition-client/diary",
    icon: BookOpen,
    badge: "3"
  },
  {
    title: "Meu Plano",
    url: "/nutrition-client/meal-plan",
    icon: UtensilsCrossed
  },
  {
    title: "Progresso",
    url: "/nutrition-client/progress",
    icon: TrendingUp
  },
  {
    title: "Consultas",
    url: "/nutrition-client/consultations",
    icon: MessageSquare,
    badge: "1"
  },
  {
    title: "Perfil",
    url: "/nutrition-client/profile",
    icon: User
  }
];

export default function NutritionClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar 
          navItems={clientNavItems}
          title="Meu Nutri"
          subtitle="Acompanhamento Nutricional"
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alimentos, receitas..."
                    className="w-80 pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Calendar className="h-5 w-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    2
                  </Badge>
                </Button>
                
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    1
                  </Badge>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/client.jpg" alt="Cliente" />
                        <AvatarFallback>CL</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem>
                      <User className="mr-2 h-4 w-4" />
                      <span>Meu Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Target className="mr-2 h-4 w-4" />
                      <span>Metas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Activity className="mr-2 h-4 w-4" />
                      <span>Atividade</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}


