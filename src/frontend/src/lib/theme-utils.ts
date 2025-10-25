export interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  category: 'fitness' | 'professional' | 'creative' | 'neutral';
  primary: string;
  secondary: string;
  accent: string;
  isDefault?: boolean;
}

/**
 * Aplica cores customizadas às variáveis CSS
 */
export function applyCustomColors(colors: CustomColors) {
  const root = document.documentElement;
  
  // Converter hex para RGB
  const primaryRgb = hexToRgb(colors.primary);
  const secondaryRgb = hexToRgb(colors.secondary);
  const accentRgb = hexToRgb(colors.accent);
  
  if (primaryRgb) {
    root.style.setProperty('--color-primary', `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);
  }
  
  if (secondaryRgb) {
    root.style.setProperty('--color-secondary', `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}`);
  }
  
  if (accentRgb) {
    root.style.setProperty('--color-accent', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
  }
}

/**
 * Reseta para cores padrão
 */
export function resetToDefaults() {
  const root = document.documentElement;
  
  // Valores padrão (blue-500, green-500, orange-500)
  root.style.setProperty('--color-primary', '59 130 246');
  root.style.setProperty('--color-secondary', '16 185 129');
  root.style.setProperty('--color-accent', '245 158 11');
}

/**
 * Converte hex para RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  
  if (!result) {
    return null;
  }
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Converte RGB para hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Valida se uma string é um hex válido
 */
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/**
 * Cores pré-definidas populares
 */
export const PRESET_COLORS = [
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Lima', value: '#84cc16' },
  { name: 'Índigo', value: '#6366f1' },
  { name: 'Amarelo', value: '#eab308' },
  { name: 'Cinza', value: '#6b7280' },
  { name: 'Preto', value: '#000000' },
];

/**
 * Aplica tema (claro/escuro)
 */
export function applyTheme(mode: 'light' | 'dark') {
  const root = document.documentElement;
  
  if (mode === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  
  // Salvar no localStorage
  localStorage.setItem('theme-mode', mode);
}

/**
 * Carrega tema do localStorage
 */
export function loadThemeFromStorage(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  
  const saved = localStorage.getItem('theme-mode');
  return (saved === 'dark' || saved === 'light') ? saved : 'light';
}

/**
 * Aplica um preset de tema
 */
export function applyThemePreset(preset: ThemePreset) {
  const colors: CustomColors = {
    primary: preset.primary,
    secondary: preset.secondary,
    accent: preset.accent,
  };
  
  applyCustomColors(colors);
  
  // Salvar no localStorage para persistência local
  if (typeof window !== 'undefined') {
    localStorage.setItem('theme-preset', preset.id);
    localStorage.setItem('custom-colors', JSON.stringify(colors));
  }
}

/**
 * Obtém o preset atualmente ativo baseado nas cores aplicadas
 */
export function getCurrentThemePreset(presets: ThemePreset[]): ThemePreset | null {
  if (typeof window === 'undefined') return null;
  
  const savedPresetId = localStorage.getItem('theme-preset');
  if (savedPresetId) {
    const preset = presets.find(p => p.id === savedPresetId);
    if (preset) return preset;
  }
  
  // Se não encontrar por ID, tentar comparar cores
  const savedColors = localStorage.getItem('custom-colors');
  if (savedColors) {
    try {
      const colors: CustomColors = JSON.parse(savedColors);
      return presets.find(preset => 
        preset.primary === colors.primary &&
        preset.secondary === colors.secondary &&
        preset.accent === colors.accent
      ) || null;
    } catch (error) {
      console.error('Error parsing saved colors:', error);
    }
  }
  
  return null;
}

/**
 * Obtém preset por ID
 */
export function getPresetById(presets: ThemePreset[], id: string): ThemePreset | undefined {
  return presets.find(preset => preset.id === id);
}

/**
 * Gera variações de cor para hover, disabled, etc.
 */
export function generateColorVariations(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  
  // Converter para HSL para facilitar manipulação
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  return {
    base: hex,
    hover: hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 0.1)),
    active: hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - 0.2)),
    disabled: hslToHex(hsl.h, Math.max(0, hsl.s - 0.3), Math.min(1, hsl.l + 0.2)),
    light: hslToHex(hsl.h, Math.max(0, hsl.s - 0.2), Math.min(1, hsl.l + 0.3)),
  };
}

/**
 * Detecta se o tema atual é personalizado (não é um preset)
 */
export function isCustomTheme(presets: ThemePreset[]): boolean {
  const currentPreset = getCurrentThemePreset(presets);
  return !currentPreset;
}

/**
 * Converte RGB para HSL
 */
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return { h: h * 360, s, l };
}

/**
 * Converte HSL para hex
 */
function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return rgbToHex(Math.round(r * 255), Math.round(g * 255), Math.round(b * 255));
}
