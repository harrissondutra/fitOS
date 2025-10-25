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
        // Fallback para localStorage se falhar
        localStorage.setItem('theme', newTheme);
      });
    } else {
      // Fallback para localStorage se não autenticado
      localStorage.setItem('theme', newTheme);
    }
  }, [theme, isAuthenticated, authLoading, settingsLoading, settings?.theme, updateSettings]);

  const isDark = theme === 'dark';
  const isLight = theme === 'light';
  const isCustom = isCustomTheme(THEME_PRESETS);

  // Apply theme to document
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Load theme from backend or localStorage on mount
  useEffect(() => {
    if (isAuthenticated && !authLoading && !settingsLoading && settings?.theme?.mode) {
      // Carregar tema do backend se autenticado
      setTheme(settings.theme.mode);
      console.log('🎨 Tema carregado do backend:', settings.theme.mode);
    } else if (!isAuthenticated || authLoading || settingsLoading) {
      // Fallback para localStorage se não autenticado ou ainda carregando
      const savedTheme = loadThemeFromStorage();
      setTheme(savedTheme);
      console.log('🎨 Tema carregado do localStorage:', savedTheme);
    }
    
    // Load current preset
    const preset = getCurrentThemePreset(THEME_PRESETS);
    setCurrentPreset(preset);
  }, [isAuthenticated, authLoading, settingsLoading, settings?.theme?.mode]); // Incluído settings?.theme?.mode

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
  const applyCustomColorsWithPersistence = useCallback((colors: CustomColors) => {
    applyCustomColors(colors);
    
    // Salvar no backend se autenticado
    if (isAuthenticated && !authLoading && !settingsLoading) {
      updateSettings({
        theme: {
          mode: settings?.theme?.mode || 'light',
          customColors: colors
        }
      }).catch(error => {
        console.error('Erro ao salvar cores customizadas no backend:', error);
      });
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



