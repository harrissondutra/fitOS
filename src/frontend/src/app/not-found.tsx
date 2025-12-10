'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { UserRoles } from '@/shared/types/auth.types';

/**
 * Página 404 customizada - Raiz da aplicação
 */
export default function NotFound() {
  const router = useRouter();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // Determinar página inicial baseado no papel do usuário
  const getHomePage = () => {
    if (!user) return '/auth/login';

    switch (user.role) {
      case UserRoles.SUPER_ADMIN:
        return '/super-admin/dashboard';
      case UserRoles.OWNER:
      case UserRoles.ADMIN:
        return '/admin/dashboard';
      case UserRoles.TRAINER:
        return '/trainer/dashboard';
      case UserRoles.NUTRITIONIST:
        return '/nutritionist/dashboard';
      case UserRoles.CLIENT:
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
      <Card className="w-full max-w-2xl border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
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
              A página que você está procurando não existe ou foi movida.
            </p>
            <p className="text-sm text-muted-foreground">
              Verifique se o endereço está correto ou tente uma das opções abaixo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <Link href={getHomePage()}>
                <Home className="mr-2 h-4 w-4" />
                Ir para Início
              </Link>
            </Button>
          </div>

          {user && (
            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground mb-3">
                Páginas úteis:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                {user.role === UserRoles.SUPER_ADMIN && (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/super-admin/database/connections">Database</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/super-admin/servers">Servidores</Link>
                    </Button>
                  </>
                )}
                {(user.role === UserRoles.ADMIN || user.role === UserRoles.SUPER_ADMIN || user.role === UserRoles.OWNER) && (
                  <>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/admin/users">Usuários</Link>
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/admin/analytics">Analytics</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              Precisa de ajuda? Entre em contato com o suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
