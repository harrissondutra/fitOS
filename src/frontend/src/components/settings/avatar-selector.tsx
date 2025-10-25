'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, User, Check } from 'lucide-react';
import { SocialAccount } from '@/shared/types/settings';
import { cn } from '@/lib/utils';

interface AvatarSelectorProps {
  currentAvatarUrl?: string;
  initials: string;
  socialAccounts: SocialAccount[];
  onSelectSocial: (provider: 'google' | 'apple' | 'microsoft') => void;
  onUpload: () => void;
  onSelectInitials: () => void;
  selectedType?: 'upload' | 'initials' | 'google' | 'apple' | 'microsoft';
  uploading?: boolean;
}

export function AvatarSelector({
  currentAvatarUrl,
  initials,
  socialAccounts,
  onSelectSocial,
  onUpload,
  onSelectInitials,
  selectedType,
  uploading = false,
}: AvatarSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return '🔵';
      case 'apple':
        return '🍎';
      case 'microsoft':
        return '🟦';
      default:
        return '👤';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'microsoft':
        return 'Microsoft';
      default:
        return provider;
    }
  };

  return (
    <div className="space-y-4">
      {/* Preview do avatar atual - Compacto */}
      <div className="flex flex-col items-center space-y-2">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={currentAvatarUrl} alt="Avatar atual" />
            <AvatarFallback className="text-lg font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Avatar atual
        </p>
      </div>

      {/* Opções de avatar - Layout compacto */}
      <div className="space-y-3">
        {/* Contas sociais */}
        {socialAccounts.map((account) => (
          <Card
            key={account.provider}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selectedType === account.provider && "ring-2 ring-primary",
              hoveredCard === account.provider && "shadow-md"
            )}
            onMouseEnter={() => setHoveredCard(account.provider)}
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => onSelectSocial(account.provider)}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={account.photoUrl} alt={`${account.provider} avatar`} />
                  <AvatarFallback className="text-sm">
                    {getProviderIcon(account.provider)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {getProviderName(account.provider)}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    Conectado
                  </Badge>
                </div>
                
                <Button
                  size="sm"
                  variant={selectedType === account.provider ? "default" : "outline"}
                  disabled={uploading}
                >
                  {selectedType === account.provider ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    'Usar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Upload de imagem */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            selectedType === 'upload' && "ring-2 ring-primary",
            hoveredCard === 'upload' && "shadow-md"
          )}
          onMouseEnter={() => setHoveredCard('upload')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={onUpload}
        >
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Upload de Imagem</p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, WEBP (máx 2MB)
                </p>
              </div>
              
              <Button
                size="sm"
                variant={selectedType === 'upload' ? "default" : "outline"}
                disabled={uploading}
              >
                {selectedType === 'upload' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  'Upload'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Iniciais */}
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md",
            selectedType === 'initials' && "ring-2 ring-primary",
            hoveredCard === 'initials' && "shadow-md"
          )}
          onMouseEnter={() => setHoveredCard('initials')}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={onSelectInitials}
        >
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Usar Iniciais</p>
                <p className="text-xs text-muted-foreground">
                  {initials}
                </p>
              </div>
              
              <Button
                size="sm"
                variant={selectedType === 'initials' ? "default" : "outline"}
                disabled={uploading}
              >
                {selectedType === 'initials' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  'Usar'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
