'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Building2, 
  Users, 
  CreditCard, 
  Settings,
  Plus,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Clock,
  Crown
} from 'lucide-react';
import { PlanBadge, PlanTypeBadge } from '@/components/plan/plan-badge';
import { UsageSummary } from '@/components/plan/usage-indicator';
import { FeatureList, FeatureToggle } from '@/components/plan/feature-badge';
import { toastUtils } from '@/lib/toast-utils';

interface TenantDetails {
  id: string;
  name: string;
  tenantType: 'individual' | 'business';
  subdomain?: string;
  customDomain?: string;
  plan: string;
  status: string;
  isCustomPlan: boolean;
  extraSlots?: Record<string, number>;
  enabledFeatures?: Record<string, boolean>;
  customPlan?: {
    id: string;
    displayName: string;
  };
  stats: {
    userCounts: Record<string, number>;
    limits: Record<string, number>;
    features: Record<string, boolean>;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TenantDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    plan: '',
    extraSlots: {} as Record<string, number>,
    features: {} as Record<string, boolean>
  });

  useEffect(() => {
    if (params?.id) {
      fetchTenantDetails(params.id as string);
    }
  }, [params?.id]);

  const fetchTenantDetails = async (tenantId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/tenants/${tenantId}`);
      if (response.ok) {
        const data = await response.json();
        setTenant(data.data);
        setFormData({
          plan: data.data.plan,
          extraSlots: data.data.extraSlots || {},
          features: data.data.stats.features || {}
        });
      }
    } catch (error) {
      console.error('Error fetching tenant details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/super-admin/tenants/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setEditing(false);
        fetchTenantDetails(params.id as string);
        toastUtils.tenant.updated(tenant?.name || 'Tenant');
      } else {
        toastUtils.tenant.error('atualizar');
      }
    } catch (error) {
      console.error('Error updating tenant:', error);
      toastUtils.tenant.error('atualizar');
    }
  };

  const handleAddExtraSlots = async (role: string, quantity: number) => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/super-admin/tenants/${params.id}/extra-slots`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, quantity })
      });

      if (response.ok) {
        fetchTenantDetails(params.id as string);
        toastUtils.tenant.slotsAdded(quantity);
      } else {
        toastUtils.tenant.error('adicionar slots extras');
      }
    } catch (error) {
      console.error('Error adding extra slots:', error);
      toastUtils.tenant.error('adicionar slots extras');
    }
  };

  const handleConvertToBusiness = async (subdomain: string) => {
    if (!params?.id) return;
    
    try {
      const response = await fetch(`/api/super-admin/tenants/${params.id}/type`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain })
      });

      if (response.ok) {
        fetchTenantDetails(params.id as string);
        toastUtils.tenant.converted(tenant?.name || 'Tenant');
      } else {
        toastUtils.tenant.error('converter');
      }
    } catch (error) {
      console.error('Error converting tenant:', error);
      toastUtils.tenant.error('converter');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Tenant não encontrado</h3>
          <p className="text-gray-500 mb-4">O tenant solicitado não foi encontrado.</p>
          <Link
            href="/super-admin/tenants"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Lista
          </Link>
        </div>
      </div>
    );
  }

  const usage = Object.entries(tenant.stats.userCounts).reduce((acc, [role, count]) => {
    const limit = tenant.stats.limits[role];
    acc[role] = {
      current: count,
      limit: limit,
      isUnlimited: limit === -1
    };
    return acc;
  }, {} as Record<string, { current: number; limit: number; isUnlimited?: boolean }>);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/super-admin/tenants"
              className="text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <PlanTypeBadge tenantType={tenant.tenantType} />
                <PlanBadge plan={tenant.plan} isCustom={tenant.isCustomPlan} />
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tenant.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tenant.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Usage Overview */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Uso de Colaboradores</h2>
            <UsageSummary usage={usage} />
          </div>

          {/* Features Management */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Features Habilitadas</h2>
              {editing && (
                <span className="text-sm text-gray-500">Clique nos toggles para editar</span>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(tenant.stats.features).map(([feature, enabled]) => (
                <FeatureToggle
                  key={feature}
                  feature={feature}
                  enabled={editing ? formData.features[feature] : enabled}
                  onChange={(newValue) => {
                    setFormData({
                      ...formData,
                      features: { ...formData.features, [feature]: newValue }
                    });
                  }}
                  disabled={!editing}
                />
              ))}
            </div>
          </div>

          {/* Extra Slots Management */}
          {tenant.tenantType === 'business' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Slots Extras</h2>
              <div className="space-y-4">
                {Object.entries(tenant.extraSlots || {}).map(([role, quantity]) => (
                  <div key={role} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className="font-medium capitalize">{role}</span>
                      <p className="text-sm text-gray-500">Slots extras atuais</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold">{quantity}</span>
                      <button
                        onClick={() => {
                          const newQuantity = prompt(`Quantos slots extras de ${role} adicionar?`, '1');
                          if (newQuantity && !isNaN(parseInt(newQuantity))) {
                            handleAddExtraSlots(role, parseInt(newQuantity));
                          }
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {Object.keys(tenant.extraSlots || {}).length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Nenhum slot extra configurado
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tenant Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Tenant</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Nome</label>
                <p className="text-gray-900">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <p className="text-gray-900">
                  {tenant.tenantType === 'individual' ? 'Pessoa Física' : 'Profissional'}
                </p>
              </div>
              {tenant.subdomain && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Subdomain</label>
                  <p className="text-gray-900">{tenant.subdomain}.fitos.com</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">Criado em</label>
                <p className="text-gray-900">
                  {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              {tenant.tenantType === 'individual' && (
                <button
                  onClick={() => {
                    const subdomain = prompt('Digite o subdomain desejado:');
                    if (subdomain) {
                      handleConvertToBusiness(subdomain);
                    }
                  }}
                  className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <Building2 className="h-5 w-5 text-blue-500 mb-2" />
                  <div className="font-medium">Converter para Business</div>
                  <div className="text-sm text-gray-500">Criar subdomain e habilitar colaboradores</div>
                </button>
              )}

              <Link
                href={`/super-admin/tenants/${tenant.id}/custom-plan`}
                className="block w-full text-left p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors"
              >
                <Crown className="h-5 w-5 text-orange-500 mb-2" />
                <div className="font-medium">Criar Plano Customizado</div>
                <div className="text-sm text-gray-500">Plano personalizado para este tenant</div>
              </Link>

              <button
                onClick={() => {
                  const role = prompt('Tipo de colaborador (admin/trainer):');
                  const quantity = prompt('Quantidade:');
                  if (role && quantity && !isNaN(parseInt(quantity))) {
                    handleAddExtraSlots(role, parseInt(quantity));
                  }
                }}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                <Plus className="h-5 w-5 text-green-500 mb-2" />
                <div className="font-medium">Adicionar Slots</div>
                <div className="text-sm text-gray-500">Adicionar slots extras rapidamente</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
