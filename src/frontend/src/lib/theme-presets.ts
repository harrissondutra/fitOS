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

export const THEME_PRESETS: ThemePreset[] = [
  // Fitness Category
  {
    id: 'fitos-purple',
    name: 'FitOS Purple',
    description: 'Tema oficial do FitOS - Roxo vibrante e moderno',
    category: 'fitness',
    primary: '#8b5cf6',
    secondary: '#10b981',
    accent: '#f59e0b',
    isDefault: true,
  },
  {
    id: 'energy-orange',
    name: 'Energy Orange',
    description: 'Laranja energético para máxima motivação',
    category: 'fitness',
    primary: '#f97316',
    secondary: '#06b6d4',
    accent: '#84cc16',
  },
  {
    id: 'power-green',
    name: 'Power Green',
    description: 'Verde esmeralda para vitalidade e crescimento',
    category: 'fitness',
    primary: '#10b981',
    secondary: '#3b82f6',
    accent: '#f59e0b',
  },
  {
    id: 'fire-red',
    name: 'Fire Red',
    description: 'Vermelho intenso para alta performance',
    category: 'fitness',
    primary: '#ef4444',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
  },

  // Professional Category
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    description: 'Azul corporativo para ambiente profissional',
    category: 'professional',
    primary: '#3b82f6',
    secondary: '#6b7280',
    accent: '#10b981',
  },
  {
    id: 'executive-gray',
    name: 'Executive Gray',
    description: 'Cinza executivo elegante e sofisticado',
    category: 'professional',
    primary: '#374151',
    secondary: '#6b7280',
    accent: '#3b82f6',
  },
  {
    id: 'business-indigo',
    name: 'Business Indigo',
    description: 'Índigo empresarial para confiança e estabilidade',
    category: 'professional',
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#10b981',
  },

  // Creative Category
  {
    id: 'artistic-pink',
    name: 'Artistic Pink',
    description: 'Rosa artístico para criatividade e inovação',
    category: 'creative',
    primary: '#ec4899',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
  },
  {
    id: 'creative-cyan',
    name: 'Creative Cyan',
    description: 'Ciano criativo para inspiração e originalidade',
    category: 'creative',
    primary: '#06b6d4',
    secondary: '#ec4899',
    accent: '#84cc16',
  },

  // Neutral Category
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Cinza minimalista para foco e simplicidade',
    category: 'neutral',
    primary: '#6b7280',
    secondary: '#9ca3af',
    accent: '#3b82f6',
  },
  {
    id: 'warm-beige',
    name: 'Warm Beige',
    description: 'Bege acolhedor para conforto e calma',
    category: 'neutral',
    primary: '#a78bfa',
    secondary: '#fbbf24',
    accent: '#f59e0b',
  },
];

export const getPresetById = (id: string): ThemePreset | undefined => {
  return THEME_PRESETS.find(preset => preset.id === id);
};

export const getPresetsByCategory = (category: ThemePreset['category']): ThemePreset[] => {
  return THEME_PRESETS.filter(preset => preset.category === category);
};

export const getDefaultPreset = (): ThemePreset => {
  return THEME_PRESETS.find(preset => preset.isDefault) || THEME_PRESETS[0];
};

export const getCategoryInfo = (category: ThemePreset['category']) => {
  const categoryMap = {
    fitness: {
      name: 'Fitness',
      description: 'Temas energéticos e motivacionais',
      icon: '💪',
    },
    professional: {
      name: 'Profissional',
      description: 'Temas corporativos e elegantes',
      icon: '👔',
    },
    creative: {
      name: 'Criativo',
      description: 'Temas artísticos e inovadores',
      icon: '🎨',
    },
    neutral: {
      name: 'Neutro',
      description: 'Temas minimalistas e equilibrados',
      icon: '⚪',
    },
  };
  
  return categoryMap[category];
};
