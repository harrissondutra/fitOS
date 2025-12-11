'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { motion } from 'framer-motion';

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const planId = searchParams.get('plan') || 'professional';
    const interval = searchParams.get('interval') || 'monthly';
    const [loading, setLoading] = useState(false);

    const plans = {
        free: { name: 'Starter', price: 0 },
        professional: { name: 'Professional', price: interval === 'yearly' ? 970 : 97 },
        enterprise: { name: 'Enterprise', price: interval === 'yearly' ? 2970 : 297 }
    };

    const selectedPlan = plans[planId as keyof typeof plans] || plans.professional;

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulação de checkout
        setTimeout(() => {
            setLoading(false);
            router.push('/checkout/success');
        }, 2000);
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
                        <Lock className="h-3 w-3" />
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
                            <h2 className="text-2xl font-bold mb-2">Dados de Pagamento</h2>
                            <p className="text-muted-foreground text-sm mb-8">Complete suas informações para iniciar</p>

                            <form onSubmit={handleCheckout} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="seu@email.com"
                                            required
                                            className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="pt-4 pb-2">
                                        <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1 mb-2 block">Método de Pagamento</Label>
                                        <RadioGroup defaultValue="card" className="grid grid-cols-2 gap-4">
                                            <div>
                                                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                                <Label
                                                    htmlFor="card"
                                                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-transparent bg-gray-50 p-4 hover:bg-gray-100 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary"
                                                >
                                                    <CreditCard className="h-6 w-6" />
                                                    <span className="font-semibold text-sm">Cartão de Crédito</span>
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                                                <Label
                                                    htmlFor="pix"
                                                    className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-transparent bg-gray-50 p-4 hover:bg-gray-100 cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:text-primary"
                                                >
                                                    <Zap className="h-6 w-6" />
                                                    <span className="font-semibold text-sm">PIX Instantâneo</span>
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cardName" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Nome no Cartão</Label>
                                        <Input
                                            id="cardName"
                                            placeholder="Como impresso no cartão"
                                            required
                                            className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cardNumber" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Número do Cartão</Label>
                                        <Input
                                            id="cardNumber"
                                            placeholder="0000 0000 0000 0000"
                                            required
                                            className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">Validade</Label>
                                            <Input
                                                id="expiry"
                                                placeholder="MM/AA"
                                                required
                                                className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvv" className="text-xs font-bold uppercase text-gray-500 tracking-wider ml-1">CVV</Label>
                                            <Input
                                                id="cvv"
                                                placeholder="123"
                                                required
                                                className="h-12 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-primary transition-all"
                                            />
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
                                            Processando...
                                        </div>
                                    ) : (
                                        'Iniciar Teste Grátis'
                                    )}
                                </Button>

                                <p className="text-xs text-center text-muted-foreground mt-4">
                                    Ao clicar em Iniciar, você concorda com nossos Termos de Uso. Cancelamento fácil a qualquer momento.
                                </p>
                            </form>
                        </motion.div>
                        <div className="mt-8 text-center lg:text-left">
                            <Button
                                variant="ghost"
                                onClick={() => router.back()}
                                className="text-muted-foreground hover:text-foreground rounded-full pl-0 hover:bg-transparent"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Voltar
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
                                    <div className="text-xl font-bold">R$ {selectedPlan.price}</div>
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
                                <span className="font-medium">R$ {selectedPlan.price},00</span>
                            </div>
                            <div className="flex justify-between items-center mb-6 text-primary">
                                <span className="font-medium">Desconto de Teste (14 dias)</span>
                                <span className="font-bold">- R$ {selectedPlan.price},00</span>
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
