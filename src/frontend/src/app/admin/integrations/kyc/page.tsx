"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Settings, 
  Shield, 
  DollarSign, 
  Zap, 
  Globe,
  Info,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface KYCProvider {
  id: string;
  name: string;
  provider: string;
  configured: boolean;
  features: string[];
  cost: string;
  accuracy: string;
  setupRequired: boolean;
  publishableKey?: string;
}

interface KYCStats {
  total: number;
  configured: number;
  active: string;
  available: Array<{ id: string; name: string }>;
}

export default function KYCIntegrationPage() {
  const [providers, setProviders] = useState<KYCProvider[]>([]);
  const [stats, setStats] = useState<KYCStats | null>(null);
  const [activeProvider, setActiveProvider] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/marketplace/kyc/providers');
      const data = await response.json();
      
      setProviders(data.providers);
      setStats(data.stats);
      setActiveProvider(data.active);
    } catch (error) {
      console.error('Erro ao carregar dados KYC:', error);
      toast.error('Erro ao carregar configurações KYC');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = async (providerId: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/marketplace/kyc/providers/set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: providerId }),
      });

      const data = await response.json();
      
      if (data.success) {
        setActiveProvider(providerId);
        toast.success(`Provider alterado para ${data.active}`);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Erro ao alterar provider:', error);
      toast.error('Erro ao alterar provider KYC');
    } finally {
      setSaving(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'face-api':
        return <Zap className="h-5 w-5 text-green-500" />;
      case 'idwall':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'stripe-identity':
        return <Globe className="h-5 w-5 text-purple-500" />;
      default:
        return <Settings className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProviderStatus = (provider: KYCProvider) => {
    if (!provider.configured) {
      return <Badge variant="secondary">Não Configurado</Badge>;
    }
    
    if (activeProvider === provider.id) {
      return <Badge variant="default" className="bg-green-500">Ativo</Badge>;
    }
    
    return <Badge variant="outline">Disponível</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando configurações KYC...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuração KYC</h1>
        <p className="text-gray-600 mt-2">
          Configure e gerencie os provedores de verificação de identidade para o marketplace.
        </p>
      </div>

      {/* Status Geral */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Status dos Provedores KYC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-600">Total de Provedores</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.configured}</div>
                <div className="text-sm text-gray-600">Configurados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.available.length}</div>
                <div className="text-sm text-gray-600">Disponíveis</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {providers.find(p => p.id === stats.active)?.name || 'Nenhum'}
                </div>
                <div className="text-sm text-gray-600">Ativo</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alertas */}
      {stats && stats.configured === 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nenhum Provedor Configurado</AlertTitle>
          <AlertDescription>
            Configure pelo menos um provedor KYC para habilitar a verificação de identidade no marketplace.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Provedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className={`relative ${activeProvider === provider.id ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getProviderIcon(provider.provider)}
                  <CardTitle className="text-lg">{provider.name}</CardTitle>
                </div>
                {getProviderStatus(provider)}
              </div>
              <CardDescription>
                {provider.provider === 'face-api' && 'Solução gratuita com verificação facial e validação de documentos'}
                {provider.provider === 'idwall' && 'Solução brasileira especializada em KYC com background check'}
                {provider.provider === 'stripe-identity' && 'Solução global com alta precisão e conformidade internacional'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Características */}
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Características:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {provider.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <Separator />

              {/* Informações de Custo e Precisão */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    Custo
                  </div>
                  <div className="font-semibold">{provider.cost}</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <Shield className="h-3 w-3" />
                    Precisão
                  </div>
                  <div className="font-semibold">{provider.accuracy}</div>
                </div>
              </div>

              {/* Configuração Necessária */}
              {provider.setupRequired && !provider.configured && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Configuração necessária. Configure as credenciais nas variáveis de ambiente.
                  </AlertDescription>
                </Alert>
              )}

              {/* Switch para Ativar/Desativar */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Usar este provedor</span>
                <Switch
                  checked={activeProvider === provider.id}
                  onCheckedChange={() => handleProviderChange(provider.id)}
                  disabled={!provider.configured || saving}
                />
              </div>

              {/* Botão de Configuração */}
              {provider.setupRequired && !provider.configured && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    toast.info('Configure as credenciais nas variáveis de ambiente do servidor');
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Informações Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Como Funciona a Seleção de Provedores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1</div>
              <div className="font-semibold text-blue-800">Configuração</div>
              <div className="text-sm text-blue-600">Configure as credenciais dos provedores desejados</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">2</div>
              <div className="font-semibold text-green-800">Seleção</div>
              <div className="text-sm text-green-600">Escolha qual provedor usar como padrão</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <div className="font-semibold text-purple-800">Fallback</div>
              <div className="text-sm text-purple-600">Sistema usa fallback automático se necessário</div>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Recomendação</AlertTitle>
            <AlertDescription>
              Para produção, recomendamos usar o <strong>Idwall</strong> (especializado no Brasil) 
              ou <strong>Stripe Identity</strong> (conformidade global). O Face-api.js é ideal para 
              desenvolvimento e testes.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
