'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Componente interno para suspender
function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams ? searchParams.get('token') : null;
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const { setAuthData } = useAuth();

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verifyToken = async () => {
            try {
                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    toast.success('Email verificado com sucesso!');

                    // Auto-Login: Se o backend retornou tokens, logar o usuário imediatamente
                    if (data.accessToken && data.refreshToken) {
                        setAuthData({
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken,
                            isAuthenticated: true
                        });
                        console.log('✅ Auto-login realizado após verificação de email');
                    }

                    // Redireciona automaticamente após 1.5 segundos
                    setTimeout(() => router.push('/pricing'), 1500);
                } else {
                    setStatus('error');
                    toast.error(data.message || 'Link inválido ou expirado');
                }
            } catch (error) {
                console.error('Erro ao verificar email:', error);
                setStatus('error');
            }
        };

        verifyToken();
    }, [token, router, setAuthData]);

    return (
        <Card className="w-full max-w-md mx-auto text-center border-0 shadow-xl bg-white/90 backdrop-blur dark:bg-gray-900/90">
            <CardHeader>
                <div className="mx-auto mb-4">
                    {status === 'verifying' && <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="h-16 w-16 text-green-500" />}
                    {status === 'error' && <XCircle className="h-16 w-16 text-red-500" />}
                </div>
                <CardTitle className="text-2xl">
                    {status === 'verifying' && 'Verificando seu email...'}
                    {status === 'success' && 'Email Verificado!'}
                    {status === 'error' && 'Link Expirado ou Inválido'}
                </CardTitle>
                <CardDescription>
                    {status === 'verifying' && 'Aguarde um momento enquanto validamos seu token.'}
                    {status === 'success' && 'Redirecionando para os planos...'}
                    {status === 'error' && 'Este link já foi usado ou não é mais válido.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {status === 'success' && (
                    <Button
                        onClick={() => router.push('/pricing')}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        Escolher meu Plano Agora
                    </Button>
                )}
                {status === 'error' && (
                    <>
                        <Button
                            onClick={() => router.push('/pricing')}
                            className="w-full"
                        >
                            Ver Planos & Preços
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            variant="outline"
                            className="w-full"
                        >
                            Fazer Login
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
            <Suspense fallback={<div>Carregando...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
