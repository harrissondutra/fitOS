'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';

interface PushNotificationManagerProps {
  onSubscribe?: () => void;
  onUnsubscribe?: () => void;
}

export function PushNotificationManager({ onSubscribe, onUnsubscribe }: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'default' | 'granted' | 'denied'>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verificar suporte a notificações
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }

    // Verificar se já existe uma subscription
    checkExistingSubscription();
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }
  };

  const requestPermission = async () => {
    if (!isSupported) return;

    try {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        await subscribeToPush();
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const subscribeToPush = async () => {
    if (!isSupported || permission !== 'granted') return;

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      setSubscription(subscription);
      
      // Enviar subscription para o servidor
      await subscribeUser(subscription);
      
      onSubscribe?.();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    setIsLoading(true);
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      
      // Notificar servidor
      await unsubscribeUser();
      
      onUnsubscribe?.();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    if (!subscription || !message.trim()) return;

    try {
      await sendNotification(message);
      setMessage('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  };

  // Função para converter VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Notificações push não são suportadas neste navegador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Gerencie suas notificações push do FitOS.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da permissão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {permission === 'granted' ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">
              Permissão: {permission === 'granted' ? 'Concedida' : 'Negada'}
            </span>
          </div>
        </div>

        {/* Status da subscription */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {subscription ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="text-sm font-medium">
              Subscription: {subscription ? 'Ativa' : 'Inativa'}
            </span>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          {!subscription ? (
            <Button
              onClick={requestPermission}
              disabled={isLoading || permission === 'denied'}
              className="flex-1"
            >
              {isLoading ? 'Conectando...' : 'Ativar Notificações'}
            </Button>
          ) : (
            <Button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {isLoading ? 'Desconectando...' : 'Desativar Notificações'}
            </Button>
          )}
        </div>

        {/* Teste de notificação */}
        {subscription && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Teste de Notificação</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Digite uma mensagem de teste..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
              />
              <Button
                onClick={sendTestNotification}
                disabled={!message.trim() || isLoading}
                size="sm"
              >
                Enviar
              </Button>
            </div>
          </div>
        )}

        {/* Mensagem de sucesso */}
        {success && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Operação realizada com sucesso!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Server Actions (seguindo documentação oficial)
async function subscribeUser(sub: PushSubscription) {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sub),
  });
  
  if (!response.ok) {
    throw new Error('Failed to subscribe user');
  }
  
  return response.json();
}

async function unsubscribeUser() {
  const response = await fetch('/api/push/unsubscribe', {
    method: 'POST',
  });
  
  if (!response.ok) {
    throw new Error('Failed to unsubscribe user');
  }
  
  return response.json();
}

async function sendNotification(message: string) {
  const response = await fetch('/api/push/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send notification');
  }
  
  return response.json();
}
