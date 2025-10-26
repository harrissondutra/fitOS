'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  UtensilsCrossed, 
  Clock, 
  Target,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Calendar,
  Apple,
  Beef,
  Wheat,
  Milk,
  Droplets,
  TrendingUp,
  Users,
  Star,
  Heart,
  Zap
} from 'lucide-react';

export default function MealPlanPage() {
  const mealPlan = {
    name: "Plano Perda de Peso - 2000kcal",
    nutritionist: "Dra. Maria Silva",
    startDate: "15/01/2024",
    duration: "12 semanas",
    status: "active",
    adherence: 85,
    rating: 4.8,
    targets: {
      calories: 2000,
      protein: 120,
      carbs: 200,
      fat: 70,
      fiber: 25
    }
  };

  const meals = [
    {
      id: 1,
      name: "Café da Manhã",
      time: "07:00",
      calories: 400,
      protein: 20,
      carbs: 50,
      fat: 12,
      foods: [
        { name: "Aveia", quantity: "50g", calories: 190 },
        { name: "Banana", quantity: "1 unidade", calories: 89 },
        { name: "Leite desnatado", quantity: "200ml", calories: 68 },
        { name: "Amêndoas", quantity: "10g", calories: 53 }
      ],
      tips: "Consuma até 1h após acordar para acelerar o metabolismo"
    },
    {
      id: 2,
      name: "Lanche da Manhã",
      time: "10:00",
      calories: 150,
      protein: 8,
      carbs: 20,
      fat: 5,
      foods: [
        { name: "Maçã", quantity: "1 unidade", calories: 52 },
        { name: "Iogurte grego", quantity: "100g", calories: 87 },
        { name: "Mel", quantity: "1 colher", calories: 11 }
      ],
      tips: "Mantenha o lanche leve para não comprometer o almoço"
    },
    {
      id: 3,
      name: "Almoço",
      time: "12:30",
      calories: 600,
      protein: 35,
      carbs: 60,
      fat: 20,
      foods: [
        { name: "Frango grelhado", quantity: "150g", calories: 248 },
        { name: "Arroz integral", quantity: "100g", calories: 111 },
        { name: "Salada verde", quantity: "100g", calories: 20 },
        { name: "Azeite", quantity: "1 colher", calories: 119 },
        { name: "Tomate", quantity: "50g", calories: 9 },
        { name: "Cenoura", quantity: "50g", calories: 21 }
      ],
      tips: "Refeição principal - mastigue bem e coma devagar"
    },
    {
      id: 4,
      name: "Lanche da Tarde",
      time: "15:00",
      calories: 200,
      protein: 12,
      carbs: 25,
      fat: 8,
      foods: [
        { name: "Tapioca", quantity: "1 unidade", calories: 100 },
        { name: "Queijo branco", quantity: "50g", calories: 80 },
        { name: "Tomate", quantity: "30g", calories: 5 },
        { name: "Orégano", quantity: "a gosto", calories: 2 }
      ],
      tips: "Ótimo para manter a energia até o jantar"
    },
    {
      id: 5,
      name: "Jantar",
      time: "19:00",
      calories: 500,
      protein: 30,
      carbs: 40,
      fat: 18,
      foods: [
        { name: "Salmão", quantity: "120g", calories: 250 },
        { name: "Batata doce", quantity: "100g", calories: 86 },
        { name: "Brócolis", quantity: "100g", calories: 34 },
        { name: "Azeite", quantity: "1 colher", calories: 119 },
        { name: "Limão", quantity: "a gosto", calories: 1 }
      ],
      tips: "Jantar leve para facilitar a digestão noturna"
    },
    {
      id: 6,
      name: "Ceia",
      time: "21:00",
      calories: 150,
      protein: 8,
      carbs: 15,
      fat: 5,
      foods: [
        { name: "Chá de camomila", quantity: "200ml", calories: 2 },
        { name: "Castanha do Pará", quantity: "2 unidades", calories: 66 },
        { name: "Mel", quantity: "1 colher", calories: 11 }
      ],
      tips: "Ceia opcional - apenas se sentir fome"
    }
  ];

  const weeklyVariations = [
    {
      day: "Segunda-feira",
      variation: "Proteína extra",
      description: "Adicione 1 ovo cozido no café da manhã"
    },
    {
      day: "Terça-feira",
      variation: "Carboidrato extra",
      description: "Substitua a tapioca por pão integral"
    },
    {
      day: "Quarta-feira",
      variation: "Vegetais extras",
      description: "Adicione mais vegetais no almoço"
    },
    {
      day: "Quinta-feira",
      variation: "Gordura boa",
      description: "Adicione abacate no lanche da tarde"
    },
    {
      day: "Sexta-feira",
      variation: "Flexibilidade",
      description: "Pode trocar o salmão por outro peixe"
    }
  ];

  const adherenceTips = [
    {
      title: "Planejamento",
      description: "Prepare as refeições no domingo para a semana",
      icon: Calendar,
      color: "text-blue-600"
    },
    {
      title: "Hidratação",
      description: "Beba água antes das refeições",
      icon: Droplets,
      color: "text-blue-600"
    },
    {
      title: "Mastigação",
      description: "Mastigue bem cada alimento",
      icon: Heart,
      color: "text-red-600"
    },
    {
      title: "Regularidade",
      description: "Mantenha os horários das refeições",
      icon: Clock,
      color: "text-green-600"
    }
  ];

  const totalCalories = meals.reduce((acc, meal) => acc + meal.calories, 0);
  const totalProtein = meals.reduce((acc, meal) => acc + meal.protein, 0);
  const totalCarbs = meals.reduce((acc, meal) => acc + meal.carbs, 0);
  const totalFat = meals.reduce((acc, meal) => acc + meal.fat, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Plano Alimentar</h1>
          <p className="text-muted-foreground">
            Plano personalizado criado pela {mealPlan.nutritionist}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Star className="w-3 h-3 mr-1" />
            {mealPlan.rating} avaliação
          </Badge>
          <Badge variant="outline" className="text-sm">
            <TrendingUp className="w-3 h-3 mr-1" />
            {mealPlan.adherence}% adesão
          </Badge>
          <Button variant="outline">
            <MessageSquare className="w-4 h-4 mr-2" />
            Falar com Nutricionista
          </Button>
        </div>
      </div>

      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Visão Geral do Plano
          </CardTitle>
          <CardDescription>
            Informações sobre seu plano nutricional personalizado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{mealPlan.targets.calories}</div>
              <div className="text-sm text-muted-foreground">Calorias/dia</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">{mealPlan.targets.protein}g</div>
              <div className="text-sm text-muted-foreground">Proteína</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{mealPlan.targets.carbs}g</div>
              <div className="text-sm text-muted-foreground">Carboidratos</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{mealPlan.targets.fat}g</div>
              <div className="text-sm text-muted-foreground">Gorduras</div>
            </div>
          </div>
          
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Nutricionista</div>
              <div className="font-medium">{mealPlan.nutritionist}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Início</div>
              <div className="font-medium">{mealPlan.startDate}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Duração</div>
              <div className="font-medium">{mealPlan.duration}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="meals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="meals">Refeições</TabsTrigger>
          <TabsTrigger value="variations">Variações</TabsTrigger>
          <TabsTrigger value="tips">Dicas</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
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
                      {meal.foods.length} alimentos • {meal.calories} kcal
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      P: {meal.protein}g
                    </Badge>
                    <Badge variant="outline">
                      C: {meal.carbs}g
                    </Badge>
                    <Badge variant="outline">
                      G: {meal.fat}g
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Alimentos:</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {meal.foods.map((food, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Apple className="w-4 h-4 text-gray-600" />
                            <span className="text-sm">{food.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {food.quantity} • {food.calories} kcal
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {meal.tips && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Zap className="w-4 h-4 text-blue-600 mt-0.5" />
                        <div>
                          <div className="text-sm font-medium text-blue-800">Dica:</div>
                          <div className="text-sm text-blue-700">{meal.tips}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="variations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variações Semanais</CardTitle>
              <CardDescription>
                Pequenas mudanças para manter a variedade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weeklyVariations.map((variation, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{variation.day}</div>
                      <div className="text-sm text-muted-foreground">
                        {variation.variation}: {variation.description}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dicas para Melhor Adesão</CardTitle>
              <CardDescription>
                Estratégias para seguir o plano com sucesso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {adherenceTips.map((tip, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      <tip.icon className={`w-5 h-5 ${tip.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progresso da Adesão</CardTitle>
              <CardDescription>
                Como você está seguindo o plano
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {mealPlan.adherence}%
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">
                    Taxa de adesão ao plano
                  </div>
                  <Progress value={mealPlan.adherence} className="h-3" />
                </div>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">85%</div>
                    <div className="text-sm text-muted-foreground">Refeições Seguidas</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-muted-foreground">Horários Respeitados</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">78%</div>
                    <div className="text-sm text-muted-foreground">Quantidades Corretas</div>
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
              <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
              Falar com Nutricionista
            </CardTitle>
            <CardDescription>
              Tire dúvidas sobre o plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Enviar Mensagem</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-green-600" />
              Agendar Consulta
            </CardTitle>
            <CardDescription>
              Marque uma consulta de acompanhamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Agendar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-purple-600" />
              Avaliar Plano
            </CardTitle>
            <CardDescription>
              Deixe sua avaliação sobre o plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Avaliar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
