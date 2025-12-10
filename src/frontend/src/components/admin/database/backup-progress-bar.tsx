'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface BackupProgressBarProps {
  backupId: string;
  status: 'in_progress' | 'completed' | 'failed';
  progressPercent?: number;
  currentStep?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export function BackupProgressBar({
  backupId,
  status,
  progressPercent = 0,
  currentStep,
  startedAt,
  completedAt,
  errorMessage,
}: BackupProgressBarProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'in_progress':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluído</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Em Progresso</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <span className="font-semibold">Backup #{backupId.slice(0, 8)}</span>
            </div>
            {getStatusBadge()}
          </div>

          {status === 'in_progress' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{currentStep || 'Processando...'}</span>
                  <span className="font-medium">{progressPercent}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </>
          )}

          {status === 'completed' && completedAt && (
            <div className="text-sm text-muted-foreground">
              Concluído em {new Date(completedAt).toLocaleString('pt-BR')}
            </div>
          )}

          {status === 'failed' && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {startedAt && (
            <div className="text-xs text-muted-foreground">
              Iniciado em {new Date(startedAt).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

