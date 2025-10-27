/**
 * Onboarding Page
 * 
 * Página principal do processo de self-service onboarding:
 * - Wizard multi-step usando Shadcn components
 * - 4 etapas: Gym Info → Owner Info → Plan Selection → Payment
 * - Progress indicator visual
 * - Navegação entre steps
 * - Validação de cada etapa
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GymInfoStep } from './steps/gym-info';
import { OwnerInfoStep } from './steps/owner-info';
import { PlanSelectionStep } from './steps/plan-selection';
import { PaymentStep } from './steps/payment';
import { CheckCircle, ArrowLeft, ArrowRight, Building2, User, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface OnboardingData {
  // Gym Information
  gymName: string;
  subdomain: string;
  billingEmail: string;
  gymType: 'academia' | 'personal_trainer' | 'crossfit' | 'pilates' | 'outro';
  
  // Owner Information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerDocument: string;
  ownerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // Plan Selection
  planId: 'starter' | 'professional' | 'enterprise';
  billingCycle: 'monthly' | 'yearly';
  paymentMethod: 'stripe' | 'mercadopago';
}

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType<StepProps>;
}

interface StepProps {
  data: OnboardingData;
  onDataChange: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  isLoading?: boolean;
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Informações da Academia',
    description: 'Dados básicos da sua academia',
    icon: Building2,
    component: GymInfoStep
  },
  {
    id: 2,
    title: 'Informações do Proprietário',
    description: 'Seus dados pessoais',
    icon: User,
    component: OwnerInfoStep
  },
  {
    id: 3,
    title: 'Escolha do Plano',
    description: 'Selecione o melhor plano para você',
    icon: DollarSign,
    component: PlanSelectionStep
  },
  {
    id: 4,
    title: 'Pagamento',
    description: 'Finalize sua assinatura',
    icon: CreditCard,
    component: PaymentStep
  }
];

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    gymName: '',
    subdomain: '',
    billingEmail: '',
    gymType: 'academia',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerDocument: '',
    ownerAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'BR'
    },
    planId: 'starter',
    billingCycle: 'monthly',
    paymentMethod: 'stripe'
  });

  const currentStepData = steps.find(step => step.id === currentStep);
  const progress = (currentStep / steps.length) * 100;

  const handleDataChange = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const handleNext = async () => {
    if (currentStep < steps.length) {
      // Validar dados do step atual
      const isValid = await validateCurrentStep();
      if (!isValid) return;

      // Marcar step como completo
      setCompletedSteps(prev => [...prev, currentStep]);
      
      // Avançar para próximo step
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const validateCurrentStep = async (): Promise<boolean> => {
    switch (currentStep) {
      case 1: // Gym Info
        if (!onboardingData.gymName || !onboardingData.subdomain || !onboardingData.billingEmail) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        
        // Validar subdomain
        try {
          const response = await fetch('/api/onboarding/validate-subdomain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subdomain: onboardingData.subdomain })
          });
          
          const result = await response.json();
          if (!result.success || !result.available) {
            toast.error('Subdomain não está disponível');
            return false;
          }
        } catch (error) {
          toast.error('Erro ao validar subdomain');
          return false;
        }
        break;

      case 2: // Owner Info
        if (!onboardingData.ownerName || !onboardingData.ownerEmail || !onboardingData.ownerPhone || !onboardingData.ownerDocument) {
          toast.error('Preencha todos os campos obrigatórios');
          return false;
        }
        break;

      case 3: // Plan Selection
        if (!onboardingData.planId || !onboardingData.billingCycle || !onboardingData.paymentMethod) {
          toast.error('Selecione um plano e método de pagamento');
          return false;
        }
        break;

      case 4: // Payment
        // Validação será feita no componente de pagamento
        break;
    }

    return true;
  };

  const handleComplete = async () => {
    setIsLoading(true);
    
    try {
      // Criar tenant e subscription
      const response = await fetch('/api/onboarding/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(onboardingData)
      });

      const result = await response.json();
      
      if (result.success) {
        // Se for pagamento PIX, redirecionar para confirmação
        if (result.nextStep === 'payment') {
          router.push(`/onboarding/payment?tenantId=${result.tenant.id}&paymentId=${result.subscription.paymentId}`);
        } else {
          // Se for Stripe, redirecionar para confirmação
          router.push(`/onboarding/confirmation?tenantId=${result.tenant.id}`);
        }
      } else {
        toast.error(result.error || 'Erro ao criar conta');
      }
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
      toast.error('Erro interno. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const StepIcon = currentStepData?.icon || Building2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Bem-vindo ao FitOS
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Configure sua academia em poucos passos
          </p>
        </div>

        {/* Progress Indicator */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  Passo {currentStep} de {steps.length}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(progress)}% concluído
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              
              {/* Step Indicators */}
              <div className="flex justify-between">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isCompleted = completedSteps.includes(step.id);
                  const isCurrent = step.id === currentStep;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center space-y-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="text-center">
                        <p className={`text-xs font-medium ${
                          isCurrent ? 'text-blue-600' : 'text-gray-500'
                        }`}>
                          {step.title}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StepIcon className="h-5 w-5" />
                {currentStepData?.title}
              </CardTitle>
              <CardDescription>
                {currentStepData?.description}
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {currentStepData && (
                <currentStepData.component
                  data={onboardingData}
                  onDataChange={handleDataChange}
                  onNext={handleNext}
                  onPrevious={handlePrevious}
                  isLoading={isLoading}
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Finalizar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Precisa de ajuda? Entre em contato conosco em{' '}
            <a href="mailto:suporte@sistudo.com" className="text-blue-600 hover:underline">
              suporte@sistudo.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

