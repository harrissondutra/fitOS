'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, X } from 'lucide-react';

interface OfflineIndicatorProps {
  showDetails?: boolean;
  position?: 'top' | 'bottom';
}

export function OfflineIndicator({ showDetails = false, position = 'top' }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      
      // Mostrar indicador quando ficar offline
      if (!online) {
        setShowIndicator(true);
      } else {
        // Esconder indicador após 3 segundos quando voltar online
        setTimeout(() => {
          setShowIndicator(false);
        }, 3000);
      }
    };

    // Status inicial
    updateOnlineStatus();

    // Escutar mudanças de conexão
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowIndicator(false);
  };

  if (!showIndicator) {
    return null;
  }

  const positionClasses = position === 'top' 
    ? 'fixed top-4 left-4 right-4 z-50' 
    : 'fixed bottom-4 left-4 right-4 z-50';

  return (
    <div className={positionClasses}>
      <Card className={`border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 ${
        isOnline ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950' : ''
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isOnline 
                    ? 'text-green-900 dark:text-green-100' 
                    : 'text-red-900 dark:text-red-100'
                }`}>
                  {isOnline ? 'Conexão restaurada!' : 'Você está offline'}
                </p>
                
                {!isOnline && (
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    Algumas funcionalidades podem estar limitadas.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isOnline && (
                <Button
                  onClick={handleRetry}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Tentar novamente
                </Button>
              )}
              
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {showDetails && !isOnline && (
            <div className="mt-3 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-red-900 dark:text-red-100">
                    Funcionalidades disponíveis offline:
                  </p>
                  <ul className="text-xs text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                    <li>Visualizar dados já carregados</li>
                    <li>Navegar entre páginas em cache</li>
                    <li>Usar funcionalidades offline</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}