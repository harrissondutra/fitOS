import { useState, useCallback, useEffect } from 'react';
import { UserRole, UserRoles } from '@/shared/types/auth.types';

interface UsePermissionsReturn {
  canAccess: (resource: string, action?: string) => boolean;
  canManageUsers: boolean;
  canManageClients: boolean;
  canManageWorkouts: boolean;
  canManageExercises: boolean;
  canViewAnalytics: boolean;
  canViewGlobalAnalytics: boolean;
  canManagePlanLimits: boolean;
  canExportData: boolean;
  // Permissões nutricionais
  canManageNutrition: boolean;
  canCreateMealPlans: boolean;
  canViewFoodDiary: boolean;
  canAccessCRM: boolean;
  canAccessWhatsApp: boolean;
  canAccessMarketing: boolean;
  // Permissões de analytics
  analyticsHistoryDays: number;
  canViewAdvancedCharts: boolean;
}

export function usePermissions(userRole?: UserRole, userPlan?: string): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<UsePermissionsReturn>({
    canAccess: () => false,
    canManageUsers: false,
    canManageClients: false,
    canManageWorkouts: false,
    canManageExercises: false,
    canViewAnalytics: false,
    canViewGlobalAnalytics: false,
    canManagePlanLimits: false,
    canExportData: false,
    canManageNutrition: false,
    canCreateMealPlans: false,
    canViewFoodDiary: false,
    canAccessCRM: false,
    canAccessWhatsApp: false,
    canAccessMarketing: false,
    analyticsHistoryDays: 7,
    canViewAdvancedCharts: false,
  });

  const updatePermissions = useCallback((role: UserRole, plan?: string) => {
    // Se for plano gratuito, bloquear funcionalidades administrativas
    const isFreePlan = plan === 'free';

    const newPermissions: UsePermissionsReturn = {
      canAccess: (resource: string, action?: string) => {
        // SUPER_ADMIN tem acesso a TUDO - é o dono do sistema
        if (role === UserRoles.SUPER_ADMIN) {
          return true;
        }

        // Bloqueios do plano gratuito
        if (isFreePlan) {
          const blockedResources = ['analytics', 'plan-limits', 'export', 'crm', 'marketing'];
          if (blockedResources.includes(resource)) {
            return false;
          }
        }

        const checkRole = (allowed: UserRole[]) => allowed.includes(role);

        // Define resource-based permissions para outros roles
        switch (resource) {
          case 'users':
            return checkRole([UserRoles.ADMIN]);
          case 'members':
            return checkRole([UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL]);
          case 'workouts':
            return checkRole([UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.PROFESSIONAL]);
          case 'exercises':
            return checkRole([UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.PROFESSIONAL]);
          case 'analytics':
            return checkRole([UserRoles.ADMIN]);
          case 'plan-limits':
            return checkRole([UserRoles.ADMIN]);
          case 'export':
            return checkRole([UserRoles.ADMIN]);
          default:
            return false;
        }
      },
      canManageUsers: !isFreePlan && (role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN),
      canManageClients: role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL].includes(role as any),
      canManageWorkouts: role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.PROFESSIONAL].includes(role as any),
      canManageExercises: role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.PROFESSIONAL].includes(role as any),
      canViewAnalytics: !isFreePlan && (role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN),
      canViewGlobalAnalytics: role === UserRoles.SUPER_ADMIN,
      canManagePlanLimits: !isFreePlan && (role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN),
      canExportData: !isFreePlan && (role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN),
      // Permissões nutricionais (PROFESSIONAL tem acesso)
      canManageNutrition: role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL].includes(role as any),
      canCreateMealPlans: role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL].includes(role as any),
      canViewFoodDiary: role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL, UserRoles.CLIENT].includes(role as any),
      canAccessCRM: !isFreePlan && (role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL].includes(role as any)),
      canAccessWhatsApp: !isFreePlan && (role === UserRoles.SUPER_ADMIN || [UserRoles.ADMIN, UserRoles.TRAINER, UserRoles.NUTRITIONIST, UserRoles.PROFESSIONAL].includes(role as any)),
      canAccessMarketing: !isFreePlan && (role === UserRoles.SUPER_ADMIN || role === UserRoles.ADMIN),
      // Analytics por plano - FREE tem acesso completo aos próprios dados para engajamento
      analyticsHistoryDays: (() => {
        // FREE: acesso completo aos próprios dados (estratégia de conversão)
        // Diferenciação está em funcionalidades administrativas, não visualização
        return 365; // Todos os planos: 1 ano de histórico
      })(),
      // Charts avançados disponíveis para todos (engajamento)
      // Bloqueio está em funcionalidades empresariais (CRM, exportação, etc)
      canViewAdvancedCharts: true,
    };

    setPermissions(newPermissions);
  }, []);

  useEffect(() => {
    if (userRole) {
      updatePermissions(userRole, userPlan);
    }
  }, [userRole, userPlan, updatePermissions]);

  return permissions;
}
