"use client";

import { useState } from "react";
import { SignupForm } from "@/components/signup-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const { signup, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [userEmail, setUserEmail] = useState("");

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
    setUserEmail(data.email);

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

      if (success) {
        setShowVerifyDialog(true);
      } else {
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

      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Verifique seu email</DialogTitle>
            <DialogDescription className="pt-2 text-center">
              Enviamos um link de confirmação para <span className="font-medium text-foreground">{userEmail}</span>.
              <br className="hidden sm:block" />
              Clique no link para ativar sua conta.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground text-center">
              Não recebeu? Verifique sua caixa de Spam ou Lixo Eletrônico.
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              variant="default"
              className="w-full"
              onClick={() => window.open('https://gmail.com', '_blank')}
            >
              Abrir email
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}