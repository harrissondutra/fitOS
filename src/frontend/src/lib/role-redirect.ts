/**
 * Função para determinar o dashboard correto baseado na role do usuário
 */

export type UserRole = 'owner' | 'admin' | 'trainer' | 'member';

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
  // Normalizar a role para lowercase
  const normalizedRole = user.role.toLowerCase() as UserRole;
  
  switch (normalizedRole) {
    case 'owner':
    case 'admin':
      return '/admin/dashboard';
    
    case 'trainer':
      return '/trainer/dashboard';
    
    case 'member':
    default:
      return '/dashboard';
  }
}

/**
 * Retorna o nome amigável da role
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role.toLowerCase() as UserRole) {
    case 'owner':
      return 'Proprietário';
    case 'admin':
      return 'Administrador';
    case 'trainer':
      return 'Personal Trainer';
    case 'member':
      return 'Membro';
    default:
      return 'Usuário';
  }
}

/**
 * Verifica se o usuário tem permissão para acessar uma rota específica
 */
export function hasPermission(user: User, route: string): boolean {
  const normalizedRole = user.role.toLowerCase() as UserRole;
  
  // Admin e Owner podem acessar tudo
  if (normalizedRole === 'admin' || normalizedRole === 'owner') {
    return true;
  }
  
  // Trainer pode acessar rotas de trainer e member
  if (normalizedRole === 'trainer') {
    return route.startsWith('/trainer') || route.startsWith('/dashboard');
  }
  
  // Member só pode acessar rotas de member
  if (normalizedRole === 'member') {
    return route.startsWith('/dashboard') && !route.startsWith('/admin') && !route.startsWith('/trainer');
  }
  
  return false;
}

/**
 * Retorna as rotas permitidas para uma role específica
 */
export function getAllowedRoutes(role: UserRole): string[] {
  switch (role.toLowerCase() as UserRole) {
    case 'owner':
    case 'admin':
      return [
        '/admin/dashboard',
        '/trainer/dashboard',
        '/dashboard',
        '/admin/users',
        '/admin/settings',
        '/admin/reports'
      ];
    
    case 'trainer':
      return [
        '/trainer/dashboard',
        '/dashboard',
        '/trainer/clients',
        '/trainer/workouts',
        '/trainer/schedule'
      ];
    
    case 'member':
    default:
      return [
        '/dashboard',
        '/workout',
        '/profile',
        '/progress'
      ];
  }
}
