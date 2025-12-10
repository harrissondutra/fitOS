"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import * as LucideIcons from "lucide-react"
import {
  Users,
  BarChart3,
  Building2,
  CreditCard,
  Building,
  Dumbbell,
  Target,
  User,
  Settings,
  TrendingUp,
  Brain,
  Sparkles,
  BarChart2,
  Watch,
  Store,
  Eye,
  Code,
  Palette,
  Calendar,
  Activity,
  Users2,
  MessageSquare,
  Bell,
  FileText,
  Clock,
  Star,
  CheckCircle,
  Goal,
  Share2,
  Download,
  History,
  Smartphone,
  Zap,
  ShieldCheck,
  UserCog,
  PieChart,
  CalendarDays,
  MessageCircle,
  Stethoscope,
  DollarSign,
  Cpu,
  Wrench,
  Database,
  Server,
  Cloud,
  Shield,
  Layers,
  GitBranch,
  Workflow,
  Bot,
  Smartphone as Phone,
  Mail,
  MapPin,
  BarChart,
  Monitor,
  Globe,
  Key,
  Lock,
  Unlock,
  UtensilsCrossed,
  Apple,
} from "lucide-react"
import { ROUTES } from "@/shared/constants/routes"

import { NavMain } from "@/components/sidebar/nav-main"
import { SimpleBrand } from "@/components/sidebar/simple-brand"
import { AdWrapper } from "@/components/advertisements/AdWrapper"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { UserRole, SidebarView } from "@/shared/types/auth.types"
import { useAuth } from "@/hooks/use-auth"
import { useSidebarView } from "@/hooks/use-sidebar-view"
import { useSidebarConfig } from "@/hooks/use-sidebar-config"
import type { LucideIcon } from "lucide-react"

