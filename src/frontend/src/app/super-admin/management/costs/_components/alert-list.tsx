'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { CostAlert } from '@/types/costs';

interface AlertListProps {
  alerts: CostAlert[];
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
  onDelete?: (alertId: string) => void;
  loading?: boolean;
}

export function AlertList({ 
  alerts, 
  onAcknowledge, 
  onResolve, 
  onDelete, 
  loading = false 
}: AlertListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'error':
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAlertStatus = (alert: CostAlert) => {
    if (alert.resolvedAt) return 'resolved';
    if (alert.acknowledgedAt) return 'acknowledged';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'default';
      case 'resolved':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'WARNING':
        return 'Atenção';
      case 'CRITICAL':
        return 'Crítico';
      case 'LIMIT_REACHED':
        return 'Limite Atingido';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum alerta encontrado</h3>
          <p className="text-muted-foreground text-center">
            Todos os custos estão dentro dos limites configurados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert) => (
        <Card 
          key={alert.id} 
          className={`border-l-4 ${
            alert.severity === 'critical' || alert.severity === 'error' 
              ? 'border-l-red-500' 
              : 'border-l-yellow-500'
          }`}
        >
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">
                      {getAlertTypeLabel(alert.alertType)}
                    </h3>
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <Badge variant={getStatusColor(getAlertStatus(alert))}>
                      {getAlertStatus(alert)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {alert.message}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Valor atual: {formatCurrency(alert.currentCost)}
                    </span>
                    {alert.limit && (
                      <span>
                        Limite: {formatCurrency(alert.limit)}
                      </span>
                    )}
                    {alert.percentage && (
                      <span>
                        {alert.percentage.toFixed(1)}% do limite
                      </span>
                    )}
                    <span>
                      {formatDate(alert.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getAlertStatus(alert) === 'active' && onAcknowledge && (
                  <Button
                    size="sm"
                    onClick={() => onAcknowledge(alert.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Reconhecer
                  </Button>
                )}
                
                {getAlertStatus(alert) === 'acknowledged' && onResolve && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve(alert.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Resolver
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(alert.id)}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}