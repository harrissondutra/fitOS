/**
 * Permissions Service
 * 
 * Serviço centralizado para gerenciar permissões por role.
 * Implementa RBAC (Role-Based Access Control).
 */

import { Permission, UserRole } from '../../../shared/types/permissions.types';

export class PermissionsService {
  // Mapeamento Role -> Permissions
  private rolePermissions: Record<UserRole, Permission[]> = {
    SUPER_ADMIN: Object.values(Permission), // Tudo
    
    ADMIN: [
      Permission.USERS_VIEW,
      Permission.USERS_CREATE,
      Permission.USERS_UPDATE,
      Permission.USERS_DELETE,
      Permission.CLIENTS_VIEW,
      Permission.CLIENTS_CREATE,
      Permission.CLIENTS_UPDATE,
      Permission.CLIENTS_DELETE,
      Permission.WORKOUTS_VIEW,
      Permission.WORKOUTS_CREATE,
      Permission.WORKOUTS_UPDATE,
      Permission.WORKOUTS_DELETE,
      Permission.EXERCISES_VIEW,
      Permission.EXERCISES_CREATE,
      Permission.EXERCISES_UPDATE,
      Permission.EXERCISES_DELETE,
      Permission.NUTRITION_MANAGE_CLIENTS,
      Permission.NUTRITION_CREATE_MEAL_PLANS,
      Permission.NUTRITION_VIEW_ALL_DIARIES,
      Permission.CRM_ACCESS,
      Permission.CRM_CREATE_DEALS,
      Permission.CRM_MANAGE_PIPELINES,
      Permission.WHATSAPP_ACCESS,
      Permission.WHATSAPP_SEND_MESSAGES,
      Permission.WHATSAPP_MANAGE_TEMPLATES,
      Permission.ANALYTICS_VIEW,
      Permission.ANALYTICS_EXPORT,
      Permission.SETTINGS_VIEW,
      Permission.SETTINGS_UPDATE,
      Permission.PLAN_LIMITS_MANAGE,
      Permission.MARKETING_ACCESS,
      Permission.MARKETING_CREATE_CAMPAIGNS,
    ],
    
    PROFESSIONAL: [
      Permission.CLIENTS_VIEW,
      Permission.CLIENTS_CREATE,
      Permission.CLIENTS_UPDATE,
      Permission.WORKOUTS_VIEW,
      Permission.WORKOUTS_CREATE,
      Permission.WORKOUTS_UPDATE,
      Permission.EXERCISES_VIEW,
      Permission.EXERCISES_CREATE,
      Permission.EXERCISES_UPDATE,
      Permission.NUTRITION_MANAGE_CLIENTS, // TODOS profissionais têm
      Permission.NUTRITION_CREATE_MEAL_PLANS, // TODOS profissionais têm
      Permission.NUTRITION_VIEW_ALL_DIARIES, // TODOS profissionais têm
      Permission.CRM_ACCESS, // TODOS profissionais têm
      Permission.CRM_CREATE_DEALS, // TODOS profissionais têm
      Permission.CRM_MANAGE_PIPELINES, // TODOS profissionais têm
      Permission.WHATSAPP_ACCESS, // TODOS profissionais têm
      Permission.WHATSAPP_SEND_MESSAGES, // TODOS profissionais têm
      Permission.WHATSAPP_MANAGE_TEMPLATES, // TODOS profissionais têm
      Permission.ANALYTICS_VIEW,
    ],
    
    EMPLOYEE: [
      // Permissões customizáveis pelo ADMIN
      // Por padrão: visualização apenas
      Permission.CLIENTS_VIEW,
      Permission.WORKOUTS_VIEW,
      Permission.EXERCISES_VIEW,
    ],
    
    CLIENT: [
      Permission.WORKOUTS_VIEW, // só visualizar os próprios
      Permission.EXERCISES_VIEW, // visualizar exercícios públicos
    ],
  };

  /**
   * Verifica se um role tem uma determinada permissão
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    return this.rolePermissions[role]?.includes(permission) || false;
  }

  /**
   * Verifica se um role tem todas as permissões fornecidas
   */
  hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(role, permission));
  }

  /**
   * Verifica se um role tem pelo menos uma das permissões fornecidas
   */
  hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(role, permission));
  }

  /**
   * Obtém todas as permissões de um role
   */
  getRolePermissions(role: UserRole): Permission[] {
    return this.rolePermissions[role] || [];
  }

  /**
   * Obtém roles que têm uma determinada permissão
   */
  getRolesWithPermission(permission: Permission): UserRole[] {
    const roles: UserRole[] = [];
    
    for (const [role, permissions] of Object.entries(this.rolePermissions)) {
      if (permissions.includes(permission)) {
        roles.push(role as UserRole);
      }
    }
    
    return roles;
  }

  /**
   * Verifica hierarquia de roles (SUPER_ADMIN > Promo > PROFESSIONAL > EMPLOYEE > CLIENT)
   */
  hasHigherOrEqualRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const hierarchy: Record<UserRole, number> = {
      SUPER_ADMIN: 5,
      ADMIN: 4,
      PROFESSIONAL: 3,
      EMPLOYEE: 2,
      CLIENT: 1,
    };
    
    return hierarchy[userRole] >= hierarchy[requiredRole];
  }

  /**
   * Verifica se o role pode acessar recursos do tenant
   */
  canAccessTenantResources(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'ADMIN', 'PROFESSIONAL', 'EMPLOYEE'].includes(role);
  }

  /**
   * Verifica se o role pode gerenciar usuários
   */
  canManageUsers(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  }

  /**
   * Verifica se o role pode acessar configurações do tenant
   */
  canAccessSettings(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  }

  /**
   * Verifica se o role pode acessar analytics globais
   */
  canAccessGlobalAnalytics(role: UserRole): boolean {
    return ['SUPER_ADMIN', 'ADMIN'].includes(role);
  }

  /**
   * Verifica se o role pode gerenciar limites de plano
   */
  canManagePlanLimits(role: UserRole): boolean {
    return role === 'SUPER_ADMIN';
  }
}

// Singleton instance
export const permissionsService = new PermissionsService();















