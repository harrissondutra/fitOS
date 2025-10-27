/**
 * Tipos para Middleware de Autenticação - FitOS
 * 
 * Tipos simplificados para o middleware Next.js
 */

export type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'NUTRITIONIST' | 'CLIENT';

export const DEFAULT_ROLE_REDIRECTS: Record<UserRole, string> = {
  SUPER_ADMIN: '/super-admin/dashboard',
  OWNER: '/admin/dashboard',
  ADMIN: '/admin/dashboard',
  TRAINER: '/trainer/dashboard',
  NUTRITIONIST: '/nutritionist/dashboard',
  CLIENT: '/nutrition-client/dashboard'
};

