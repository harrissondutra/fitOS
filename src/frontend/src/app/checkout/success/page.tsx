'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams?.get('session_id') || null;

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

    useEffect(() => {
        // Efeito de confetti ao carregar (se houver sessionId)
        if (sessionId) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }

        // Verificar status do checkout
        const verifyCheckout = async () => {
            if (!sessionId) {
                setStatus('error');
                return;
            }

            try {
                const response = await fetch(`/api/subscription/verify-checkout?session_id=${sessionId}`, {
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    setStatus('success');
                    setSubscriptionDetails(data.subscription);
                } else {
                    setStatus('error');
                }
            } catch (error) {
                console.error('Erro ao verificar checkout:', error);
                setStatus('error');
            }
        };

        // Delay para mostrar animação
        setTimeout(() => {
            verifyCheckout();
        }, 1500);
    }, [sessionId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-12 pb-12 text-center">
                        <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Processando pagamento...</h2>
                        <p className="text-muted-foreground">
                            Aguarde enquanto confirmamos sua assinatura
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 p-4">
                <Card className="w-full max-w-md border-red-200">
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                        </div>
                        <CardTitle className="text-2xl">Erro no Pagamento</CardTitle>
                        <CardDescription>
                            Não conseguimos confirmar seu pagamento. Isso pode acontecer por diversos motivos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                Se o valor foi debitado da sua conta, não se preocupe! O sistema irá processar automaticamente
                                assim que confirmarmos o pagamento com o gateway.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button onClick={() => router.push('/pricing')} className="w-full">
                                Tentar Novamente
                            </Button>
                            <Button variant="outline" onClick={() => router.push('/dashboard')} className="w-full">
                                Ir para Dashboard
                            </Button>
                            <Button variant="ghost" asChild className="w-full">
                                <Link href="/support">Contactar Suporte</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Success state
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
            <Card className="w-full max-w-2xl border-green-200">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center animate-bounce">
                        <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-3xl bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Pagamento Confirmado! 🎉
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Sua assinatura foi ativada com sucesso
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Detalhes da Assinatura */}
                    {subscriptionDetails && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                            <h3 className="font-semibold text-lg mb-4">Detalhes da Assinatura</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Plano:</span>
                                    <p className="font-semibold capitalize">{subscriptionDetails.planId}</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <p className="font-semibold text-green-600">Ativo</p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Próxima cobrança:</span>
                                    <p className="font-semibold">
                                        {new Date(subscriptionDetails.currentPeriodEnd).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">ID da Assinatura:</span>
                                    <p className="font-mono text-xs">{subscriptionDetails.id.slice(0, 12)}...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Próximos Passos */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg">Próximos Passos</h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Explore seu dashboard</p>
                                    <p className="text-sm text-muted-foreground">
                                        Comece a usar todas as funcionalidades do seu plano
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Configure sua conta</p>
                                    <p className="text-sm text-muted-foreground">
                                        Personalize suas preferências e configurações
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium">Receba ajuda</p>
                                    <p className="text-sm text-muted-foreground">
                                        Acesse nossa documentação e tutoriais
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Email Confirmation */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                            📧 Um email de confirmação foi enviado para você com todos os detalhes da sua assinatura.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            size="lg"
                            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            onClick={() => router.push('/dashboard')}
                        >
                            Ir para Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="flex-1"
                            asChild
                        >
                            <Link href="/settings/billing">Ver Minha Assinatura</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
