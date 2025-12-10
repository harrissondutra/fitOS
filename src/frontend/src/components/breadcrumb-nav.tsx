"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mapeamento de rotas para nomes amigáveis
const routeNames: Record<string, string> = {
  // Dashboards
  'super-admin': 'Super Admin',
  'admin': 'Administração',
  'trainer': 'Personal Trainer',
  'client': 'Cliente',
  
  // Funcionalidades principais
  'dashboard': 'Dashboard',
  'users': 'Usuários',
  'clients': 'Clientes',
  'workouts': 'Treinos',
  'exercises': 'Exercícios',
  'schedule': 'Agendamentos',
  'analytics': 'Análises',
  'reports': 'Relatórios',
  'settings': 'Configurações',
  'profile': 'Perfil',
  'bioimpedance': 'Bioimpedância',
  'marketplace': 'Marketplace',
  'crm': 'CRM',
  'ai': 'Inteligência Artificial',
  'management': 'Gerenciamento',
  'plans': 'Planos',
  'costs': 'Custos',
  'integrations': 'Integrações',
  
  // Subfuncionalidades
  'providers': 'Provedores',
  'logs': 'Logs',
  'limits': 'Limites',
  'templates': 'Templates',
  'availability': 'Disponibilidade',
  'attendance': 'Presença',
  'reminders': 'Lembretes',
  'timeline': 'Timeline',
  'comparison': 'Comparação',
  'evolution': 'Evolução',
  'pipeline': 'Pipeline',
  'interactions': 'Interações',
  'campaigns': 'Campanhas',
  'notifications': 'Notificações',
  'comments': 'Comentários',
  'reviews': 'Avaliações',
  'goals': 'Metas',
  'progress': 'Progresso',
  'appointments': 'Agendamentos',
  'team-calendar': 'Calendário da Equipe',
  'white-label': 'White Label',
  'backup': 'Backup',
  'monitoring': 'Monitoramento',
  'custom-plans': 'Planos Customizados',
  'empresas': 'Empresas',
  'wearables': 'Wearables',
  'overview': 'Visão Geral',
  'builder': 'Construtor',
  'export': 'Exportação',
  'preferences': 'Preferências',
  'privacy': 'Privacidade',
}

// Função para gerar breadcrumb baseado no pathname
function generateBreadcrumbItems(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const items = []
  
  // Sempre começar com Home
  items.push({
    href: '/',
    label: 'Home',
    isLast: segments.length === 0
  })
  
  // Processar cada segmento
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const href = '/' + segments.slice(0, i + 1).join('/')
    const isLast = i === segments.length - 1
    
    // Usar nome mapeado ou capitalizar o segmento
    const label = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    
    items.push({
      href: isLast ? undefined : href,
      label,
      isLast
    })
  }
  
  return items
}

export function BreadcrumbNav() {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)

  // Evitar mismatch de hidratação: só usar pathname após mount
  React.useEffect(() => {
    setHasMounted(true)
  }, [])

  // Se ainda não montou, retornar um placeholder simples
  if (!hasMounted) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>...</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
  
  const items = generateBreadcrumbItems(pathname || '')
  const ITEMS_TO_DISPLAY = 2
  
  // Se temos poucos itens, mostrar todos
  if (items.length <= ITEMS_TO_DISPLAY) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {items.map((item, index) => (
            <React.Fragment key={index}>
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href!}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!item.isLast && <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>}
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }
  
  // Se temos muitos itens, usar ellipsis conforme documentação shadcn/ui
  const firstItem = items[0]
  const lastItems = items.slice(-ITEMS_TO_DISPLAY + 1)
  const middleItems = items.slice(1, -ITEMS_TO_DISPLAY + 1)
  
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Primeiro item */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={firstItem.href!}>{firstItem.label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
        
        {/* Ellipsis com dropdown para itens do meio */}
        <BreadcrumbItem>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger className="flex items-center gap-1 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5">
              <BreadcrumbEllipsis className="size-4" />
              <span className="sr-only">Toggle menu</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {middleItems.map((item, index) => (
                <DropdownMenuItem key={index} asChild>
                  <Link href={item.href!}>{item.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>
        
        {/* Últimos itens */}
        {lastItems.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href!}>{item.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isLast && <BreadcrumbSeparator><ChevronRight /></BreadcrumbSeparator>}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
