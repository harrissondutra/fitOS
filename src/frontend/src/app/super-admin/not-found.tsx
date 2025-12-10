'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, ArrowLeft, Database, Server, Shield, Settings } from 'lucide-react';

/**
 * Página 404 customizada - Área Super Admin
 */
export default function SuperAdminNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-destructive/5 to-background p-4">
      <Card className="w-full max-w-2xl border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-destructive" />
          </div>
          <div>
            <CardTitle className="text-4xl font-bold mb-2">404</CardTitle>
            <CardDescription className="text-lg">
              Página super admin não encontrada
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              A página de super administração que você está procurando não existe.
            </p>
            <p className="text-sm text-muted-foreground">
              Acesse uma das seções de gerenciamento disponíveis abaixo.
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
              <Link href="/super-admin/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Dashboard Super Admin
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-center text-muted-foreground mb-4">
              Seções de gerenciamento:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/super-admin/database/connections">
                  <Database className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Database</span>
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/super-admin/servers">
                  <Server className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Servidores</span>
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/super-admin/redis/connections">
                  <Database className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Redis</span>
                </Link>
              </Button>
              
              <Button variant="outline" size="sm" asChild className="h-auto py-4 flex-col">
                <Link href="/super-admin/system/config">
                  <Settings className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium">Config</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/super-admin/tenants">Tenants</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/super-admin/users">Usuários</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/super-admin/ai">IA</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/super-admin/management/dashboard">Gestão</Link>
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




