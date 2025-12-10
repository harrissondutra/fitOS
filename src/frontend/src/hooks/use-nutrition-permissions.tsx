/**
 * Frontend Nutrition Permissions Hook - FitOS Sprint 4
 * 
 * Hook para controle de acesso no frontend baseado em roles de usuário
 * com separação clara entre visão profissional e cliente.
 */

import React from 'react';
import { useAuth } from './use-auth';
import { UserRole, UserRoles } from '../shared/types/auth.types';

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
  canViewMarketingAnalytics: boolean;
}

export function useNutritionPermissions(): NutritionPermissions {
  const { user } = useAuth();
  const userRole = user?.role as UserRole;

  const isSuperAdmin = userRole === UserRoles.SUPER_ADMIN;
  const isAdmin = userRole === UserRoles.ADMIN;
  // Professional is not a role, but a category. Check if user is Trainer or Nutritionist
  const isProfessional = userRole === UserRoles.TRAINER || userRole === UserRoles.NUTRITIONIST;
  const isEmployee = userRole === UserRoles.EMPLOYEE; // Keep legacy check for now or remove if unused
  const isClient = userRole === UserRoles.CLIENT;

  // Roles profissionais (podem gerenciar nutrição)
  const canManageNutrition = isSuperAdmin || isAdmin || isProfessional;

  // Roles que podem acessar CRM (PROFESSIONAL também tem)
  const canAccessCRM = isSuperAdmin || isAdmin || isProfessional;

  // Roles que podem acessar marketing (apenas ADMIN)
  const canAccessMarketing = isSuperAdmin || isAdmin;

  return {
    // Acesso geral
    canAccessNutrition: canManageNutrition || isClient,

    // Permissões profissionais
    canManageClients: canManageNutrition,
    canCreateMealPlans: canManageNutrition,
    canEditMealPlans: canManageNutrition,
    canDeleteMealPlans: canManageNutrition,
    canViewAllFoodDiaries: canManageNutrition,
    canCreateConsultations: canManageNutrition,
    canManageGoals: canManageNutrition,
    canViewLabExams: canManageNutrition,
    canPrescribeSupplements: canManageNutrition,
    canAccessFoodDatabase: canManageNutrition || isClient, // Clientes podem buscar alimentos
    canCreateRecipes: canManageNutrition,
    canViewAnalytics: canManageNutrition,

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
    canAccessWhatsApp: canManageNutrition,
    canSendMessages: canManageNutrition,
    canManageTemplates: canManageNutrition,

    // Permissões Marketing
    canAccessMarketing: canAccessMarketing,
    canCreateCampaigns: canAccessMarketing,
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
      case UserRoles.SUPER_ADMIN:
      case UserRoles.OWNER:
      case UserRoles.ADMIN:
        return '/admin/dashboard';
      case UserRoles.NUTRITIONIST:
        return '/nutritionist/dashboard';
      case UserRoles.TRAINER:
        return '/trainer/dashboard';
      case UserRoles.CLIENT:
        return '/nutrition-client/dashboard';
      default:
        return '/dashboard';
    }
  };

  return { getDefaultRoute };
}

