'use client';

/**
 * AdBanner - Componente para anúncios em formato banner
 * Design elegante para header/footer
 */

import React from 'react';
import { Advertisement } from '@/shared/types/advertisements.types';
import { useTrackAdClick } from '@/hooks/useAdvertisements';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AdBannerProps {
  ad: Advertisement;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function AdBanner({ ad, onClick, className }: AdBannerProps) {
  const { trackClick } = useTrackAdClick();

  const handleClick = (e: React.MouseEvent) => {
    trackClick(ad.id, ad.position);
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className={cn(
        'relative w-full bg-muted/50 rounded-lg overflow-hidden transition-all hover:shadow-md cursor-pointer group',
        'border border-border/50',
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4 p-3 md:p-4">
        {ad.imageUrl && (
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded overflow-hidden">
            <Image
              src={ad.imageUrl}
              alt={ad.title || 'Advertisement'}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          {ad.title && (
            <h4 className="font-semibold text-sm md:text-base line-clamp-1 mb-1">
              {ad.title}
            </h4>
          )}
          {ad.description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
              {ad.description}
            </p>
          )}
        </div>

        <ExternalLink className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}
