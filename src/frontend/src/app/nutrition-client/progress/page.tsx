'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Scale,
  Activity,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Award,
  Zap,
  Heart,
  Users,
  MessageSquare,
  Camera,
  BarChart3,
  PieChart,
  LineChart,
  Trophy
} from 'lucide-react';

export default function ProgressPage() {
  const currentStats = {
    weight: 68.5,
    startWeight: 72.0,
    targetWeight: 65.0,
    bodyFat: 22,
    startBodyFat: 26,
    targetBodyFat: 18,
    muscle: 28,
    startMuscle: 25,
    targetMuscle: 30,
    bmi: 23.1,
    startBmi: 24.3,
    targetBmi: 21.9
  };

  const weeklyProgress = [
    { week: 1, weight: 72.0, bodyFat: 26, muscle: 25, adherence: 75 },
    { week: 2, weight: 71.2, bodyFat: 25.5, muscle: 25.5, adherence: 82 },
    { week: 3, weight: 70.5, bodyFat: 24.8, muscle: 26.2, adherence: 88 },
    { week: 4, weight: 69.8, bodyFat: 24.0, muscle: 26.8, adherence: 85 },
    { week: 5, weight: 69.2, bodyFat: 23.2, muscle: 27.2, adherence: 90 },
    { week: 6, weight: 68.5, bodyFat: 22.0, muscle: 28.0, adherence: 85 }
  ];

  const achievements = [
    {
      id: 1,
      title: "Primeira Semana",
      description: "Completou 7 dias seguidos do plano",
      icon: Calendar,
      color: "text-blue-600",
      earned: true,
      date: "22/01/2024"
    },
    {
      id: 2,
      title: "Meta de Peso",
      description: "Perdeu 3kg em 4 semanas",
      icon: Scale,
      color: "text-green-600",
      earned: true,
      date: "12/02/2024"
    },
    {
      id: 3,
      title: "Adesão Excelente",
      description: "90% de adesão por 2 semanas",
      icon: Award,
      color: "text-purple-600",
      earned: true,
      date: "05/02/2024"
    },
    {
      id: 4,
      title: "Meta de Gordura",
      description: "Reduziu 4% de gordura corporal",
      icon: Target,
      color: "text-orange-600",
      earned: false,
      date: null
    },
    {
      id: 5,
      title: "Meta Final",
      description: "Atingiu o peso objetivo",
      icon: Trophy,
      color: "text-yellow-600",
      earned: false,
      date: null
    }
  ];

  const nutritionProgress = {
    calories: { current: 1950, target: 2000, trend: "stable" },
    protein: { current: 115, target: 120, trend: "up" },
    carbs: { current: 190, target: 200, trend: "stable" },
    fat: { current: 65, target: 70, trend: "down" },
    fiber: { current: 22, target: 25, trend: "up" },
    water: { current: 2300, target: 2500, trend: "up" }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'stable':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getWeightProgress = () => {
    const totalLoss = currentStats.startWeight - currentStats.targetWeight;
    const currentLoss = currentStats.startWeight - currentStats.weight;
    return (currentLoss / totalLoss) * 100;
  };

  const getBodyFatProgress = () => {
    const totalReduction = currentStats.startBodyFat - currentStats.targetBodyFat;
    const currentReduction = currentStats.startBodyFat - currentStats.bodyFat;
    return (currentReduction / totalReduction) * 100;
  };

  const getMuscleProgress = () => {
    const totalGain = currentStats.targetMuscle - currentStats.startMuscle;
    const currentGain = currentStats.muscle - currentStats.startMuscle;
    return (currentGain / totalGain) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Progresso</h1>
          <p className="text-muted-foreground">
            Acompanhe sua evolução e conquiste suas metas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Camera className="w-4 h-4 mr-2" />
            Foto de Progresso
          </Button>
          <Button>
            <MessageSquare className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      {/* Current Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Peso Atual</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.weight}kg</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-{currentStats.startWeight - currentStats.weight}kg</span> desde o início
            </p>
            <Progress value={getWeightProgress()} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gordura Corporal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.bodyFat}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-{currentStats.startBodyFat - currentStats.bodyFat}%</span> desde o início
            </p>
            <Progress value={getBodyFatProgress()} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Massa Muscular</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.muscle}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{currentStats.muscle - currentStats.startMuscle}%</span> desde o início
            </p>
            <Progress value={getMuscleProgress()} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IMC</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStats.bmi}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-{currentStats.startBmi - currentStats.bmi}</span> desde o início
            </p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Peso Normal
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Progresso Semanal
                </CardTitle>
                <CardDescription>
                  Evolução nas últimas 6 semanas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {weeklyProgress.slice(-4).map((week, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Semana {week.week}</div>
                        <div className="text-sm text-muted-foreground">
                          {week.weight}kg • {week.bodyFat}% gordura • {week.muscle}% músculo
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{week.adherence}%</div>
                        <div className="text-xs text-muted-foreground">adesão</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goals Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Status das Metas
                </CardTitle>
                <CardDescription>
                  Progresso em relação aos objetivos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peso</span>
                    <span className="text-sm font-medium">
                      {currentStats.weight}kg / {currentStats.targetWeight}kg
                    </span>
                  </div>
                  <Progress value={getWeightProgress()} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(getWeightProgress())}% da meta
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Gordura Corporal</span>
                    <span className="text-sm font-medium">
                      {currentStats.bodyFat}% / {currentStats.targetBodyFat}%
                    </span>
                  </div>
                  <Progress value={getBodyFatProgress()} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(getBodyFatProgress())}% da meta
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Massa Muscular</span>
                    <span className="text-sm font-medium">
                      {currentStats.muscle}% / {currentStats.targetMuscle}%
                    </span>
                  </div>
                  <Progress value={getMuscleProgress()} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {Math.round(getMuscleProgress())}% da meta
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Progresso Nutricional
              </CardTitle>
              <CardDescription>
                Acompanhe sua evolução nutricional
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Calorias</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(nutritionProgress.calories.trend)}
                      <span className="text-sm">{nutritionProgress.calories.current}/{nutritionProgress.calories.target}</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(nutritionProgress.calories.current, nutritionProgress.calories.target)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Proteína</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(nutritionProgress.protein.trend)}
                      <span className="text-sm">{nutritionProgress.protein.current}/{nutritionProgress.protein.target}g</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(nutritionProgress.protein.current, nutritionProgress.protein.target)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Carboidratos</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(nutritionProgress.carbs.trend)}
                      <span className="text-sm">{nutritionProgress.carbs.current}/{nutritionProgress.carbs.target}g</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(nutritionProgress.carbs.current, nutritionProgress.carbs.target)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gorduras</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(nutritionProgress.fat.trend)}
                      <span className="text-sm">{nutritionProgress.fat.current}/{nutritionProgress.fat.target}g</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(nutritionProgress.fat.current, nutritionProgress.fat.target)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fibras</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(nutritionProgress.fiber.trend)}
                      <span className="text-sm">{nutritionProgress.fiber.current}/{nutritionProgress.fiber.target}g</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(nutritionProgress.fiber.current, nutritionProgress.fiber.target)} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Água</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon(nutritionProgress.water.trend)}
                      <span className="text-sm">{nutritionProgress.water.current}/{nutritionProgress.water.target}ml</span>
                    </div>
                  </div>
                  <Progress value={getProgressPercentage(nutritionProgress.water.current, nutritionProgress.water.target)} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Conquistas
              </CardTitle>
              <CardDescription>
                Badges conquistados durante sua jornada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className={`flex items-center space-x-3 p-4 border rounded-lg ${
                    achievement.earned ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className={`flex-shrink-0 p-2 rounded-lg ${
                      achievement.earned ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <achievement.icon className={`w-5 h-5 ${
                        achievement.earned ? achievement.color : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        achievement.earned ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {achievement.title}
                      </div>
                      <div className={`text-sm ${
                        achievement.earned ? 'text-green-700' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </div>
                      {achievement.earned && achievement.date && (
                        <div className="text-xs text-green-600 mt-1">
                          Conquistado em {achievement.date}
                        </div>
                      )}
                    </div>
                    {achievement.earned ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="w-5 h-5 mr-2" />
                Gráficos de Evolução
              </CardTitle>
              <CardDescription>
                Visualize sua evolução ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <LineChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Gráficos Interativos</h3>
                <p className="text-muted-foreground mb-4">
                  Visualize sua evolução de peso, gordura corporal e massa muscular
                </p>
                <Button>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Ver Gráficos Detalhados
                </Button>
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
              Foto de Progresso
            </CardTitle>
            <CardDescription>
              Registre sua evolução visual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Tirar Foto</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-green-600" />
              Relatório Semanal
            </CardTitle>
            <CardDescription>
              Envie relatório para sua nutricionista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Enviar</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2 text-purple-600" />
              Compartilhar
            </CardTitle>
            <CardDescription>
              Compartilhe sua conquista
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Compartilhar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


