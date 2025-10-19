'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Trash2, 
  Download,
  X
} from 'lucide-react';
import { BulkActionsBarProps } from '../../../../shared/types';

export function BulkActionsBar({
  selectedCount,
  onBulkAction,
  onExport,
  onClearSelection
}: BulkActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (window.confirm(`Tem certeza que deseja ${action === 'activate' ? 'ativar' : action === 'deactivate' ? 'desativar' : 'excluir'} ${selectedCount} usuário(s)?`)) {
      onBulkAction(action);
    }
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Badge variant="secondary" className="text-primary">
            {selectedCount} selecionado{selectedCount > 1 ? 's' : ''}
          </Badge>
          <span className="text-sm text-primary">
            Ações em lote disponíveis
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction('activate')}
          >
            <UserCheck className="h-4 w-4 mr-2" />
            Ativar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onBulkAction('deactivate')}
          >
            <UserX className="h-4 w-4 mr-2" />
            Desativar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => handleBulkAction('delete')}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionados
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Seleção
          </Button>
        </div>
      </div>
    </div>
  );
}
