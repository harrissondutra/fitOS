"use client"

import * as React from "react"
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
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { SimpleBrand } from "@/components/sidebar/simple-brand"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { UserRole, SidebarView } from "@/shared/types/auth.types"
import { useAuth } from "@/hooks/use-auth"
import { useSidebarView } from "@/hooks/use-sidebar-view"

// Função para gerar menu items da visão padrão (operacional)
const getStandardMenuItems = (userRole: UserRole) => {
  switch (userRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'TRAINER':
      return [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: BarChart3,
        },
        {
          title: "Clientes",
          url: "/clients",
          icon: Users,
          items: [
            { title: "Lista de Clientes", url: "/clients" },
            { title: "Novos Clientes", url: "/clients/new" },
            { title: "Importar", url: "/clients/import" },
          ],
        },
        {
          title: "Treinos & Exercícios",
          url: "/workouts",
          icon: Target,
          items: [
            { title: "Treinos", url: "/workouts" },
            { title: "Exercícios", url: "/exercises" },
            { title: "Metas", url: "/goals" },
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
          url: "/bioimpedance",
          icon: Stethoscope,
          items: [
            { title: "Bioimpedância", url: "/bioimpedance" },
            { title: "Evolução", url: "/bioimpedance/evolution" },
            { title: "Comparação", url: "/bioimpedance/compare" },
          ],
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
          url: "/workouts",
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
          title: "Minhas Bioimpedâncias",
          url: "/bioimpedance",
          icon: Activity,
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
            { title: "Logs & Monitoramento", url: "/super-admin/ai/logs" },
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
          url: "/super-admin/management",
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
            { title: "Clientes", url: "/admin/clients" },
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
    case 'TRAINER':
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { view } = useSidebarView()
  
  // Usar dados do usuário autenticado ou fallback para CLIENT
  const userRole: UserRole = (user?.role as UserRole) || 'CLIENT'
  
  const mockCompanies = [
    {
      id: 'academia-premium',
      name: 'Academia Premium',
      plan: 'Professional',
      logo: Building
    },
    {
      id: 'clinica-fisio',
      name: 'Clínica FisioLife',
      plan: 'Enterprise',
      logo: Building
    },
    {
      id: 'personal-trainer',
      name: 'Personal Trainer João',
      plan: 'Individual',
      logo: Building
    }
  ];
  
  // Escolher menu baseado na visão atual
  const menuItems = view === 'admin' 
    ? getAdminMenuItems(userRole)
    : getStandardMenuItems(userRole)

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SimpleBrand 
          userRole={userRole}
          companyName={mockCompanies?.[0]?.name}
          companyPlan={mockCompanies?.[0]?.plan}
          showCompanyInfo={userRole === 'SUPER_ADMIN' && mockCompanies?.length > 0}
          companyLogo={undefined}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuItems} />
      </SidebarContent>
    </Sidebar>
  )
}