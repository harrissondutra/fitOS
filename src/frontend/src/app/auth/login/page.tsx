/**
 * Página de Login - FitOS
 * 
 * Página de login usando o modelo login-04 do shadcn/ui
 * Com login social (Google, Microsoft, Apple)
 */

"use client";

import { useState, useCallback, Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { PageLoading } from "@/components/ui/optimized-loading";
import Link from "next/link";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string>("");

  // Otimização: useCallback para evitar re-renders desnecessários
  const handleLogin = useCallback(async (email: string, password: string, rememberMe: boolean) => {
    setError("");
    
    try {
      const success = await login({
        email,
        password,
        rememberMe
      });

      if (!success) {
        setError("Credenciais inválidas");
      }
    } catch (error) {
      console.error("Erro no login:", error);
      setError("Erro de conexão. Tente novamente.");
    }
  }, [login]);

  // Otimização: useCallback para evitar re-renders desnecessários
  const handleSocialLogin = useCallback((provider: 'google' | 'microsoft' | 'apple') => {
    toast.info("Login social em desenvolvimento", {
      description: `Login com ${provider} será implementado em breve`
    });
  }, []);

  // Mostrar loading otimizado durante carregamento
  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <Suspense fallback={<PageLoading />}>
          <LoginForm 
            onLogin={handleLogin}
            onSocialLogin={handleSocialLogin}
            isLoading={isLoading}
            error={error}
          />
        </Suspense>
      </div>
    </div>
  );
}