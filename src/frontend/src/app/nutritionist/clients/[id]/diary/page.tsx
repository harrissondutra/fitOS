'use client';

/**
 * Página de Diário do Cliente - Nutricionista
 * 
 * Permite nutricionista visualizar diário alimentar do cliente com:
 * - Totais diários
 * - Histórico (últimos 30 dias)
 * - Gráficos de evolução
 * - Aderência ao plano
 * - Análise de padrões
 */

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  ArrowLeft,
  TrendingUp, 
  Target,
  AlertCircle,
  BarChart3,
  Apple,
  Beef,
  Wheat,
  Milk,
  Activity,
  TrendingDown
} from 'lucide-react';
import useSWR from 'swr';
import { toast } from 'react-hot-toast';

interface ClientInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const fetcher = async (url: string) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
};

export default function ClientDiaryPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Buscar dados do cliente
  const { data: clientData } = useSWR(
    clientId ? `/api/nutrition/clients/${clientId}` : null,
    fetcher
  );

  // Buscar totais diários
  const { data: dailyData, error: dailyError } = useSWR(
    clientId ? `/api/nutrition/tracking/daily/${selectedDate}?clientId=${clientId}` : null,
    fetcher,
    { refreshInterval: 60000 }
  );

  // Buscar histórico (30 dias)
  const { data: historyData } = useSWR(
    clientId ? `/api/nutrition/tracking/history?clientId=${clientId}&days=30` : null,
    fetcher
  );

  const dailyTotals = dailyData?.data;
  const history = historyData?.data;
  const client: ClientInfo = clientData?.data || { id: '', name: 'Cliente', email: '' };

  const getAdherenceColor = (adherence: number) => {
    if (adherence >= 80) return 'text-green-600';
    if (adherence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAdherenceBadge = (adherence: number) => {
    if (adherence >= 80) return 'success';
    if (adherence >= 60) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Diário Alimentar - {client.name}
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o progresso nutricional do paciente
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon">
          <Calendar className="w-4 h-4" />
        </Button>
      </div>

      {/* Aderência ao Plano */}
      {dailyTotals && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Aderência ao Plano
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${getAdherenceColor(dailyTotals.adherence)}`}>
                {dailyTotals.adherence}%
              </div>
              <div className="flex-1">
                <Progress value={dailyTotals.adherence} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {dailyTotals.adherence >= 80 
                    ? 'Cliente está seguindo muito bem o plano! 🎉'
                    : dailyTotals.adherence >= 60
                    ? 'Cliente precisa melhorar a aderência'
                    : 'Cliente está com baixa aderência - intervenção necessária'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Hoje</TabsTrigger>
          <TabsTrigger value="history">Histórico (30 dias)</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        {/* Tab: Hoje */}
        <TabsContent value="today" className="space-y-4">
          {dailyError ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Erro ao carregar dados do diário
                </p>
              </CardContent>
            </Card>
          ) : dailyTotals ? (
            <>
              {/* Totais Nutricionais */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo Nutricional - {selectedDate}</CardTitle>
                  <CardDescription>
                    Consumo vs Metas do Plano
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Calorias */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Apple className="w-4 h-4 text-red-500" />
                          Calorias
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {dailyTotals.totalCalories}/{dailyTotals.goals?.calories}
                        </span>
                      </div>
                      <Progress 
                        value={((dailyTotals.totalCalories / dailyTotals.goals?.calories) * 100) || 0} 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(((dailyTotals.totalCalories / dailyTotals.goals?.calories) * 100) || 0)}% da meta
                      </div>
                    </div>

                    {/* Proteína */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Beef className="w-4 h-4 text-purple-500" />
                          Proteína
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(dailyTotals.totalProtein || 0)}/{dailyTotals.goals?.protein}g
                        </span>
                      </div>
                      <Progress 
                        value={((dailyTotals.totalProtein / dailyTotals.goals?.protein) * 100) || 0} 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(((dailyTotals.totalProtein / dailyTotals.goals?.protein) * 100) || 0)}% da meta
                      </div>
                    </div>

                    {/* Carboidratos */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Wheat className="w-4 h-4 text-orange-500" />
                          Carboidratos
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(dailyTotals.totalCarbs || 0)}/{dailyTotals.goals?.carbs}g
                        </span>
                      </div>
                      <Progress 
                        value={((dailyTotals.totalCarbs / dailyTotals.goals?.carbs) * 100) || 0} 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(((dailyTotals.totalCarbs / dailyTotals.goals?.carbs) * 100) || 0)}% da meta
                      </div>
                    </div>

                    {/* Gorduras */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Milk className="w-4 h-4 text-yellow-500" />
                          Gorduras
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {Math.round(dailyTotals.totalFat || 0)}/{dailyTotals.goals?.fat}g
                        </span>
                      </div>
                      <Progress 
                        value={((dailyTotals.totalFat / dailyTotals.goals?.fat) * 100) || 0} 
                        className="h-2" 
                      />
                      <div className="text-xs text-muted-foreground">
                        {Math.round(((dailyTotals.totalFat / dailyTotals.goals?.fat) * 100) || 0)}% da meta
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Refeições do Dia */}
              {dailyTotals.meals && dailyTotals.meals.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  {dailyTotals.meals.map((meal: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {meal.mealType === 'breakfast' ? 'Café da Manhã' :
                             meal.mealType === 'lunch' ? 'Almoço' :
                             meal.mealType === 'dinner' ? 'Jantar' : 'Lanches'}
                          </CardTitle>
                          <Badge variant="outline">
                            {meal.calories} kcal
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {meal.entries && meal.entries.length > 0 ? (
                          <div className="space-y-2">
                            {meal.entries.map((entry: any, entryIndex: number) => (
                              <div key={entryIndex} className="text-sm border-b pb-2 last:border-0">
                                <div className="font-medium">{entry.food}</div>
                                <div className="text-xs text-muted-foreground">
                                  {entry.quantity} {entry.unit} • {entry.calories} kcal
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhum alimento registrado
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Carregando dados...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Histórico */}
        <TabsContent value="history" className="space-y-4">
          {history ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Histórico dos Últimos 30 Dias
                </CardTitle>
                <CardDescription>
                  Estatísticas e tendências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Total de Entradas</div>
                    <div className="text-2xl font-bold">{history.counts?.totalEntries || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Alimentos Únicos</div>
                    <div className="text-2xl font-bold">{history.counts?.uniqueFoods || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Média Calorias/Dia</div>
                    <div className="text-2xl font-bold">
                      {Math.round(history.averages?.caloriesPerDay || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Refeições/Dia</div>
                    <div className="text-2xl font-bold">
                      {Math.round(history.averages?.entriesPerDay || 0)}
                    </div>
                  </div>
                </div>

                {/* Distribuição por Tipo de Refeição */}
                {history.counts?.mealTypeCounts && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Distribuição por Refeição</h3>
                    <div className="space-y-2">
                      {Object.entries(history.counts.mealTypeCounts).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{type}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(count / history.counts.totalEntries) * 100} className="w-32" />
                            <span className="text-sm text-muted-foreground">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Carregando histórico...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Análise */}
        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Análise de Padrões
              </CardTitle>
              <CardDescription>
                Insights comportamentais (em desenvolvimento)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Análise de padrões com IA em breve
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

