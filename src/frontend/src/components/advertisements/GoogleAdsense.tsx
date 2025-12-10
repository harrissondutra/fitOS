'use client';

/**
 * GoogleAdsense - Componente para renderizar anúncios do Google AdSense
 */

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface GoogleAdsenseProps {
  adSlotId: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  fullWidth?: boolean;
}

export function GoogleAdsense({
  adSlotId,
  adFormat = 'auto',
  className,
  fullWidth = false,
}: GoogleAdsenseProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Verificar se já foi carregado
    if (hasLoaded.current || !adSlotId || !adRef.current) {
      return;
    }

    // Verificar se o script do AdSense já foi carregado
    const existingScript = document.querySelector('script[src*="adsbygoogle"]');
    
    if (!existingScript) {
      // Carregar script do Google AdSense
      const script = document.createElement('script');
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID || '');
      document.head.appendChild(script);
    }

    // Aguardar um pouco para o script carregar
    const timer = setTimeout(() => {
      try {
        // Criar elemento de anúncio
        if (adRef.current && !hasLoaded.current) {
          const ins = document.createElement('ins');
          ins.className = 'adsbygoogle';
          ins.style.display = 'block';
          ins.setAttribute('data-ad-slot', adSlotId);
          ins.setAttribute('data-ad-format', adFormat);
          ins.setAttribute('data-full-width-responsive', fullWidth ? 'true' : 'false');

          adRef.current.appendChild(ins);

          // Inicializar anúncio
          try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            hasLoaded.current = true;
          } catch (error) {
            console.error('Error initializing AdSense:', error);
          }
        }
      } catch (error) {
        console.error('Error creating AdSense ad:', error);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [adSlotId, adFormat, fullWidth]);

  if (!adSlotId) {
    return null;
  }

  return (
    <div
      ref={adRef}
      className={cn(
        'ad-google-adsense min-h-[250px] w-full',
        fullWidth && 'w-full',
        className
      )}
      style={{
        minHeight: adFormat === 'rectangle' ? '250px' : adFormat === 'horizontal' ? '90px' : '600px',
      }}
    />
  );
}
