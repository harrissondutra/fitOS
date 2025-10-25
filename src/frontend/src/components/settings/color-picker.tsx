'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRESET_COLORS, isValidHex } from '@/lib/theme-utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(true);

  const handlePresetClick = (color: string) => {
    setInputValue(color);
    onChange(color);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (isValidHex(newValue)) {
      setIsValid(true);
      onChange(newValue);
    } else {
      setIsValid(false);
    }
  };

  const handleInputBlur = () => {
    if (!isValidHex(inputValue)) {
      setInputValue(value);
      setIsValid(true);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      <div className="flex items-center space-x-3">
        {/* Color input nativo */}
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
            }}
            className="w-12 h-10 rounded border border-input cursor-pointer"
          />
        </div>

        {/* Input de texto para hex */}
        <div className="flex-1">
          <Input
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            placeholder="#000000"
            className={cn(
              "font-mono text-sm",
              !isValid && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {!isValid && (
            <p className="text-xs text-destructive mt-1">
              Formato inválido. Use #000000
            </p>
          )}
        </div>

        {/* Preview da cor */}
        <div
          className="w-10 h-10 rounded border border-input"
          style={{ backgroundColor: value }}
        />
      </div>

      {/* Paleta de cores pré-definidas */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            Escolher cor pré-definida
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Cores populares</h4>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handlePresetClick(color.value)}
                  className={cn(
                    "w-8 h-8 rounded border-2 border-transparent hover:border-primary transition-colors relative",
                    value === color.value && "border-primary"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                >
                  {value === color.value && (
                    <Check className="h-4 w-4 text-white absolute inset-0 m-auto drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
