'use client';

import { OfflineIndicator } from './OfflineIndicator';
import { UpdateNotification } from './UpdateNotification';

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
  return (
    <>
      {children}
      {enableUpdateNotification && <UpdateNotification />}
      {enableOfflineIndicator && <OfflineIndicator showDetails={showOfflineDetails} />}
    </>
  );
}