'use client';

/**
 * AdHeader - Componente de header com anúncio no topo
 * Renderiza anúncio banner no header da aplicação
 */

import React from 'react';
import { AdWrapper } from './AdWrapper';
import { cn } from '@/lib/utils';

interface AdHeaderProps {
  className?: string;
}

export function AdHeader({ className }: AdHeaderProps) {
  return (
    <div className={cn('w-full border-b bg-background', className)}>
      <AdWrapper
        position="header"
        className="container mx-auto px-4 py-2"
        limit={1}
      />
    </div>
  );
}
