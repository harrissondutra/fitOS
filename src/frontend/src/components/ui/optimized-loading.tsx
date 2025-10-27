'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface OptimizedLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function OptimizedLoading({ 
  size = 'md', 
  text = 'Carregando...', 
  className 
}: OptimizedLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-2',
      className
    )}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-primary border-t-transparent',
        sizeClasses[size]
      )} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// Componente de loading para páginas inteiras
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <OptimizedLoading 
        size="lg" 
        text="Inicializando aplicação..." 
        className="space-y-4"
      />
    </div>
  );
}

// Componente de loading para formulários
export function FormLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <OptimizedLoading 
        size="sm" 
        text="Processando..." 
      />
    </div>
  );
}






