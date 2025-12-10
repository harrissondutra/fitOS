'use client';

/**
 * Nutrition Upgrade Page - Sprint 7
 * Página de vendas de add-ons nutricionais avançados
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  features: string[];
  aiCredits: number;
}

const PLANS: PricingPlan[] = [
  {
    id: 'nutrition-basic',
    name: 'Nutrição Básica',
    price: 'R$ 49,90',
    features: [
      'Clara IA Avançado',
      'Base TBCA/TACO (3000+ alimentos)',
      '50+ templates de prescrição',
      'Questionários de saúde',
      'Exportação PDF profissional',
      '100 créditos IA/mês'
    ],
    aiCredits: 100
  },
  {
    id: 'nutrition-pro',
    name: 'Nutrição Profissional',
    price: 'R$ 99,90',
    features: [
      'Tudo do Básico +',
      'BodyScan AI (análise por fotos)',
      'Avaliação materno-infantil',
      'IA para prevenção de lesões',
      'Suporte prioritário',
      '500 créditos IA/mês'
    ],
    aiCredits: 500
  }
];

export default function NutritionUpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Chamar backend para criar checkout
      const res = await fetch('/api/nutrition-addon/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      });

      if (!res.ok) {
        throw new Error('Erro ao criar checkout');
      }

      const { checkoutUrl } = await res.json();
      
      // Redirecionar para checkout (Stripe ou Mercado Pago)
      window.location.href = checkoutUrl;
      
    } catch (err: any) {
      setError(err.message || 'Erro ao processar assinatura');
    } finally {
      setLoading(false);
    }
  };

  const handleTrial = async () => {
    try {
      setLoading(true);
      
      const res = await fetch('/api/nutrition-addon/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error('Erro ao criar trial');
      }

      // Reload para refletir mudanças
      window.location.reload();
      
    } catch (err: any) {
      setError(err.message || 'Erro ao ativar trial');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Recursos Avançados para Nutricionistas
        </h1>
        <p className="text-xl text-muted-foreground">
          Funcionalidades profissionais de IA e análise nutricional
        </p>
      </div>

      <div className="flex justify-center mb-8">
        <Button onClick={handleTrial} disabled={loading} variant="outline" size="lg">
          <CheckCircle className="mr-2 h-4 w-4" />
          Experimente grátis por 7 dias (Pro)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {PLANS.map((plan, index) => (
          <Card
            key={plan.id}
            className={index === 1 ? 'border-primary border-2' : ''}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {index === 1 && <Badge variant="default">Mais Popular</Badge>}
              </div>
              <CardDescription className="text-3xl font-bold mt-4">
                {plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span>
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              {error && <div className="text-sm text-red-500">{error}</div>}

              <Button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading}
                className="w-full"
                variant={index === 1 ? 'default' : 'outline'}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Assinar Agora'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Cancele a qualquer momento
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          💳 Pagamento seguro via Stripe ou Mercado Pago | Suporte 24/7
        </p>
      </div>
    </div>
  );
}




