// Hook para gerenciar prompt de instalação PWA
'use client';

import { useState, useEffect } from 'react';
import { PWAInstallPromptEvent } from '@/lib/pwa/pwa-utils';

export interface InstallPromptState {
  isInstallable: boolean;
  isInstalled: boolean;
  isPrompted: boolean;
  canPrompt: boolean;
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

export function useInstallPrompt() {
  const [state, setState] = useState<InstallPromptState>({
    isInstallable: false,
    isInstalled: false,
    isPrompted: false,
    canPrompt: false,
    platform: 'unknown',
  });

  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detectar plataforma
    const userAgent = window.navigator.userAgent.toLowerCase();
    let platform: 'ios' | 'android' | 'desktop' | 'unknown' = 'unknown';
    
    if (/iphone|ipad|ipod/.test(userAgent)) platform = 'ios';
    else if (/android/.test(userAgent)) platform = 'android';
    else if (/windows|macintosh|linux/.test(userAgent)) platform = 'desktop';

    // Detectar se está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true ||
                       document.referrer.includes('android-app://');

    // Detectar se é instalável
    const isInstallable = 'serviceWorker' in navigator && 
                          'PushManager' in window &&
                          'Notification' in window;

    setState(prev => ({
      ...prev,
      isInstallable,
      isInstalled,
      platform,
    }));

    // Listener para beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as PWAInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setState(prev => ({
        ...prev,
        canPrompt: true,
      }));
    };

    // Listener para appinstalled
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        canPrompt: false,
        isPrompted: false,
      }));
      setDeferredPrompt(null);
    };

    // Listener para mudanças no display mode
    const handleDisplayModeChange = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      setState(prev => ({
        ...prev,
        isInstalled: isStandalone,
      }));
    };

    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', handleDisplayModeChange);
    };
  }, []);

  // Função para mostrar o prompt de instalação
  const promptInstall = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('[Install Prompt] No deferred prompt available');
      return false;
    }

    try {
      // Mostrar o prompt
      await deferredPrompt.prompt();
      
      // Aguardar a escolha do usuário
      const { outcome } = await deferredPrompt.userChoice;
      
      setState(prev => ({
        ...prev,
        isPrompted: true,
        canPrompt: outcome === 'dismissed',
      }));

      // Limpar o prompt
      setDeferredPrompt(null);

      return outcome === 'accepted';
    } catch (error) {
      console.error('[Install Prompt] Error showing prompt:', error);
      return false;
    }
  };

  // Função para mostrar instruções de instalação (iOS)
  const showInstallInstructions = () => {
    setState(prev => ({
      ...prev,
      isPrompted: true,
    }));
  };

  // Função para ocultar o prompt
  const dismissPrompt = () => {
    setState(prev => ({
      ...prev,
      isPrompted: false,
    }));
  };

  return {
    ...state,
    promptInstall,
    showInstallInstructions,
    dismissPrompt,
  };
}
