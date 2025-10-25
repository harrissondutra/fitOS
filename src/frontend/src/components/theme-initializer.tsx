'use client';

import { useEffect } from 'react';
import { useProfileSettings } from '@/hooks/use-profile-settings';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/use-auth';

export function ThemeInitializer() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings, loading: settingsLoading } = useProfileSettings();
  const { applyCustomColors, selectThemePreset, currentPreset } = useTheme();

  // Aplicar tema e cores do perfil quando carregar (apenas se autenticado)
  useEffect(() => {
    // Só aplicar cores se estiver autenticado e não estiver carregando
    if (!isAuthenticated || isLoading || settingsLoading) {
      return;
    }

    // Aplicar tema (light/dark) do perfil
    if (settings?.theme?.mode) {
      // O useTheme já gerencia isso, mas podemos forçar a aplicação aqui também
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(settings.theme.mode);
      document.documentElement.style.colorScheme = settings.theme.mode;
    }

    // Aplicar cores customizadas do perfil
    if (settings?.theme?.customColors) {
      applyCustomColors(settings.theme.customColors);
    } else if (currentPreset) {
      // Se não há cores customizadas mas há um preset ativo, aplicá-lo
      selectThemePreset(currentPreset.id);
    }
  }, [
    isAuthenticated, 
    isLoading, 
    settingsLoading,
    applyCustomColors,
    currentPreset,
    selectThemePreset,
    settings?.theme?.customColors,
    settings?.theme?.mode
  ]);

  // Este componente não renderiza nada, apenas aplica as cores
  return null;
}
