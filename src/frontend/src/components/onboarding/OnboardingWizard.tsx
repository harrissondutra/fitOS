'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Schemas de validação para cada step
const gymInfoSchema = z.object({
  gymName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  gymType: z.enum(['academia', 'personal_trainer', 'crossfit', 'pilates', 'outro']),
  billingEmail: z.string().email('Email inválido')
});

const adminInfoSchema = z.object({
  ownerName: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  ownerEmail: z.string().email('Email inválido'),
  ownerPhone: z.string().min(10, 'Telefone deve ter no mínimo 10 caracteres'),
  ownerDocument: z.string().min(11, 'CPF/CNPJ deve ter no mínimo 11 caracteres'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

const subdomainSchema = z.object({
  subdomain: z.string()
    .min(3, 'Subdomain deve ter no mínimo 3 caracteres')
    .max(20, 'Subdomain deve ter no máximo 20 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Subdomain deve conter apenas letras minúsculas, números e hífens')
});

const planSchema = z.object({
  planId: z.string().min(1, 'Selecione um plano'),
  billingCycle: z.enum(['monthly', 'yearly'])
});

const addressSchema = z.object({
  street: z.string().min(5, 'Endereço completo é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().min(2, 'Estado é obrigatório'),
  zipCode: z.string().min(8, 'CEP é obrigatório'),
  country: z.string().default('BR')
});

type FormData = z.infer<typeof gymInfoSchema> & 
  z.infer<typeof adminInfoSchema> & 
  z.infer<typeof subdomainSchema> & 
  z.infer<typeof planSchema> & 
  { address: z.infer<typeof addressSchema> };

interface OnboardingWizardProps {
  initialPlanId?: string;
}

export function OnboardingWizard({ initialPlanId }: OnboardingWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null);
  const [isValidatingSubdomain, setIsValidatingSubdomain] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(gymInfoSchema.merge(adminInfoSchema).merge(subdomainSchema).merge(planSchema).extend({
      address: addressSchema
    })),
    defaultValues: {
      planId: initialPlanId,
      billingCycle: 'monthly',
      country: 'BR'
    },
    mode: 'onChange'
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const validateCurrentStep = async () => {
    let stepFields: (keyof FormData)[] = [];
    
    switch (currentStep) {
      case 1:
        stepFields = ['gymName', 'gymType', 'billingEmail'];
        break;
      case 2:
        stepFields = ['ownerName', 'ownerEmail', 'ownerPhone', 'ownerDocument', 'password', 'confirmPassword'];
        break;
      case 3:
        stepFields = ['subdomain'];
        // Validar subdomain via API
        const subdomain = form.getValues('subdomain');
        if (subdomain) {
          setIsValidatingSubdomain(true);
          try {
            const res = await fetch('/api/onboarding/validate-subdomain', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ subdomain })
            });
            const data = await res.json();
            setSubdomainAvailable(data.available);
            if (!data.available) {
              toast({
                variant: 'destructive',
                title: 'Subdomain indisponível',
                description: 'Este subdomain já está em uso. Tente outro.'
              });
              return false;
            }
          } catch (error) {
            toast({
              variant: 'destructive',
              title: 'Erro ao validar',
              description: 'Não foi possível validar o subdomain'
            });
            return false;
          } finally {
            setIsValidatingSubdomain(false);
          }
        }
        break;
      case 4:
        stepFields = ['planId', 'billingCycle'];
        break;
    }

    const result = await form.trigger(stepFields);
    return result;
  };

  const handleNext = async () => {
    if (!await validateCurrentStep()) {
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const data = form.getValues();
      
      const res = await fetch('/api/onboarding/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        throw new Error('Erro ao criar tenant');
      }

      toast({
        title: 'Cadastro criado com sucesso!',
        description: 'Redirecionando para pagamento...'
      });

      // Redirecionar para página de pagamento
      router.push(`/onboarding/payment?tenantId=${data.subdomain}`);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar cadastro',
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Passo {currentStep} de {totalSteps}</span>
                <span>{Math.round(progress)}% completo</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Informações da Academia'}
              {currentStep === 2 && 'Dados do Administrador'}
              {currentStep === 3 && 'Subdomain'}
              {currentStep === 4 && 'Plano de Assinatura'}
              {currentStep === 5 && 'Endereço'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Informe os dados da sua academia'}
              {currentStep === 2 && 'Crie a conta do administrador'}
              {currentStep === 3 && 'Escolha um subdomain para acessar sua área'}
              {currentStep === 4 && 'Selecione o plano ideal'}
              {currentStep === 5 && 'Informe o endereço de cobrança'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Step 1: Gym Info */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="gymName">Nome da Academia</Label>
                  <Input
                    id="gymName"
                    {...form.register('gymName')}
                    error={form.formState.errors.gymName?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="gymType">Tipo de Academia</Label>
                  <Select {...form.register('gymType')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academia">Academia</SelectItem>
                      <SelectItem value="personal_trainer">Personal Trainer</SelectItem>
                      <SelectItem value="crossfit">Crossfit</SelectItem>
                      <SelectItem value="pilates">Pilates</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="billingEmail">Email de Cobrança</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    {...form.register('billingEmail')}
                    error={form.formState.errors.billingEmail?.message}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Admin Info */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ownerName">Nome Completo</Label>
                  <Input
                    id="ownerName"
                    {...form.register('ownerName')}
                    error={form.formState.errors.ownerName?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="ownerEmail">Email</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    {...form.register('ownerEmail')}
                    error={form.formState.errors.ownerEmail?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="ownerPhone">Telefone</Label>
                  <Input
                    id="ownerPhone"
                    {...form.register('ownerPhone')}
                    error={form.formState.errors.ownerPhone?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="ownerDocument">CPF/CNPJ</Label>
                  <Input
                    id="ownerDocument"
                    {...form.register('ownerDocument')}
                    error={form.formState.errors.ownerDocument?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    error={form.formState.errors.password?.message}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...form.register('confirmPassword')}
                    error={form.formState.errors.confirmPassword?.message}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Subdomain */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    O subdomain será usado para acessar sua área: <strong>seu-subdomain.fitos.com</strong>
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="subdomain">Subdomain</Label>
                  <div className="flex gap-2">
                    <Input
                      id="subdomain"
                      {...form.register('subdomain')}
                      error={form.formState.errors.subdomain?.message}
                      placeholder="exemplo: minha-academia"
                    />
                    <span className="flex items-center text-muted-foreground">.fitos.com</span>
                  </div>
                  {subdomainAvailable === false && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Este subdomain já está em uso
                      </AlertDescription>
                    </Alert>
                  )}
                  {subdomainAvailable === true && (
                    <Alert className="mt-2">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Subdomain disponível!
                      </AlertDescription>
                    </Alert>
                  )}
                  {isValidatingSubdomain && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Validando...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Plan */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Você pode alterar o plano a qualquer momento
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="billingCycle">Ciclo de Cobrança</Label>
                  <Select defaultValue="monthly" {...form.register('billingCycle')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="yearly">Anual (20% desconto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="planId">Plano</Label>
                  <Select {...form.register('planId')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um plano" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="starter">Starter - R$ 199/mês</SelectItem>
                      <SelectItem value="professional">Professional - R$ 499/mês</SelectItem>
                      <SelectItem value="enterprise">Enterprise - R$ 999/mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 5: Address */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="street">Endereço</Label>
                  <Input
                    id="street"
                    {...form.register('address.street')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...form.register('address.city')}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...form.register('address.state')}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    {...form.register('address.zipCode')}
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1 || isSubmitting}
              >
                Voltar
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting || isValidatingSubdomain}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === totalSteps ? 'Finalizar Cadastro' : 'Próximo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

