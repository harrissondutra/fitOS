'use client';

import React from 'react';
import { 
  Brain, 
  Watch, 
  Eye, 
  Store, 
  Palette, 
  BarChart3, 
  Code,
  Check,
  X
} from 'lucide-react';

interface FeatureBadgeProps {
  feature: string;
  enabled: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const featureIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  aiAgents: Brain,
  wearables: Watch,
  computerVision: Eye,
  marketplace: Store,
  whiteLabel: Palette,
  advancedAnalytics: BarChart3,
  apiAccess: Code
};

const featureNames: Record<string, string> = {
  aiAgents: 'AI Agents',
  wearables: 'Wearables',
  computerVision: 'Computer Vision',
  marketplace: 'Marketplace',
  whiteLabel: 'White Label',
  advancedAnalytics: 'Analytics Avançado',
  apiAccess: 'API Access'
};

const featureDescriptions: Record<string, string> = {
  aiAgents: 'Agentes de IA para coaching, nutrição e negócios',
  wearables: 'Integração com dispositivos vestíveis',
  computerVision: 'Análise de movimento por visão computacional',
  marketplace: 'Marketplace de produtos e serviços',
  whiteLabel: 'Personalização completa da marca',
  advancedAnalytics: 'Relatórios e análises avançadas',
  apiAccess: 'Acesso à API para integrações'
};

export function FeatureBadge({ 
  feature, 
  enabled, 
  size = 'md',
  showIcon = true,
  className = ''
}: FeatureBadgeProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-2.5 py-0.5 text-sm';
    }
  };

  const Icon = featureIcons[feature] || Check;
  const featureName = featureNames[feature] || feature;
  const description = featureDescriptions[feature] || '';

  return (
    <div
      className={`inline-flex items-center font-medium rounded-full ${getSizeClasses()} ${
        enabled
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
          : 'bg-muted text-muted-foreground border border-border'
      } ${className}`}
      title={description}
    >
      {showIcon && (
        enabled ? (
          <Check className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        ) : (
          <X className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        )
      )}
      {showIcon && (
        <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      )}
      {featureName}
    </div>
  );
}

interface FeatureListProps {
  features: Record<string, boolean>;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function FeatureList({ 
  features, 
  size = 'md',
  showIcon = true,
  className = ''
}: FeatureListProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {Object.entries(features).map(([feature, enabled]) => (
        <FeatureBadge
          key={feature}
          feature={feature}
          enabled={enabled}
          size={size}
          showIcon={showIcon}
        />
      ))}
    </div>
  );
}

interface FeatureToggleProps {
  feature: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function FeatureToggle({ 
  feature, 
  enabled, 
  onChange,
  disabled = false,
  className = ''
}: FeatureToggleProps) {
  const Icon = featureIcons[feature] || Check;
  const featureName = featureNames[feature] || feature;
  const description = featureDescriptions[feature] || '';

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg ${className}`}>
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-sm font-medium text-foreground">{featureName}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
