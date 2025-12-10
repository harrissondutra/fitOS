'use client';

import { useEffect } from 'react';
import { useTheme as useNextTheme } from 'next-themes';
import { useProfileSettings } from '@/hooks/use-profile-settings';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

export function ThemeInitializer() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings, loading: settingsLoading } = useProfileSettings();
  const { theme: customTheme, applyCustomColors, selectThemePreset, currentPreset } = useTheme();
  const { setTheme: setNextTheme } = useNextTheme();

  // Sincronizar tema do hook customizado com next-themes sempre que mudar
  useEffect(() => {
    if (customTheme) {
      setNextTheme(customTheme);
    }
  }, [customTheme, setNextTheme]);

  // Sincronizar tema do perfil com next-themes quando carregar
  useEffect(() => {
    // Só aplicar se estiver autenticado e não estiver carregando
    if (!isAuthenticated || isLoading || settingsLoading) {
      return;
    }

    // Sincronizar tema (light/dark) do perfil com next-themes
    if (settings?.theme?.mode) {
      // Sincronizar com next-themes
      setNextTheme(settings.theme.mode);
      
      // Aplicar diretamente no HTML também (garantir aplicação imediata)
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(settings.theme.mode);
      document.documentElement.style.colorScheme = settings.theme.mode;
      
      console.log('🎨 Tema sincronizado com next-themes:', settings.theme.mode);
    }

    // Aplicar cores customizadas do perfil (com skipSave=true para evitar loop)
    if (settings?.theme?.customColors) {
      // Converter hex para RGB para comparar com CSS variable
      const hexToRgbString = (hex: string): string | null => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;
        return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
      };
      
      const root = document.documentElement;
      const currentPrimary = root.style.getPropertyValue('--color-primary');
      const expectedPrimary = hexToRgbString(settings.theme.customColors.primary);
      
      // Verificar se as cores são diferentes
      const needsUpdate = !currentPrimary || currentPrimary !== expectedPrimary;
      
      if (needsUpdate) {
        // Usar applyCustomColors diretamente com skipSave para evitar salvar no backend
        // já que estamos apenas inicializando a partir do backend
        if (typeof applyCustomColors === 'function') {
          try {
            // applyCustomColors aceita um segundo parâmetro skipSave
            (applyCustomColors as any)(settings.theme.customColors, true);
            console.log('🎨 Cores customizadas aplicadas do perfil');
          } catch {
            // Fallback se não aceitar segundo parâmetro
            applyCustomColors(settings.theme.customColors);
          }
        }
      }
    } else if (currentPreset) {
      // Se não há cores customizadas mas há um preset ativo, aplicá-lo
      selectThemePreset(currentPreset.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isAuthenticated, 
    isLoading, 
    settingsLoading,
    setNextTheme,
    // Remover applyCustomColors, currentPreset, selectThemePreset das dependências
    // para evitar loops infinitos. Usar apenas quando realmente necessário.
    settings?.theme?.customColors?.primary,
    settings?.theme?.customColors?.secondary,
    settings?.theme?.customColors?.accent,
    settings?.theme?.mode
  ]);

  // Este componente não renderiza nada, apenas aplica as cores
  return null;
}
