'use client';

import React from 'react';
import { Crown, Star, Building2, User } from 'lucide-react';

interface PlanBadgeProps {
  plan: string;
  isCustom?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PlanBadge({ 
  plan, 
  isCustom = false, 
  size = 'md',
  showIcon = true,
  className = ''
}: PlanBadgeProps) {
  const getPlanInfo = (planName: string) => {
    const planMap: Record<string, { 
      name: string; 
      color: string; 
      bgColor: string; 
      icon: React.ComponentType<{ className?: string }>;
    }> = {
      individual: {
        name: 'Pessoa Física',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted',
        icon: User
      },
      starter: {
        name: 'Starter',
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/20',
        icon: Building2
      },
      professional: {
        name: 'Professional',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/20',
        icon: Star
      },
      enterprise: {
        name: 'Enterprise',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/20',
        icon: Crown
      }
    };

    return planMap[planName] || {
      name: planName,
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
      icon: Building2
    };
  };

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

  const planInfo = getPlanInfo(plan);
  const Icon = planInfo.icon;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getSizeClasses()} ${
        isCustom 
          ? 'bg-orange-100 text-orange-800 border border-orange-200' 
          : `${planInfo.bgColor} ${planInfo.color}`
      } ${className}`}
    >
      {showIcon && (
        <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      )}
      {isCustom ? (
        <>
          <Crown className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          {plan}
        </>
      ) : (
        planInfo.name
      )}
    </span>
  );
}

interface PlanTypeBadgeProps {
  tenantType: 'individual' | 'business';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export function PlanTypeBadge({ 
  tenantType, 
  size = 'md',
  showIcon = true,
  className = ''
}: PlanTypeBadgeProps) {
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

  const isIndividual = tenantType === 'individual';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${getSizeClasses()} ${
        isIndividual
          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
          : 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
      } ${className}`}
    >
      {showIcon && (
        isIndividual ? (
          <User className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        ) : (
          <Building2 className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        )
      )}
      {isIndividual ? 'Pessoa Física' : 'Profissional'}
    </span>
  );
}
