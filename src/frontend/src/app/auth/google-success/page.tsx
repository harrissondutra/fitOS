'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export default function GoogleSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuthData } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processGoogleAuth = async () => {
      try {
        const token = searchParams?.get('token');
        const refresh = searchParams?.get('refresh');

        if (!token || !refresh) {
          throw new Error('Tokens não encontrados');
        }

        // Armazenar tokens no contexto de autenticação
        setAuthData({
          accessToken: token,
          refreshToken: refresh,
          isAuthenticated: true
        });

        // Armazenar no localStorage
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refresh);

        toast.success('Login realizado com sucesso!', {
          description: 'Você foi autenticado via Google'
        });

        // Redirecionar para dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);

      } catch (error) {
        console.error('Erro ao processar autenticação Google:', error);
        toast.error('Erro ao processar login', {
          description: 'Tente fazer login novamente'
        });
        router.push('/auth/login');
      } finally {
        setIsProcessing(false);
      }
    };

    processGoogleAuth();
  }, [searchParams, setAuthData, router]);

  if (isProcessing) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <h2 className="text-lg font-semibold mb-2">Processando login...</h2>
            <p className="text-muted-foreground text-center">
              Aguarde enquanto processamos sua autenticação com Google
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Login realizado com sucesso!</CardTitle>
          <CardDescription>
            Você foi autenticado via Google e será redirecionado em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full"
          >
            Ir para Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
