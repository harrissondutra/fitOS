'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  Building2,
  Users,
  CreditCard,
  Settings,
  Eye,
  Save,
  Crown
} from 'lucide-react';
import { PlanBadge, PlanTypeBadge } from '@/components/plan/plan-badge';
import { FeatureList, FeatureToggle } from '@/components/plan/feature-badge';
import { toastUtils } from '@/lib/toast-utils';

interface Tenant {
  id: string;
  name: string;
  tenantType: 'individual' | 'business';
  plan: string;
}

interface BasePlan {
  id: string;
  plan: string;
  displayName: string;
  tenantType: string;
  limits: Record<string, number>;
  price: number;
  extraSlotPrice: Record<string, number>;
  features: Record<string, boolean>;
}

interface CustomPlanData {
  displayName: string;
  limits: Record<string, number>;
  price: number;
  extraSlotPrice: Record<string, number>;
  features: Record<string, boolean>;
  contractTerms: string;
}

const STEPS = [
  { id: 'base', title: 'Base', icon: Building2 },
  { id: 'limits', title: 'Limites', icon: Users },
  { id: 'pricing', title: 'Preços', icon: CreditCard },
  { id: 'features', title: 'Features', icon: Settings },
  { id: 'details', title: 'Detalhes', icon: Crown },
  { id: 'preview', title: 'Preview', icon: Eye }
];

