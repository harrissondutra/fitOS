'use client';

import { useState, useEffect } from 'react';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PushNotificationSetupProps {
  className?: string;
  onSetupComplete?: (success: boolean) => void;
  onDismiss?: () => void;
}

export function PushNotificationSetup({
  className,
  onSetupComplete,
  onDismiss
}: PushNotificationSetupProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
    clearError,
  } = usePushNotifications({
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCEyV7c3jhreAKZ0gjt0UjVqwEjQB4IG1SUd-KU9eRssyYQDpctAwfA1vfvOJIqBrUlTcGLOton4bUgwrhNrPI0',
    serverUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Mostrar setup se não estiver inscrito e for suportado
    if (isSupported && !isSubscribed && permission === 'default') {
      setShowSetup(true);
    }
  }, [isSupported, isSubscribed, permission]);

  const handleSubscribe = async () => {
    setIsLoading(true);
    clearError();

    try {
      // Solicitar permissão primeiro
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        onSetupComplete?.(false);
        return;
      }

      // Inscrever para notificações
      const success = await subscribe();
      onSetupComplete?.(success);

      if (success) {
        setShowSetup(false);
      }
    } catch (error) {
      console.error('[Push Setup] Subscription failed:', error);
      onSetupComplete?.(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);

    try {
      const success = await unsubscribe();
      if (success) {
        setShowSetup(true);
      }
    } catch (error) {
      console.error('[Push Setup] Unsubscription failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!isSupported) return <XCircle className="h-5 w-5 text-red-500" />;
    if (isSubscribed) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (permission === 'denied') return <XCircle className="h-5 w-5 text-red-500" />;
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Não suportado';
    if (isSubscribed) return 'Ativado';
    if (permission === 'denied') return 'Negado';
    if (permission === 'granted') return 'Permitido';
    return 'Pendente';
  };

  const getStatusColor = () => {
    if (!isSupported) return 'destructive';
    if (isSubscribed) return 'default';
    if (permission === 'denied') return 'destructive';
    return 'secondary';
  };

  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  if (!isSupported) {
    return (
      <Card className={cn("border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Notificações Push</CardTitle>
            <Badge variant="destructive">Não Suportado</Badge>
          </div>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isSubscribed && !showSetup) {
    return (
      <Card className={cn("border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Notificações Ativadas</CardTitle>
              <Badge variant="default">Ativo</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnsubscribe}
              disabled={isLoading}
            >
              <BellOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Você receberá lembretes de treino, mensagens e atualizações
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950",
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <CardTitle className="text-lg">Configurar Notificações</CardTitle>
            <Badge variant={getStatusColor() as any}>
              {getStatusText()}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Receba lembretes de treino, mensagens do trainer e atualizações importantes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="mt-2"
            >
              Limpar Erro
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <h4 className="text-sm font-medium">O que você receberá:</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full" />
              <span>Lembretes de treino personalizados</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full" />
              <span>Mensagens do seu personal trainer</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-purple-500 rounded-full" />
              <span>Parabéns por atingir metas</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-orange-500 rounded-full" />
              <span>Atualizações de planos de treino</span>
            </li>
          </ul>
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || permission === 'denied'}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Configurando...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Ativar Notificações
              </>
            )}
          </Button>

          {permission === 'denied' && (
            <Button
              variant="outline"
              onClick={() => {
                // Abrir configurações do navegador
                if (navigator.userAgent.includes('Chrome')) {
                  window.open('chrome://settings/content/notifications');
                } else if (navigator.userAgent.includes('Firefox')) {
                  window.open('about:preferences#privacy');
                } else if (navigator.userAgent.includes('Safari')) {
                  window.open('x-apple.systempreferences:com.apple.preference.security');
                }
              }}
            >
              Configurar
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Você pode alterar essas configurações a qualquer momento nas configurações do app
        </p>
      </CardContent>
    </Card>
  );
}
