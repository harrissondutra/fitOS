'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

interface ThemeProviderProps {
  children: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

export function ThemeProvider({ 
  children, 
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = false,
  disableTransitionOnChange = false,
  ...props 
}: ThemeProviderProps) {
  // Carregar tema inicial do localStorage se disponível (antes do perfil carregar)
  const [initialTheme, setInitialTheme] = React.useState<string>(defaultTheme);
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme-mode');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setInitialTheme(savedTheme);
      }
    }
  }, []);

  return (
    <NextThemesProvider
      attribute={attribute}
      defaultTheme={initialTheme}
      enableSystem={enableSystem}
      disableTransitionOnChange={disableTransitionOnChange}
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
