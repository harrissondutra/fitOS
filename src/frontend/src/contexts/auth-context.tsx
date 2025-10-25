/**
 * AuthContext e AuthProvider - FitOS
 * 
 * Contexto global para gerenciamento de estado de autenticação
 * Inclui persistência de dados, refresh automático de tokens e tracking de atividade
 */

"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  User, 
  LoginRequest, 
  SignupRequest, 
  AuthResponse,
  DEFAULT_ROLE_REDIRECTS,
  AUTH_CONSTANTS
} from '../../../shared/types/auth.types';

// ============================================================================
// TIPOS DO CONTEXTO
// ============================================================================

interface AuthContextType {
  // Estado
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Ações
  login: (credentials: LoginRequest) => Promise<boolean>;
  signup: (data: SignupRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateUser: (userData: Partial<User>) => void;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (token: string, password: string, confirmPassword: string) => Promise<boolean>;
  fetchMe: () => Promise<User | null>;
  setAuthData: (data: { accessToken: string; refreshToken: string; isAuthenticated: boolean }) => void;
  
  // Utilitários
  hasRole: (roles: string[]) => boolean;
  canAccess: (requiredRoles: string[]) => boolean;
  getRedirectPath: () => string;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// CONTEXTO
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  
  // Estado
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Atividade do usuário
  const [lastActivity, setLastActivity] = useState<number>(Date.now());
  const [activityTimer, setActivityTimer] = useState<any | null>(null);

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const saveTokens = useCallback((accessToken: string, refreshToken: string) => {
    console.log('💾 Salvando tokens:', { 
      accessToken: accessToken?.substring(0, 20) + '...', 
      refreshToken: refreshToken?.substring(0, 20) + '...'
    });
    
    // Salvar no localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Salvar em cookies para o middleware (sem SameSite para evitar problemas)
    document.cookie = `accessToken=${accessToken}; path=/; max-age=3600`;
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800`;
    
    console.log('✅ Tokens salvos com sucesso');
    console.log('🍪 Cookies definidos:', document.cookie);
  }, []);

  const clearTokens = useCallback(() => {
    console.log('🔍 AuthContext: Limpando tokens');
    // Limpar localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Limpar cookies
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }, []);

  const fetchMe = useCallback(async (): Promise<User | null> => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        return null;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.log('🔍 fetchMe - Token inválido ou expirado, limpando dados de autenticação');
          // Limpar dados de autenticação inválidos
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        console.log('🔍 fetchMe - Dados do usuário obtidos:', data.user);
        return data.user;
      } else {
        throw new Error(data.error?.message || 'Erro ao obter dados do usuário');
      }
    } catch (error) {
      console.error('Erro ao obter dados do usuário:', error);
      return null;
    }
  }, []);



  const logout = useCallback(async (): Promise<void> => {
    try {
      // Chamar API de logout
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // Limpar estado local
      setUser(null);
      setIsAuthenticated(false);
      clearTokens();
      
      // Parar timer de atividade
      if (activityTimer) {
        clearInterval(activityTimer);
        setActivityTimer(null);
      }
      
      // Redirecionar para login
      router.push('/auth/login');
      
      toast.success('Logout realizado com sucesso');
    }
  }, [router, clearTokens, activityTimer]); // Incluído activityTimer

  const checkInactivity = useCallback(() => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    
    if (timeSinceLastActivity > AUTH_CONSTANTS.SESSION_TIMEOUT) {
      toast.warning('Sessão expirada', {
        description: 'Você foi desconectado por inatividade'
      });
      // Usar logout diretamente sem dependência para evitar loop infinito
      setUser(null);
      setIsAuthenticated(false);
      clearTokens();
      // Redirecionar para login após logout
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    } else if (timeSinceLastActivity > AUTH_CONSTANTS.INACTIVITY_WARNING) {
      toast.warning('Sessão expirando', {
        description: 'Você será desconectado em breve por inatividade'
      });
    }
  }, [lastActivity, clearTokens]); // Adicionado clearTokens de volta

  // ============================================================================
  // FUNÇÕES DE AUTENTICAÇÃO
  // ============================================================================

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const apiUrl = 'http://localhost:3001';
      console.log('🔗 Tentando conectar com:', `${apiUrl}/api/auth/login`);
      console.log('📤 Dados enviados:', credentials);
      
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      
      console.log('📥 Resposta recebida:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();

      if (data.success) {
        console.log('✅ Login bem-sucedido!', data.user);
        
        // Salvar dados
        setUser(data.user);
        setIsAuthenticated(true);
        saveTokens(data.accessToken, data.refreshToken);
        setLastActivity(Date.now());
        
        // Salvar usuário no localStorage
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('🔔 Mostrando toast de sucesso...');
        toast.success('Login realizado com sucesso!', {
          description: `Bem-vindo, ${data.user.firstName || data.user.email}!`
        });

        // Atualizar estado de autenticação
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Redirecionar após um pequeno delay para garantir que os cookies sejam definidos
        const redirectPath = getRedirectPathByRole(data.user.role);
        console.log('🔄 Redirecionando para:', redirectPath);
        
        setTimeout(() => {
          router.push(redirectPath);
        }, 100);
        
        return true;
      } else {
        toast.error('Erro no login', {
          description: data.message || 'Credenciais inválidas'
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      console.error('❌ Tipo do erro:', typeof error);
      console.error('❌ Mensagem do erro:', error instanceof Error ? error.message : String(error));
      
      let errorMessage = 'Erro de conexão. Verifique se o servidor está rodando.';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3001.';
        } else if (error.message.includes('HTTP error')) {
          errorMessage = 'Erro do servidor. Tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error('Erro no login', {
        description: errorMessage
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [saveTokens, router]);

  const signup = useCallback(async (data: SignupRequest): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: AuthResponse = await response.json();

      if (result.success) {
        // Salvar dados
        setUser(result.user);
        setIsAuthenticated(true);
        saveTokens(result.accessToken, result.refreshToken);
        setLastActivity(Date.now());
        
        toast.success('Conta criada com sucesso!', {
          description: `Bem-vindo ao FitOS, ${result.user.firstName}!`
        });

        // Redirecionar
        router.push('/dashboard');
        
        return true;
      } else {
        toast.error('Erro no cadastro', {
          description: result.message || 'Não foi possível criar a conta'
        });
        return false;
      }
    } catch (error) {
      console.error('Erro no signup:', error);
      toast.error('Erro de conexão', {
        description: 'Não foi possível conectar ao servidor'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router, saveTokens]);


  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 refreshToken: Iniciando renovação de token');
      const refreshTokenValue = localStorage.getItem('refreshToken');
      console.log('🔍 refreshToken: Refresh token existe:', refreshTokenValue ? 'sim' : 'não');
      
      if (!refreshTokenValue) {
        console.log('🔍 refreshToken: Nenhum refresh token encontrado');
        return false;
      }

      console.log('🔍 refreshToken: Fazendo requisição para renovar token');
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      console.log('🔍 refreshToken: Resposta recebida:', response.status);
      const data = await response.json();
      console.log('🔍 refreshToken: Dados da resposta:', data);

      if (data.success) {
        console.log('🔍 refreshToken: Token renovado com sucesso');
        saveTokens(data.accessToken, data.refreshToken);
        setLastActivity(Date.now());
        return true;
      } else {
        console.log('🔍 refreshToken: Falha na renovação, fazendo logout');
        // Refresh token inválido, fazer logout
        await logout();
        return false;
      }
    } catch (error) {
      console.error('🔍 refreshToken: Erro ao renovar token:', error);
      await logout();
      return false;
    }
  }, [logout, saveTokens]);

  const updateUser = useCallback((userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [user]);

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  const hasRole = useCallback((roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  }, [user]);

  const canAccess = useCallback((requiredRoles: string[]): boolean => {
    if (!user) return false;
    return hasRole(requiredRoles);
  }, [user, hasRole]);

  const getRedirectPathByRole = (role: string): string => {
    return DEFAULT_ROLE_REDIRECTS[role as keyof typeof DEFAULT_ROLE_REDIRECTS] || '/dashboard';
  };

  const getRedirectPath = useCallback((): string => {
    if (!user) return '/auth/login';
    return getRedirectPathByRole(user.role);
  }, [user]);

  const forgotPassword = useCallback(async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Email enviado', {
          description: 'Verifique sua caixa de entrada para redefinir sua senha.'
        });
        return true;
      } else {
        toast.error('Erro', {
          description: data.message || 'Erro ao enviar email de recuperação'
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no forgot password:', error);
      toast.error('Erro', {
        description: 'Erro ao enviar email de recuperação'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (password !== confirmPassword) {
        toast.error('Erro', {
          description: 'As senhas não coincidem'
        });
        return false;
      }
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Senha redefinida', {
          description: 'Sua senha foi redefinida com sucesso. Você pode fazer login agora.'
        });
        router.push('/auth/login');
        return true;
      } else {
        toast.error('Erro', {
          description: data.message || 'Erro ao redefinir senha'
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Erro no reset password:', error);
      toast.error('Erro', {
        description: 'Erro ao redefinir senha'
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // ============================================================================
  // EFEITOS
  // ============================================================================

  // Inicialização simplificada
  useEffect(() => {
    // Tentar carregar usuário do localStorage
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('👤 Usuário carregado do localStorage:', userData);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário do localStorage:', error);
    }
    
    setIsInitialized(true);
    setIsLoading(false);
  }, []);

  // Interceptor simplificado - removido para evitar loop infinito

  // Timer de atividade otimizado
  useEffect(() => {
    if (isAuthenticated) {
      // Configurar timer de verificação de inatividade (otimização: intervalo maior)
      const timer = setInterval(checkInactivity, AUTH_CONSTANTS.ACTIVITY_PING_INTERVAL);
      setActivityTimer(timer);

      // Eventos de atividade do usuário (otimização: throttling)
      const events = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
      let lastActivityTime = 0;
      const THROTTLE_MS = 1000; // Throttle de 1 segundo
      
      const handleActivity = () => {
        const now = Date.now();
        if (now - lastActivityTime > THROTTLE_MS) {
          setLastActivity(now);
          lastActivityTime = now;
        }
      };

      events.forEach(event => {
        document.addEventListener(event, handleActivity, { passive: true }); // Otimização: passive listeners
      });

      return () => {
        clearInterval(timer);
        events.forEach(event => {
          document.removeEventListener(event, handleActivity);
        });
      };
    }
  }, [isAuthenticated, checkInactivity]); // Adicionado checkInactivity de volta

  // Auto-refresh de token
  useEffect(() => {
    if (isAuthenticated) {
      const refreshInterval = setInterval(async () => {
        await refreshToken();
      }, AUTH_CONSTANTS.SESSION_TIMEOUT - 60000); // 1 minuto antes de expirar

      return () => clearInterval(refreshInterval);
    }
  }, [isAuthenticated, refreshToken]); // Adicionado refreshToken de volta

  // ============================================================================
  // MÉTODOS ADICIONAIS
  // ============================================================================

  const setAuthData = useCallback((data: { accessToken: string; refreshToken: string; isAuthenticated: boolean }) => {
    // Armazenar tokens no localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    // Atualizar estado
    setIsAuthenticated(data.isAuthenticated);
    
    // Não buscar dados do usuário aqui para evitar loop infinito
    // Os dados serão carregados na inicialização
  }, []); // Sem dependências para evitar loop infinito

  // ============================================================================
  // VALOR DO CONTEXTO
  // ============================================================================

  const value: AuthContextType = {
    // Estado
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    
    // Ações
    login,
    signup,
    logout,
    refreshToken,
    updateUser,
    forgotPassword,
    resetPassword,
    fetchMe,
    setAuthData,
    
    // Utilitários
    hasRole,
    canAccess,
    getRedirectPath,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

export function useRequireAuth(): AuthContextType {
  const auth = useAuth();
  
  useEffect(() => {
    if (auth.isInitialized && !auth.isAuthenticated) {
      auth.logout();
    }
  }, [auth.isInitialized, auth.isAuthenticated, auth.logout, auth]); // Adicionado auth para completar dependências

  return auth;
}
