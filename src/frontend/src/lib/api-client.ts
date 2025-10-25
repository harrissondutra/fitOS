/**
 * Configuração do Axios com Interceptors - FitOS
 * 
 * Configuração do Axios com interceptors para:
 * - Adicionar token de autenticação automaticamente
 * - Renovar tokens expirados automaticamente
 * - Tratar erros de autenticação
 * - Gerenciar loading states
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'sonner';

// ============================================================================
// CONFIGURAÇÃO BASE
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Instância base do Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================================
// INTERCEPTORS DE REQUEST
// ============================================================================

apiClient.interceptors.request.use(
  (config: any) => {
    // Adicionar token de autenticação se disponível
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Adicionar tenant ID e role se disponível
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.tenantId && config.headers) {
          config.headers['X-Tenant-ID'] = userData.tenantId;
        }
        if (userData.role && config.headers) {
          config.headers['x-user-role'] = userData.role;
        }
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
      }
    }

    // Log da requisição em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('Erro no interceptor de request:', error);
    return Promise.reject(error);
  }
);

// ============================================================================
// INTERCEPTORS DE RESPONSE
// ============================================================================

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log da resposta em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`, {
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Log do erro em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, {
        data: error.response?.data,
        message: error.message,
      });
    }

    // Tratar erro 401 (Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Tentar renovar o token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const refreshResponse = await axios.post('/api/auth/refresh', {
            refreshToken,
          });

          if (refreshResponse.data.success) {
            // Salvar novos tokens
            localStorage.setItem('accessToken', refreshResponse.data.accessToken);
            localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);

            // Atualizar header da requisição original
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.accessToken}`;
            }

            // Retry da requisição original
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('Erro ao renovar token:', refreshError);
      }

      // Se chegou aqui, o refresh falhou - fazer logout
      handleAuthError();
    }

    // Tratar outros erros
    handleApiError(error);

    return Promise.reject(error);
  }
);

// ============================================================================
// FUNÇÕES DE TRATAMENTO DE ERRO
// ============================================================================

function handleAuthError() {
  // Limpar dados de autenticação
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');

  // Mostrar notificação
  toast.error('Sessão expirada', {
    description: 'Faça login novamente para continuar'
  });

  // Redirecionar para login
  if (typeof window !== 'undefined') {
    window.location.href = '/auth/login';
  }
}

function handleApiError(error: AxiosError) {
  const status = error.response?.status;
  const data = error.response?.data as any;

  switch (status) {
    case 400:
      toast.error('Erro na requisição', {
        description: data?.message || 'Dados inválidos'
      });
      break;
    
    case 403:
      toast.error('Acesso negado', {
        description: data?.message || 'Você não tem permissão para esta ação'
      });
      break;
    
    case 404:
      toast.error('Não encontrado', {
        description: data?.message || 'Recurso não encontrado'
      });
      break;
    
    case 422:
      toast.error('Erro de validação', {
        description: data?.message || 'Dados inválidos fornecidos'
      });
      break;
    
    case 429:
      toast.error('Muitas requisições', {
        description: 'Tente novamente em alguns minutos'
      });
      break;
    
    case 500:
      toast.error('Erro interno do servidor', {
        description: 'Tente novamente mais tarde'
      });
      break;
    
    default:
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        toast.error('Erro de conexão', {
          description: 'Verifique sua conexão com a internet'
        });
      } else {
        toast.error('Erro inesperado', {
          description: data?.message || 'Algo deu errado'
        });
      }
  }
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Configurar token de autenticação manualmente
 */
export function setAuthToken(token: string) {
  localStorage.setItem('accessToken', token);
}

/**
 * Remover token de autenticação
 */
export function removeAuthToken() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

/**
 * Verificar se há token válido
 */
export function hasValidToken(): boolean {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  try {
    // Decodificar JWT para verificar expiração
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch (error) {
    // Token inválido ou malformado
    return false;
  }
}

/**
 * Obter token atual
 */
export function getCurrentToken(): string | null {
  return localStorage.getItem('accessToken');
}

// ============================================================================
// EXPORTS
// ============================================================================

export default apiClient;

// Exportar instância configurada
export { apiClient as api };
