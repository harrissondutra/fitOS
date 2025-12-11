'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

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
                // Artificial delay for better UX (prevent flashing)
                await new Promise(resolve => setTimeout(resolve, 800));

                const response = await fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    toast.success('Email verificado com sucesso!');

                    if (data.accessToken && data.refreshToken) {
                        setAuthData({
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken,
                            isAuthenticated: true
                        });
                    }

                    setTimeout(() => router.push('/pricing'), 2000);
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
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl p-8 md:p-12 text-center"
        >
            <div className="mx-auto mb-8 flex justify-center">
                {status === 'verifying' && (
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-blue-50 p-4 rounded-full">
                            <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        </div>
                    </div>
                )}
                {status === 'success' && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="bg-green-50 p-4 rounded-full"
                    >
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                    </motion.div>
                )}
                {status === 'error' && (
                    <div className="bg-red-50 p-4 rounded-full">
                        <XCircle className="h-12 w-12 text-red-500" />
                    </div>
                )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                {status === 'verifying' && 'Verificando...'}
                {status === 'success' && 'Email Confirmado!'}
                {status === 'error' && 'Link Inválido'}
            </h1>

            <p className="text-muted-foreground mb-8 text-lg font-medium leading-relaxed">
                {status === 'verifying' && 'Estamos validando seu token de acesso seguro.'}
                {status === 'success' && 'Sua conta foi ativada. Estamos te levando para a próxima etapa.'}
                {status === 'error' && 'Parece que este link expirou ou já foi utilizado anteriormente.'}
            </p>

            <div className="flex flex-col gap-3">
                {status === 'success' && (
                    <Button
                        onClick={() => router.push('/pricing')}
                        className="w-full h-12 rounded-full bg-primary hover:bg-[#059669] text-white font-bold text-base shadow-lg shadow-primary/20"
                    >
                        Continuar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}

                {status === 'error' && (
                    <>
                        <Button
                            onClick={() => router.push('/auth/signup')}
                            className="w-full h-12 rounded-full font-bold"
                        >
                            Tentar Novamente
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            variant="outline"
                            className="w-full h-12 rounded-full border-2"
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Fazer Login
                        </Button>
                    </>
                )}
            </div>
        </motion.div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="absolute top-8 left-0 right-0 flex justify-center">
                <div className="flex items-center gap-2 mb-8 opacity-50 hover:opacity-100 transition-opacity">
                    <img src="/images/logomarca.png" alt="FitOS" className="h-8 w-auto" />
                    <span className="text-lg font-bold">FitOS</span>
                </div>
            </div>
            <Suspense fallback={<div>Carregando...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
