'use client';

/**
 * CustomAd - Componente para anúncios customizados
 * Design elegante e não-intrusivo
 */

import React from 'react';
import { Advertisement } from '@/shared/types/advertisements.types';
import { useTrackAdClick } from '@/hooks/useAdvertisements';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface CustomAdProps {
  ad: Advertisement;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'featured';
}

export function CustomAd({ ad, onClick, className, variant = 'default' }: CustomAdProps) {
  const { trackClick } = useTrackAdClick();

  const handleClick = (e: React.MouseEvent) => {
    trackClick(ad.id, ad.position);
    if (onClick) {
      onClick(e);
    }
  };

  const isAffiliate = ad.type === 'affiliate';
  const isSponsored = ad.type === 'sponsored_content';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border transition-all hover:shadow-lg cursor-pointer',
        variant === 'compact' && 'p-2',
        variant === 'featured' && 'border-primary',
        className
      )}
      onClick={handleClick}
    >
      {isSponsored && (
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 z-10 text-xs"
        >
          Patrocinado
        </Badge>
      )}

      {ad.imageUrl && (
        <div className={cn(
          'relative overflow-hidden',
          variant === 'compact' ? 'h-24' : 'h-48',
          variant === 'featured' && 'h-56'
        )}>
          <Image
            src={ad.imageUrl}
            alt={ad.title || 'Advertisement'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}

      <CardContent className={cn(
        'p-4',
        variant === 'compact' && 'p-2'
      )}>
        {ad.title && (
          <h3 className={cn(
            'font-semibold mb-1 line-clamp-2',
            variant === 'compact' ? 'text-sm' : 'text-base',
            variant === 'featured' && 'text-lg'
          )}>
            {ad.title}
          </h3>
        )}

        {ad.description && variant !== 'compact' && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {ad.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {isAffiliate && (
            <Badge variant="outline" className="text-xs">
              Parceiro
            </Badge>
          )}
          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
