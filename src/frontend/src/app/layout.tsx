import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { ConditionalLayout } from '@/components/conditional-layout';
import { PWAWrapper } from '@/components/pwa/PWAWrapper';
import { ThemeInitializer } from '@/components/theme-initializer';
import { FetchInterceptorProvider } from '@/components/fetch-interceptor-provider';

// Forçar modo dinâmico globalmente
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitOS - Sistema Operacional de Fitness',
  description: 'Plataforma inteligente de gestão fitness com personal trainer alimentado por IA',
  keywords: ['fitness', 'treino', 'IA', 'personal trainer', 'saúde', 'academia', 'exercício'],
  authors: [{ name: 'Equipe FitOS' }],
  robots: 'index, follow',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FitOS',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'FitOS - Sistema Operacional de Fitness',
    description: 'Plataforma inteligente de gestão fitness com personal trainer alimentado por IA',
    type: 'website',
    locale: 'pt_BR',
    siteName: 'FitOS',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FitOS - Sistema Operacional de Fitness',
    description: 'Plataforma inteligente de gestão fitness com personal trainer alimentado por IA',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-config': '/browserconfig.xml',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#10b981' },
    { media: '(prefers-color-scheme: dark)', color: '#059669' }
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'} />

        {/* iOS Splash Screens - Gerados via PWA Asset Generator ou similar */}
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/splash/splash-1536x2048.png" media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1125x2436.png" media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-1242x2688.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-828x1792.png" media="(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-750x1334.png" media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />
        <link rel="apple-touch-startup-image" href="/splash/splash-640x1136.png" media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="FitOS" />
        <meta name="theme-color" content="#10b981" />
        <meta name="msapplication-TileColor" content="#10b981" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <FetchInterceptorProvider>
              <ThemeInitializer />
              <PWAWrapper
                enableInstallPrompt={true}
                enableUpdateNotification={true}
                enableOfflineIndicator={true}
                showOfflineDetails={false}
              >
                <ConditionalLayout>
                  {children}
                </ConditionalLayout>
                <Toaster />
              </PWAWrapper>
            </FetchInterceptorProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
