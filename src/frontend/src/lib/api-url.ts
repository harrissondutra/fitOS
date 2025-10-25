/**
 * Utilitário para gerenciar URLs da API
 * Centraliza a configuração de URLs para evitar hardcoding
 */

// Simplified type definitions to avoid conflicts
type SimpleRequestInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: 'omit' | 'same-origin' | 'include';
  cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
  redirect?: 'follow' | 'error' | 'manual';
  referrer?: string;
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal;
};

// Função para obter a URL base da API
export function getApiUrl(): string {
  // Em desenvolvimento, usar proxy do Next.js (URL relativa)
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  
  // Em produção, usar variável de ambiente
  return process.env.NEXT_PUBLIC_API_URL || '';
}

// Função para construir URLs completas da API
export function buildApiUrl(endpoint: string): string {
  const baseUrl = getApiUrl();
  
  // Se baseUrl está vazio (desenvolvimento), usar endpoint relativo
  if (!baseUrl) {
    return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  }
  
  // Se baseUrl tem valor (produção), concatenar com endpoint
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
}

// URLs comuns da API
export const API_ENDPOINTS = {
  // Autenticação
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    ME: '/api/auth/me',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // Super Admin
  SUPER_ADMIN: {
    DASHBOARD_STATS: '/api/super-admin/dashboard/stats',
    TENANTS: '/api/super-admin/tenants',
    USERS: '/api/users',
    AI_SETTINGS: '/api/super-admin/ai-settings',
    AI_COSTS: '/api/super-admin/ai-costs',
    AI_TEMPLATES: '/api/super-admin/ai-templates',
    AI_SERVICES: '/api/super-admin/ai-service-configs',
    AI_LOGS: '/api/super-admin/ai-logs',
    AI_PROVIDERS: '/api/super-admin/ai-providers',
  },
  
  // Configurações do Sistema
  SETTINGS: {
    SYSTEM: '/api/settings/system',
    UPLOAD_LOGO: '/api/settings/upload/logo',
  },
  
  // Entidades principais
  CLIENTS: '/api/clients',
  WORKOUTS: '/api/workouts',
  EXERCISES: '/api/exercises',
  
  // Upload
  UPLOAD: {
    AVATAR: '/api/upload/avatar',
    LOGO: '/api/upload/logo',
    EXERCISE: '/api/upload/exercise',
    WORKOUT: '/api/upload/workout',
    GALLERY: '/api/upload/gallery',
    DOCUMENT: '/api/upload/document',
  },
} as const;

// Função helper para fazer requisições com configuração padrão
export async function apiRequest(
  endpoint: string,
  options: SimpleRequestInit = {}
): Promise<Response> {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: SimpleRequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  return fetch(url, defaultOptions);
}

// Função helper para requisições autenticadas
export async function authenticatedApiRequest(
  endpoint: string,
  options: SimpleRequestInit = {}
): Promise<Response> {
  const accessToken = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  
  return apiRequest(endpoint, {
    ...options,
    headers,
  });
}
