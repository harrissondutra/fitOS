/**
 * Componente de Debug do Usuário Atual
 * 
 * Este componente mostra informações detalhadas sobre o usuário logado
 * para debug e verificação de autenticação
 */

"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useAuth } from '@/contexts/auth-context';
import { RefreshCw, User, Shield, Building } from 'lucide-react';

export function UserDebugInfo() {
  const { user, isLoading, error, refetch } = useCurrentUser();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
          <CardDescription>Carregando dados de autenticação...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Usuário
          </CardTitle>
          <CardDescription>Usuário não autenticado</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Faça login para ver suas informações</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações do Usuário
        </CardTitle>
        <CardDescription>
          Dados do usuário logado
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={isLoading}
            className="ml-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">
              <strong>Erro:</strong> {error}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        )}

        {user && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Role:</span>
              <Badge variant="secondary">{user.role}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Nome:</span>
              <span className="text-sm">{user.firstName} {user.lastName}</span>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm">{user.email}</span>
            </div>

            {user.tenantId && (
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Tenant ID:</span>
                <span className="text-sm font-mono">{user.tenantId}</span>
              </div>
            )}

            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-2">Dados Completos (JSON):</h4>
              <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {!user && !isLoading && !error && (
          <p className="text-muted-foreground">Nenhum dado do usuário disponível</p>
        )}
      </CardContent>
    </Card>
  );
}
