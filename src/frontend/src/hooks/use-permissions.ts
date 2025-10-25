import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

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
}

export function usePermissions(userRole?: UserRole): UsePermissionsReturn {
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
  });

  const updatePermissions = useCallback((role: UserRole) => {
    const newPermissions: UsePermissionsReturn = {
      canAccess: (resource: string, action?: string) => {
        // SUPER_ADMIN tem acesso a TUDO - é o dono do sistema
        if (role === 'SUPER_ADMIN') {
          return true;
        }
        
        // Define resource-based permissions para outros roles
        switch (resource) {
          case 'users':
            return ['OWNER', 'ADMIN'].includes(role);
          case 'members':
            return ['OWNER', 'ADMIN', 'TRAINER'].includes(role);
          case 'workouts':
            return ['OWNER', 'ADMIN', 'TRAINER'].includes(role);
          case 'exercises':
            return ['OWNER', 'ADMIN', 'TRAINER'].includes(role);
          case 'analytics':
            return ['OWNER', 'ADMIN'].includes(role);
          case 'plan-limits':
            return ['OWNER'].includes(role);
          case 'export':
            return ['OWNER', 'ADMIN'].includes(role);
          default:
            return false;
        }
      },
      canManageUsers: role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN'].includes(role),
      canManageClients: role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN', 'TRAINER'].includes(role),
      canManageWorkouts: role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN', 'TRAINER'].includes(role),
      canManageExercises: role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN', 'TRAINER'].includes(role),
      canViewAnalytics: role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN'].includes(role),
      canViewGlobalAnalytics: role === 'SUPER_ADMIN',
      canManagePlanLimits: role === 'SUPER_ADMIN' || ['OWNER'].includes(role),
      canExportData: role === 'SUPER_ADMIN' || ['OWNER', 'ADMIN'].includes(role),
    };

    setPermissions(newPermissions);
  }, []);

  useEffect(() => {
    if (userRole) {
      updatePermissions(userRole);
    }
  }, [userRole, updatePermissions]);

  return permissions;
}
