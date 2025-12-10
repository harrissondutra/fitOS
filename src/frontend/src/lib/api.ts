'use client'

import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * API Endpoints - Constantes para endpoints da API (legacy support)
 */
export const API_ENDPOINTS = {
  SETTINGS: {
    SYSTEM: '/api/admin/settings/system',
    UPLOAD_LOGO: '/api/admin/settings/upload-logo',
  },
  SUPER_ADMIN: {
    DASHBOARD_STATS: '/api/admin/dashboard/stats',
    TENANTS: '/api/admin/tenants',
  },
} as const;

/**
 * Authenticated API Request - Helper para requests com autenticação (legacy support)
 * @param endpoint - URL endpoint
 * @param options - Opções fetch
 * @returns Response data
 */
export async function authenticatedApiRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  // Buscar accessToken (compatível com AuthContext)
  let accessToken = localStorage.getItem('accessToken');
  
  // Fallback para formato antigo
  if (!accessToken) {
    const tokens = localStorage.getItem('fitos_tokens');
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        accessToken = parsedTokens.accessToken || '';
      } catch (error) {
        console.error('Error parsing tokens:', error);
      }
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      ...options.headers,
    },
  });

  // Verificar se a resposta é JSON antes de fazer parse
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  if (!response.ok && (response.status === 401 || response.status === 403)) {
    // Tentar parsear resposta de erro para verificar mensagem específica
    let errorMessage = 'Unauthorized';
    if (isJson) {
      try {
        const errorData = await response.clone().json();
        errorMessage = errorData?.error || errorData?.message || 'Unauthorized';
      } catch {
        // Ignorar erro de parse
      }
    }

    // Verificar se é erro de token expirado (TOKEN_EXPIRED ou qualquer 401)
    const isTokenExpired = response.status === 401 || 
                          errorMessage === 'TOKEN_EXPIRED' || 
                          errorMessage?.includes('expired') ||
                          errorMessage?.includes('expirou');

    if (isTokenExpired) {
      // Limpar todos os dados de autenticação
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('fitos_tokens');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        
        // Redirecionar para login imediatamente
        window.location.href = '/auth/login';
      }
      throw new Error('TOKEN_EXPIRED');
    }
    
    throw new Error(errorMessage || 'Unauthorized');
  }

  // Retornar JSON se for JSON, senão retornar texto
  if (isJson) {
    return response.json();
  }
  return response.text();
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') {
      return config; // SSR - skip
    }
    
    // Tentar buscar token (compatível com AuthContext)
    let accessToken = localStorage.getItem('accessToken'); // Formato do AuthContext
    
    // Fallback para formato antigo (fitos_tokens)
    if (!accessToken) {
      const tokens = localStorage.getItem('fitos_tokens');
      if (tokens) {
        try {
          const parsedTokens = JSON.parse(tokens);
          accessToken = parsedTokens.accessToken;
        } catch (error) {
          console.error('[API Interceptor] Error parsing fitos_tokens:', error);
          localStorage.removeItem('fitos_tokens');
        }
      }
    }
    
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[API Interceptor] ✅ Authorization header added');
    } else {
      console.warn('[API Interceptor] ⚠️ No access token found - user may not be logged in');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Verificar se é erro de autenticação (401 ou TOKEN_EXPIRED)
    const isAuthError = error.response?.status === 401 || 
                       error.response?.status === 403 ||
                       error.response?.data?.error === 'TOKEN_EXPIRED' ||
                       error.response?.data?.message === 'TOKEN_EXPIRED' ||
                       error.message === 'TOKEN_EXPIRED';

    if (isAuthError && !originalRequest._retry) {
      originalRequest._retry = true;

      // Verificar se a mensagem de erro indica token expirado
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || '';
      const isTokenExpired = errorMessage === 'TOKEN_EXPIRED' || 
                            errorMessage?.includes('expired') ||
                            errorMessage?.includes('expirou') ||
                            error.response?.status === 401;

      // Se for token expirado, não tentar refresh - redirecionar direto
      if (isTokenExpired) {
        // Limpar todos os dados de autenticação
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('fitos_tokens');
          localStorage.removeItem('user');
          localStorage.removeItem('tenantId');
          
          // Redirecionar para login imediatamente
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }

      // Se não for token expirado, tentar refresh
      try {
        // Buscar refreshToken (compatível com AuthContext)
        let refreshToken = localStorage.getItem('refreshToken');
        
        // Fallback para formato antigo
        if (!refreshToken) {
          const tokens = localStorage.getItem('fitos_tokens');
          if (tokens) {
            try {
              const parsedTokens = JSON.parse(tokens);
              refreshToken = parsedTokens.refreshToken;
            } catch {}
          }
        }

        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          if (response.data.success) {
            const newAccessToken = response.data.data?.accessToken || response.data.accessToken;
            const newRefreshToken = response.data.data?.refreshToken || response.data.refreshToken;
            
            // Salvar tokens (compatível com AuthContext)
            localStorage.setItem('accessToken', newAccessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }

      // Se refresh falhou, limpar tokens e redirecionar
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('fitos_tokens');
        localStorage.removeItem('user');
        localStorage.removeItem('tenantId');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
