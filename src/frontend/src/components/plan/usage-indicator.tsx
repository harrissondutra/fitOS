'use client';

import React from 'react';
import { AlertCircle, CheckCircle, Users } from 'lucide-react';

interface UsageIndicatorProps {
  current: number;
  limit: number;
  role: string;
  isUnlimited?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function UsageIndicator({ 
  current, 
  limit, 
  role, 
  isUnlimited = false,
  showIcon = true,
  className = ''
}: UsageIndicatorProps) {
  const isUnlimitedRole = limit === -1 || isUnlimited;
  const percentage = isUnlimitedRole ? 0 : Math.round((current / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  const getProgressColor = () => {
    if (isUnlimitedRole) return 'bg-gray-300';
    if (isAtLimit) return 'bg-red-500';
    if (isNearLimit) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (isUnlimitedRole) return 'text-muted-foreground';
    if (isAtLimit) return 'text-red-600 dark:text-red-400';
    if (isNearLimit) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-muted-foreground';
  };

  const getIcon = () => {
    if (isUnlimitedRole) return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
    if (isAtLimit) return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (isNearLimit) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <Users className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isUnlimitedRole) return 'Ilimitado';
    if (isAtLimit) return 'Limite atingido';
    if (isNearLimit) return 'Próximo do limite';
    return 'Normal';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {showIcon && getIcon()}
          <span className="text-sm font-medium text-foreground capitalize">
            {role}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getTextColor()}`}>
            {isUnlimitedRole ? (
              <span className="text-muted-foreground">{current}</span>
            ) : (
              <span>
                {current} / {limit}
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {getStatusText()}
          </div>
        </div>
      </div>
      
      {!isUnlimitedRole && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      )}

      {isAtLimit && (
        <div className="flex items-center space-x-1 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-3 w-3" />
          <span>Limite atingido - não é possível adicionar mais {role}s</span>
        </div>
      )}

      {isNearLimit && !isAtLimit && (
        <div className="flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="h-3 w-3" />
          <span>Próximo do limite - considere solicitar slots extras</span>
        </div>
      )}
    </div>
  );
}

interface UsageSummaryProps {
  usage: Record<string, { current: number; limit: number; isUnlimited?: boolean }>;
  className?: string;
}

export function UsageSummary({ usage, className = '' }: UsageSummaryProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-medium text-foreground">Uso por Role</h3>
      <div className="space-y-3">
        {Object.entries(usage).map(([role, data]) => (
          <UsageIndicator
            key={role}
            current={data.current}
            limit={data.limit}
            role={role}
            isUnlimited={data.isUnlimited}
          />
        ))}
      </div>
    </div>
  );
}
