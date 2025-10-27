/**
 * Plan Selection Step
 * 
 * Step 3 do onboarding:
 * - Cards com planos disponíveis
 * - Starter, Professional, Enterprise
 * - Comparação de features
 * - Preços mensais/anuais
 * - Seleção interativa
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Star, Users, Database, Zap, Shield, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface PlanSelectionStepProps {
  data: {
    planId: 'starter' | 'professional' | 'enterprise';
    billingCycle: 'monthly' | 'yearly';
    paymentMethod: 'stripe' | 'mercadopago';
  };
  onDataChange: (data: Partial<any>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    users: number;
    clients: number;
    storage: number;
    apiCalls: number;
  };
  popular?: boolean;
  recommended?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfeito para academias pequenas e personal trainers',
    price: {
      monthly: 99.90,
      yearly: 799.20 // 20% desconto
    },
    features: [
      'Até 50 clientes',
      '5 usuários simultâneos',
      '10GB de armazenamento',
      'Relatórios básicos',
      'Suporte por email',
      'Integração WhatsApp básica',
      'App mobile incluído',
      'Backup diário'
    ],
    limits: {
      users: 5,
      clients: 50,
      storage: 10,
      apiCalls: 1000
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal para academias em crescimento e profissionais estabelecidos',
    price: {
      monthly: 199.90,
      yearly: 1599.20 // 20% desconto
    },
    features: [
      'Até 200 clientes',
      '15 usuários simultâneos',
      '50GB de armazenamento',
      'Relatórios avançados',
      'Suporte prioritário',
      'Integração WhatsApp completa',
      'CRM básico incluído',
      'Integração com wearables',
      'App mobile + web',
      'Backup em tempo real',
      'API básica'
    ],
    limits: {
      users: 15,
      clients: 200,
      storage: 50,
      apiCalls: 5000
    },
    popular: true,
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solução completa para grandes academias e redes',
    price: {
      monthly: 399.90,
      yearly: 3199.20 // 20% desconto
    },
    features: [
      'Clientes ilimitados',
      'Usuários ilimitados',
      '200GB de armazenamento',
      'Relatórios personalizados',
      'Suporte 24/7',
      'CRM avançado',
      'Integração completa',
      'API personalizada',
      'White label disponível',
      'Domínio personalizado',
      'Backup ilimitado',
      'Webhooks ilimitados',
      'Integração com ERPs',
      'Treinamento personalizado'
    ],
    limits: {
      users: -1, // ilimitado
      clients: -1, // ilimitado
      storage: 200,
      apiCalls: -1 // ilimitado
    }
  }
];

export function PlanSelectionStep({ data, onDataChange, onPrevious, onNext, isLoading }: PlanSelectionStepProps) {
  const [availablePlans, setAvailablePlans] = useState<Plan[]>(plans);

  useEffect(() => {
    // Simular carregamento de planos da API
    setAvailablePlans(plans);
  }, []);

  const handlePlanChange = (planId: string) => {
    onDataChange({ planId });
  };

  const handleBillingCycleChange = (cycle: string) => {
    onDataChange({ billingCycle: cycle });
  };

  const handlePaymentMethodChange = (method: string) => {
    onDataChange({ paymentMethod: method });
  };

  const handleNext = () => {
    if (!data.planId) {
      toast.error('Selecione um plano');
      return;
    }

    if (!data.billingCycle) {
      toast.error('Selecione o ciclo de cobrança');
      return;
    }

    if (!data.paymentMethod) {
      toast.error('Selecione o método de pagamento');
      return;
    }

    onNext();
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Users className="h-5 w-5" />;
      case 'professional':
        return <Star className="h-5 w-5" />;
      case 'enterprise':
        return <Crown className="h-5 w-5" />;
      default:
        return <Users className="h-5 w-5" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const calculateSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = Math.round((savings / monthlyTotal) * 100);
    return { amount: savings, percentage };
  };

  const selectedPlan = availablePlans.find(plan => plan.id === data.planId);

  return (
    <div className="space-y-6">
      {/* Seleção de Planos */}
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Escolha o melhor plano para você</h3>
          <p className="text-sm text-muted-foreground">
            Todos os planos incluem suporte e atualizações gratuitas
          </p>
        </div>

        <RadioGroup value={data.planId} onValueChange={handlePlanChange}>
          <div className="grid gap-4 md:grid-cols-3">
            {availablePlans.map((plan) => {
              const isSelected = data.planId === plan.id;
              const savings = calculateSavings(plan.price.monthly, plan.price.yearly);
              
              return (
                <div key={plan.id} className="relative">
                  <Label
                    htmlFor={plan.id}
                    className={`block cursor-pointer ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                  >
                    <Card className={`h-full transition-all ${
                      isSelected 
                        ? 'border-primary shadow-lg' 
                        : 'hover:shadow-md'
                    } ${plan.popular ? 'border-blue-500' : ''}`}>
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-blue-500 text-white">
                            <Star className="h-3 w-3 mr-1" />
                            Mais Popular
                          </Badge>
                        </div>
                      )}
                      
                      <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-2">
                          {getPlanIcon(plan.id)}
                        </div>
                        <CardTitle className="text-xl">{plan.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {plan.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Preços */}
                        <div className="text-center">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold">
                              {formatPrice(data.billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {data.billingCycle === 'yearly' ? 'por ano' : 'por mês'}
                            </div>
                            {data.billingCycle === 'yearly' && (
                              <div className="text-xs text-green-600 font-medium">
                                Economize {formatPrice(savings.amount)} ({savings.percentage}% de desconto)
                              </div>
                            )}
                          </div>
                        </div>

                        <Separator />

                        {/* Features */}
                        <div className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <RadioGroupItem value={plan.id} id={plan.id} className="sr-only" />
                      </CardContent>
                    </Card>
                  </Label>
                </div>
              );
            })}
          </div>
        </RadioGroup>
      </div>

      {/* Ciclo de Cobrança */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ciclo de Cobrança</CardTitle>
          <CardDescription>
            Escolha como prefere ser cobrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={data.billingCycle} onValueChange={handleBillingCycleChange}>
            <div className="grid grid-cols-2 gap-4">
              <Label htmlFor="monthly" className="cursor-pointer">
                <Card className={`p-4 ${data.billingCycle === 'monthly' ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <div>
                      <div className="font-medium">Mensal</div>
                      <div className="text-sm text-muted-foreground">
                        Cobrança mensal
                      </div>
                    </div>
                  </div>
                </Card>
              </Label>
              
              <Label htmlFor="yearly" className="cursor-pointer">
                <Card className={`p-4 ${data.billingCycle === 'yearly' ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        Anual
                        <Badge variant="secondary" className="text-xs">20% OFF</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Economize com cobrança anual
                      </div>
                    </div>
                  </div>
                </Card>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Método de Pagamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Método de Pagamento</CardTitle>
          <CardDescription>
            Escolha como prefere pagar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={data.paymentMethod} onValueChange={handlePaymentMethodChange}>
            <div className="grid grid-cols-2 gap-4">
              <Label htmlFor="stripe" className="cursor-pointer">
                <Card className={`p-4 ${data.paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="stripe" id="stripe" />
                    <div>
                      <div className="font-medium">Stripe</div>
                      <div className="text-sm text-muted-foreground">
                        Cartões internacionais
                      </div>
                    </div>
                  </div>
                </Card>
              </Label>
              
              <Label htmlFor="mercadopago" className="cursor-pointer">
                <Card className={`p-4 ${data.paymentMethod === 'mercadopago' ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mercadopago" id="mercadopago" />
                    <div>
                      <div className="font-medium">Mercado Pago</div>
                      <div className="text-sm text-muted-foreground">
                        PIX, Boleto, Cartões nacionais
                      </div>
                    </div>
                  </div>
                </Card>
              </Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Resumo da Seleção */}
      {selectedPlan && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">Resumo da Seleção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Plano:</span>
              <span className="font-medium">{selectedPlan.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Ciclo:</span>
              <span className="font-medium">
                {data.billingCycle === 'monthly' ? 'Mensal' : 'Anual'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Método:</span>
              <span className="font-medium">
                {data.paymentMethod === 'stripe' ? 'Stripe' : 'Mercado Pago'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>
                {formatPrice(data.billingCycle === 'yearly' ? selectedPlan.price.yearly : selectedPlan.price.monthly)}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {data.billingCycle === 'yearly' ? '/ano' : '/mês'}
                </span>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={isLoading}
        >
          Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading || !data.planId || !data.billingCycle || !data.paymentMethod}
          className="flex items-center gap-2"
        >
          Continuar
          <Star className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