// Função para gerar menu items da visão padrão (operacional)
const getStandardMenuItems = (userRole: UserRole) => {
  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'PROFESSIONAL':
      return [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: BarChart3,
        },
        {
          title: "Clientes",
          url: "/trainer/clients",
          icon: Users,
          items: [
            { title: "Meus Clientes", url: "/trainer/clients" },
            { title: "Atribuir Cliente", url: "/trainer/clients/assign" },
          ],
        },
        {
          title: "Treinos & Exercícios",
          url: "/trainer/workouts",
          icon: Target,
          items: [
            { title: "Treinos", url: "/trainer/workouts" },
            { title: "Exercícios", url: "/trainer/exercises" },
            { title: "Criar Treino", url: "/trainer/workouts/create" },
            { title: "Metas", url: "/trainer/goals" },
          ],
        },
        {
          title: "Agendamentos",
          url: "/schedule",
          icon: CalendarDays,
          items: [
            { title: "Calendário", url: "/schedule" },
            { title: "Templates", url: "/schedule/templates" },
            { title: "Disponibilidade", url: "/schedule/availability" },
            { title: "Presença", url: "/attendance" },
          ],
        },
        {
          title: "Avaliações Físicas",
          url: "/trainer/assessments",
          icon: Stethoscope,
          items: [
            { title: "Avaliações", url: "/trainer/assessments" },
            { title: "Nova Avaliação", url: "/trainer/assessments/new" },
          ],
        },
        {
          title: "Chat com Clientes",
          url: "/trainer/chat",
          icon: MessageSquare,
        },
        {
          title: "Nutrição",
          url: "/nutritionist/dashboard",
          icon: Apple,
          items: [
            { title: "Dashboard Nutrição", url: "/nutritionist/dashboard" },
            { title: "Clientes", url: "/nutritionist/clients" },
            { title: "Planos Alimentares", url: "/nutritionist/meal-plans" },
            { title: "Base de Alimentos", url: "/nutritionist/food-database" },
            { title: "Bioimpedância", url: "/nutritionist/bioimpedance" },
            { title: "Questionários", url: "/nutritionist/questionnaires" },
          ],
        },
        {
          title: "Dietas",
          url: ROUTES.NUTRITION_CLIENT.DIET,
          icon: UtensilsCrossed,
          items: [
            { title: "Minha Dieta", url: ROUTES.NUTRITION_CLIENT.DIET },
            { title: "Diário Alimentar", url: ROUTES.NUTRITION_CLIENT.DIARY },
            { title: "Meu Plano", url: ROUTES.NUTRITION_CLIENT.MEAL_PLAN },
            { title: "Progresso", url: ROUTES.NUTRITION_CLIENT.PROGRESS },
            { title: "Consultas", url: ROUTES.NUTRITION_CLIENT.CONSULTATIONS },
          ],
        },
        {
          title: "Analytics",
          url: "/trainer/analytics",
          icon: BarChart3,
        },
        {
          title: "CRM & Comunicação",
          url: "/crm",
          icon: MessageCircle,
          items: [
            { title: "Pipeline", url: "/crm" },
            { title: "WhatsApp", url: "/whatsapp" },
            { title: "Notificações", url: "/notifications" },
            { title: "Campanhas", url: "/crm/campaigns" },
          ],
        },
        {
          title: "Análises",
          url: "/analytics",
          icon: PieChart,
          items: [
            { title: "Analytics", url: "/analytics" },
            { title: "Timeline", url: "/timeline" },
            { title: "Relatórios", url: "/reports" },
          ],
        },
        {
          title: "Marketplace",
          url: "/marketplace",
          icon: Store,
          items: [
            { title: "Explorar", url: "/marketplace" },
            { title: "Meus Pedidos", url: "/marketplace/orders" },
          ],
        },
        {
          title: "Meu Perfil",
          url: "/settings/profile",
          icon: User,
        },
      ];
    case 'CLIENT':
    default:
      return [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: BarChart3,
        },
        {
          title: "Meus Treinos",
          url: "/client/workouts",
          icon: Target,
        },
        {
          title: "Exercícios",
          url: "/exercises",
          icon: Dumbbell,
        },
        {
          title: "Meu Progresso",
          url: "/progress",
          icon: TrendingUp,
        },
        {
          title: "Meus Agendamentos",
          url: "/appointments",
          icon: Calendar,
        },
        {
          title: "Minhas Avaliações",
          url: "/client/assessments",
          icon: Activity,
        },
        {
          title: "Chat com Trainer",
          url: "/client/chat",
          icon: MessageSquare,
        },
        {
          title: "Minhas Bioimpedâncias",
          url: "/bioimpedance",
          icon: Activity,
        },
        {
          title: "Nutrição",
          url: ROUTES.NUTRITION_CLIENT.DASHBOARD,
          icon: Apple,
          items: [
            { title: "Dashboard", url: ROUTES.NUTRITION_CLIENT.DASHBOARD },
            { title: "Minha Dieta", url: ROUTES.NUTRITION_CLIENT.DIET },
            { title: "Diário Alimentar", url: ROUTES.NUTRITION_CLIENT.DIARY },
            { title: "Meu Plano", url: ROUTES.NUTRITION_CLIENT.MEAL_PLAN },
            { title: "Progresso", url: ROUTES.NUTRITION_CLIENT.PROGRESS },
          ],
        },
        {
          title: "Dietas",
          url: ROUTES.NUTRITION_CLIENT.DIET,
          icon: UtensilsCrossed,
          items: [
            { title: "Minha Dieta", url: "/nutrition-client/dieta" },
            { title: "Diário Alimentar", url: "/nutrition-client/diary" },
            { title: "Meu Plano", url: "/nutrition-client/meal-plan" },
            { title: "Progresso", url: "/nutrition-client/progress" },
          ],
        },
        {
          title: "Minhas Metas & Notificações",
          url: "/goals",
          icon: Goal,
          items: [
            { title: "Minhas Metas", url: "/goals" },
            { title: "Notificações", url: "/notifications" },
          ],
        },
        {
          title: "Meu Perfil",
          url: "/settings/profile",
          icon: User,
        },
      ];
  }
};

