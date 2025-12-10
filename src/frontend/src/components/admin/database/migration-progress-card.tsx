'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Pause, 
  Play, 
  RotateCcw,
  Loader2 
} from 'lucide-react';

interface MigrationProgressCardProps {
  migrationId: string;
  organizationId: string;
  fromStrategy: string;
  toStrategy: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled_back';
  progressPercent: number;
  currentStep?: string;
  startedAt?: Date;
  completedAt?: Date;
  errorLog?: string;
  onPause?: () => void;
  onResume?: () => void;
  onRollback?: () => void;
}

export function MigrationProgressCard({
  migrationId,
  organizationId,
  fromStrategy,
  toStrategy,
  status,
  progressPercent,
  currentStep,
  startedAt,
  completedAt,
  errorLog,
  onPause,
  onResume,
  onRollback,
}: MigrationProgressCardProps) {
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Concluída</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      case 'rolled_back':
        return <Badge variant="secondary">Revertida</Badge>;
      case 'running':
        return <Badge variant="secondary">Em Execução</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <CardTitle>Migração #{migrationId.slice(0, 8)}</CardTitle>
          </div>
          {getStatusBadge()}
        </div>
        <CardDescription>
          <div className="flex items-center gap-2">
            <span className="font-medium">{fromStrategy}</span>
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium">{toStrategy}</span>
          </div>
          <div className="text-xs mt-1">Organização: {organizationId.slice(0, 8)}...</div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'running' && (
          <>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{currentStep || 'Migrando dados...'}</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            <div className="flex gap-2">
              {onPause && (
                <Button variant="outline" size="sm" onClick={onPause}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
            </div>
          </>
        )}

        {status === 'pending' && (
          <div className="flex gap-2">
            {onResume && (
              <Button variant="outline" size="sm" onClick={onResume}>
                <Play className="h-4 w-4 mr-2" />
                Iniciar
              </Button>
            )}
          </div>
        )}

        {status === 'failed' && (
          <>
            {errorLog && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-mono text-xs">
                  {errorLog}
                </AlertDescription>
              </Alert>
            )}
            {onRollback && (
              <Button variant="outline" size="sm" onClick={onRollback}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reverter
              </Button>
            )}
          </>
        )}

        {status === 'completed' && completedAt && (
          <div className="text-sm text-muted-foreground">
            Concluída em {new Date(completedAt).toLocaleString('pt-BR')}
          </div>
        )}

        {startedAt && (
          <div className="text-xs text-muted-foreground">
            Iniciada em {new Date(startedAt).toLocaleString('pt-BR')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


