/**
 * Página de Debug do Usuário
 * 
 * Esta página mostra informações detalhadas sobre o usuário logado
 * para debug e verificação de autenticação
 */

"use client";

import React from 'react';
import { UserDebugInfo } from '@/components/debug/user-debug-info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { Shield, User, Building, Clock } from 'lucide-react';

export default function UserDebugPage() {
  const { user, isAuthenticated, isLoading, isInitialized } = useAuth();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Debug do Usuário</h1>
          <p className="text-muted-foreground">
            Informações detalhadas sobre o usuário logado
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={isAuthenticated ? "default" : "secondary"}>
            {isAuthenticated ? "Autenticado" : "Não Autenticado"}
          </Badge>
          <Badge variant={isLoading ? "secondary" : "outline"}>
            {isLoading ? "Carregando" : "Pronto"}
          </Badge>
          <Badge variant={isInitialized ? "default" : "secondary"}>
            {isInitialized ? "Inicializado" : "Inicializando"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações do Contexto de Autenticação */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Contexto de Autenticação
            </CardTitle>
            <CardDescription>
              Estado do contexto de autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Autenticado:</span>
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? "Sim" : "Não"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Carregando:</span>
              <Badge variant={isLoading ? "secondary" : "outline"}>
                {isLoading ? "Sim" : "Não"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Inicializado:</span>
              <Badge variant={isInitialized ? "default" : "secondary"}>
                {isInitialized ? "Sim" : "Não"}
              </Badge>
            </div>

            {user && (
              <div className="pt-3 border-t">
                <h4 className="text-sm font-medium mb-2">Usuário do Contexto:</h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{user.firstName} {user.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs">{user.role}</span>
                  </div>
                  {user.tenantId && (
                    <div className="flex items-center gap-2">
                      <Building className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs">{user.tenantId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações do LocalStorage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              LocalStorage
            </CardTitle>
            <CardDescription>
              Dados armazenados localmente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Access Token:</span>
              <Badge variant={typeof window !== 'undefined' && localStorage.getItem('accessToken') ? "default" : "secondary"}>
                {typeof window !== 'undefined' && localStorage.getItem('accessToken') ? "Presente" : "Ausente"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Refresh Token:</span>
              <Badge variant={typeof window !== 'undefined' && localStorage.getItem('refreshToken') ? "default" : "secondary"}>
                {typeof window !== 'undefined' && localStorage.getItem('refreshToken') ? "Presente" : "Ausente"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Usuário:</span>
              <Badge variant={typeof window !== 'undefined' && localStorage.getItem('user') ? "default" : "secondary"}>
                {typeof window !== 'undefined' && localStorage.getItem('user') ? "Presente" : "Ausente"}
              </Badge>
            </div>

            {typeof window !== 'undefined' && localStorage.getItem('user') && (
              <div className="pt-3 border-t">
                <h4 className="text-sm font-medium mb-2">Usuário Armazenado:</h4>
                <pre className="text-xs bg-muted p-2 rounded overflow-auto">
                  {JSON.stringify(JSON.parse(localStorage.getItem('user') || '{}'), null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informações Detalhadas do Usuário */}
      <UserDebugInfo />
    </div>
  );
}
