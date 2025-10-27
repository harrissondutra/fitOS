"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Truck, 
  Shield, 
  MessageSquare, 
  BarChart3, 
  Bell,
  CheckCircle,
  XCircle,
  Settings,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'configured' | 'not_configured';
  cost: string;
  features: string[];
  setupRequired: boolean;
  href: string;
}

export default function IntegrationsPage() {
  const integrations: Integration[] = [
    {
      id: 'payments',
      name: 'Pagamentos',
      description: 'Stripe e MercadoPago para processamento de pagamentos',
      icon: <CreditCard className="h-6 w-6" />,
      status: 'active',
      cost: 'Por transação',
      features: ['PIX', 'Cartões', 'Boleto', 'Split automático'],
      setupRequired: true,
      href: '/admin/integrations/payments'
    },
    {
      id: 'shipping',
      name: 'Transportadoras',
      description: 'Melhor Envio, Correios e transportadoras internacionais',
      icon: <Truck className="h-6 w-6" />,
      status: 'configured',
      cost: 'Gratuito + frete',
      features: ['Cotações', 'Etiquetas', 'Rastreamento', 'Coleta'],
      setupRequired: true,
      href: '/admin/integrations/shipping'
    },
    {
      id: 'kyc',
      name: 'Verificação KYC',
      description: 'Face-api.js, Idwall e Stripe Identity para verificação de identidade',
      icon: <Shield className="h-6 w-6" />,
      status: 'active',
      cost: 'R$ 0-10 por verificação',
      features: ['Verificação facial', 'Validação documentos', 'Background check'],
      setupRequired: true,
      href: '/admin/integrations/kyc'
    },
    {
      id: 'notifications',
      name: 'Notificações',
      description: 'Twilio para SMS, WhatsApp e notificações push',
      icon: <Bell className="h-6 w-6" />,
      status: 'configured',
      cost: 'Por mensagem',
      features: ['SMS', 'WhatsApp', 'Push', 'Email'],
      setupRequired: true,
      href: '/admin/integrations/notifications'
    },
    {
      id: 'chat',
      name: 'Chat Interno',
      description: 'Socket.io para comunicação em tempo real',
      icon: <MessageSquare className="h-6 w-6" />,
      status: 'active',
      cost: 'Gratuito',
      features: ['Tempo real', 'Histórico', 'Notificações', 'Arquivos'],
      setupRequired: false,
      href: '/admin/integrations/chat'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Google Analytics 4 para métricas e relatórios',
      icon: <BarChart3 className="h-6 w-6" />,
      status: 'configured',
      cost: 'Gratuito',
      features: ['E-commerce', 'Conversões', 'Funil', 'Relatórios'],
      setupRequired: true,
      href: '/admin/integrations/analytics'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'Configuração centralizada para todo o sistema (Acesso Super Admin)',
      icon: <MessageSquare className="h-6 w-6" />,
      status: 'inactive',
      cost: 'Por mensagem',
      features: ['Templates', 'Automação', 'Webhooks', 'Multi-tenant'],
      setupRequired: true,
      href: '/super-admin/whatsapp'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Ativo</Badge>;
      case 'configured':
        return <Badge className="bg-blue-500">Configurado</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativo</Badge>;
      case 'not_configured':
        return <Badge variant="destructive">Não Configurado</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'configured':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'inactive':
        return <XCircle className="h-4 w-4 text-gray-400" />;
      case 'not_configured':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-400" />;
    }
  };

  const activeIntegrations = integrations.filter(i => i.status === 'active').length;
  const totalIntegrations = integrations.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrações</h1>
        <p className="text-gray-600 mt-2">
          Gerencie todas as integrações externas do marketplace fitOS.
        </p>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{activeIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{totalIntegrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ExternalLink className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Configuradas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === 'configured' || i.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === 'not_configured').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {integration.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                {getStatusIcon(integration.status)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                {getStatusBadge(integration.status)}
              </div>

              {/* Custo */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Custo:</span>
                <span className="text-sm font-medium">{integration.cost}</span>
              </div>

              {/* Features */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Funcionalidades:</h4>
                <div className="flex flex-wrap gap-1">
                  {integration.features.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Setup Required */}
              {integration.setupRequired && (
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ Configuração necessária
                </div>
              )}

              {/* Botão de Ação */}
              <Link href={integration.href}>
                <Button 
                  className="w-full" 
                  variant={integration.status === 'active' ? 'default' : 'outline'}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {integration.status === 'active' ? 'Gerenciar' : 'Configurar'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funcionam as Integrações</CardTitle>
          <CardDescription>
            As integrações permitem que o marketplace se conecte com serviços externos para 
            oferecer funcionalidades avançadas aos usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Configuração</h3>
              <p className="text-sm text-gray-600">
                Configure as credenciais e chaves de API dos serviços externos.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Ativação</h3>
              <p className="text-sm text-gray-600">
                Ative as integrações desejadas para habilitar as funcionalidades.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Monitoramento</h3>
              <p className="text-sm text-gray-600">
                Monitore o status e performance das integrações ativas.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
