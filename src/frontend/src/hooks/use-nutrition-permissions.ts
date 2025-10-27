/**
 * Frontend Nutrition Permissions Hook - FitOS Sprint 4
 * 
 * Hook para controle de acesso no frontend baseado em roles de usuário
 * com separação clara entre visão profissional e cliente.
 */

import { useAuth } from '@/hooks/use-auth';
import { UserRole } from '@/shared/types/auth.types';

export interface NutritionPermissions {
  // Acesso geral ao módulo nutricional
  canAccessNutrition: boolean;
  
  // Permissões profissionais (nutricionistas)
  canManageClients: boolean;
  canCreateMealPlans: boolean;
  canEditMealPlans: boolean;
  canDeleteMealPlans: boolean;
  canViewAllFoodDiaries: boolean;
  canCreateConsultations: boolean;
  canManageGoals: boolean;
  canViewLabExams: boolean;
  canPrescribeSupplements: boolean;
  canAccessFoodDatabase: boolean;
  canCreateRecipes: boolean;
  canViewAnalytics: boolean;
  
  // Permissões de cliente
  canViewOwnMealPlan: boolean;
  canLogFoodDiary: boolean;
  canViewOwnProgress: boolean;
  canViewOwnConsultations: boolean;
  canViewOwnGoals: boolean;
  canViewOwnExams: boolean;
  
  // Permissões CRM (apenas profissionais)
  canAccessCRM: boolean;
  canManagePipelines: boolean;
  canManageDeals: boolean;
  canCreateAutomations: boolean;
  canViewCRMAnalytics: boolean;
  
  // Permissões WhatsApp (apenas profissionais)
  canAccessWhatsApp: boolean;
  canSendMessages: boolean;
  canManageTemplates: boolean;
  
  // Permissões Marketing (apenas OWNER/ADMIN)
  canAccessMarketing: boolean;
  canCreateCampaigns: boolean;
  canManageTemplates: boolean;
  canViewMarketingAnalytics: boolean;
}

export function useNutritionPermissions(): NutritionPermissions {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isOwner = userRole === 'OWNER';
  const isAdmin = userRole === 'ADMIN';
  const isNutritionist = userRole === 'NUTRITIONIST';
  const isTrainer = userRole === 'TRAINER';
  const isClient = userRole === 'CLIENT';
  
  // Roles profissionais (podem gerenciar nutrição)
  const isProfessional = isSuperAdmin || isOwner || isAdmin || isNutritionist;
  
  // Roles que podem acessar CRM
  const canAccessCRM = isSuperAdmin || isOwner || isAdmin || isNutritionist;
  
  // Roles que podem acessar marketing
  const canAccessMarketing = isSuperAdmin || isOwner || isAdmin;

  return {
    // Acesso geral
    canAccessNutrition: isProfessional || isClient,
    
    // Permissões profissionais
    canManageClients: isProfessional,
    canCreateMealPlans: isProfessional,
    canEditMealPlans: isProfessional,
    canDeleteMealPlans: isProfessional,
    canViewAllFoodDiaries: isProfessional,
    canCreateConsultations: isProfessional,
    canManageGoals: isProfessional,
    canViewLabExams: isProfessional,
    canPrescribeSupplements: isProfessional,
    canAccessFoodDatabase: isProfessional || isClient, // Clientes podem buscar alimentos
    canCreateRecipes: isProfessional,
    canViewAnalytics: isProfessional,
    
    // Permissões de cliente
    canViewOwnMealPlan: isClient,
    canLogFoodDiary: isClient,
    canViewOwnProgress: isClient,
    canViewOwnConsultations: isClient,
    canViewOwnGoals: isClient,
    canViewOwnExams: isClient,
    
    // Permissões CRM
    canAccessCRM: canAccessCRM,
    canManagePipelines: canAccessCRM,
    canManageDeals: canAccessCRM,
    canCreateAutomations: canAccessCRM,
    canViewCRMAnalytics: canAccessCRM,
    
    // Permissões WhatsApp
    canAccessWhatsApp: isProfessional,
    canSendMessages: isProfessional,
    canManageTemplates: isProfessional,
    
    // Permissões Marketing
    canAccessMarketing: canAccessMarketing,
    canCreateCampaigns: canAccessMarketing,
    canManageTemplates: canAccessMarketing,
    canViewMarketingAnalytics: canAccessMarketing,
  };
}

/**
 * Hook para verificar se o usuário pode acessar uma rota específica
 */
export function useRouteAccess() {
  const permissions = useNutritionPermissions();
  
  const canAccessRoute = (route: string): boolean => {
    // Rotas de nutricionista (apenas profissionais)
    if (route.startsWith('/nutritionist/')) {
      return permissions.canManageClients || permissions.canCreateMealPlans;
    }
    
    // Rotas de cliente nutricional (clientes e profissionais podem acessar)
    if (route.startsWith('/nutrition-client/')) {
      return permissions.canAccessNutrition;
    }
    
    // Rotas de CRM (apenas profissionais)
    if (route.startsWith('/professional/crm/')) {
      return permissions.canAccessCRM;
    }
    
    // Rotas de WhatsApp (apenas profissionais)
    if (route.startsWith('/professional/whatsapp/')) {
      return permissions.canAccessWhatsApp;
    }
    
    // Rotas de Marketing (apenas OWNER/ADMIN)
    if (route.startsWith('/professional/marketing/')) {
      return permissions.canAccessMarketing;
    }
    
    // Rotas de admin (apenas SUPER_ADMIN, OWNER, ADMIN)
    if (route.startsWith('/admin/')) {
      return permissions.canAccessMarketing; // Mesma lógica de marketing
    }
    
    return false;
  };
  
  return { canAccessRoute };
}

/**
 * Componente de proteção de rota
 */
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: keyof NutritionPermissions;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  fallback = <div>Acesso negado</div> 
}: ProtectedRouteProps) {
  const permissions = useNutritionPermissions();
  
  if (!permissions[requiredPermission]) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * Hook para redirecionamento baseado em role
 */
export function useRoleRedirect() {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;
  
  const getDefaultRoute = (): string => {
    switch (userRole) {
      case 'SUPER_ADMIN':
      case 'OWNER':
      case 'ADMIN':
        return '/admin/dashboard';
      case 'NUTRITIONIST':
        return '/nutritionist/dashboard';
      case 'TRAINER':
        return '/trainer/dashboard';
      case 'CLIENT':
        return '/nutrition-client/dashboard';
      default:
        return '/dashboard';
    }
  };
  
  return { getDefaultRoute };
}

