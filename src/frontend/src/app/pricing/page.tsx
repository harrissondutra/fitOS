'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Check, Zap, Crown, Building, ArrowLeft, Star } from 'lucide-react';
import { usePlans } from '@/hooks/use-plans';
import { toast } from 'sonner';


// Metadata para enriquecer os dados do backend
const PLAN_METADATA: Record<string, any> = {
    individual: {
        icon: Zap,
        description: 'Para começar sua jornada fitness',
        limitations: ['Sem gestão de clientes', 'Sem CRM', 'Sem white-label'],
        cta: 'Começar Grátis',
        popular: false,
        order: 1
    },
    starter: {
        icon: Star,
        description: 'Perfeito para personal trainers',
        limitations: ['Sem domínio personalizado', 'Sem API'],
        cta: 'Escolher Starter',
        popular: false,
        order: 2
    },
    professional: {
        icon: Crown,
        description: 'Para academias em crescimento',
        limitations: [],
        cta: 'Escolher Professional',
        popular: true,
        order: 3
    },
    enterprise: {
        icon: Building,
        description: 'Para grandes redes',
        limitations: [],
        cta: 'Fale com Vendas',
        popular: false,
        order: 4
    }
};

export default function PricingPage() {
    const router = useRouter();
    // const { user, isAuthenticated } = useAuth(); // Removed unused

    const { plans: backendPlans, isLoading } = usePlans();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState<string | null>(null);

    const plans = backendPlans?.map(plan => {
        const metadata = PLAN_METADATA[plan.id] || {
            icon: Star,
            description: plan.name,
            limitations: [],
            cta: 'Escolher Plano',
            popular: false,
            order: 99
        };

        // Normalizar preço (assumindo que o backend já retornou o objeto {monthly, yearly} conforme onbording routes)
        // Se vier number (formato antigo/interface antiga), tratar
        const price = typeof plan.price === 'object' && plan.price !== null
            ? plan.price
            : { monthly: Number(plan.price || 0), yearly: Number(plan.price || 0) * 12 * 0.8 };

        return {
            ...plan,
            ...metadata,
            price
        };
    }).sort((a: any, b: any) => (a.order || 99) - (b.order || 99)) || [];

    const handleSelectPlan = async (planId: string) => {
        setLoading(planId);

        try {
            if (planId === 'enterprise') {
                router.push('/contact-sales');
            } else {
                // Enviar para checkout para todos os planos (exceto Enterprise)
                // O fluxo é: Pricing -> Checkout -> Signup
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
                    {plans.map((plan) => {
                        const Icon = plan.icon;
                        const price = plan.price[billingCycle];

                        return (
                            <div
                                key={plan.id}
                                className={`
                                    relative flex flex-col p-6 rounded-[2rem] transition-all duration-300
                                    ${plan.popular
                                        ? 'bg-white shadow-2xl scale-105 z-10 ring-2 ring-primary border-transparent'
                                        : 'bg-white/60 backdrop-blur-sm border border-white/40 hover:bg-white hover:shadow-xl hover:-translate-y-1'
                                    }
                                `}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                                        <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/20 flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-current" />
                                            Recomendado
                                        </div>
                                    </div>
                                )}

                                <div className="mb-6">
                                    <div className={`
                                        w-12 h-12 rounded-2xl flex items-center justify-center mb-4
                                        ${plan.popular ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed h-[40px]">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-6 pb-6 border-b border-gray-100">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold tracking-tight">
                                            {price === 0 ? 'Grátis' : `R$ ${price}`}
                                        </span>
                                        {price > 0 && (
                                            <span className="text-muted-foreground font-medium text-sm">
                                                /{billingCycle === 'monthly' ? 'mês' : 'ano'}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ul className="space-y-4 mb-8 flex-1">
                                    {plan.features.map((feature: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3">
                                            <div className="mt-0.5 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={`
                                        w-full h-11 rounded-xl font-bold text-sm transition-all duration-300
                                        ${plan.popular
                                            ? 'bg-primary hover:bg-[#059669] text-white shadow-lg hover:shadow-primary/30'
                                            : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-gray-900 hover:bg-gray-50'
                                        }
                                    `}
                                    onClick={() => handleSelectPlan(plan.id)}
                                    disabled={loading === plan.id}
                                >
                                    {loading === plan.id ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
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