export default function CustomPlanWizard() {
  const params = useParams();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [basePlans, setBasePlans] = useState<BasePlan[]>([]);
  const [selectedBasePlan, setSelectedBasePlan] = useState<string>('');
  const [planData, setPlanData] = useState<CustomPlanData>({
    displayName: '',
    limits: { owner: 1, admin: 0, trainer: 0, member: 0 },
    price: 0,
    extraSlotPrice: {},
    features: {},
    contractTerms: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTenantAndPlans();
  }, []);

  const fetchTenantAndPlans = async () => {
    if (!params?.id) return;
    
    try {
      setLoading(true);
      const [tenantResponse, plansResponse] = await Promise.all([
        fetch(`/api/super-admin/tenants/${params.id}`),
        fetch('/api/super-admin/plan-configs?isCustom=false')
      ]);

      if (tenantResponse.ok) {
        const tenantData = await tenantResponse.json();
        setTenant(tenantData.data);
      }

      if (plansResponse.ok) {
        const plansData = await plansResponse.json();
        setBasePlans(plansData.data.plans);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBasePlanSelect = (planId: string) => {
    const plan = basePlans.find(p => p.id === planId);
    if (plan) {
      setSelectedBasePlan(planId);
      setPlanData({
        ...planData,
        displayName: `${plan.displayName} (Customizado)`,
        limits: { ...plan.limits },
        price: plan.price,
        extraSlotPrice: { ...plan.extraSlotPrice },
        features: { ...plan.features }
      });
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = async () => {
    if (!params?.id) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/super-admin/custom-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: params.id,
          ...planData
        })
      });

      if (response.ok) {
        const result = await response.json();
        // Atribuir plano ao tenant
        await fetch(`/api/super-admin/custom-plans/${result.data.id}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tenantId: params.id })
        });
        
        toastUtils.plan.created('Plano customizado');
        router.push(`/super-admin/tenants/${params.id}`);
      } else {
        toastUtils.plan.error('criar');
      }
    } catch (error) {
      console.error('Error creating custom plan:', error);
      toastUtils.plan.error('criar');
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedBasePlan !== '';
      case 1: return Object.values(planData.limits).some(v => v > 0);
      case 2: return planData.price > 0;
      case 3: return true; // Features são opcionais
      case 4: return planData.displayName.trim() !== '';
      case 5: return true; // Preview
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Escolher Plano Base
              </h3>
              <p className="text-gray-600">
                Selecione um plano existente como base para personalizar
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {basePlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedBasePlan === plan.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleBasePlanSelect(plan.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{plan.displayName}</h4>
                    <PlanTypeBadge tenantType={plan.tenantType as 'individual' | 'business'} size="sm" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600 mb-2">
                    R$ {plan.price.toFixed(2)}/mês
                  </p>
                  <div className="text-sm text-gray-600">
                    <p>Limites: {Object.entries(plan.limits)
                      .filter(([_, v]) => v > 0)
                      .map(([role, limit]) => `${role}: ${limit === -1 ? '∞' : limit}`)
                      .join(', ')}
                    </p>
                    <p className="mt-1">
                      Features: {Object.values(plan.features).filter(Boolean).length} habilitadas
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Definir Limites por Role
              </h3>
              <p className="text-gray-600">
                Configure quantos usuários de cada tipo o plano permite
              </p>
            </div>
            <div className="space-y-4">
              {Object.entries(planData.limits).map(([role, limit]) => (
                <div key={role} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium capitalize">{role}</h4>
                    <p className="text-sm text-gray-500">
                      {role === 'owner' ? 'Proprietário da conta' : 
                       role === 'admin' ? 'Administradores' :
                       role === 'trainer' ? 'Personal Trainers' : 'Membros'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setPlanData({
                        ...planData,
                        limits: { ...planData.limits, [role]: -1 }
                      })}
                      className={`px-3 py-1 text-sm rounded ${
                        limit === -1 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      Ilimitado
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={limit === -1 ? '' : limit}
                      onChange={(e) => setPlanData({
                        ...planData,
                        limits: { ...planData.limits, [role]: parseInt(e.target.value) || 0 }
                      })}
                      className="w-20 px-3 py-1 border rounded text-center"
                      disabled={limit === -1}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configurar Preços
              </h3>
              <p className="text-gray-600">
                Defina o preço mensal e valores para slots extras
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Mensal (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={planData.price}
                  onChange={(e) => setPlanData({
                    ...planData,
                    price: parseFloat(e.target.value) || 0
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preços de Slots Extras</h4>
                <div className="space-y-3">
                  {Object.entries(planData.extraSlotPrice).map(([role, price]) => (
                    <div key={role} className="flex items-center justify-between">
                      <span className="capitalize text-sm">{role}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={price}
                          onChange={(e) => setPlanData({
                            ...planData,
                            extraSlotPrice: {
                              ...planData.extraSlotPrice,
                              [role]: parseFloat(e.target.value) || 0
                            }
                          })}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <span className="text-sm text-gray-500">por slot</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Configurar Features
              </h3>
              <p className="text-gray-600">
                Habilite ou desabilite funcionalidades específicas
              </p>
            </div>
            <div className="space-y-3">
              {Object.entries(planData.features).map(([feature, enabled]) => (
                <FeatureToggle
                  key={feature}
                  feature={feature}
                  enabled={enabled}
                  onChange={(newValue) => setPlanData({
                    ...planData,
                    features: { ...planData.features, [feature]: newValue }
                  })}
                />
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Detalhes Finais
              </h3>
              <p className="text-gray-600">
                Configure o nome e condições especiais do plano
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  value={planData.displayName}
                  onChange={(e) => setPlanData({
                    ...planData,
                    displayName: e.target.value
                  })}
                  placeholder="Ex: Academia XYZ Premium"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Condições Especiais do Contrato
                </label>
                <textarea
                  value={planData.contractTerms}
                  onChange={(e) => setPlanData({
                    ...planData,
                    contractTerms: e.target.value
                  })}
                  rows={4}
                  placeholder="Ex: Desconto de 10% para pagamento anual, suporte prioritário..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Preview do Plano
              </h3>
              <p className="text-gray-600">
                Revise os detalhes antes de criar o plano customizado
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Crown className="h-6 w-6 text-orange-500" />
                  <h4 className="text-xl font-bold">{planData.displayName}</h4>
                  <PlanTypeBadge tenantType={tenant?.tenantType || 'business'} />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    R$ {planData.price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">/mês</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Limites</h5>
                  <div className="space-y-1">
                    {Object.entries(planData.limits).map(([role, limit]) => (
                      <div key={role} className="flex justify-between text-sm">
                        <span className="capitalize">{role}:</span>
                        <span>{limit === -1 ? 'Ilimitado' : limit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Features</h5>
                  <FeatureList features={planData.features} size="sm" />
                </div>
              </div>

              {planData.contractTerms && (
                <div className="mt-4 pt-4 border-t">
                  <h5 className="font-medium text-gray-900 mb-2">Condições Especiais</h5>
                  <p className="text-sm text-gray-600">{planData.contractTerms}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4">
          <Link
            href={`/super-admin/tenants/${params?.id}`}
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Criar Plano Customizado
            </h1>
            <p className="mt-2 text-gray-600">
              Para {tenant?.name} - {tenant?.tenantType === 'individual' ? 'Pessoa Física' : 'Profissional'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <step.icon className="h-5 w-5" />
                )}
              </div>
              <div className="ml-3">
                <div className={`text-sm font-medium ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </button>

        <div className="flex items-center space-x-2">
          {currentStep === STEPS.length - 1 ? (
            <button
              onClick={handleSave}
              disabled={!canProceed() || saving}
              className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Plano
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
