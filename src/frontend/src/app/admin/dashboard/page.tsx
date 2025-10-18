'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Shield,
  Activity,
  TrendingUp,
  UserPlus,
  Building2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-500" />
              <span className="text-2xl font-bold">Admin Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, configurações e monitore o sistema.
          </p>
        </div>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tenants Ativos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                +0% este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Online</div>
              <p className="text-xs text-muted-foreground">
                Todos os serviços funcionando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0</div>
              <p className="text-xs text-muted-foreground">
                +0% este mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Administre usuários e permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Usuários
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Shield className="mr-2 h-4 w-4" />
                Gerenciar Permissões
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configure parâmetros e monitoramento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações Gerais
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
              <Button variant="outline" className="w-full" onClick={() => alert('Funcionalidade em desenvolvimento')}>
                <Activity className="mr-2 h-4 w-4" />
                Monitoramento
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Admin Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle>Gestão de Usuários</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Controle completo sobre usuários, roles e permissões.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-green-500" />
                <CardTitle>Multi-Tenancy</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Gerencie múltiplas organizações e seus dados.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <CardTitle>Analytics Avançado</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Relatórios detalhados e métricas do sistema.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
