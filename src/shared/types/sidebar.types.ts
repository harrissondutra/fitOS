/**
 * Módulos da sidebar organizados por área funcional
 */
export type MenuModule = 
  | 'core'           // Dashboard, Perfil, Chat IA (todos os roles)
  | 'training'       // Treinos, Exercícios, Avaliações (TRAINER)
  | 'nutrition'      // Nutrição, Planos Alimentares, Bioimpedância (NUTRITIONIST)
  | 'scheduling'     // Agendamentos, Disponibilidade (TRAINER, NUTRITIONIST)
  | 'crm'            // CRM, Pipeline, Campanhas (ADMIN, OWNER)
  | 'communication'  // WhatsApp, Notificações (ADMIN, OWNER)
  | 'analytics'      // Analytics, Relatórios (ADMIN, OWNER)
  | 'marketplace'    // Marketplace (disponível em planos superiores)
  | 'admin'          // Gestão de Usuários, Configurações (ADMIN, OWNER)
  | 'superadmin';    // Configurações Globais, White Label (SUPER_ADMIN)

/**
 * Item individual do menu
 */
export interface SidebarMenuItem {
  id: string;                    // ID único (ex: 'dashboard', 'crm', 'nutrition')
  title: string;                 // Título exibido
  url: string;                   // Rota
  icon: string;                  // Nome do ícone Lucide React
  module: MenuModule;            // Módulo ao qual pertence
  requiredFeature?: string;      // Feature do plano necessária (ex: 'whatsappIntegration')
  requiredRoles?: string[];      // Roles permitidas
  isVisible: boolean;            // Visibilidade
  order: number;                 // Ordem de exibição
  items?: SidebarSubMenuItem[];  // Sub-menus
  badge?: string;                // Badge opcional (ex: 'New', 'Pro')
  customIcon?: string;           // URL ícone customizado (upload)
}

export interface SidebarSubMenuItem {
  id: string;
  title: string;
  url: string;
  requiredFeature?: string;
  requiredRoles?: string[];
  isVisible: boolean;
}

export interface SidebarConfig {
  plan: string;
  menuItems: SidebarMenuItem[];
  version: number;
  changelog?: string;
}

export interface TenantSidebarCustomization {
  tenantId: string;
  enabledModules: MenuModule[];
  hiddenMenuIds: string[];
  menuOrder: string[];
  customizations: {
    [menuId: string]: {
      customTitle?: string;
      customIcon?: string;
    };
  };
}

/**
 * Mapeamento de roles para módulos permitidos
 */
export const ROLE_MODULE_MAP: Record<string, MenuModule[]> = {
  'SUPER_ADMIN': ['core', 'training', 'nutrition', 'scheduling', 'crm', 'communication', 'analytics', 'marketplace', 'admin', 'superadmin'],
  'OWNER': ['core', 'training', 'nutrition', 'scheduling', 'crm', 'communication', 'analytics', 'marketplace', 'admin'],
  'ADMIN': ['core', 'training', 'nutrition', 'scheduling', 'crm', 'communication', 'analytics', 'admin'],
  'TRAINER': ['core', 'training', 'scheduling'], // ⭐ Personal Trainer vê apenas treinos
  'NUTRITIONIST': ['core', 'nutrition', 'scheduling'], // ⭐ Nutricionista vê apenas nutrição
  'CLIENT': ['core'] // Cliente vê apenas perfil e progresso
};


















