'use client';

import React from 'react';

interface PWAWrapperProps {
  children: React.ReactNode;
  enableInstallPrompt?: boolean;
  enableUpdateNotification?: boolean;
  enableOfflineIndicator?: boolean;
  showOfflineDetails?: boolean;
}

export function PWAWrapper({
  children,
  enableInstallPrompt = true,
  enableUpdateNotification = true,
  enableOfflineIndicator = true,
  showOfflineDetails = false,
}: PWAWrapperProps) {
  // Renderizar apenas o children para evitar problemas de hidratação
  // Os recursos PWA serão inicializados em um componente separado
  return <>{children}</>;
}