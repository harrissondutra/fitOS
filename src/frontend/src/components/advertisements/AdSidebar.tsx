'use client';

/**
 * AdSidebar - Componente para anúncios na sidebar
 * Design compacto e elegante
 */

import React from 'react';
import { Advertisement } from '@/shared/types/advertisements.types';
import { useTrackAdClick } from '@/hooks/useAdvertisements';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface AdSidebarProps {
  ad: Advertisement;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function AdSidebar({ ad, onClick, className }: AdSidebarProps) {
  const { trackClick } = useTrackAdClick();

  const handleClick = (e: React.MouseEvent) => {
    trackClick(ad.id, ad.position);
    if (onClick) {
      onClick(e);
    }
  };

  const isSponsored = ad.type === 'sponsored_content';

  return (
    <Card
      className={cn(
        'group relative overflow-hidden border transition-all hover:shadow-lg cursor-pointer',
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
        <div className="relative h-32 w-full overflow-hidden">
          <Image
            src={ad.imageUrl}
            alt={ad.title || 'Advertisement'}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
          />
        </div>
      )}

      <CardContent className="p-3">
        {ad.title && (
          <h4 className="font-semibold text-sm mb-1 line-clamp-2">
            {ad.title}
          </h4>
        )}

        {ad.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {ad.description}
          </p>
        )}

        <div className="flex items-center justify-end">
          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardContent>
    </Card>
  );
}
