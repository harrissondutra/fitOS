'use client';

/**
 * AdInterstitial - Componente para anúncios intersticiais
 * Design não-intrusivo, aparece apenas após interação do usuário
 */

import React, { useState, useEffect } from 'react';
import { Advertisement } from '@/shared/types/advertisements.types';
import { useTrackAdView, useTrackAdClick } from '@/hooks/useAdvertisements';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { CustomAd } from './CustomAd';
import { GoogleAdsense } from './GoogleAdsense';

interface AdInterstitialProps {
  ad: Advertisement;
  isOpen: boolean;
  onClose: () => void;
  delay?: number; // Delay em ms antes de mostrar (padrão: 30s após página carregar)
}

export function AdInterstitial({
  ad,
  isOpen,
  onClose,
  delay = 30000,
}: AdInterstitialProps) {
  const { trackView } = useTrackAdView();
  const { trackClick } = useTrackAdClick();
  const [hasTracked, setHasTracked] = useState(false);

  useEffect(() => {
    if (isOpen && !hasTracked) {
      trackView(ad.id, ad.position);
      setHasTracked(true);
    }
  }, [isOpen, ad.id, ad.position, trackView, hasTracked]);

  const handleClose = () => {
    onClose();
  };

  const handleClick = (e: React.MouseEvent) => {
    trackClick(ad.id, ad.position);
    // O CustomAd já abre a URL, então não precisamos fazer nada aqui
  };

  if (!ad.isActive) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 gap-0">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-6 w-6"
            onClick={handleClose}
          >
            <X className="h-4 w-4" />
          </Button>

          {ad.adCode && ad.type === 'banner' ? (
            <div className="p-4">
              <GoogleAdsense
                adSlotId={ad.adCode}
                adFormat="auto"
                fullWidth
              />
            </div>
          ) : (
            <CustomAd ad={ad} onClick={handleClick} variant="featured" />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
