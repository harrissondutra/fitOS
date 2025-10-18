import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/providers/auth-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitOS - Sistema Operacional de Fitness',
  description: 'Plataforma inteligente de gestão fitness com personal trainer alimentado por IA',
  keywords: ['fitness', 'treino', 'IA', 'personal trainer', 'saúde', 'academia', 'exercício'],
  authors: [{ name: 'Equipe FitOS' }],
  robots: 'index, follow',
  openGraph: {
    title: 'FitOS - Sistema Operacional de Fitness',
    description: 'Plataforma inteligente de gestão fitness com personal trainer alimentado por IA',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitOS - Sistema Operacional de Fitness',
    description: 'Plataforma inteligente de gestão fitness com personal trainer alimentado por IA',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
