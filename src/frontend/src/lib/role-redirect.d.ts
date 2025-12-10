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
export declare function getDashboardUrl(user: User): string;
/**
 * Retorna o nome amigável da role
 */
export declare function getRoleDisplayName(role: UserRole): string;
/**
 * Verifica se o usuário tem permissão para acessar uma rota específica
 */
export declare function hasPermission(user: User, route: string): boolean;
/**
 * Retorna as rotas permitidas para uma role específica
 */
export declare function getAllowedRoutes(role: UserRole): string[];
