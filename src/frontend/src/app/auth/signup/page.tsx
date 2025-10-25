/**
 * Página de Signup - FitOS
 * 
 * Página de cadastro usando o modelo signup-04 do shadcn/ui
 * Com cadastro social (Google, Microsoft, Apple)
 */

"use client";

import { useState } from "react";
import { SignupForm } from "@/components/signup-form";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const { signup, isLoading } = useAuth();
  const [error, setError] = useState<string>("");

  const handleSignup = async (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    confirmPassword: string
    phone?: string
    acceptTerms: boolean
  }) => {
    setError("");
    
    // Validações
    if (data.password !== data.confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }
    
    if (!data.acceptTerms) {
      setError("Você deve aceitar os termos de serviço");
      return;
    }
    
    try {
      const success = await signup({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phone: data.phone,
        tenantId: 'default-tenant'
      });

      if (!success) {
        setError("Erro ao criar conta");
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setError("Erro de conexão. Tente novamente.");
    }
  };

  const handleSocialSignup = (provider: 'google' | 'microsoft' | 'apple') => {
    toast.info("Cadastro social em desenvolvimento", {
      description: `Cadastro com ${provider} será implementado em breve`
    });
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm 
          onSignup={handleSignup}
          onSocialSignup={handleSocialSignup}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
}