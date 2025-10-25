'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function GoogleErrorPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Erro na autenticação</CardTitle>
          <CardDescription>
            Ocorreu um erro ao processar sua autenticação com Google. 
            Tente fazer login novamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Possíveis causas:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Conexão com Google interrompida</li>
              <li>• Permissões negadas</li>
              <li>• Erro de configuração</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tentar novamente
              </Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link href="/auth/signup">
                Criar nova conta
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
