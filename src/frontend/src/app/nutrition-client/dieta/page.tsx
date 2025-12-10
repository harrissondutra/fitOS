'use client';

/**
 * Página "Minha Dieta" - FitOS Sprint 7
 * 
 * Exibe resumo do dia, progresso, metas e aderência ao plano
 * Integração: Backend real + shadcn/ui
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Plus, 
  Target, 
  TrendingUp, 
  Apple,
  Beef,
  Wheat,
  Milk,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { useFoodDiaryTracking } from '@/hooks/use-food-diary-tracking';
import { FoodSearchDialog } from '@/components/nutrition/food-search-dialog';
import { Skeleton } from '@/components/ui/skeleton';

export default function DietaPage() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('');

  // Formatear data para hoje
  const today = new Date().toISOString().split('T')[0];
  
  const { dailyTotals, isLoading, addFood, adherence, isOnline, syncStatus, syncNow } = useFoodDiaryTracking(today);

  const handleAddFood = async (food: any, quantity: number, unit: string) => {
    await addFood({
      foodId: food.id,
      name: food.name,
      quantity,
      unit,
      mealType: selectedMealType,
      consumedAt: new Date()
    });
  };

  const mealTypeLabels: Record<string, string> = {
    breakfast: 'Café da Manhã',
    lunch: 'Almoço',
    dinner: 'Jantar',
    snack: 'Lanches'
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha Dieta</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe seu progresso e metas diárias
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status de Conexão */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                <Wifi className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Online</span>
              </Badge>
            ) : (
              <Badge variant="destructive">
                <WifiOff className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Offline</span>
              </Badge>
            )}
          </div>

          {/* Sincronizar */}
          {!isOnline && syncStatus && syncStatus.pendingCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={syncNow}
              disabled={!isOnline}
              className="hidden sm:flex"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Sincronizar ({syncStatus.pendingCount})
            </Button>
          )}

          <Button variant="outline" size="icon" aria-label="Calendário">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Alerta Offline */}
      {!isOnline && (
        <Alert variant="default" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            <strong>Você está offline</strong>. Os alimentos adicionados serão salvos localmente e sincronizados automaticamente quando a conexão for restaurada.
            {syncStatus && syncStatus.pendingCount > 0 && (
              <span className="ml-2">
                {syncStatus.pendingCount} entrada(s) pendente(s)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Alerta de Sincronização */}
      {isOnline && syncStatus && syncStatus.pendingCount > 0 && (
        <Alert variant="default" className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            <strong>Sincronização em andamento</strong>. {syncStatus.pendingCount} entrada(s) sendo enviadas ao servidor...
          </AlertDescription>
        </Alert>
      )}

      {/* Aderência ao Plano */}
      <Card className="border-green-500/20 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Aderência ao Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-green-600">
              {adherence}%
            </div>
            <div className="flex-1">
              <Progress value={adherence} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">
                Você está a {adherence >= 80 ? 'ótimo' : adherence >= 60 ? 'bom' : 'precisar melhorar'} em relação ao plano prescrito
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Totais do Dia */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Nutricional de Hoje</CardTitle>
          <CardDescription>
            Compare seu consumo com as metas do nutricionista
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
                  {Math.round(dailyTotals?.totalCalories || 0)}/{dailyTotals?.goals?.calories || 0}
                </span>
              </div>
              <Progress 
                value={((dailyTotals?.totalCalories || 0) / (dailyTotals?.goals?.calories || 1)) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {Math.round(((dailyTotals?.totalCalories || 0) / (dailyTotals?.goals?.calories || 1)) * 100)}% da meta
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
                  {Math.round(dailyTotals?.totalProtein || 0)}/{dailyTotals?.goals?.protein || 0}g
                </span>
              </div>
              <Progress 
                value={((dailyTotals?.totalProtein || 0) / (dailyTotals?.goals?.protein || 1)) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {Math.round(((dailyTotals?.totalProtein || 0) / (dailyTotals?.goals?.protein || 1)) * 100)}% da meta
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
                  {Math.round(dailyTotals?.totalCarbs || 0)}/{dailyTotals?.goals?.carbs || 0}g
                </span>
              </div>
              <Progress 
                value={((dailyTotals?.totalCarbs || 0) / (dailyTotals?.goals?.carbs || 1)) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {Math.round(((dailyTotals?.totalCarbs || 0) / (dailyTotals?.goals?.carbs || 1)) * 100)}% da meta
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
                  {Math.round(dailyTotals?.totalFat || 0)}/{dailyTotals?.goals?.fat || 0}g
                </span>
              </div>
              <Progress 
                value={((dailyTotals?.totalFat || 0) / (dailyTotals?.goals?.fat || 1)) * 100} 
                className="h-2" 
              />
              <div className="text-xs text-muted-foreground">
                {Math.round(((dailyTotals?.totalFat || 0) / (dailyTotals?.goals?.fat || 1)) * 100)}% da meta
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refeições por Tipo */}
      {dailyTotals?.meals && dailyTotals.meals.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
            const meal = dailyTotals.meals.find((m: any) => m.mealType === mealType);
            
            return (
              <Card key={mealType}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {mealTypeLabels[mealType]}
                    </CardTitle>
                    <Badge variant="outline">
                      {Math.round(meal?.calories || 0)} kcal
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setSelectedMealType(mealType);
                        setSearchOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Alimento
                    </Button>

                    {meal?.entries && meal.entries.length > 0 ? (
                      <div className="space-y-2 mt-4">
                        {meal.entries.map((entry: any, index: number) => (
                          <div key={index} className="text-sm">
                            <div className="font-medium">{entry.food || entry.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {entry.quantity} {entry.unit} • {Math.round(entry.calories || 0)} kcal
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum alimento adicionado
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog de Busca */}
      <FoodSearchDialog
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectFood={handleAddFood}
        mealType={selectedMealType}
      />
    </div>
  );
}

