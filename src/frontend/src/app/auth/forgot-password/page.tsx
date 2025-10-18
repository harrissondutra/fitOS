"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Better Auth não tem reset de senha built-in, então vamos simular
      // Em uma implementação real, você usaria o plugin de email
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setEmailSent(true);
      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao enviar email",
        description: "Erro ao enviar email de recuperação",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 lg:p-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex min-h-screen items-center justify-center p-4 pt-20 lg:pt-8">
          <div className="w-full max-w-6xl">
            <div className="flex flex-col gap-6">
              <Card className="overflow-hidden shadow-2xl border-0">
                <CardContent className="grid p-0 lg:grid-cols-2">
                  <div className="p-6 md:p-8 lg:p-12">
                    <div className="flex flex-col gap-6 max-w-md mx-auto lg:mx-0">
                      <div className="flex flex-col items-center text-center">
                        <h1 className="text-3xl font-bold text-gray-900">Email enviado!</h1>
                        <p className="text-balance text-muted-foreground mt-2">
                          Verifique sua caixa de entrada
                        </p>
                      </div>

                      <div className="text-center space-y-6">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Email enviado com sucesso!</h3>
                          <p className="text-gray-600">
                            Enviamos um link de recuperação para <strong>{email}</strong>
                          </p>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-sm text-gray-500">
                            Não recebeu o email? Verifique sua pasta de spam ou
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setEmailSent(false)}
                            className="w-full"
                          >
                            Tentar novamente
                          </Button>
                        </div>
                        
                        <div className="pt-4">
                          <Link
                            href="/auth/login"
                            className="text-primary hover:underline font-medium"
                          >
                            Voltar para o login
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="relative hidden lg:block bg-gradient-to-br from-orange-600 via-red-600 to-pink-800">
                    <Image
                      src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                      alt="Email and Communication"
                      fill
                      className="object-cover"
                      priority
                    />
                    {/* Overlay com gradiente usando cores do tema */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-primary/90" />
                    <div className="absolute inset-0 flex items-center justify-center p-12">
                      <div className="text-center text-white relative z-10">
                        <div className="mb-8">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Mail className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Verifique seu email</h2>
                        <p className="text-xl opacity-95 drop-shadow-md leading-relaxed">
                          Enviamos instruções para redefinir sua senha com segurança
                        </p>
                        <div className="mt-8 flex justify-center space-x-4">
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                          <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-red-100">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 lg:p-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex min-h-screen items-center justify-center p-4 pt-20 lg:pt-8">
        <div className="w-full max-w-6xl">
          <div className="flex flex-col gap-6">
            <Card className="overflow-hidden shadow-2xl border-0">
              <CardContent className="grid p-0 lg:grid-cols-2">
                <form className="p-6 md:p-8 lg:p-12" onSubmit={handleSubmit}>
                  <div className="flex flex-col gap-6 max-w-md mx-auto lg:mx-0">
                    <div className="flex flex-col items-center text-center">
                      <h1 className="text-3xl font-bold text-gray-900">Esqueceu sua senha?</h1>
                      <p className="text-balance text-muted-foreground mt-2">
                        Não se preocupe, vamos te ajudar a recuperar
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-11"
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                      {isLoading ? "Enviando..." : "Enviar link de recuperação"}
                    </Button>
                    
                    <div className="text-center text-sm">
                      <span className="text-gray-600">Lembrou da senha? </span>
                      <Link href="/auth/login" className="text-primary hover:underline font-medium">
                        Fazer login
                      </Link>
                    </div>
                  </div>
                </form>
                
                <div className="relative hidden lg:block bg-gradient-to-br from-orange-600 via-red-600 to-pink-800">
                  <Image
                    src="https://images.unsplash.com/photo-1551650975-87deedd944c3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    alt="Email and Communication"
                    fill
                    className="object-cover"
                    priority
                  />
                  {/* Overlay com gradiente usando cores do tema */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-primary/90" />
                  <div className="absolute inset-0 flex items-center justify-center p-12">
                    <div className="text-center text-white relative z-10">
                      <div className="mb-8">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Mail className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Recupere sua senha</h2>
                      <p className="text-xl opacity-95 drop-shadow-md leading-relaxed">
                        Digite seu email e enviaremos um link seguro para redefinir sua senha
                      </p>
                      <div className="mt-8 flex justify-center space-x-4">
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                        <div className="w-2 h-2 bg-white/40 rounded-full"></div>
                        <div className="w-2 h-2 bg-white/60 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="text-center text-xs text-muted-foreground">
              Ao continuar, você concorda com nossos{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Termos de Serviço
              </a>{" "}
              e{" "}
              <a href="#" className="underline underline-offset-4 hover:text-primary">
                Política de Privacidade
              </a>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
