'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
// import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'; // Comentado pois o PaymentElement gerencia métodos
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Inicializar Stripe com a chave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SQvu10aTWFI2uJkTfwhnr3XefqHAyxsnHTHgT5E2RO3vIiG5yl8vmHjUrHC68G6bM6ThieW9G0fCRCe5gfXxASW00sH1sQrVg');

// Sub-componente para o formulário de pagamento real usando Stripe Elements
function PaymentForm({ clientSecret, planId, interval, email, name }: { clientSecret: string, planId: string, interval: string, email: string, name: string }) {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setIsProcessing(true);
        setErrorMessage(null);

        const isSetupIntent = clientSecret.startsWith('seti_');

        const confirmOptions = {
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout?plan=${planId}&interval=${interval}&email=${encodeURIComponent(email)}`,
                payment_method_data: {
                    billing_details: {
                        name: name,
                        email: email
                    }
                }
            },
        };

        const { error } = isSetupIntent
            ? await stripe.confirmSetup(confirmOptions)
            : await stripe.confirmPayment(confirmOptions);

        if (error) {
            setErrorMessage(error.message || 'Ocorreu um erro inesperado.');
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-4 text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-2">Detalhes do Pagamento</h2>
                <p className="text-sm text-muted-foreground mb-6">Insira os dados do seu cartão ou escolha outro método seguro abaixo.</p>
            </div>

            <div className="bg-gray-50/50 p-4 sm:p-6 rounded-2xl border border-gray-100">
                <PaymentElement options={{ layout: 'tabs' }} />
            </div>

            {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium animate-pulse">
                    ⚠️ {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={isProcessing || !stripe}
                className="w-full bg-primary hover:bg-[#059669] text-white font-bold h-14 rounded-full text-lg shadow-lg shadow-primary/25 mt-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                {isProcessing ? (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        Processando...
                    </div>
                ) : (
                    'Confirmar e Iniciar Teste Grátis'
                )}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
                <ShieldCheck className="h-3 w-3" />
                <span>Ambiente 100% Seguro & Criptografado</span>
            </div>
        </form>
    );
}

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams?.get('plan') || 'professional';
    const interval = searchParams?.get('interval') || 'monthly';
    const sessionId = searchParams?.get('session_id');
    const paymentIntentSecret = searchParams?.get('payment_intent_client_secret');
    const setupIntentSecret = searchParams?.get('setup_intent_client_secret');

    // Sucesso detectado via query params após o redirect do Stripe Elements
    const isSuccess = !!(sessionId || paymentIntentSecret || setupIntentSecret);

    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [userData, setUserData] = useState({
        email: searchParams?.get('email') || '',
        name: ''
    });

    const plans = {
        free: { name: 'Individual', price: 0 },
        individual: { name: 'Individual', price: 0 },
        starter: { name: 'Starter', price: interval === 'yearly' ? 799.20 : 99.90 },
        professional: { name: 'Professional', price: interval === 'yearly' ? 1599.20 : 199.90 },
        enterprise: { name: 'Enterprise', price: interval === 'yearly' ? 3199.20 : 399.90 }
    };

    const selectedPlan = plans[planId as keyof typeof plans] || plans.starter;

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const email = (document.getElementById('email') as HTMLInputElement)?.value;
        const name = (document.getElementById('cardName') as HTMLInputElement)?.value;
        setUserData({ email, name });

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/subscription/checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    interval,
                    email,
                    name
                })
            });
            const data = await response.json();

            if (data.clientSecret) {
                setClientSecret(data.clientSecret);
            } else {
                console.error('Checkout error:', data);
                alert('Erro ao iniciar checkout: ' + (data.error || 'Erro desconhecido'));
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 md:mb-0" onClick={() => router.push('/')}>
                        <div className="relative h-8 w-auto">
                            <img
                                src="/images/logomarca.png"
                                alt="FitOS"
                                className="h-full w-auto object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold tracking-tight">FitOS</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-white px-3 py-1.5 rounded-full shadow-sm border">
                        <Lock className="h-3 w-3 text-green-500" />
                        Ambiente Seguro SSL 256-bit
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

                    {/* Left Column - Form */}
                    <div className="lg:col-span-7 order-2 lg:order-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100"
                        >
                            {isSuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Check className="h-10 w-10 text-green-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold mb-4 text-gray-900">Pagamento Confirmado!</h2>
                                    <p className="text-lg text-muted-foreground mb-8">
                                        Sua assinatura foi iniciada com sucesso. <br />
                                        Crie sua senha para acessar o sistema.
                                    </p>
                                    <Button
                                        onClick={() => router.push(`/auth/signup?plan=${planId}&interval=${interval}&email=${userData.email}`)}
                                        className="bg-primary hover:bg-primary/90 text-white font-bold h-12 px-8 rounded-full text-lg shadow-lg shadow-primary/20"
                                    >
                                        Finalizar Cadastro
                                    </Button>
                                </div>
                            ) : clientSecret ? (
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret,
                                        appearance: {
                                            theme: 'stripe',
                                            variables: {
                                                colorPrimary: '#10b981',
                                                borderRadius: '12px',
                                                colorBackground: '#f9fafb',
                                            }
                                        }
                                    }}
                                >
                                    <PaymentForm
                                        clientSecret={clientSecret}
                                        planId={planId}
                                        interval={interval}
                                        email={userData.email}
                                        name={userData.name}
                                    />
                                </Elements>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold mb-2">Dados de Identificação</h2>
                                    <p className="text-muted-foreground text-sm mb-8">Informe quem você é para continuar</p>

                                    <form onSubmit={handleInitialSubmit} className="space-y-6">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Email Profissional</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="seu@email.com"
                                                    required
                                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="cardName" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Nome Completo</Label>
                                                <Input
                                                    id="cardName"
                                                    placeholder="Seu nome completo"
                                                    required
                                                    className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                                />
                                            </div>

                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                                                <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                                                <div className="text-sm text-blue-800">
                                                    <p className="font-semibold mb-1">Passo Inicial</p>
                                                    <p>Após informar seus dados, você verá as opções de pagamento integradas.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            className="w-full bg-primary hover:bg-[#059669] text-white font-bold h-14 rounded-full text-lg shadow-lg shadow-primary/25 mt-8 transition-all hover:scale-[1.01]"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                                    Iniciando...
                                                </div>
                                            ) : (
                                                'Continuar para Pagamento'
                                            )}
                                        </Button>
                                    </form>
                                </>
                            )}

                            {!isSuccess && !clientSecret && (
                                <p className="text-xs text-center text-muted-foreground mt-6">
                                    Ambiente criptografado e seguro. Seus dados estão protegidos sob a LGPD.
                                </p>
                            )}
                        </motion.div>

                        <div className="mt-8 text-center lg:text-left">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="text-muted-foreground hover:text-foreground rounded-full pl-0 hover:bg-transparent"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar para planos
                            </Button>
                        </div>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-5 order-1 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/60 backdrop-blur-md rounded-[2rem] p-8 border border-white/40 sticky top-8"
                        >
                            <h3 className="font-bold text-xl mb-6">Resumo do Pedido</h3>

                            <div className="flex items-start justify-between mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">{selectedPlan.name}</h2>
                                    <div className="text-sm text-muted-foreground capitalize">{interval === 'yearly' ? 'Plano Anual' : 'Plano Mensal'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.price)}</div>
                                    <div className="text-xs text-muted-foreground">/{interval === 'yearly' ? 'ano' : 'mês'}</div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm font-medium">14 dias de teste totalmente grátis</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm font-medium">Cancele online quando quiser</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
                                    </div>
                                    <span className="text-sm font-medium">Cobrança só começa dia {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <Separator className="bg-gray-200 my-6" />

                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.price)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-6 text-primary">
                                <span className="font-medium">Desconto de Teste (14 dias)</span>
                                <span className="font-bold">- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedPlan.price)}</span>
                            </div>

                            <div className="flex justify-between items-end pt-4 border-t border-gray-200">
                                <div>
                                    <span className="text-2xl font-bold text-gray-900">Total hoje</span>
                                    <p className="text-xs text-muted-foreground mt-1">Nada será cobrado agora.</p>
                                </div>
                                <span className="text-3xl font-bold text-gray-900">R$ 0,00</span>
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </div>
    );
}
