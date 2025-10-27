'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Calculator, 
  Target, 
  Activity,
  Zap,
  Scale,
  Ruler,
  Calendar,
  TrendingUp,
  Users,
  Apple,
  Beef,
  Wheat,
  Milk,
  Droplets
} from 'lucide-react';

interface MacroCalculation {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  water: number;
}

interface ClientInfo {
  age: number;
  gender: 'male' | 'female';
  weight: number;
  height: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'weight_loss' | 'maintenance' | 'weight_gain' | 'muscle_gain';
  bodyFat?: number;
}

export function MacroCalculator() {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    age: 30,
    gender: 'female',
    weight: 70,
    height: 170,
    activityLevel: 'moderate',
    goal: 'weight_loss',
    bodyFat: undefined
  });

  const [calculatedMacros, setCalculatedMacros] = useState<MacroCalculation | null>(null);

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const goalAdjustments = {
    weight_loss: 0.8,
    maintenance: 1.0,
    weight_gain: 1.2,
    muscle_gain: 1.1
  };

  const calculateBMR = (info: ClientInfo): number => {
    // Mifflin-St Jeor Equation
    if (info.gender === 'male') {
      return 10 * info.weight + 6.25 * info.height - 5 * info.age + 5;
    } else {
      return 10 * info.weight + 6.25 * info.height - 5 * info.age - 161;
    }
  };

  const calculateTDEE = (info: ClientInfo): number => {
    const bmr = calculateBMR(info);
    const multiplier = activityMultipliers[info.activityLevel];
    return bmr * multiplier;
  };

  const calculateMacros = (info: ClientInfo): MacroCalculation => {
    const tdee = calculateTDEE(info);
    const goalMultiplier = goalAdjustments[info.goal];
    const targetCalories = Math.round(tdee * goalMultiplier);

    let protein, carbs, fat, fiber, water;

    switch (info.goal) {
      case 'weight_loss':
        protein = Math.round(info.weight * 2.2); // 2.2g per kg
        fat = Math.round(targetCalories * 0.25 / 9); // 25% of calories
        carbs = Math.round((targetCalories - (protein * 4) - (fat * 9)) / 4);
        fiber = Math.round(info.weight * 0.4); // 0.4g per kg
        water = Math.round(info.weight * 35); // 35ml per kg
        break;
      
      case 'muscle_gain':
        protein = Math.round(info.weight * 2.5); // 2.5g per kg
        fat = Math.round(targetCalories * 0.25 / 9); // 25% of calories
        carbs = Math.round((targetCalories - (protein * 4) - (fat * 9)) / 4);
        fiber = Math.round(info.weight * 0.4);
        water = Math.round(info.weight * 40); // 40ml per kg
        break;
      
      case 'weight_gain':
        protein = Math.round(info.weight * 1.8); // 1.8g per kg
        fat = Math.round(targetCalories * 0.30 / 9); // 30% of calories
        carbs = Math.round((targetCalories - (protein * 4) - (fat * 9)) / 4);
        fiber = Math.round(info.weight * 0.4);
        water = Math.round(info.weight * 35);
        break;
      
      default: // maintenance
        protein = Math.round(info.weight * 2.0); // 2.0g per kg
        fat = Math.round(targetCalories * 0.25 / 9); // 25% of calories
        carbs = Math.round((targetCalories - (protein * 4) - (fat * 9)) / 4);
        fiber = Math.round(info.weight * 0.4);
        water = Math.round(info.weight * 35);
    }

    return {
      calories: targetCalories,
      protein: Math.max(protein, 50), // Minimum 50g
      carbs: Math.max(carbs, 50), // Minimum 50g
      fat: Math.max(fat, 20), // Minimum 20g
      fiber: Math.max(fiber, 25), // Minimum 25g
      water: water
    };
  };

  const handleCalculate = () => {
    const macros = calculateMacros(clientInfo);
    setCalculatedMacros(macros);
  };

  const getBMICategory = (weight: number, height: number): string => {
    const bmi = weight / Math.pow(height / 100, 2);
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const getBMIColor = (weight: number, height: number): string => {
    const bmi = weight / Math.pow(height / 100, 2);
    if (bmi < 18.5) return 'text-blue-600';
    if (bmi < 25) return 'text-green-600';
    if (bmi < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Informações do Cliente
          </CardTitle>
          <CardDescription>
            Insira os dados do cliente para calcular as necessidades nutricionais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="age">Idade</Label>
              <Input
                id="age"
                type="number"
                value={clientInfo.age}
                onChange={(e) => setClientInfo({...clientInfo, age: Number(e.target.value)})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Sexo</Label>
              <Select
                value={clientInfo.gender}
                onValueChange={(value: 'male' | 'female') => setClientInfo({...clientInfo, gender: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                value={clientInfo.weight}
                onChange={(e) => setClientInfo({...clientInfo, weight: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                value={clientInfo.height}
                onChange={(e) => setClientInfo({...clientInfo, height: Number(e.target.value)})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Nível de Atividade</Label>
              <Select
                value={clientInfo.activityLevel}
                onValueChange={(value: any) => setClientInfo({...clientInfo, activityLevel: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentário</SelectItem>
                  <SelectItem value="light">Leve</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="very_active">Muito Ativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo</Label>
              <Select
                value={clientInfo.goal}
                onValueChange={(value: any) => setClientInfo({...clientInfo, goal: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_loss">Perda de Peso</SelectItem>
                  <SelectItem value="maintenance">Manutenção</SelectItem>
                  <SelectItem value="weight_gain">Ganho de Peso</SelectItem>
                  <SelectItem value="muscle_gain">Ganho de Massa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-muted-foreground">IMC: </span>
                <span className={`font-medium ${getBMIColor(clientInfo.weight, clientInfo.height)}`}>
                  {(clientInfo.weight / Math.pow(clientInfo.height / 100, 2)).toFixed(1)}
                </span>
                <span className={`ml-2 ${getBMIColor(clientInfo.weight, clientInfo.height)}`}>
                  ({getBMICategory(clientInfo.weight, clientInfo.height)})
                </span>
              </div>
            </div>
            <Button onClick={handleCalculate} className="flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Calcular Macros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calculated Results */}
      {calculatedMacros && (
        <div className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Necessidades Nutricionais
              </CardTitle>
              <CardDescription>
                Baseado nas informações do cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{calculatedMacros.calories}</div>
                  <div className="text-sm text-muted-foreground">Calorias/dia</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{calculatedMacros.protein}g</div>
                  <div className="text-sm text-muted-foreground">Proteína</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{calculatedMacros.carbs}g</div>
                  <div className="text-sm text-muted-foreground">Carboidratos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{calculatedMacros.fat}g</div>
                  <div className="text-sm text-muted-foreground">Gorduras</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Distribuição Detalhada
              </CardTitle>
              <CardDescription>
                Percentual de cada macronutriente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Beef className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">Proteína</span>
                    </div>
                    <span className="text-sm">{calculatedMacros.protein}g ({(calculatedMacros.protein * 4 / calculatedMacros.calories * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(calculatedMacros.protein * 4 / calculatedMacros.calories * 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wheat className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-medium">Carboidratos</span>
                    </div>
                    <span className="text-sm">{calculatedMacros.carbs}g ({(calculatedMacros.carbs * 4 / calculatedMacros.calories * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(calculatedMacros.carbs * 4 / calculatedMacros.calories * 100)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Droplets className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium">Gorduras</span>
                    </div>
                    <span className="text-sm">{calculatedMacros.fat}g ({(calculatedMacros.fat * 9 / calculatedMacros.calories * 100).toFixed(1)}%)</span>
                  </div>
                  <Progress value={(calculatedMacros.fat * 9 / calculatedMacros.calories * 100)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                Recomendações Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Apple className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Fibras</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {calculatedMacros.fiber}g por dia para saúde digestiva
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Milk className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Água</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {calculatedMacros.water}ml por dia para hidratação
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}


