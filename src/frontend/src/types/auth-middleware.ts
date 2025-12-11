/**
 * Tipos para Middleware de Autenticação - FitOS
 * 
 * Tipos simplificados para o middleware Next.js
 */

export const UserRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  TRAINER: 'TRAINER',
  NUTRITIONIST: 'NUTRITIONIST',
  CLIENT: 'CLIENT',
} as const;

export type UserRole = keyof typeof UserRoles;

export const DEFAULT_ROLE_REDIRECTS: Record<UserRole, string> = {
  SUPER_ADMIN: '/dashboard',
  OWNER: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  TRAINER: '/trainer/dashboard',
  NUTRITIONIST: '/nutritionist/dashboard',
  CLIENT: '/dashboard'
};
