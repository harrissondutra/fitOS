// Hook para gerenciar push notifications
'use client';

import { useState, useEffect, useCallback } from 'react';
import { requestNotificationPermission, trackPWAEvent } from '@/lib/pwa/pwa-utils';

export interface PushNotificationState {
  isSupported: boolean;
  permission: 'default' | 'granted' | 'denied';
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  error: string | null;
}

export interface PushNotificationConfig {
  vapidPublicKey: string;
  serverUrl: string;
}

export function usePushNotifications(config?: PushNotificationConfig) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    subscription: null,
    error: null,
  });

  // Verificar suporte e permissões
  // Verificar inscrição existente
  const checkSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      setState(prev => ({
        ...prev,
        isSubscribed: !!subscription,
        subscription,
      }));
    } catch (error) {
      console.error('[Push Notifications] Error checking subscription:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao verificar inscrição',
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window;

    setState(prev => ({
      ...prev,
      isSupported,
      permission: Notification.permission,
    }));

    // Verificar se já está inscrito
    if (isSupported) {
      checkSubscription();
    }
  }, [checkSubscription]);

  // Solicitar permissão
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Push notifications não são suportadas neste navegador',
      }));
      return false;
    }

    try {
      const permission = await requestNotificationPermission();

      setState(prev => ({
        ...prev,
        permission,
        error: permission === 'denied' ? 'Permissão negada para notificações' : null,
      }));

      trackPWAEvent('push_permission_requested', { permission });

      return permission === 'granted';
    } catch (error) {
      console.error('[Push Notifications] Error requesting permission:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao solicitar permissão',
      }));
      return false;
    }
  }, [state.isSupported]);

  // Inscrever para push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported || state.permission !== 'granted') {
      const hasPermission = await requestPermission();
      if (!hasPermission) return false;
    }

    if (!config?.vapidPublicKey) {
      console.error('[Push Notifications] VAPID Public Key is missing from config:', config);
      setState(prev => ({
        ...prev,
        error: 'Chave VAPID não configurada (Variável de ambiente ausente)',
      }));
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Converter chave VAPID para Uint8Array
      const vapidPublicKey = urlBase64ToUint8Array(config.vapidPublicKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey.buffer as ArrayBuffer,
      });

      // Enviar subscription para o servidor
      const response = await fetch(`${config.serverUrl}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar subscription para o servidor');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        subscription,
        error: null,
      }));

      trackPWAEvent('push_subscribed', {
        endpoint: subscription.endpoint,
      });

      return true;
    } catch (error) {
      console.error('[Push Notifications] Error subscribing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setState(prev => ({
        ...prev,
        error: `Erro: ${errorMessage}`,
      }));
      return false;
    }
  }, [state.isSupported, state.permission, config, requestPermission]);

  // Cancelar inscrição
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!state.subscription) return false;

    try {
      await state.subscription.unsubscribe();

      // Notificar servidor sobre cancelamento
      if (config?.serverUrl) {
        await fetch(`${config.serverUrl}/api/push/unsubscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ endpoint: state.subscription.endpoint }),
        });
      }

      setState(prev => ({
        ...prev,
        isSubscribed: false,
        subscription: null,
        error: null,
      }));

      trackPWAEvent('push_unsubscribed');

      return true;
    } catch (error) {
      console.error('[Push Notifications] Error unsubscribing:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao cancelar inscrição',
      }));
      return false;
    }
  }, [state.subscription, config]);

  // Limpar erro
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    clearError,
  };
}

// Função auxiliar para converter chave VAPID
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray as Uint8Array;
}
