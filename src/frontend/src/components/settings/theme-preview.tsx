'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Sun, Moon } from 'lucide-react';

interface ThemePreviewProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  className?: string;
}

export function ThemePreview({ 
  primaryColor, 
  secondaryColor, 
  accentColor, 
  className 
}: ThemePreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [progressValue, setProgressValue] = useState(75);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Preview das cores:</h4>
        <div className="flex items-center space-x-2">
          <Sun className="h-4 w-4" />
          <Switch
            checked={isDarkMode}
            onCheckedChange={setIsDarkMode}
          />
          <Moon className="h-4 w-4" />
        </div>
      </div>
      
      <Tabs defaultValue="components" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="forms">Formulários</TabsTrigger>
          <TabsTrigger value="data">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-4">
          {/* Botões */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Botões</Label>
            <div className="flex flex-wrap gap-2">
              <Button 
                size="sm"
                style={{ backgroundColor: primaryColor }}
                className="text-white hover:opacity-90"
              >
                Primário
              </Button>
              
              <Button 
                size="sm"
                variant="outline"
                style={{ 
                  borderColor: secondaryColor,
                  color: secondaryColor,
                }}
                className="hover:bg-opacity-10"
              >
                Secundário
              </Button>
              
              <Button 
                size="sm"
                variant="ghost"
                style={{ color: accentColor }}
                className="hover:bg-opacity-10"
              >
                Destaque
              </Button>
            </div>
          </div>

          {/* Badges */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Badges</Label>
            <div className="flex flex-wrap gap-2">
              <Badge 
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white',
                }}
              >
                Primário
              </Badge>
              
              <Badge 
                variant="secondary"
                style={{ 
                  backgroundColor: secondaryColor,
                  color: 'white',
                }}
              >
                Secundário
              </Badge>
              
              <Badge 
                variant="outline"
                style={{ 
                  borderColor: accentColor,
                  color: accentColor,
                }}
              >
                Destaque
              </Badge>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Cards</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Card Padrão</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Exemplo de card com tema atual.
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                style={{ 
                  borderColor: primaryColor,
                }}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Card Destacado</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-muted-foreground">
                    Card com borda na cor primária.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="forms" className="space-y-4">
          {/* Inputs */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Campos de Entrada</Label>
            <div className="space-y-3">
              <Input 
                placeholder="Campo de texto padrão"
                className="w-full"
              />
              <Input 
                placeholder="Campo com foco na cor primária"
                className="w-full"
                style={{ 
                  borderColor: primaryColor,
                  '--tw-ring-color': primaryColor,
                } as React.CSSProperties}
              />
            </div>
          </div>

          {/* Switches */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Switches</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={true}
                  style={{ 
                    '--tw-ring-color': primaryColor,
                  } as React.CSSProperties}
                />
                <Label className="text-xs">Ativado</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={false}
                  style={{ 
                    '--tw-ring-color': secondaryColor,
                  } as React.CSSProperties}
                />
                <Label className="text-xs">Desativado</Label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          {/* Progress Bars */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Barras de Progresso</Label>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso Primário</span>
                  <span>{progressValue}%</span>
                </div>
                <Progress 
                  value={progressValue} 
                  className="h-2"
                  style={{ 
                    '--progress-background': primaryColor,
                  } as React.CSSProperties}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso Secundário</span>
                  <span>60%</span>
                </div>
                <Progress 
                  value={60} 
                  className="h-2"
                  style={{ 
                    '--progress-background': secondaryColor,
                  } as React.CSSProperties}
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso Destaque</span>
                  <span>40%</span>
                </div>
                <Progress 
                  value={40} 
                  className="h-2"
                  style={{ 
                    '--progress-background': accentColor,
                  } as React.CSSProperties}
                />
              </div>
            </div>
          </div>

          {/* Color Bars */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Paleta de Cores</Label>
            <div className="space-y-1">
              <div 
                className="h-3 rounded-full"
                style={{ backgroundColor: primaryColor }}
              />
              <div 
                className="h-2 rounded-full"
                style={{ backgroundColor: secondaryColor }}
              />
              <div 
                className="h-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
