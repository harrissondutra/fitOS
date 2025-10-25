"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import React, { useState } from "react"

interface ForgotPasswordFormProps extends React.ComponentProps<"div"> {
  onForgotPassword?: (email: string) => Promise<void>
  isLoading?: boolean
  error?: string
  success?: boolean
}

export function ForgotPasswordForm({
  className,
  onForgotPassword,
  isLoading = false,
  error,
  success = false,
  ...props
}: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onForgotPassword) {
      await onForgotPassword(email);
    }
  };

  if (success) {
    return (
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <Card className="overflow-hidden">
          <CardContent className="grid p-0 md:grid-cols-2">
            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold">Email enviado!</h1>
                  <p className="text-balance text-muted-foreground">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </p>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Não recebeu o email? Verifique sua pasta de spam ou tente novamente.
                  </p>

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.reload()}
                  >
                    Tentar novamente
                  </Button>

                  <div className="text-center">
                    <Link 
                      href="/auth/login" 
                      className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Voltar para o login
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative hidden bg-muted md:block">
              <Image
                src="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=1920&q=80"
                alt="Fitness forgot password background - Person doing strength training"
                fill
                className="object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Esqueceu sua senha?</h1>
                <p className="text-balance text-muted-foreground">
                  Digite seu email e enviaremos um link para redefinir sua senha
                </p>
              </div>

              {/* Erro */}
              {error && (
                <Alert className="bg-red-500/10 border-red-500/20">
                  <AlertDescription className="text-red-600">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de recuperação"
                )}
              </Button>

              <div className="text-center">
                <Link 
                  href="/auth/login" 
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para o login
                </Link>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block">
            <Image
              src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&q=80"
              alt="Fitness forgot password background - Person running"
              fill
              className="object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        Ao continuar, você concorda com nossos{" "}
        <a href="#" className="underline underline-offset-4">
          Termos de Serviço
        </a>{" "}
        e{" "}
        <a href="#" className="underline underline-offset-4">
          Política de Privacidade
        </a>
        .
      </div>
    </div>
  )
}
