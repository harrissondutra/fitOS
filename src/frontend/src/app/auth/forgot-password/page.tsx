/**
 * Página de Esqueci Minha Senha - FitOS
 * 
 * Página de recuperação de senha usando o mesmo modelo visual do login/signup
 */

"use client";

import { useState } from "react";
import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleForgotPassword = async (email: string) => {
    setError("");
    
    try {
      const result = await forgotPassword(email);
      
      if (result) {
        setSuccess(true);
        toast.success("Email enviado!", {
          description: "Verifique sua caixa de entrada para redefinir sua senha."
        });
      } else {
        setError("Erro ao enviar email");
      }
    } catch (error) {
      console.error("Erro na recuperação de senha:", error);
      setError("Erro de conexão. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <ForgotPasswordForm 
          onForgotPassword={handleForgotPassword}
          isLoading={false}
          error={error}
          success={success}
        />
      </div>
    </div>
  );
}