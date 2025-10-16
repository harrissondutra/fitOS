'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/auth-client';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
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
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Verify token and get user info
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': localStorage.getItem('tenantId') || '',
          },
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.data.user);
        } else {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tenantId');
        }
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log('Iniciando login...', { email });
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'cmgtv73ht0006u8so2hmw7qmw', // Default tenant for now
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const { user: userData, tokens } = data.data;
        
        // Store tokens and tenant ID
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('tenantId', 'cmgtv73ht0006u8so2hmw7qmw');
        
        setUser({
          id: userData.id,
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          createdAt: new Date(),
        });
        
        toast.success('Login realizado com sucesso!');
        console.log('Redirecionando para /dashboard...');
        
        // Try router.push first, fallback to window.location
        try {
          router.push('/dashboard');
        } catch (error) {
          console.warn('Router.push failed, using window.location:', error);
          window.location.href = '/dashboard';
        }
      } else {
        throw new Error(data.error?.message || 'Falha no login');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Falha no login');
      throw error;
    } finally {
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
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': 'cmgtv73ht0006u8so2hmw7qmw', // Default tenant for now
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { user: userData, tokens } = result.data;
        
        // Store tokens and tenant ID
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('tenantId', 'cmgtv73ht0006u8so2hmw7qmw');
        
        setUser({
          id: userData.id,
          email: userData.email,
          name: `${userData.firstName} ${userData.lastName}`,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          status: userData.status,
          createdAt: new Date(userData.createdAt),
        });
        
        toast.success('Cadastro realizado com sucesso!');
        console.log('Redirecionando para /dashboard...');
        
        // Try router.push first, fallback to window.location
        try {
          router.push('/dashboard');
        } catch (error) {
          console.warn('Router.push failed, using window.location:', error);
          window.location.href = '/dashboard';
        }
      } else {
        throw new Error(result.error?.message || 'Falha no cadastro');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Falha no cadastro');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('tenantId');
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const socialLogin = async (provider: 'google' | 'microsoft' | 'facebook') => {
    // Social login not implemented yet
    throw new Error('Social login not implemented yet');
  };

  const value = {
    user,
    isLoading,
    login,
    register,
    logout,
    socialLogin,
  };

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