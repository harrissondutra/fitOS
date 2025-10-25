'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { THEME_PRESETS, getPresetsByCategory, getCategoryInfo, type ThemePreset } from '@/lib/theme-presets';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ThemePaletteSelectorProps {
  selectedPresetId?: string;
  onPresetSelect: (preset: ThemePreset) => void;
  onCustomizeClick: () => void;
  className?: string;
}

export function ThemePaletteSelector({
  selectedPresetId,
  onPresetSelect,
  onCustomizeClick,
  className
}: ThemePaletteSelectorProps) {
  const categories: ThemePreset['category'][] = ['fitness', 'professional', 'creative', 'neutral'];

  return (
    <div className={cn("space-y-6", className)}>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Escolha um Tema</h3>
        <p className="text-sm text-muted-foreground">
          Selecione um tema pré-definido ou personalize suas próprias cores
        </p>
      </div>

      <RadioGroup
        value={selectedPresetId || ''}
        onValueChange={(value) => {
          const preset = THEME_PRESETS.find(p => p.id === value);
          if (preset) onPresetSelect(preset);
        }}
        className="space-y-6"
      >
        {categories.map((category) => {
          const presets = getPresetsByCategory(category);
          const categoryInfo = getCategoryInfo(category);
          
          return (
            <div key={category} className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{categoryInfo.icon}</span>
                <div>
                  <h4 className="font-medium">{categoryInfo.name}</h4>
                  <p className="text-xs text-muted-foreground">{categoryInfo.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {presets.map((preset) => (
                  <motion.div
                    key={preset.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label htmlFor={preset.id} className="cursor-pointer">
                      <Card 
                        className={cn(
                          "relative transition-all duration-200 hover:shadow-md",
                          selectedPresetId === preset.id 
                            ? "ring-2 ring-primary shadow-md" 
                            : "hover:shadow-sm"
                        )}
                      >
                        <RadioGroupItem
                          value={preset.id}
                          id={preset.id}
                          className="sr-only"
                        />
                        
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium">
                              {preset.name}
                            </CardTitle>
                            {preset.isDefault && (
                              <Badge variant="secondary" className="text-xs">
                                Padrão
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs">
                            {preset.description}
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Color Preview */}
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <span className="text-xs text-muted-foreground">Primária</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: preset.secondary }}
                              />
                              <span className="text-xs text-muted-foreground">Secundária</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-4 h-4 rounded-full border border-border"
                                style={{ backgroundColor: preset.accent }}
                              />
                              <span className="text-xs text-muted-foreground">Destaque</span>
                            </div>
                          </div>
                          
                          {/* Color Bars Preview */}
                          <div className="mt-3 space-y-1">
                            <div 
                              className="h-2 rounded-full"
                              style={{ backgroundColor: preset.primary }}
                            />
                            <div 
                              className="h-1 rounded-full"
                              style={{ backgroundColor: preset.secondary }}
                            />
                            <div 
                              className="h-1 rounded-full"
                              style={{ backgroundColor: preset.accent }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </RadioGroup>

      <Separator />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-medium">Personalização Avançada</h4>
          <p className="text-sm text-muted-foreground">
            Ajuste cada cor individualmente para criar seu tema único
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={onCustomizeClick}
          className="shrink-0"
        >
          Personalizar Cores
        </Button>
      </div>
    </div>
  );
}
