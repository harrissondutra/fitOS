/**
 * Onboarding Confirmation Page
 * 
 * Página de sucesso após completar o onboarding:
 * - Tela de sucesso
 * - Credenciais de acesso
 * - Próximos passos
 * - Botão para fazer login
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, Globe, Users, Star, ArrowRight, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

interface TenantData {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
}

interface OwnerData {
  id: string;
  email: string;
  name: string;
}

interface ConfirmationData {
  tenant: TenantData;
  owner: OwnerData;
  loginUrl: string;
  dashboardUrl: string;
}

export default function OnboardingConfirmationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const tenantId = searchParams.get('tenantId');

  useEffect(() => {
    if (tenantId) {
      fetchConfirmationData(tenantId);
    } else {
      setIsLoading(false);
    }
  }, [tenantId]);

  const fetchConfirmationData = async (id: string) => {
    try {
      const response = await fetch(`/api/onboarding/status/${id}`);
      const result = await response.json();

      if (result.success) {
        setConfirmationData({
          tenant: result.tenant,
          owner: result.owner || { id: '', email: '', name: '' },
          loginUrl: `${process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'localhost:3000'}/login`,
          dashboardUrl: `https://${result.tenant.subdomain}.${process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'fitos.com'}`
        });
      } else {
        toast.error('Erro ao carregar dados da conta');
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'email' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'email') {
        setCopiedEmail(true);
        toast.success('Email copiado!');
        setTimeout(() => setCopiedEmail(false), 2000);
      } else {
        toast.success('URL copiada!');
      }
    } catch (error) {
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  const handleLogin = () => {
    if (confirmationData) {
      window.location.href = confirmationData.loginUrl;
    }
  };

  const handleGoToDashboard = () => {
    if (confirmationData) {
      window.location.href = confirmationData.dashboardUrl;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-medium">Carregando dados da sua conta...</p>
        </div>
      </div>
    );
  }

  if (!confirmationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-rose-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Erro ao Carregar Conta</h2>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar os dados da sua conta.
            </p>
            <Button onClick={() => router.push('/onboarding')}>
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header de Sucesso */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Parabéns! 🎉
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Sua academia <strong>{confirmationData.tenant.name}</strong> foi criada com sucesso!
            </p>
          </div>

          {/* Cards de Informações */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Informações da Conta */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Sua Conta
                </CardTitle>
                <CardDescription>
                  Informações de acesso à sua plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nome da Academia:</span>
                    <span className="font-medium">{confirmationData.tenant.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Plano:</span>
                    <Badge variant="secondary" className="capitalize">
                      {confirmationData.tenant.plan}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">URL:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {confirmationData.tenant.subdomain}.{process.env.NEXT_PUBLIC_DEFAULT_DOMAIN || 'fitos.com'}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(confirmationData.dashboardUrl, 'url')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Credenciais de Acesso */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Credenciais de Acesso
                </CardTitle>
                <CardDescription>
                  Use estas informações para fazer login
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{confirmationData.owner.email}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(confirmationData.owner.email, 'email')}
                      >
                        {copiedEmail ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Nome:</span>
                    <span className="font-medium text-sm">{confirmationData.owner.name}</span>
                  </div>
                </div>
                
                <Alert className="border-blue-200 bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    <div className="font-medium">Email de Boas-vindas Enviado!</div>
                    <div className="text-sm mt-1">
                      Verifique sua caixa de entrada para mais detalhes sobre sua conta.
                    </div>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Próximos Passos */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Próximos Passos
              </CardTitle>
              <CardDescription>
                O que você pode fazer agora
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium mb-2">1. Configure seu Perfil</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete as informações da sua academia e personalize as configurações.
                  </p>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium mb-2">2. Adicione seus Clientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Importe ou cadastre seus clientes para começar a usar o sistema.
                  </p>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium mb-2">3. Explore os Recursos</h3>
                  <p className="text-sm text-muted-foreground">
                    Descubra todas as funcionalidades disponíveis no seu plano.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleGoToDashboard}
              size="lg"
              className="flex items-center gap-2"
            >
              <Globe className="h-5 w-5" />
              Acessar Minha Academia
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Fazer Login
            </Button>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>
              Precisa de ajuda? Entre em contato conosco em{' '}
              <a href="mailto:suporte@sistudo.com" className="text-blue-600 hover:underline">
                suporte@sistudo.com
              </a>
            </p>
            <p className="mt-2">
              Ou acesse nossa{' '}
              <a href="https://ajuda.fitOS.com" className="text-blue-600 hover:underline">
                Central de Ajuda
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

