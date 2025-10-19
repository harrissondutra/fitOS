"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/providers/auth-provider"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { toast } = useToast()
  const { register, socialLogin, isLoading } = useAuth()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    return {
      isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: {
        minLength: !minLength,
        hasUpperCase: !hasUpperCase,
        hasLowerCase: !hasLowerCase,
        hasNumbers: !hasNumbers,
        hasSpecialChar: !hasSpecialChar,
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não coincidem",
        type: "error",
      } as any)
      return
    }

    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast({
        title: "Senha inválida",
        description: "A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas, números e caracteres especiais",
        type: "error",
      } as any)
      return
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
      })
    } catch (error: any) {
      // O erro já é tratado no AuthProvider
      // console.error('Registration error:', error)
    }
  }

  const handleSocialLogin = async (provider: "google" | "microsoft" | "facebook") => {
    try {
      await socialLogin(provider)
    } catch (error: any) {
      // O erro já é tratado no AuthProvider
      // console.error(`Social login error with ${provider}:`, error)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden shadow-2xl border-0">
        <CardContent className="grid p-0 lg:grid-cols-2">
          <form className="p-6 md:p-8 lg:p-12" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6 max-w-md mx-auto lg:mx-0">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-3xl font-bold text-gray-900">Crie sua conta</h1>
                <p className="text-balance text-muted-foreground mt-2">
                  Preencha os dados abaixo para criar sua conta FitOS
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">Nome</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="João"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Sobrenome</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Silva"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                      disabled={isLoading}
                      className="h-11"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Mínimo 8 caracteres"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required 
                    disabled={isLoading}
                    className="h-11"
                  />
                  {formData.password && (
                    <div className="space-y-1 text-xs">
                      <div className="text-muted-foreground font-medium">Critérios da senha:</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{formData.password.length >= 8 ? '✓' : '✗'}</span>
                          <span>Mínimo 8 caracteres</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{/[A-Z]/.test(formData.password) ? '✓' : '✗'}</span>
                          <span>Maiúscula</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{/[a-z]/.test(formData.password) ? '✓' : '✗'}</span>
                          <span>Minúscula</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{/\d/.test(formData.password) ? '✓' : '✗'}</span>
                          <span>Número</span>
                        </div>
                        <div className={`flex items-center gap-1 ${/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'text-green-600' : 'text-red-500'}`}>
                          <span>{/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '✗'}</span>
                          <span>Especial</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar senha</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="Confirme sua senha"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required 
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
              </div>
              
              <Button type="submit" className="w-full h-11 text-base font-medium" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar conta"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">
                    Ou continue com
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-gray-200 hover:bg-gray-50"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="sr-only">Sign up with Google</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-gray-200 hover:bg-gray-50"
                  onClick={() => handleSocialLogin("microsoft")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#f25022" d="M1 1h10v10H1z" />
                    <path fill="#00a4ef" d="M13 1h10v10H13z" />
                    <path fill="#7fba00" d="M1 13h10v10H1z" />
                    <path fill="#ffb900" d="M13 13h10v10H13z" />
                  </svg>
                  <span className="sr-only">Sign up with Microsoft</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full h-11 border-gray-200 hover:bg-gray-50"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
                      fill="#1877F2"
                    />
                  </svg>
                  <span className="sr-only">Sign up with Facebook</span>
                </Button>
              </div>
              
              <div className="text-center text-sm">
                <span className="text-gray-600">Já tem uma conta? </span>
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Fazer login
                </Link>
              </div>
            </div>
          </form>
          
          <div className="relative hidden lg:block bg-gradient-to-br from-green-600 via-emerald-600 to-teal-800">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
              alt="Fitness and Health"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Overlay com gradiente usando cores do tema */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-primary/90" />
            <div className="absolute inset-0 flex items-center justify-center p-12">
              <div className="text-center text-white relative z-10">
                <div className="mb-8">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-4xl font-bold mb-4 drop-shadow-lg">Junte-se à comunidade</h2>
                <p className="text-xl opacity-95 drop-shadow-md leading-relaxed">
                  Conecte-se com outros usuários, compartilhe suas conquistas e mantenha-se motivado
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
  )
}
