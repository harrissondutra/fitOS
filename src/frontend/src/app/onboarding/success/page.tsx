'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Check, Loader2 } from 'lucide-react';

const checklistItems = [
  { id: 1, label: 'Cadastro concluído', completed: true },
  { id: 2, label: 'Pagamento confirmado', completed: true },
  { id: 3, label: 'Tenant criado', completed: true },
  { id: 4, label: 'Configurando ambiente', completed: false, inProgress: true },
];

export default function OnboardingSuccessPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    // Simular progresso de setup
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          // Marcar último item como completo
          checklistItems[3].completed = true;
          checklistItems[3].inProgress = false;
          
          // Redirecionar após 2 segundos
          setTimeout(() => {
            setRedirecting(true);
            router.push('/dashboard');
          }, 2000);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Parabéns!</CardTitle>
          <CardDescription className="text-lg">
            Sua academia foi cadastrada com sucesso no FitOS
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Success Message */}
          <Alert className="border-green-500 bg-green-50">
            <Check className="h-5 w-5 text-green-600" />
            <AlertTitle className="text-green-900">Tudo pronto!</AlertTitle>
            <AlertDescription className="text-green-800">
              Estamos configurando seu ambiente. Isso levará apenas alguns segundos.
            </AlertDescription>
          </Alert>

          {/* Checklist */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm mb-3">Configuração Final:</h3>
            {checklistItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {item.completed ? (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                  ) : item.inProgress ? (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    </div>
                  )}
                </div>
                <span className={item.completed ? 'text-green-700' : 'text-muted-foreground'}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Redirect Warning */}
          {redirecting && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Redirecionando...</AlertTitle>
              <AlertDescription>
                Você será redirecionado para o dashboard em instantes.
              </AlertDescription>
            </Alert>
          )}

          {/* Manual Redirect Button */}
          <Button
            onClick={() => router.push('/dashboard')}
            className="w-full"
            disabled={progress < 100}
          >
            {redirecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecionando...
              </>
            ) : (
              'Ir para Dashboard'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

