/**
 * Página de Redefinir Senha - FitOS
 * 
 * Página de redefinição de senha usando o mesmo modelo visual do login/signup
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");
  
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  const handleResetPassword = async (password: string, confirmPassword: string, token: string) => {
    setError("");
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    try {
      const result = await resetPassword(token, password, confirmPassword);
      
      if (result) {
        setSuccess(true);
        toast.success("Senha redefinida!", {
          description: "Sua senha foi redefinida com sucesso."
        });
      } else {
        setError("Erro ao redefinir senha");
      }
    } catch (error) {
      console.error("Erro na redefinição de senha:", error);
      setError("Erro de conexão. Tente novamente.");
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <ResetPasswordForm 
          onResetPassword={handleResetPassword}
          isLoading={false}
          error={error}
          success={success}
          token={token || undefined}
        />
      </div>
    </div>
  );
}