'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

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
        <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={() => router.back()}
                    className="mb-8 hover:text-[#10B981] hover:bg-transparent pl-0"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="order-2 lg:order-1">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle>Resumo do Pedido</CardTitle>
                                <CardDescription>Revise os detalhes da sua assinatura</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                                        <p className="text-sm text-gray-500 capitalize">{interval === 'yearly' ? 'Anual' : 'Mensal'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl">R$ {selectedPlan.price},00</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Check className="h-4 w-4 text-[#10B981]" />
                                        <span>14 dias de teste grátis</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <Check className="h-4 w-4 text-[#10B981]" />
                                        <span>Cancele quando quiser</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                                        <span>Pagamento 100% seguro</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between items-center text-lg font-bold">
                                    <span>Total hoje</span>
                                    <span>R$ 0,00</span>
                                </div>
                                <p className="text-xs text-gray-500 text-right">
                                    Após 14 dias: R$ {selectedPlan.price},00 / {interval === 'yearly' ? 'ano' : 'mês'}
                                </p>
                            </CardContent>
                        </Card>

                        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
                            <Lock className="h-3 w-3" />
                            Ambiente Seguro SSL 256-bit
                        </div>
                    </div>

                    {/* Checkout Form */}
                    <div className="order-1 lg:order-2">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle>Dados de Pagamento</CardTitle>
                                <CardDescription>Complete suas informações para iniciar o teste</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleCheckout} className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" placeholder="seu@email.com" required />
                                        </div>

                                        <Separator className="my-4" />

                                        <RadioGroup defaultValue="card" className="grid grid-cols-2 gap-4">
                                            <div>
                                                <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                                <Label
                                                    htmlFor="card"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#10B981] [&:has([data-state=checked])]:border-[#10B981]"
                                                >
                                                    <CreditCard className="mb-3 h-6 w-6" />
                                                    Cartão
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="pix" id="pix" className="peer sr-only" />
                                                <Label
                                                    htmlFor="pix"
                                                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-[#10B981] [&:has([data-state=checked])]:border-[#10B981]"
                                                >
                                                    <div className="mb-3 font-bold text-xl">PIX</div>
                                                    Instantâneo
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        <div className="space-y-2">
                                            <Label htmlFor="cardName">Nome no Cartão</Label>
                                            <Input id="cardName" placeholder="Como impresso no cartão" required />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="cardNumber">Número do Cartão</Label>
                                            <Input id="cardNumber" placeholder="0000 0000 0000 0000" required />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="expiry">Validade</Label>
                                                <Input id="expiry" placeholder="MM/AA" required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cvv">CVV</Label>
                                                <Input id="cvv" placeholder="123" required />
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-bold h-12 text-lg"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processando...' : 'Iniciar Teste Grátis'}
                                    </Button>
                                </form>
                            </CardContent>
                            <CardFooter className="justify-center border-t p-4 bg-gray-50/50">
                                <p className="text-xs text-center text-muted-foreground">
                                    Ao clicar em Iniciar, você concorda com nossos Termos de Uso.
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
