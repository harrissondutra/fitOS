'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { toastUtils } from '@/lib/toast-utils';
import { 
  Settings, 
  Users, 
  BarChart3, 
  Shield,
  Activity,
  TrendingUp,
  UserPlus,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { PlanBadge, PlanTypeBadge } from '@/components/plan/plan-badge';
import { UsageSummary } from '@/components/plan/usage-indicator';
import { FeatureList } from '@/components/plan/feature-badge';
import { UpgradeModal } from '@/components/plan/upgrade-modal';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, tenant, tenantType, planLimits, enabledFeatures, isCustomPlan, canHaveSubdomain } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [planInfo, setPlanInfo] = useState<any>(null);
  const [usage, setUsage] = useState<Record<string, { current: number; limit: number; isUnlimited?: boolean }>>({});
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchPlanInfo();
  }, []);

  const fetchPlanInfo = async () => {
    try {
      const response = await fetch('/api/admin/plan-info');
      if (response.ok) {
        const data = await response.json();
        setPlanInfo(data.data);
        
        // Processar dados de uso
        const usageData: Record<string, { current: number; limit: number; isUnlimited?: boolean }> = {};
        Object.entries(data.data.usage).forEach(([role, count]) => {
          const limit = data.data.limits[role];
          usageData[role] = {
            current: count as number,
            limit: limit as number,
            isUnlimited: limit === -1
          };
        });
        setUsage(usageData);
      }
    } catch (error) {
      console.error('Error fetching plan info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (upgradeType: 'business' | 'slots' | 'feature', data: any) => {
    try {
      let endpoint = '';
      let payload = {};

      switch (upgradeType) {
        case 'business':
          endpoint = '/api/admin/request-upgrade-to-business';
          payload = { subdomain: data.subdomain };
          break;
        case 'slots':
          endpoint = '/api/admin/request-extra-slots';
          payload = { role: data.role, quantity: data.quantity, reason: data.reason };
          break;
        case 'feature':
          endpoint = '/api/admin/request-feature';
          payload = { featureName: data.featureName, reason: data.reason };
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toastUtils.success('Solicitação enviada', 'Sua solicitação foi enviada com sucesso!');
      } else {
        toastUtils.error('Erro ao enviar solicitação', 'Ocorreu um erro inesperado');
      }
    } catch (error) {
      console.error('Error sending upgrade request:', error);
      toastUtils.error('Erro ao enviar solicitação', 'Ocorreu um erro inesperado');
    }
  };

  if (!mounted || loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
    );
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
              <ThemeToggle />
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

        {/* Plan Information Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Informações do Plano</span>
                </CardTitle>
                <CardDescription>
                  Detalhes do seu plano atual e uso de recursos
                </CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <PlanTypeBadge tenantType={tenantType} />
                <PlanBadge plan={planInfo?.tenant?.plan || 'starter'} isCustom={isCustomPlan} />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Usage Summary */}
              <div>
                <h3 className="text-lg font-medium text-foreground mb-4">Uso de Colaboradores</h3>
                <UsageSummary usage={usage} />
              </div>

              {/* Features and Actions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Features Habilitadas</h3>
                  <FeatureList features={enabledFeatures} />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium text-foreground mb-2">Ações Disponíveis</h3>
                  <div className="space-y-2">
                    {tenantType === 'individual' && (
                      <Button 
                        onClick={() => setShowUpgradeModal(true)}
                        className="w-full"
                        variant="outline"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Tornar-se Profissional
                      </Button>
                    )}
                    
                    {tenantType === 'business' && (
                      <>
                        <Button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Solicitar Slots Extras
                        </Button>
                        <Button 
                          onClick={() => setShowUpgradeModal(true)}
                          className="w-full"
                          variant="outline"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Solicitar Feature
                        </Button>
                      </>
                    )}

                    {planInfo?.tenant?.subdomain && (
                      <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                        <strong>Subdomain:</strong> {planInfo.tenant.subdomain}.fitos.com
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(usage).reduce((sum, role) => sum + role.current, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Colaboradores ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipo de Conta</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenantType === 'individual' ? 'Pessoa Física' : 'Profissional'}
              </div>
              <p className="text-xs text-muted-foreground">
                {canHaveSubdomain ? 'Com subdomain' : 'Sem subdomain'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Plano Atual</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isCustomPlan ? 'Customizado' : planInfo?.tenant?.plan || 'Starter'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isCustomPlan ? 'Plano personalizado' : 'Plano padrão'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Features Ativas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(enabledFeatures).filter(Boolean).length}
              </div>
              <p className="text-xs text-muted-foreground">
                de {Object.keys(enabledFeatures).length} disponíveis
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
              <Button className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
                <Users className="mr-2 h-4 w-4" />
                Gerenciar Usuários
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Usuário
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
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
              <Button className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações Gerais
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Relatórios
              </Button>
              <Button variant="outline" className="w-full" onClick={() => toastUtils.comingSoon('Funcionalidade')}>
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

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={planInfo?.tenant?.plan || 'starter'}
        tenantType={tenantType}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
}
