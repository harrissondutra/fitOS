import { PlanComparison } from '@/components/onboarding/PlanComparison';
import { PlanCard } from '@/components/onboarding/PlanCard';
import { usePlans } from '@/hooks/use-plans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function PlansPage() {
  const { plans, isLoading } = usePlans();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Planos flexíveis para academias de todos os tamanhos
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[600px] bg-muted animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {/* Plans Grid */}
        {!isLoading && plans.length > 0 && (
          <Tabs defaultValue="cards" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="comparison">Comparação</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="cards" className="space-y-8">
              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onSelect={(id) => {
                    // Redirecionar para onboarding com planId
                    window.location.href = `/onboarding/start?planId=${id}`;
                  }} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comparison" className="space-y-8">
              {/* Tabela de Comparação */}
              <PlanComparison plans={plans} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

