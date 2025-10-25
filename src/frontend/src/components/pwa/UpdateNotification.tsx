'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UpdateNotificationProps {
  onUpdate?: () => void;
  onDismiss?: () => void;
}

export function UpdateNotification({ onUpdate, onDismiss }: UpdateNotificationProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Verificar se há atualização pendente
        if (reg.waiting) {
          setShowUpdate(true);
        }

        // Escutar atualizações
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setShowUpdate(true);
              }
            });
          }
        });
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!registration?.waiting) return;

    setIsUpdating(true);
    
    try {
      // Enviar mensagem para o service worker para pular a espera
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Recarregar a página para aplicar a atualização
      window.location.reload();
      
      onUpdate?.();
    } catch (error) {
      console.error('Error updating app:', error);
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    onDismiss?.();
  };

  if (!showUpdate || !registration) {
    return null;
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <RefreshCw className="h-5 w-5" />
            Atualização Disponível
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-amber-700 dark:text-amber-300">
          Uma nova versão do FitOS está disponível com melhorias e correções.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                O que há de novo:
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                <li>Melhorias de performance</li>
                <li>Correções de bugs</li>
                <li>Novas funcionalidades</li>
                <li>Melhorias de segurança</li>
              </ul>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleUpdate}
              disabled={isUpdating}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Atualizar Agora
                </>
              )}
            </Button>
            <Button
              onClick={handleDismiss}
              variant="outline"
              disabled={isUpdating}
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
            >
              Depois
            </Button>
          </div>
          
          <p className="text-xs text-amber-600 dark:text-amber-400">
            A atualização será aplicada automaticamente após o reload da página.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}