/**
 * Componente de Overlay para Imagens de Fundo - FitOS
 * 
 * Componente reutilizável para criar overlay sobre imagens de fundo
 * usado nas telas de autenticação (login, signup, forgot-password, etc.)
 */

import React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface ImageOverlayProps {
  imageUrl: string;
  overlayColor?: string;
  overlayOpacity?: number;
  children: React.ReactNode;
  className?: string;
}

export function ImageOverlay({
  imageUrl,
  overlayColor = "hsl(var(--primary))",
  overlayOpacity = 0.7,
  children,
  className
}: ImageOverlayProps) {
  return (
    <div className={cn("relative min-h-screen", className)}>
      {/* Imagem de fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${imageUrl})`,
        }}
      />
      
      {/* Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />
      
      {/* Conteúdo */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <Card className="w-full max-w-md">
          {children}
        </Card>
      </div>
    </div>
  );
}