// Função para gerar menu items da visão administrativa
const getAdminMenuItems = (userRole: UserRole) => {
  switch (userRole) {
    case 'SUPER_ADMIN':
      return [
        {
          title: "Dashboard Admin",
          url: "/super-admin/dashboard",
          icon: BarChart3,
        },
        {
          title: "Inteligência Artificial",
          url: "/super-admin/ai",
          icon: Brain,
          items: [
            { title: "Dashboard", url: "/super-admin/ai/dashboard" },
            { title: "Provedores", url: "/super-admin/ai/providers" },
            { title: "Serviços", url: "/super-admin/ai/services" },
            { title: "Predições", url: "/super-admin/ai/predictions" },
            { title: "Geradores", url: "/super-admin/ai/generators" },
            { title: "Analytics", url: "/super-admin/ai/analytics" },
            { title: "Logs & Monitoramento", url: "/super-admin/ai/logs" },
            { title: "Help", url: "/super-admin/ai/help" },
            { title: "Configurações", url: "/super-admin/ai/settings" },
            { title: "Limites", url: "/super-admin/ai/limits" },
          ],
        },
        {
          title: "Gestão de Custos",
          url: "/super-admin/management/costs",
          icon: DollarSign,
          items: [
            { title: "Dashboard", url: "/super-admin/management/costs" },
            { title: "Inteligência Artificial", url: "/super-admin/management/costs/inteligencia-artificial" },
            { title: "Pagamentos", url: "/super-admin/management/costs/pagamentos" },
            { title: "Comunicação", url: "/super-admin/management/costs/comunicacao" },
            { title: "Armazenamento", url: "/super-admin/management/costs/armazenamento" },
            { title: "Database & Cache", url: "/super-admin/management/costs/database" },
            { title: "Automação", url: "/super-admin/management/costs/automacao" },
            { title: "Orçamentos", url: "/super-admin/management/costs/orcamentos" },
            { title: "Alertas", url: "/super-admin/management/costs/alertas" },
          ],
        },
        {
          title: "Gerenciamento",
          url: "/super-admin/management/dashboard",
          icon: Settings,
          items: [
            { title: "Dashboard", url: "/super-admin/management/dashboard" },
            { title: "Limites Globais", url: "/super-admin/management/limits" },
            { title: "Wearables", url: "/super-admin/management/wearables" },
          ],
        },
        {
          title: "Gestão",
          url: "/super-admin/users",
          icon: UserCog,
          items: [
            { title: "Usuários", url: "/super-admin/users" },
            { title: "Clientes", url: "/admin/members" },
            { title: "Empresas", url: "/super-admin/empresas" },
          ],
        },
        {
          title: "Planos & Financeiro",
          url: "/super-admin/plans",
          icon: DollarSign,
          items: [
            { title: "Planos Base", url: "/super-admin/plans" },
            { title: "Planos Customizados", url: "/super-admin/custom-plans" },
          ],
        },
        {
          title: "Minha Loja",
          url: "/store",
          icon: Store,
          items: [
            { title: "Dashboard", url: "/store" },
            { title: "Produtos", url: "/store/produtos" },
            { title: "Pedidos", url: "/store/pedidos" },
            { title: "Avaliações", url: "/store/avaliacoes" },
          ],
        },
        {
          title: "WhatsApp Business",
          url: "/super-admin/whatsapp",
          icon: MessageSquare,
          items: [
            { title: "Configuração", url: "/super-admin/whatsapp" },
            { title: "Mensagens", url: "/professional/whatsapp/messages" },
            { title: "Templates", url: "/professional/whatsapp/templates" },
            { title: "Analytics", url: "/professional/whatsapp/analytics" },
          ],
        },
        {
          title: "Database",
          url: "/super-admin/database/dashboard",
          icon: Database,
          items: [
            { title: "Bancos de Dados", url: "/super-admin/database/dashboard" },
            { title: "Integrações", url: "/super-admin/database/integracoes" },
          ],
        },
        {
          title: "Servidores",
          url: "/super-admin/servers",
          icon: Key,
          items: [
            { title: "Lista", url: "/super-admin/servers" },
          ],
        },
        {
          title: "Monetização",
          url: "/super-admin/advertisements",
          icon: TrendingUp,
          items: [
            { title: "Gestão de Anúncios", url: "/super-admin/advertisements" },
          ],
        },
        {
          title: "Configuração de Sidebar",
          url: "/super-admin/sidebar-config",
          icon: Layers,
        },
        {
          title: "Configurações do Sistema",
          url: "/super-admin/system/config",
          icon: Wrench,
          items: [
            { title: "White Label", url: "/super-admin/white-label" },
            { title: "Calendário da Equipe", url: "/professional/team-calendar" },
            { title: "Configurações", url: "/super-admin/system/config" },
            { title: "Logs", url: "/super-admin/system/logs" },
            { title: "Backup", url: "/super-admin/system/backup" },
            { title: "Monitoramento", url: "/super-admin/system/monitoring" },
          ],
        },
      ];
    case 'ADMIN':
      return [
        {
          title: "Dashboard Admin",
          url: "/admin/dashboard",
          icon: BarChart3,
        },
        {
          title: "Gestão de Usuários",
          url: "/admin/users",
          icon: UserCog,
        },
        {
          title: "Analytics Avançados",
          url: "/admin/analytics",
          icon: PieChart,
          items: [
            { title: "Overview", url: "/admin/analytics/overview" },
            { title: "Engajamento", url: "/admin/analytics/engagement" },
            { title: "Retenção", url: "/admin/analytics/retention" },
          ],
        },
        {
          title: "Configurações de Limites",
          url: "/admin/limits",
          icon: Settings,
        },
        {
          title: "Calendário da Equipe",
          url: "/professional/team-calendar",
          icon: CalendarDays,
        },
        {
          title: "Relatórios Avançados",
          url: "/admin/reports",
          icon: FileText,
          items: [
            { title: "Builder", url: "/admin/reports/builder" },
            { title: "Exportação", url: "/admin/reports/export" },
          ],
        },
      ];
    case 'PROFESSIONAL':
      return [
        {
          title: "Analytics da Equipe",
          url: "/trainer/analytics",
          icon: PieChart,
        },
        {
          title: "Meu Desempenho",
          url: "/trainer/performance",
          icon: BarChart3,
        },
        {
          title: "Calendário Compartilhado",
          url: "/professional/team-calendar",
          icon: CalendarDays,
        },
        {
          title: "Configurações de Disponibilidade",
          url: "/professional/schedule/availability",
          icon: Clock,
        },
      ];
    case 'CLIENT':
    default:
      return [
        {
          title: "Configurações de Conta",
          url: "/settings/account",
          icon: Settings,
        },
        {
          title: "Preferências",
          url: "/settings/preferences",
          icon: Settings,
        },
        {
          title: "Notificações",
          url: "/settings/notifications",
          icon: Bell,
        },
        {
          title: "Privacidade",
          url: "/settings/privacy",
          icon: Lock,
        },
      ];
  }
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { view } = useSidebarView()
  const pathname = usePathname()

  // Usar estado para evitar mismatch de hidratação
  const [isAdminView, setIsAdminView] = React.useState(false)
  const [hasMounted, setHasMounted] = React.useState(false)

  // Atualizar apenas no client após mount para evitar mismatch
  // Para rotas /super-admin/*, SEMPRE usar menu administrativo do SUPER_ADMIN
  React.useEffect(() => {
    setHasMounted(true)
    const isSuperAdminRoute = pathname?.startsWith('/super-admin') || false
    // Se for rota super-admin, sempre mostrar menu admin. Caso contrário, usar a visão salva
    setIsAdminView(isSuperAdminRoute || String(view) === 'admin')
  }, [view, pathname])

  const [hasNewDb, setHasNewDb] = React.useState(false)
  const [hasNewRedis, setHasNewRedis] = React.useState(false)
  const channel = React.useMemo(() => (typeof window !== 'undefined' ? new BroadcastChannel('fitos-admin-refresh') : null), [])
  React.useEffect(() => {
    if (!channel) return
    const handler = (ev: MessageEvent) => {
      if (ev.data?.type === 'connections') {
        if (String(ev.data?.provider).toLowerCase() === 'redis') {
          setHasNewRedis(true)
          setTimeout(() => setHasNewRedis(false), 15000)
        } else {
          setHasNewDb(true)
          setTimeout(() => setHasNewDb(false), 15000)
        }
      }
    }
    channel.addEventListener('message', handler as any)
    return () => channel.removeEventListener('message', handler as any)
  }, [channel])

  // Usar hook de sidebar dinâmica
  const { menuItems: dynamicMenus, isLoading: isLoadingDynamic, isError: isErrorDynamic } = useSidebarConfig()

  // Usar dados do usuário autenticado ou fallback para CLIENT
  const userRole: UserRole = (user?.role as UserRole) || 'CLIENT'

  // Extrair apenas props válidas do Sidebar
  const { variant = "inset", collapsible = "icon", side = "left", className, style, ...restProps } = props

  // Loading state ou aguardar mount para evitar hidratação
  if (isLoadingDynamic || !hasMounted) {
    return (
      <Sidebar variant={variant} collapsible={collapsible} side={side} className={className} style={style} suppressHydrationWarning>
        <SidebarContent>
          <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Em caso de erro no carregamento dinâmico, seguiremos com fallback de menus base (sem Alert)
  if (isErrorDynamic) {
    console.warn('⚠️ Sidebar dynamic config failed, falling back to base menus:', isErrorDynamic);
  }

  // Decidir fonte de menus respeitando visão (padrão x administrativa) - usar estado após mount
  const baseMenus = hasMounted && isAdminView
    ? getAdminMenuItems(userRole)
    : getStandardMenuItems(userRole)

  // Para visão administrativa: SEMPRE usar menus administrativos
  // Para visão padrão: preferir dinâmicos quando disponíveis, senão usar base
  // Usar estado após mount para evitar mismatch
  const effectiveMenus = (hasMounted && isAdminView)
    ? baseMenus
    : ((dynamicMenus && dynamicMenus.length > 0) ? dynamicMenus : baseMenus)

  // Se ainda não há menus efetivos, mostrar skeleton curto
  if (!effectiveMenus || effectiveMenus.length === 0) {
    return (
      <Sidebar variant={variant} collapsible={collapsible} side={side} className={className} style={style}>
        <SidebarHeader>
          <SimpleBrand
            userRole={userRole}
            companyName={undefined}
            companyPlan={undefined}
            showCompanyInfo={false}
          />
        </SidebarHeader>
        <SidebarContent>
          <div className="space-y-4 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Mapear ícones de string para componente Lucide
  const aliasMap: Record<string, keyof typeof LucideIcons> = {
    dashboard: 'BarChart3',
    analytics: 'PieChart',
    users: 'Users',
    clients: 'Users',
    settings: 'Settings',
    database: 'Database',
    ai: 'Brain',
    brain: 'Brain',
    whatsapp: 'MessageSquare',
    store: 'Store',
    crm: 'MessageCircle',
    nutrition: 'Apple',
    goals: 'Goal',
  };

  const toPascal = (name: string) =>
    name
      .replace(/[^a-zA-Z0-9]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join('');

  const resolveIcon = (icon?: any): LucideIcon => {
    if (!icon) return (LucideIcons.Circle as unknown) as LucideIcon;
    // Se já veio como componente (menus estáticos), usar direto
    if (typeof icon === 'function' || typeof icon === 'object') {
      return icon as LucideIcon;
    }
    if (typeof icon !== 'string') {
      return (LucideIcons.Circle as unknown) as LucideIcon;
    }
    const name: string = icon;
    // tentativa 1: exato
    const exact = (LucideIcons as any)[name];
    if (exact) return exact as LucideIcon;
    // tentativa 2: alias
    const alias = aliasMap[name.toLowerCase()];
    if (alias && (LucideIcons as any)[alias]) return (LucideIcons as any)[alias] as LucideIcon;
    // tentativa 3: PascalCase de kebab/snake
    const pascal = toPascal(name);
    const pascalIcon = (LucideIcons as any)[pascal];
    if (pascalIcon) return pascalIcon as LucideIcon;
    // tentativa 4: remover dígitos finais e reavaliar (ex.: BarChart3)
    const base = pascal.replace(/\d+$/, '');
    const with3 = base + '3';
    if ((LucideIcons as any)[with3]) return (LucideIcons as any)[with3] as LucideIcon;
    // fallback
    return (LucideIcons.Circle as unknown) as LucideIcon;
  };

  const menuItemsWithIcons = effectiveMenus.map(item => {
    // Lógica para bloquear itens no plano gratuito
    const isFreePlan = user?.plan === 'free';
    const restrictedItems = ['Analytics', 'CRM', 'Financeiro', 'Marketing', 'Relatórios', 'White Label'];
    const isRestricted = isFreePlan && restrictedItems.some(restricted => item.title.includes(restricted));

    return {
      ...item,
      title: (() => {
        let title = item.title;
        if (hasMounted && isAdminView) {
          if (String(item.title).toLowerCase() === 'database' && hasNewDb) title = `${item.title} (novo)`
          if (String(item.title).toLowerCase() === 'redis' && hasNewRedis) title = `${item.title} (novo)`
        }
        return title;
      })(),
      icon: resolveIcon(item.icon as unknown as string),
      items: item.items,
      // Adicionar propriedade visual de bloqueio (pode ser usada no componente de renderização do item)
      isLocked: isRestricted
    };
  });

  console.log('✅ Sidebar carregada do banco de dados:', {
    menuCount: menuItemsWithIcons.length,
    userRole,
    menus: menuItemsWithIcons.map(m => m.title)
  });

  return (
    <Sidebar variant={variant} collapsible={collapsible} side={side} className={className} style={style}>
      <SidebarHeader>
        <SimpleBrand
          userRole={userRole}
          companyName={undefined}
          companyPlan={undefined}
          showCompanyInfo={false}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuItemsWithIcons} />
        <div className="mt-auto px-2 pb-2">
          <AdWrapper position="sidebar" limit={1} className="mt-4" />
        </div>
      </SidebarContent>
    </Sidebar>
  )
}