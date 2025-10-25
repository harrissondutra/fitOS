/**
 * Função para determinar o dashboard correto baseado na role do usuário
 */

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: string;
}

/**
 * Retorna a URL do dashboard baseado na role do usuário
 */
export function getDashboardUrl(user: User): string {
  console.log('🔍 getDashboardUrl chamada com user:', user);
  console.log('🔍 user.role:', user.role);
  
  switch (user.role) {
    case 'SUPER_ADMIN':
      console.log('🔍 Retornando /super-admin/dashboard');
      return '/super-admin/dashboard';
    
    case 'OWNER':
    case 'ADMIN':
      console.log('🔍 Retornando /admin/dashboard');
      return '/admin/dashboard';
    
    case 'TRAINER':
      console.log('🔍 Retornando /trainer/dashboard');
      return '/trainer/dashboard';
    
    case 'CLIENT':
    default:
      console.log('🔍 Retornando /client/workouts (default)');
      return '/client/workouts';
  }
}

/**
 * Retorna o nome amigável da role
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'Super Administrador';
    case 'OWNER':
      return 'Proprietário';
    case 'ADMIN':
      return 'Administrador';
    case 'TRAINER':
      return 'Personal Trainer';
    case 'CLIENT':
      return 'Cliente';
    default:
      return 'Usuário';
  }
}

/**
 * Verifica se o usuário tem permissão para acessar uma rota específica
 */
export function hasPermission(user: User, route: string): boolean {
  // Super Admin pode acessar tudo
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }
  
  // Admin e Owner podem acessar tudo exceto super-admin
  if (user.role === 'ADMIN' || user.role === 'OWNER') {
    return !route.startsWith('/super-admin');
  }
  
  // Trainer pode acessar rotas de trainer e member
  if (user.role === 'TRAINER') {
    return route.startsWith('/trainer') || route.startsWith('/dashboard');
  }
  
  // Client só pode acessar rotas de client
  if (user.role === 'CLIENT') {
    return route.startsWith('/client') && !route.startsWith('/admin') && !route.startsWith('/trainer') && !route.startsWith('/super-admin');
  }
  
  return false;
}

/**
 * Retorna as rotas permitidas para uma role específica
 */
export function getAllowedRoutes(role: UserRole): string[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return [
        '/super-admin/dashboard',
        '/super-admin/tenants',
        '/super-admin/plans',
        '/super-admin/custom-plans',
        '/admin/dashboard',
        '/trainer/dashboard',
        '/dashboard'
      ];
    
    case 'OWNER':
    case 'ADMIN':
      return [
        '/admin/dashboard',
        '/trainer/dashboard',
        '/dashboard',
        '/admin/users',
        '/admin/settings',
        '/admin/reports'
      ];
    
    case 'TRAINER':
      return [
        '/trainer/dashboard',
        '/dashboard',
        '/trainer/clients',
        '/trainer/workouts',
        '/trainer/schedule'
      ];
    
    case 'CLIENT':
    default:
      return [
        '/client/workouts',
        '/client/progress',
        '/client/exercises',
        '/profile'
      ];
  }
}
