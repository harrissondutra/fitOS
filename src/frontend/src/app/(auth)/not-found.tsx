'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowLeft, LogIn, UserPlus } from 'lucide-react';

/**
 * Página 404 customizada - Área de Autenticação
 */
export default function AuthNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <Card className="w-full max-w-md border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
            <CardDescription className="text-lg">
              Página não encontrada
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              A página que você está procurando não existe.
            </p>
            <p className="text-sm text-muted-foreground">
              Faça login ou crie uma conta para acessar a plataforma.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            
            <Button
              asChild
              className="w-full"
              size="lg"
            >
              <Link href="/auth/login">
                <LogIn className="mr-2 h-4 w-4" />
                Fazer Login
              </Link>
            </Button>

            <Button
              asChild
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <Link href="/auth/signup">
                <UserPlus className="mr-2 h-4 w-4" />
                Criar Conta
              </Link>
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              Esqueceu sua senha?{' '}
              <Link href="/auth/forgot-password" className="text-primary hover:underline">
                Recuperar acesso
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




