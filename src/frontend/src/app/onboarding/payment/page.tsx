'use client';

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StripeCheckoutForm } from '@/components/payment/StripeCheckoutForm';
import { PixPaymentDisplay } from '@/components/payment/PixPaymentDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PaymentPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  const planId = searchParams.get('planId');

  if (!tenantId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Sessão expirada ou inválida
            </p>
            <Link href="/onboarding/plans">
              <Button className="w-full">Voltar para Planos</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/onboarding/plans">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Finalizar Assinatura</CardTitle>
            <CardDescription>
              Escolha a forma de pagamento para ativar sua assinatura
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="stripe" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stripe">Cartão de Crédito</TabsTrigger>
                <TabsTrigger value="mercado-pago">Mercado Pago</TabsTrigger>
              </TabsList>

              <TabsContent value="stripe">
                <StripeCheckoutForm
                  planId={planId || 'professional'}
                  tenantId={tenantId}
                  onPaymentSuccess={(paymentIntentId) => {
                    console.log('Payment success:', paymentIntentId);
                    window.location.href = `/onboarding/success?tenantId=${tenantId}`;
                  }}
                  onPaymentError={(error) => {
                    console.error('Payment error:', error);
                  }}
                />
              </TabsContent>

              <TabsContent value="mercado-pago">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Escolha como deseja pagar via Mercado Pago
                  </p>
                  
                  {/* PIX Payment */}
                  <div className="border rounded-lg p-6">
                    <h3 className="font-semibold mb-4">PIX (Pagamento Instantâneo)</h3>
                    <PixPaymentDisplay
                      qrCode="00020126580014BR.GOV.BCB.PIX01141234567890123456789012345678"
                      expiresAt={new Date(Date.now() + 15 * 60 * 1000)}
                      paymentId="TEST_PAYMENT_ID"
                      onPaymentSuccess={() => {
                        window.location.href = `/onboarding/success?tenantId=${tenantId}`;
                      }}
                      onPaymentError={(error) => {
                        console.error('PIX error:', error);
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

