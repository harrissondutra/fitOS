'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  UtensilsCrossed, 
  Plus, 
  Search, 
  Calculator,
  Target,
  Clock,
  Users,
  Save,
  Eye,
  Copy,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Apple,
  Beef,
  Wheat,
  Milk,
  Droplets,
  Zap
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface MealItem {
  id: string;
  food: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

interface Meal {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
}

interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export default function MealPlanCreator() {
  const [planName, setPlanName] = useState('');
  const [clientName, setClientName] = useState('');
  const [macroTargets, setMacroTargets] = useState<MacroTargets>({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 70,
    fiber: 25
  });

  const [meals, setMeals] = useState<Meal[]>([
    {
      id: '1',
      name: 'Café da Manhã',
      time: '07:00',
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    },
    {
      id: '2',
      name: 'Lanche da Manhã',
      time: '10:00',
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    },
    {
      id: '3',
      name: 'Almoço',
      time: '12:00',
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    },
    {
      id: '4',
      name: 'Lanche da Tarde',
      time: '15:00',
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    },
    {
      id: '5',
      name: 'Jantar',
      time: '19:00',
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    }
  ]);

  const foodDatabase = [
    { name: 'Frango (peito, sem pele)', calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, category: 'Proteínas', icon: Beef },
    { name: 'Arroz branco cozido', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4, category: 'Carboidratos', icon: Wheat },
    { name: 'Salmão (grelhado)', calories: 208, protein: 25, carbs: 0, fat: 12, fiber: 0, category: 'Proteínas', icon: Beef },
    { name: 'Maçã (com casca)', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, fiber: 2.4, category: 'Frutas', icon: Apple },
    { name: 'Leite desnatado', calories: 34, protein: 3.4, carbs: 5, fat: 0.2, fiber: 0, category: 'Laticínios', icon: Milk },
    { name: 'Azeite de oliva', calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, category: 'Gorduras', icon: Droplets },
    { name: 'Batata doce cozida', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, category: 'Carboidratos', icon: Wheat },
    { name: 'Ovo (inteiro)', calories: 155, protein: 13, carbs: 1.1, fat: 11, fiber: 0, category: 'Proteínas', icon: Beef }
  ];

  const addFoodToMeal = (mealId: string, food: any, quantity: number) => {
    const newItem: MealItem = {
      id: Date.now().toString(),
      food: food.name,
      quantity,
      unit: 'g',
      calories: Math.round((food.calories * quantity) / 100),
      protein: Math.round((food.protein * quantity) / 100),
      carbs: Math.round((food.carbs * quantity) / 100),
      fat: Math.round((food.fat * quantity) / 100),
      fiber: Math.round((food.fiber * quantity) / 100)
    };

    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        const updatedItems = [...meal.items, newItem];
        const totals = updatedItems.reduce((acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
          fiber: acc.fiber + item.fiber
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

        return {
          ...meal,
          items: updatedItems,
          ...totals
        };
      }
      return meal;
    }));
  };

  const removeItemFromMeal = (mealId: string, itemId: string) => {
    setMeals(meals.map(meal => {
      if (meal.id === mealId) {
        const updatedItems = meal.items.filter(item => item.id !== itemId);
        const totals = updatedItems.reduce((acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
          fiber: acc.fiber + item.fiber
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });

        return {
          ...meal,
          items: updatedItems,
          ...totals
        };
      }
      return meal;
    }));
  };

  const calculateTotals = () => {
    return meals.reduce((acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.totalProtein,
      carbs: acc.carbs + meal.totalCarbs,
      fat: acc.fat + meal.totalFat,
      fiber: acc.fiber + meal.totalFiber
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 });
  };

  const totals = calculateTotals();

  const getMacroProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getMacroStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 95 && percentage <= 105) return 'perfect';
    if (percentage >= 90 && percentage <= 110) return 'good';
    if (percentage >= 80 && percentage <= 120) return 'warning';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'perfect': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Criador de Planos Alimentares</h1>
          <p className="text-muted-foreground">
            Crie planos nutricionais personalizados com cálculo automático de macros
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Duplicar
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Salvar Plano
          </Button>
        </div>
      </div>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UtensilsCrossed className="w-5 h-5 mr-2" />
            Informações do Plano
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="planName">Nome do Plano</Label>
              <Input
                id="planName"
                placeholder="Ex: Plano Perda de Peso - 2000kcal"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName">Cliente</Label>
              <Input
                id="clientName"
                placeholder="Nome do cliente"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro Targets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Metas de Macros
          </CardTitle>
          <CardDescription>
            Defina as metas nutricionais para este plano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label htmlFor="calories">Calorias</Label>
              <Input
                id="calories"
                type="number"
                value={macroTargets.calories}
                onChange={(e) => setMacroTargets({...macroTargets, calories: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Proteína (g)</Label>
              <Input
                id="protein"
                type="number"
                value={macroTargets.protein}
                onChange={(e) => setMacroTargets({...macroTargets, protein: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carboidratos (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={macroTargets.carbs}
                onChange={(e) => setMacroTargets({...macroTargets, carbs: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Gorduras (g)</Label>
              <Input
                id="fat"
                type="number"
                value={macroTargets.fat}
                onChange={(e) => setMacroTargets({...macroTargets, fat: Number(e.target.value)})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fibras (g)</Label>
              <Input
                id="fiber"
                type="number"
                value={macroTargets.fiber}
                onChange={(e) => setMacroTargets({...macroTargets, fiber: Number(e.target.value)})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Macro Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Progresso dos Macros
          </CardTitle>
          <CardDescription>
            Acompanhe o progresso em relação às metas definidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calorias</span>
                <span className="text-sm">{totals.calories}/{macroTargets.calories}</span>
              </div>
              <Progress value={getMacroProgress(totals.calories, macroTargets.calories)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getMacroProgress(totals.calories, macroTargets.calories))}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proteína</span>
                <span className="text-sm">{totals.protein}/{macroTargets.protein}g</span>
              </div>
              <Progress value={getMacroProgress(totals.protein, macroTargets.protein)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getMacroProgress(totals.protein, macroTargets.protein))}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Carboidratos</span>
                <span className="text-sm">{totals.carbs}/{macroTargets.carbs}g</span>
              </div>
              <Progress value={getMacroProgress(totals.carbs, macroTargets.carbs)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getMacroProgress(totals.carbs, macroTargets.carbs))}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gorduras</span>
                <span className="text-sm">{totals.fat}/{macroTargets.fat}g</span>
              </div>
              <Progress value={getMacroProgress(totals.fat, macroTargets.fat)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getMacroProgress(totals.fat, macroTargets.fat))}%
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fibras</span>
                <span className="text-sm">{totals.fiber}/{macroTargets.fiber}g</span>
              </div>
              <Progress value={getMacroProgress(totals.fiber, macroTargets.fiber)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getMacroProgress(totals.fiber, macroTargets.fiber))}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plan Builder */}
      <Tabs defaultValue="meals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meals">Refeições</TabsTrigger>
          <TabsTrigger value="foods">Base de Alimentos</TabsTrigger>
          <TabsTrigger value="summary">Resumo</TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-4">
          {meals.map((meal) => (
            <Card key={meal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {meal.name} - {meal.time}
                    </CardTitle>
                    <CardDescription>
                      {meal.items.length} alimentos • {meal.totalCalories} kcal
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      P: {meal.totalProtein}g
                    </Badge>
                    <Badge variant="outline">
                      C: {meal.totalCarbs}g
                    </Badge>
                    <Badge variant="outline">
                      G: {meal.totalFat}g
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {meal.items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Alimento</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Calorias</TableHead>
                        <TableHead>Macros</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {meal.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.food}</TableCell>
                          <TableCell>{item.quantity}g</TableCell>
                          <TableCell>{item.calories} kcal</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItemFromMeal(meal.id, item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum alimento adicionado nesta refeição
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="foods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Base de Alimentos</CardTitle>
              <CardDescription>
                Selecione alimentos para adicionar às refeições
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alimentos..."
                    className="pl-10"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {foodDatabase.map((food, index) => (
                    <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 rounded-lg bg-gray-100">
                            <food.icon className="w-4 h-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-sm">{food.name}</h3>
                            <p className="text-xs text-muted-foreground">{food.category}</p>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">
                          {food.calories} kcal • P: {food.protein}g • C: {food.carbs}g • G: {food.fat}g
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            placeholder="100"
                            className="h-8 text-xs"
                            defaultValue={100}
                          />
                          <span className="text-xs text-muted-foreground">g</span>
                          <Button
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                              const quantity = 100; // Get from input
                              addFoodToMeal('1', food, quantity); // Add to first meal for demo
                            }}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Plano</CardTitle>
              <CardDescription>
                Visão geral do plano alimentar criado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Informações Gerais</h3>
                    <div className="space-y-1 text-sm">
                      <div>Nome: {planName || 'Não definido'}</div>
                      <div>Cliente: {clientName || 'Não definido'}</div>
                      <div>Refeições: {meals.length}</div>
                      <div>Total de alimentos: {meals.reduce((acc, meal) => acc + meal.items.length, 0)}</div>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Totais Nutricionais</h3>
                    <div className="space-y-1 text-sm">
                      <div>Calorias: {totals.calories} kcal</div>
                      <div>Proteína: {totals.protein}g</div>
                      <div>Carboidratos: {totals.carbs}g</div>
                      <div>Gorduras: {totals.fat}g</div>
                      <div>Fibras: {totals.fiber}g</div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="font-semibold mb-2">Status das Metas</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Calorias</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={getMacroProgress(totals.calories, macroTargets.calories)} className="w-20 h-2" />
                        <span className={`text-sm ${getStatusColor(getMacroStatus(totals.calories, macroTargets.calories))}`}>
                          {Math.round(getMacroProgress(totals.calories, macroTargets.calories))}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Proteína</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={getMacroProgress(totals.protein, macroTargets.protein)} className="w-20 h-2" />
                        <span className={`text-sm ${getStatusColor(getMacroStatus(totals.protein, macroTargets.protein))}`}>
                          {Math.round(getMacroProgress(totals.protein, macroTargets.protein))}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Carboidratos</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={getMacroProgress(totals.carbs, macroTargets.carbs)} className="w-20 h-2" />
                        <span className={`text-sm ${getStatusColor(getMacroStatus(totals.carbs, macroTargets.carbs))}`}>
                          {Math.round(getMacroProgress(totals.carbs, macroTargets.carbs))}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gorduras</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={getMacroProgress(totals.fat, macroTargets.fat)} className="w-20 h-2" />
                        <span className={`text-sm ${getStatusColor(getMacroStatus(totals.fat, macroTargets.fat))}`}>
                          {Math.round(getMacroProgress(totals.fat, macroTargets.fat))}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
