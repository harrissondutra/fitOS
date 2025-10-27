'use client';

import { Sidebar } from '@/components/sidebar/simple-brand';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Calendar, 
  UtensilsCrossed, 
  Database, 
  MessageSquare, 
  BarChart3,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const nutritionistNavItems = [
  {
    title: "Dashboard",
    url: "/nutritionist/dashboard",
    icon: BarChart3,
    isActive: true
  },
  {
    title: "Clientes",
    url: "/nutritionist/clients",
    icon: Users,
    badge: "12"
  },
  {
    title: "Planos Alimentares",
    url: "/nutritionist/meal-plans",
    icon: UtensilsCrossed,
    badge: "5"
  },
  {
    title: "Base de Alimentos",
    url: "/nutritionist/food-database",
    icon: Database
  },
  {
    title: "Consultas",
    url: "/nutritionist/consultations",
    icon: MessageSquare,
    badge: "3"
  },
  {
    title: "Analytics",
    url: "/nutritionist/analytics",
    icon: BarChart3
  }
];

export default function NutritionistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar 
          navItems={nutritionistNavItems}
          title="Nutrição"
          subtitle="Gestão Nutricional"
        />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clientes, alimentos, receitas..."
                    className="w-80 pl-10"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                  >
                    3
                  </Badge>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/avatars/nutritionist.jpg" alt="Nutricionista" />
                        <AvatarFallback>NU</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
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


