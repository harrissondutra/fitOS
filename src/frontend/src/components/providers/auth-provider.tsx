'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/auth-client';
import { getDashboardUrl, getRoleDisplayName, type UserRole } from '@/lib/role-redirect';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  status: string;
  createdAt: Date;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  socialLogin: (provider: 'google' | 'microsoft' | 'facebook') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log('🔍 Verificando sessão...');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/session`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📥 Resposta da sessão:', result);
        
        // Better Auth retorna os dados em result.user
        const userData = result?.user;
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name || userData.email,
            firstName: (userData as any).firstName || '',
            lastName: (userData as any).lastName || '',
            phone: (userData as any).phone || '',
            role: (userData as any).role || 'member',
            status: (userData as any).status || 'ACTIVE',
            createdAt: new Date(userData.createdAt),
          });
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('🔐 Iniciando login...', { email });
    setIsLoading(true);
    try {
      console.log('📡 Fazendo requisição direta para o backend...');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      console.log('📊 Status da resposta:', response.status);
      console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro do backend (status:', response.status, '):', errorText);
        throw new Error(`Erro do servidor: ${response.status} - ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ Resposta não é JSON:', textResponse);
        throw new Error('Resposta inválida do servidor');
      }

      const result = await response.json();
      console.log('📥 Resposta do backend:', result);

      // Better Auth retorna os dados diretamente no resultado
      const userData = result?.user;
      
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          firstName: (userData as any).firstName || '',
          lastName: (userData as any).lastName || '',
          phone: (userData as any).phone || '',
          role: (userData as any).role || 'member',
          status: (userData as any).status || 'ACTIVE',
          createdAt: new Date(userData.createdAt),
        });
        
        const dashboardUrl = getDashboardUrl({
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          role: (userData as any).role || 'member',
          status: (userData as any).status || 'ACTIVE'
        });
        
        const roleDisplayName = getRoleDisplayName((userData as any).role || 'member');
        
        console.log('✅ Login bem-sucedido!', { user: userData, dashboardUrl });
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo ao FitOS como ${roleDisplayName}!`,
        });
        console.log(`🔄 Redirecionando para ${dashboardUrl}...`);
        
        // Try router.push first, fallback to window.location
        try {
          router.push(dashboardUrl);
        } catch (error) {
          console.warn('Router.push failed, using window.location:', error);
          window.location.href = dashboardUrl;
        }
      } else {
        console.warn('⚠️ Login retornou sem dados de usuário');
        console.log('Estrutura da resposta:', result);
        throw new Error('Dados de usuário não encontrados');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      toast({
        title: "Erro no login",
        description: error.message || 'Falha no login',
        variant: "destructive",
      });
      throw error;
    } finally {
      console.log('🏁 Finalizando processo de login');
      setIsLoading(false);
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => {
    setIsLoading(true);
    try {
      const { data: result, error } = await authClient.signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstName} ${data.lastName}`,
      });

      if (error) {
        throw new Error(error.message || 'Falha no cadastro');
      }

      // Better Auth retorna os dados em result.data.user
      const userData = (result as any)?.data?.user || result?.user;
      
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name || `${data.firstName} ${data.lastName}`,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone || '',
          role: (userData as any).role || 'member',
          status: (userData as any).status || 'ACTIVE',
          createdAt: new Date(userData.createdAt),
        });
        
        const dashboardUrl = getDashboardUrl({
          id: userData.id,
          email: userData.email,
          name: userData.name || `${data.firstName} ${data.lastName}`,
          role: (userData as any).role || 'member',
          status: (userData as any).status || 'ACTIVE'
        });
        
        const roleDisplayName = getRoleDisplayName((userData as any).role || 'member');
        
        toast({
          title: "Cadastro realizado com sucesso!",
          description: `Bem-vindo ao FitOS como ${roleDisplayName}!`,
        });
        console.log(`Redirecionando para ${dashboardUrl}...`);
        
        // Try router.push first, fallback to window.location
        try {
          router.push(dashboardUrl);
        } catch (error) {
          console.warn('Router.push failed, using window.location:', error);
          window.location.href = dashboardUrl;
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || 'Falha no cadastro',
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const socialLogin = async (provider: 'google' | 'microsoft' | 'facebook') => {
    setIsLoading(true);
    try {
      const { data, error } = await authClient.signIn.social({
        provider,
        callbackURL: "/dashboard",
      });

      if (error) {
        throw new Error(error.message || `Falha no login com ${provider}`);
      }

      // Better Auth retorna os dados em data.data.user
      const userData = (data as any)?.data?.user || (data && 'user' in data ? data.user : null);
      
      if (userData) {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          firstName: (userData as any).firstName || '',
          lastName: (userData as any).lastName || '',
          phone: (userData as any).phone || '',
          role: (userData as any).role || 'member',
          status: (userData as any).status || 'ACTIVE',
          createdAt: new Date(userData.createdAt),
        });
        
        const dashboardUrl = getDashboardUrl({
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email,
          role: (userData as any).role || 'member',
          status: (userData as any).status || 'ACTIVE'
        });
        
        const roleDisplayName = getRoleDisplayName((userData as any).role || 'member');
        
        toast({
          title: "Login realizado com sucesso!",
          description: `Bem-vindo ao FitOS como ${roleDisplayName} via ${provider}!`,
        });
        
        router.push(dashboardUrl);
      }
    } catch (error: any) {
      console.error(`Social login error with ${provider}:`, error);
      toast({
        title: "Erro no login social",
        description: error.message || `Falha no login com ${provider}`,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    socialLogin,
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}