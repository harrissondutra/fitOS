'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Activity, DollarSign } from 'lucide-react';
import { ServiceSummary } from '../_hooks/use-costs';

interface CostServiceCardProps {
  service: ServiceSummary;
  onClick?: () => void;
}

export function CostServiceCard({ service, onClick }: CostServiceCardProps) {
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatPercentage = (value: number | undefined) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0.0%';
    }
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-red-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  const getCaptureTypeColor = (captureType: string) => {
    switch (captureType) {
      case 'usage_tracking':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'automatic':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'manual':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getCaptureTypeLabel = (captureType: string) => {
    switch (captureType) {
      case 'usage_tracking':
        return 'Automático';
      case 'automatic':
        return 'Automático';
      case 'manual':
        return 'Manual';
      default:
        return captureType;
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
        onClick ? 'hover:border-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {service.displayName}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={`text-xs ${getCaptureTypeColor((service as any).captureType || 'manual')}`}
          >
            {getCaptureTypeLabel((service as any).captureType || 'manual')}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {formatPercentage(service.percentage)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-2xl font-bold">
            {formatCurrency(service.totalCost)}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {(service.requestCount || 0).toLocaleString()} requests
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatCurrency(service.averageCost)}/request
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {service.categoryName}
            </span>
            <div className={`flex items-center gap-1 ${getTrendColor(service.trend)}`}>
              {getTrendIcon(service.trend)}
              <span className="font-medium">
                {service.trend === 'up' ? 'Crescendo' : service.trend === 'down' ? 'Diminuindo' : 'Estável'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

