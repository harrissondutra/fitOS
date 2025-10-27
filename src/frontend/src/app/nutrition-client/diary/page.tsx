'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Apple,
  Beef,
  Wheat,
  Milk,
  Droplets,
  Target,
  Calculator,
  Camera,
  Barcode
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function FoodDiaryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const meals = [
    {
      id: 1,
      name: "Café da Manhã",
      time: "07:30",
      items: [
        { id: 1, name: "Aveia", quantity: 50, unit: "g", calories: 190, protein: 7, carbs: 34, fat: 3 },
        { id: 2, name: "Banana", quantity: 1, unit: "unidade", calories: 89, protein: 1, carbs: 23, fat: 0 },
        { id: 3, name: "Leite desnatado", quantity: 200, unit: "ml", calories: 68, protein: 7, carbs: 10, fat: 0 }
      ],
      totalCalories: 347,
      totalProtein: 15,
      totalCarbs: 67,
      totalFat: 3
    },
    {
      id: 2,
      name: "Lanche da Manhã",
      time: "10:00",
      items: [
        { id: 4, name: "Maçã", quantity: 1, unit: "unidade", calories: 52, protein: 0, carbs: 14, fat: 0 },
        { id: 5, name: "Amêndoas", quantity: 15, unit: "g", calories: 87, protein: 3, carbs: 3, fat: 8 }
      ],
      totalCalories: 139,
      totalProtein: 3,
      totalCarbs: 17,
      totalFat: 8
    },
    {
      id: 3,
      name: "Almoço",
      time: "12:30",
      items: [
        { id: 6, name: "Frango grelhado", quantity: 150, unit: "g", calories: 248, protein: 46, carbs: 0, fat: 5 },
        { id: 7, name: "Arroz integral", quantity: 100, unit: "g", calories: 111, protein: 3, carbs: 23, fat: 1 },
        { id: 8, name: "Salada verde", quantity: 100, unit: "g", calories: 20, protein: 2, carbs: 4, fat: 0 }
      ],
      totalCalories: 379,
      totalProtein: 51,
      totalCarbs: 27,
      totalFat: 6
    },
    {
      id: 4,
      name: "Lanche da Tarde",
      time: "15:00",
      items: [
        { id: 9, name: "Iogurte grego", quantity: 150, unit: "g", calories: 130, protein: 15, carbs: 9, fat: 5 }
      ],
      totalCalories: 130,
      totalProtein: 15,
      totalCarbs: 9,
      totalFat: 5
    },
    {
      id: 5,
      name: "Jantar",
      time: "19:00",
      items: [],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    }
  ];

  const dailyTotals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.totalCalories,
    protein: acc.protein + meal.totalProtein,
    carbs: acc.carbs + meal.totalCarbs,
    fat: acc.fat + meal.totalFat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  const dailyTargets = {
    calories: 2000,
    protein: 120,
    carbs: 200,
    fat: 70
  };

  const quickAddFoods = [
    { name: "Frango", calories: 165, protein: 31, carbs: 0, fat: 3.6, icon: Beef },
    { name: "Arroz", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, icon: Wheat },
    { name: "Maçã", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, icon: Apple },
    { name: "Leite", calories: 34, protein: 3.4, carbs: 5, fat: 0.2, icon: Milk },
    { name: "Azeite", calories: 884, protein: 0, carbs: 0, fat: 100, icon: Droplets }
  ];

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-blue-600';
    return 'text-yellow-600';
  };

  const getProgressValue = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diário Alimentar</h1>
          <p className="text-muted-foreground">
            Registre suas refeições e acompanhe sua nutrição diária
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-40"
          />
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Alimento
          </Button>
        </div>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Resumo do Dia
          </CardTitle>
          <CardDescription>
            {new Date(selectedDate).toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Calorias</span>
                <span className={`text-sm font-bold ${getProgressColor(dailyTotals.calories, dailyTargets.calories)}`}>
                  {dailyTotals.calories}/{dailyTargets.calories}
                </span>
              </div>
              <Progress value={getProgressValue(dailyTotals.calories, dailyTargets.calories)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getProgressValue(dailyTotals.calories, dailyTargets.calories))}% da meta
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Proteína</span>
                <span className={`text-sm font-bold ${getProgressColor(dailyTotals.protein, dailyTargets.protein)}`}>
                  {dailyTotals.protein}/{dailyTargets.protein}g
                </span>
              </div>
              <Progress value={getProgressValue(dailyTotals.protein, dailyTargets.protein)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getProgressValue(dailyTotals.protein, dailyTargets.protein))}% da meta
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Carboidratos</span>
                <span className={`text-sm font-bold ${getProgressColor(dailyTotals.carbs, dailyTargets.carbs)}`}>
                  {dailyTotals.carbs}/{dailyTargets.carbs}g
                </span>
              </div>
              <Progress value={getProgressValue(dailyTotals.carbs, dailyTargets.carbs)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getProgressValue(dailyTotals.carbs, dailyTargets.carbs))}% da meta
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Gorduras</span>
                <span className={`text-sm font-bold ${getProgressColor(dailyTotals.fat, dailyTargets.fat)}`}>
                  {dailyTotals.fat}/{dailyTargets.fat}g
                </span>
              </div>
              <Progress value={getProgressValue(dailyTotals.fat, dailyTargets.fat)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {Math.round(getProgressValue(dailyTotals.fat, dailyTargets.fat))}% da meta
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Foods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Rapidamente
          </CardTitle>
          <CardDescription>
            Alimentos mais consumidos para adição rápida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-5">
            {quickAddFoods.map((food, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-20 flex-col space-y-1"
                onClick={() => {
                  // Add food logic here
                  console.log('Adding food:', food.name);
                }}
              >
                <food.icon className="w-5 h-5" />
                <span className="text-xs">{food.name}</span>
                <span className="text-xs text-muted-foreground">{food.calories} kcal</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Meals */}
      <Tabs defaultValue="meals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meals">Refeições</TabsTrigger>
          <TabsTrigger value="foods">Alimentos</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="meals" className="space-y-4">
          {meals.map((meal) => (
            <Card key={meal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
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
                    <Button variant="ghost" size="sm">
                      <Plus className="w-4 h-4" />
                    </Button>
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
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.quantity} {item.unit}</TableCell>
                          <TableCell>{item.calories} kcal</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remover
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <UtensilsCrossed className="mx-auto h-12 w-12 mb-4" />
                    <p>Nenhum alimento registrado nesta refeição</p>
                    <Button className="mt-4" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Alimento
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="foods" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alimentos Consumidos Hoje</CardTitle>
              <CardDescription>
                Lista completa de todos os alimentos registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {meals.map((meal) => (
                  meal.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Apple className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {meal.name} • {item.quantity} {item.unit}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{item.calories} kcal</div>
                        <div className="text-sm text-muted-foreground">
                          P: {item.protein}g • C: {item.carbs}g • G: {item.fat}g
                        </div>
                      </div>
                    </div>
                  ))
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Análise Nutricional
              </CardTitle>
              <CardDescription>
                Insights sobre sua alimentação de hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Pontos Positivos</h4>
                    <ul className="space-y-1 text-sm text-green-600">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Boa distribuição de proteínas
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Consumo adequado de fibras
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hidratação adequada
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Atenção</h4>
                    <ul className="space-y-1 text-sm text-yellow-600">
                      <li className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Pouco consumo de gorduras boas
                      </li>
                      <li className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Falta adicionar vegetais no jantar
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Recomendações</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Adicione uma fonte de gordura boa no jantar (azeite, abacate)</p>
                    <p>• Inclua mais vegetais coloridos nas refeições</p>
                    <p>• Mantenha o consumo de água ao longo do dia</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Camera className="w-5 h-5 mr-2 text-blue-600" />
              Foto da Refeição
            </CardTitle>
            <CardDescription>
              Tire uma foto para análise automática
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Tirar Foto</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Barcode className="w-5 h-5 mr-2 text-green-600" />
              Escanear Código
            </CardTitle>
            <CardDescription>
              Escaneie código de barras do produto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Escanear</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="w-5 h-5 mr-2 text-purple-600" />
              Buscar Alimento
            </CardTitle>
            <CardDescription>
              Procure na base de dados de alimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Buscar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


