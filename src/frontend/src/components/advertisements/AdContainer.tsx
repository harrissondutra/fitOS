'use client';

/**
 * AdContainer - Componente wrapper para renderizar anúncios
 * Decide qual componente usar baseado no tipo de anúncio
 */

import React, { useEffect, useRef } from 'react';
import { Advertisement } from '@/shared/types/advertisements.types';
import { useTrackAdView } from '@/hooks/useAdvertisements';
import { GoogleAdsense } from './GoogleAdsense';
import { CustomAd } from './CustomAd';
import { AdBanner } from './AdBanner';
import { AdSidebar } from './AdSidebar';
import { cn } from '@/lib/utils';

interface AdContainerProps {
  ad: Advertisement;
  className?: string;
  onAdClick?: (ad: Advertisement) => void;
}

export function AdContainer({ ad, className, onAdClick }: AdContainerProps) {
  const { trackView } = useTrackAdView();
  const hasTrackedView = useRef(false);

  useEffect(() => {
    // Track view apenas uma vez quando o componente é montado
    if (!hasTrackedView.current && ad.isActive) {
      trackView(ad.id, ad.position);
      hasTrackedView.current = true;
    }
  }, [ad.id, ad.position, ad.isActive, trackView]);

  if (!ad.isActive) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAdClick) {
      onAdClick(ad);
    }
    // Abrir URL em nova aba se tiver targetUrl
    if (ad.targetUrl) {
      window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Renderizar componente baseado no tipo
  // Se tiver adCode, pode ser Google AdSense ou anúncio customizado com código
  if (ad.adCode && ad.type === 'banner') {
    // Assumir que adCode indica Google AdSense
    return (
      <div className={cn('ad-container', className)}>
        <GoogleAdsense
          adSlotId={ad.adCode}
          adFormat="auto"
        />
      </div>
    );
  }

  switch (ad.type) {
    case 'native':
    case 'contextual':
    case 'sponsored_content':
      // Renderizar como CustomAd para posições específicas
      if (ad.position === 'sidebar') {
        return (
          <div className={cn('ad-container', className)}>
            <AdSidebar ad={ad} onClick={handleClick} />
          </div>
        );
      }
      
      if (ad.position === 'header' || ad.position === 'footer') {
        return (
          <div className={cn('ad-container', className)}>
            <AdBanner ad={ad} onClick={handleClick} />
          </div>
        );
      }

      // Default: CustomAd
      return (
        <div className={cn('ad-container', className)}>
          <CustomAd ad={ad} onClick={handleClick} />
        </div>
      );

    case 'affiliate':
      return (
        <div className={cn('ad-container', className)}>
          <CustomAd ad={ad} onClick={handleClick} />
        </div>
      );

    default:
      return (
        <div className={cn('ad-container', className)}>
          <CustomAd ad={ad} onClick={handleClick} />
        </div>
      );
  }
}
