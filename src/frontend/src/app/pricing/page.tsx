'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Zap, Crown, Building, ArrowLeft } from 'lucide-react';
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
                router.push('/contact-sales');
            } else {
                router.push(`/checkout?plan=${planId}&interval=${billingCycle}`);
            }
        } catch (error) {
            console.error('Erro ao selecionar plano:', error);
            toast.error('Erro ao processar solicitação');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Logo */}
                <div className="flex flex-col items-center mb-16">
                    <div className="flex items-center gap-3 mb-8 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
                        <div className="relative h-10 w-auto">
                            <img
                                src="/images/logomarca.png"
                                alt="FitOS"
                                className="h-full w-auto object-contain"
                            />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">FitOS</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-tight">
                        Escolha seu plano.
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl text-center">
                        Poderoso para profissionais. Simples para iniciantes.
                    </p>
                </div>

                {/* Switcher Style iOS */}
                <div className="flex justify-center mb-16">
                    <div className="bg-white p-1 rounded-full shadow-sm inline-flex items-center">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${billingCycle === 'monthly'
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Mensal
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-8 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${billingCycle === 'yearly'
                                    ? 'bg-foreground text-background shadow-md'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Anual
                            <span className="ml-2 text-[10px] font-bold text-primary uppercase">Economize 17%</span>
                        </button>
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const price = plan.price[billingCycle];

                        return (
                            <div
                                key={plan.id}
                                className={`
                                    relative flex flex-col p-8 rounded-[2rem] transition-all duration-500
                                    ${plan.popular
                                        ? 'bg-white shadow-2xl scale-105 z-10 ring-1 ring-black/5'
                                        : 'bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white hover:shadow-xl'
                                    }
                                `}
                            >
                                {plan.popular && (
                                    <div className="absolute top-0 left-0 right-0 flex justify-center -translate-y-1/2">
                                        <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20">
                                            Mais Popular
                                        </div>
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center mb-6 
                                        ${plan.popular ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold tracking-tight">
                                            {price === 0 ? 'Grátis' : `R$ ${price}`}
                                        </span>
                                        {price > 0 && (
                                            <span className="text-muted-foreground font-medium">
                                                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                            </div>
                                            <span className="text-sm font-medium text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`
                                        w-full h-12 rounded-full font-bold text-base transition-all duration-300
                                        ${plan.popular
                                            ? 'bg-primary hover:bg-[#059669] text-white shadow-lg hover:shadow-primary/30'
                                            : 'bg-gray-900 text-white hover:bg-black'
                                        }
                                    `}
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loading === plan.id}
                                >
                                    {loading === plan.id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                            <span>Processando...</span>
                                        </div>
                                    ) : (
                                        plan.cta
                                    )}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Footer Info */}
                <div className="mt-16 text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Todos os planos incluem 14 dias de teste grátis. Cancele quando quiser.
                    </p>
                    <button onClick={() => router.push('/contact')} className="text-sm font-semibold text-primary hover:underline">
                        Precisa de um plano customizado para sua rede? Fale com nosso time de vendas.
                    </button>
                    <div className="pt-8">
                        <Button variant="ghost" onClick={() => router.push('/')} className="rounded-full text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Voltar para Home
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
