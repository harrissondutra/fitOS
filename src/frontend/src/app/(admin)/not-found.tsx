'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, ArrowLeft, Database, Users, BarChart3 } from 'lucide-react';

/**
 * Página 404 customizada - Área Admin
 */
export default function AdminNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-background p-4">
      <Card className="w-full max-w-2xl border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <div>
            <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
            <CardDescription className="text-lg">
              Página administrativa não encontrada
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              A página administrativa que você está procurando não existe.
            </p>
            <p className="text-sm text-muted-foreground">
              Navegue para uma das seções disponíveis abaixo.
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
              <Link href="/admin/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard Admin
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground mb-4">
              Páginas administrativas disponíveis:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/admin/database">
                  <Database className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Database</span>
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/admin/users">
                  <Users className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Usuários</span>
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/admin/analytics">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Analytics</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="text-center pt-4">
            <Button variant="link" size="sm" asChild>
              <Link href="/dashboard">Ir para área do cliente</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




