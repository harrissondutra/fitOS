import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';
import { 
  applyTheme, 
  loadThemeFromStorage, 
  applyCustomColors, 
  resetToDefaults, 
  applyThemePreset,
  getCurrentThemePreset,
  getPresetById,
  isCustomTheme,
  CustomColors,
  ThemePreset 
} from '../lib/theme-utils';
import { THEME_PRESETS } from '../lib/theme-presets';
import { useProfileSettings } from './use-profile-settings';
import { useAuth } from './use-auth';

interface UseThemeReturn {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  applyCustomColors: (colors: CustomColors) => void;
  resetToDefaults: () => void;
  selectThemePreset: (presetId: string) => void;
  resetToPreset: (presetId: string) => void;
  currentPreset: ThemePreset | null;
  isCustom: boolean;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [currentPreset, setCurrentPreset] = useState<ThemePreset | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { settings, updateSettings, loading: settingsLoading } = useProfileSettings();

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Salvar no localStorage imediatamente para sincronização
    localStorage.setItem('theme-mode', newTheme);
    
    // Salvar no backend se autenticado
    if (isAuthenticated && !authLoading && !settingsLoading) {
      updateSettings({
        theme: {
          mode: newTheme,
          customColors: settings?.theme?.customColors || {
            primary: '#8B5CF6',
            secondary: '#10B981',
            accent: '#F59E0B'
          }
        }
      }).catch(error => {
        console.error('Erro ao salvar tema no backend:', error);
        // localStorage já foi atualizado acima como fallback
      });
    }
  }, [theme, isAuthenticated, authLoading, settingsLoading, settings?.theme, updateSettings]);

  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const isCustom = isCustomTheme(THEME_PRESETS);

  // Apply theme to document and sync with next-themes
  useEffect(() => {
    applyTheme(theme);
    // Também sincronizar com next-themes se disponível
    if (typeof window !== 'undefined') {
      const htmlElement = document.documentElement;
      htmlElement.classList.remove('light', 'dark');
      htmlElement.classList.add(theme);
      htmlElement.style.colorScheme = theme;
    }
  }, [theme]);

  // Load theme from backend or localStorage on mount
  useEffect(() => {
    // Priorizar tema do perfil do usuário se autenticado e carregado
    if (isAuthenticated && !authLoading && !settingsLoading) {
      if (settings?.theme?.mode) {
        // Carregar tema do backend se autenticado e settings disponível
        setTheme(settings.theme.mode);
        console.log('🎨 Tema carregado do backend:', settings.theme.mode);
      } else {
        // Se autenticado mas sem tema no perfil, usar localStorage como fallback
        const savedTheme = loadThemeFromStorage();
        setTheme(savedTheme);
        console.log('🎨 Tema carregado do localStorage (usuário autenticado sem tema no perfil):', savedTheme);
      }
    } else if (!isAuthenticated && !authLoading) {
      // Se não autenticado e não está carregando, usar localStorage
      const savedTheme = loadThemeFromStorage();
      setTheme(savedTheme);
      console.log('🎨 Tema carregado do localStorage (não autenticado):', savedTheme);
    }
    // Se ainda está carregando (authLoading ou settingsLoading), não fazer nada para evitar conflitos
    
    // Load current preset
    const preset = getCurrentThemePreset(THEME_PRESETS);
    setCurrentPreset(preset);
  }, [isAuthenticated, authLoading, settingsLoading, settings?.theme?.mode]);

  // Select theme preset
  const selectThemePreset = useCallback((presetId: string) => {
    const preset = getPresetById(THEME_PRESETS, presetId);
    if (preset) {
      applyThemePreset(preset);
      setCurrentPreset(preset);
      
      // Salvar no backend se autenticado
      if (isAuthenticated && !authLoading && !settingsLoading) {
        updateSettings({
          theme: {
            mode: settings?.theme?.mode || 'light',
            customColors: {
              primary: preset.primary,
              secondary: preset.secondary,
              accent: preset.accent
            }
          }
        }).catch(error => {
          console.error('Erro ao salvar preset no backend:', error);
        });
      }
    }
  }, [isAuthenticated, authLoading, settingsLoading, settings?.theme, updateSettings]);

  // Reset to specific preset
  const resetToPreset = useCallback((presetId: string) => {
    const preset = getPresetById(THEME_PRESETS, presetId);
    if (preset) {
      applyThemePreset(preset);
      setCurrentPreset(preset);
      
      // Salvar no backend se autenticado
      if (isAuthenticated && !authLoading && !settingsLoading) {
        updateSettings({
          theme: {
            mode: settings?.theme?.mode || 'light',
            customColors: {
              primary: preset.primary,
              secondary: preset.secondary,
              accent: preset.accent
            }
          }
        }).catch(error => {
          console.error('Erro ao salvar preset no backend:', error);
        });
      }
    }
  }, [isAuthenticated, authLoading, settingsLoading, settings?.theme, updateSettings]);

  // Wrapper para applyCustomColors que salva no backend
  const applyCustomColorsWithPersistence = useCallback((colors: CustomColors, skipSave = false) => {
    applyCustomColors(colors);
    
    // Salvar no backend se autenticado e não for uma chamada de inicialização
    if (!skipSave && isAuthenticated && !authLoading && !settingsLoading) {
      // Verificar se as cores já são as mesmas (evitar salvar desnecessariamente)
      const currentColors = settings?.theme?.customColors;
      if (currentColors && 
          currentColors.primary === colors.primary && 
          currentColors.secondary === colors.secondary && 
          currentColors.accent === colors.accent) {
        // Cores já são as mesmas, não precisa salvar
        return;
      }
      
      // Usar setTimeout para evitar múltiplas chamadas síncronas
      setTimeout(() => {
        updateSettings({
          theme: {
            mode: settings?.theme?.mode || 'light',
            customColors: colors
          }
        }).catch(error => {
          // Silenciosamente ignorar erros de rede (backend offline)
          if (error instanceof Error && !error.message.includes('Failed to fetch') && !error.message.includes('ERR_CONNECTION_REFUSED')) {
            console.debug('Erro ao salvar cores customizadas no backend (non-critical):', error);
          }
        });
      }, 200); // Debounce de 200ms
    }
  }, [isAuthenticated, authLoading, settingsLoading, settings?.theme, updateSettings]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark,
    isLight,
    applyCustomColors: applyCustomColorsWithPersistence,
    resetToDefaults,
    selectThemePreset,
    resetToPreset,
    currentPreset,
    isCustom,
  };
}



