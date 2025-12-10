'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

/**
 * Página de erro global - captura erros não tratados na aplicação
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para monitoramento
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-destructive/5 to-background p-4">
          <Card className="w-full max-w-2xl border-2 shadow-lg">
            <CardHeader className="text-center space-y-4 pb-8">
              <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-4xl font-bold mb-2">Algo deu errado</CardTitle>
                <CardDescription className="text-lg">
                  Ocorreu um erro inesperado na aplicação
                </CardDescription>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">
                  Desculpe pelo inconveniente. Nosso time foi notificado e está trabalhando para resolver o problema.
                </p>
                {process.env.NODE_ENV === 'development' && error.message && (
                  <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                    <p className="text-xs font-mono text-muted-foreground break-all">
                      {error.message}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={reset}
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar Novamente
                </Button>
                
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Ir para Início
                    </Link>
                </Button>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Se o problema persistir, entre em contato com o suporte técnico.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </body>
    </html>
  );
}




