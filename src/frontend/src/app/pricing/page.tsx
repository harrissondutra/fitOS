'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Zap, Crown, Building } from 'lucide-react';
import { toast } from 'sonner';

const plans = [
    {
        id: 'free',
        name: 'FREE',
        icon: Zap,
        price: { monthly: 0, yearly: 0 },
        description: 'Para começar sua jornada fitness',
        features: [
            'Acesso completo aos seus dados pessoais',
            'Histórico de 1 ano de treinos e progresso',
            'Gráficos avançados de analytics',
            'Aplicativo móvel',
            'Suporte por email'
        ],
        limitations: [
            'Sem exportação de dados',
            'Sem gestão de clientes',
            'Sem CRM',
            'Sem marketplace'
        ],
        popular: false,
        cta: 'Começar Grátis'
    },
    {
        id: 'professional',
        name: 'PROFESSIONAL',
        icon: Crown,
        price: { monthly: 97, yearly: 970 },
        description: 'Para profissionais que querem crescer',
        features: [
            'Tudo do FREE +',
            'Exportação de dados',
            'Gestão de até 50 clientes',
            'CRM básico',
            'Marketplace de produtos',
            'Suporte prioritário',
            'Relatórios avançados'
        ],
        limitations: [],
        popular: true,
        cta: 'Escolher Professional'
    },
    {
        id: 'enterprise',
        name: 'ENTERPRISE',
        icon: Building,
        price: { monthly: 297, yearly: 2970 },
        description: 'Para academias e grandes empresas',
        features: [
            'Tudo do PROFESSIONAL +',
            'Clientes ilimitados',
            'CRM completo',
            'Multi-tenancy',
            'White-label',
            'API dedicada',
            'Suporte 24/7',
            'Onboarding personalizado',
            'Treinamento da equipe'
        ],
        limitations: [],
        popular: false,
        cta: 'Fale com Vendas'
    }
];

export default function PricingPage() {
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

    const handleSelectPlan = async (planId: string) => {
        if (!isAuthenticated) {
            toast.error('Você precisa estar logado para escolher um plano');
            router.push('/auth/signup');
            return;
        }

        setLoading(planId);

        try {
            if (planId === 'free') {
                // Para plano FREE, ativar e verificar se houve criação de tenant
                const response = await fetch('/api/subscription/free', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user?.id })
                });

                const data = await response.json();

                if (response.ok) {
                    toast.success('Plano FREE ativado!');

                    if (data.redirectUrl) {
                        toast.loading('Redirecionando para seu novo espaço...');
                        // Pequeno delay para usuário ler o toast
                        setTimeout(() => {
                            window.location.href = data.redirectUrl;
                        }, 1500);
                    } else {
                        router.push('/dashboard');
                    }
                } else {
                    toast.error(data.error || 'Erro ao ativar plano FREE');
                }
            } else if (planId === 'enterprise') {
                // Para Enterprise, redirecionar para contato/vendas
                router.push('/contact-sales');
            } else {
                // Para Professional, ir para checkout
                const response = await fetch('/api/subscription/create-checkout', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        planId,
                        billingCycle,
                        userId: user?.id
                    })
                });

                const data = await response.json();

                if (data.success && data.checkoutUrl) {
                    // Redirecionar para Stripe/MercadoPago checkout
                    window.location.href = data.checkoutUrl;
                } else {
                    toast.error('Erro ao criar checkout. Tente novamente.');
                }
            }
        } catch (error) {
            console.error('Erro ao selecionar plano:', error);
            toast.error('Erro ao processar solicitação');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Escolha o <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">plano ideal</span> para você
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                        Comece grátis e evolua conforme suas necessidades crescem
                    </p>

                    {/* Billing Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Mensal
                        </span>
                        <Switch
                            checked={billingCycle === 'yearly'}
                            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
                        />
                        <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-foreground' : 'text-muted-foreground'}`}>
                            Anual
                            <Badge variant="secondary" className="ml-2">Economize 17%</Badge>
                        </span>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const price = plan.price[billingCycle];
                        const savings = billingCycle === 'yearly' ? Math.round((plan.price.monthly * 12 - plan.price.yearly) / 10) * 10 : 0;

                        return (
                            <Card
                                key={plan.id}
                                className={`relative flex flex-col ${plan.popular
                                    ? 'border-2 border-primary shadow-xl scale-105'
                                    : 'border hover:shadow-lg transition-shadow'
                                    }`}
                            >
                                {plan.popular && (
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600">
                                        Mais Popular
                                    </Badge>
                                )}

                                <CardHeader>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Icon className={`h-6 w-6 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <CardTitle>{plan.name}</CardTitle>
                                    </div>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>

                                <CardContent className="flex-1">
                                    <div className="mb-6">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-bold">
                                                {price === 0 ? 'Grátis' : `R$ ${price}`}
                                            </span>
                                            {price > 0 && (
                                                <span className="text-muted-foreground">
                                                    / {billingCycle === 'monthly' ? 'mês' : 'ano'}
                                                </span>
                                            )}
                                        </div>
                                        {savings > 0 && price > 0 && (
                                            <p className="text-sm text-green-600 mt-1">
                                                Economize R$ {savings}/ano
                                            </p>
                                        )}
                                    </div>

                                    <ul className="space-y-3">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>

                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        variant={plan.popular ? 'default' : 'outline'}
                                        size="lg"
                                        onClick={() => handleSelectPlan(plan.id)}
                                        disabled={loading === plan.id}
                                    >
                                        {loading === plan.id ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                                Processando...
                                            </>
                                        ) : (
                                            plan.cta
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* FAQ / Info */}
                <div className="mt-16 text-center">
                    <p className="text-sm text-muted-foreground">
                        Todos os planos incluem 14 dias de teste grátis • Cancele a qualquer momento
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Dúvidas?{' '}
                        <a href="/contact" className="text-primary hover:underline">
                            Fale conosco
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}
