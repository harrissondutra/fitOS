// Hook para monitorar status de conexão online/offline
'use client';

import { useState, useEffect } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  isOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export function useOnlineStatus(): OnlineStatus {
  const [onlineStatus, setOnlineStatus] = useState<OnlineStatus>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      const connection = (navigator as any).connection;
      
      setOnlineStatus({
        isOnline,
        isOffline: !isOnline,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    };

    // Listeners para mudanças de status
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Listener para mudanças de conexão (se suportado)
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateOnlineStatus);
    }

    // Atualizar status inicial
    updateOnlineStatus();

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      
      if (connection) {
        connection.removeEventListener('change', updateOnlineStatus);
      }
    };
  }, []);

  return onlineStatus;
}
