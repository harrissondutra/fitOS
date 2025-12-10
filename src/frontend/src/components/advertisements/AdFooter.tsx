'use client';

/**
 * AdFooter - Componente de footer com anúncio na parte inferior
 * Renderiza anúncio banner no footer da aplicação
 */

import React from 'react';
import { AdWrapper } from './AdWrapper';
import { cn } from '@/lib/utils';

interface AdFooterProps {
  className?: string;
}

export function AdFooter({ className }: AdFooterProps) {
  return (
    <div className={cn('w-full border-t bg-background mt-auto', className)}>
      <AdWrapper
        position="footer"
        className="container mx-auto px-4 py-2"
        limit={1}
      />
    </div>
  );
}
