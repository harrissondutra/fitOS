'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, XCircle, Clock } from 'lucide-react';

export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

interface HealthStatusIndicatorProps {
  status: HealthStatus;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function HealthStatusIndicator({
  status,
  label,
  size = 'md',
}: HealthStatusIndicatorProps) {
  const getIcon = () => {
    const iconClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
    
    switch (status) {
      case 'healthy':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'degraded':
        return <AlertCircle className={`${iconClass} text-yellow-500`} />;
      case 'down':
        return <XCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  const getBadgeVariant = () => {
    switch (status) {
      case 'healthy':
        return 'default' as const;
      case 'degraded':
        return 'secondary' as const;
      case 'down':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'healthy':
        return 'Saudável';
      case 'degraded':
        return 'Degradado';
      case 'down':
        return 'Indisponível';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <Badge variant={getBadgeVariant()}>
        {label || getStatusLabel()}
      </Badge>
    </div>
  );
}















