import React from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

interface FeatureLockProps {
    children: React.ReactNode;
    featureName: string;
    description?: string;
    minPlan?: 'starter' | 'professional' | 'enterprise';
}

export function FeatureLock({
    children,
    featureName,
    description = "Esta funcionalidade não está disponível no seu plano atual.",
    minPlan = 'starter'
}: FeatureLockProps) {
    const { user } = useAuth();

    // Se não tiver usuário ou plano, bloqueia por segurança
    if (!user || !user.plan) {
        return null;
    }

    const planLevels = {
        'free': 0,
        'starter': 1,
        'professional': 2,
        'enterprise': 3
    };

    const currentLevel = planLevels[user.plan as keyof typeof planLevels] || 0;
    const requiredLevel = planLevels[minPlan] || 1;

    // Se o nível do plano atual for suficiente, renderiza o conteúdo
    if (currentLevel >= requiredLevel) {
        return <>{children}</>;
    }

    // Caso contrário, mostra o bloqueio
    return (
        <div className="relative w-full h-full min-h-[200px] rounded-lg border border-dashed p-4 flex items-center justify-center bg-muted/30">
            <div className="absolute inset-0 backdrop-blur-[1px]" />
            <Card className="relative z-10 w-full max-w-md shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>Funcionalidade Bloqueada</CardTitle>
                    <CardDescription>
                        {featureName} é exclusivo para planos {minPlan === 'starter' ? 'Starter' : minPlan === 'professional' ? 'Professional' : 'Enterprise'} ou superiores.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    {description}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/billing">
                            Fazer Upgrade Agora
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
