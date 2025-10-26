'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  Edit, 
  Save, 
  Camera, 
  Target,
  Calendar,
  Scale,
  Ruler,
  Activity,
  Heart,
  Zap,
  Shield,
  Bell,
  Settings,
  Download,
  Upload,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';

export default function ProfilePage() {
  const profile = {
    name: "Maria Silva",
    email: "maria@email.com",
    phone: "(11) 99999-9999",
    birthDate: "15/03/1990",
    gender: "Feminino",
    avatar: "/avatars/client.jpg",
    nutritionist: "Dra. Maria Silva",
    startDate: "15/01/2024",
    plan: "Plano Perda de Peso - 2000kcal",
    status: "active"
  };

  const measurements = {
    height: 170,
    currentWeight: 68.5,
    startWeight: 72.0,
    targetWeight: 65.0,
    bodyFat: 22,
    muscle: 28,
    waist: 75,
    hip: 95,
    chest: 90
  };

  const goals = {
    primary: "Perda de peso",
    secondary: "Melhora da composição corporal",
    targetWeight: 65.0,
    targetBodyFat: 18,
    targetMuscle: 30,
    timeline: "12 semanas"
  };

  const preferences = {
    notifications: {
      mealReminders: true,
      waterReminders: true,
      consultationReminders: true,
      progressUpdates: true,
      nutritionistMessages: true
    },
    privacy: {
      shareProgress: false,
      sharePhotos: false,
      allowMessages: true,
      showOnlineStatus: true
    },
    app: {
      theme: "light",
      language: "pt-BR",
      units: "metric",
      timezone: "America/Sao_Paulo"
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais e preferências
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Dados
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Informações Pessoais
          </CardTitle>
          <CardDescription>
            Suas informações básicas e foto de perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatar} />
                <AvatarFallback className="text-lg">
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={profile.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={profile.email} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={profile.phone} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate">Data de Nascimento</Label>
                  <Input id="birthDate" value={profile.birthDate} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="measurements" className="space-y-4">
        <TabsList>
          <TabsTrigger value="measurements">Medidas</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scale className="w-5 h-5 mr-2" />
                Medidas Corporais
              </CardTitle>
              <CardDescription>
                Suas medidas atuais e evolução
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input id="height" type="number" value={measurements.height} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                  <Input id="currentWeight" type="number" step="0.1" value={measurements.currentWeight} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Peso Meta (kg)</Label>
                  <Input id="targetWeight" type="number" step="0.1" value={measurements.targetWeight} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
                  <Input id="bodyFat" type="number" step="0.1" value={measurements.bodyFat} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="muscle">Massa Muscular (%)</Label>
                  <Input id="muscle" type="number" step="0.1" value={measurements.muscle} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="waist">Cintura (cm)</Label>
                  <Input id="waist" type="number" value={measurements.waist} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hip">Quadril (cm)</Label>
                  <Input id="hip" type="number" value={measurements.hip} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chest">Peito (cm)</Label>
                  <Input id="chest" type="number" value={measurements.chest} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Histórico de Medidas
              </CardTitle>
              <CardDescription>
                Evolução das suas medidas ao longo do tempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      -{measurements.startWeight - measurements.currentWeight}kg
                    </div>
                    <div className="text-sm text-muted-foreground">Perda de peso</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {measurements.muscle - 25}%
                    </div>
                    <div className="text-sm text-muted-foreground">Ganho de massa</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      -{26 - measurements.bodyFat}%
                    </div>
                    <div className="text-sm text-muted-foreground">Redução de gordura</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Metas e Objetivos
              </CardTitle>
              <CardDescription>
                Defina e acompanhe suas metas nutricionais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryGoal">Meta Principal</Label>
                    <Input id="primaryGoal" value={goals.primary} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryGoal">Meta Secundária</Label>
                    <Input id="secondaryGoal" value={goals.secondary} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetWeightGoal">Peso Meta</Label>
                    <Input id="targetWeightGoal" type="number" step="0.1" value={goals.targetWeight} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeline">Prazo</Label>
                    <Input id="timeline" value={goals.timeline} />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-2">Metas Específicas</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetBodyFatGoal">Gordura Corporal Meta (%)</Label>
                      <Input id="targetBodyFatGoal" type="number" step="0.1" value={goals.targetBodyFat} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetMuscleGoal">Massa Muscular Meta (%)</Label>
                      <Input id="targetMuscleGoal" type="number" step="0.1" value={goals.targetMuscle} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Preferências do App
              </CardTitle>
              <CardDescription>
                Configure como você quer usar o aplicativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Notificações</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Lembretes de Refeição</div>
                        <div className="text-sm text-muted-foreground">Notificar sobre horários das refeições</div>
                      </div>
                      <Button variant={preferences.notifications.mealReminders ? "default" : "outline"} size="sm">
                        {preferences.notifications.mealReminders ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Lembretes de Água</div>
                        <div className="text-sm text-muted-foreground">Notificar para beber água</div>
                      </div>
                      <Button variant={preferences.notifications.waterReminders ? "default" : "outline"} size="sm">
                        {preferences.notifications.waterReminders ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Lembretes de Consulta</div>
                        <div className="text-sm text-muted-foreground">Notificar sobre consultas agendadas</div>
                      </div>
                      <Button variant={preferences.notifications.consultationReminders ? "default" : "outline"} size="sm">
                        {preferences.notifications.consultationReminders ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Atualizações de Progresso</div>
                        <div className="text-sm text-muted-foreground">Notificar sobre conquistas e metas</div>
                      </div>
                      <Button variant={preferences.notifications.progressUpdates ? "default" : "outline"} size="sm">
                        {preferences.notifications.progressUpdates ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Privacidade</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Compartilhar Progresso</div>
                        <div className="text-sm text-muted-foreground">Permitir que outros vejam seu progresso</div>
                      </div>
                      <Button variant={preferences.privacy.shareProgress ? "default" : "outline"} size="sm">
                        {preferences.privacy.shareProgress ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Compartilhar Fotos</div>
                        <div className="text-sm text-muted-foreground">Permitir que outros vejam suas fotos de progresso</div>
                      </div>
                      <Button variant={preferences.privacy.sharePhotos ? "default" : "outline"} size="sm">
                        {preferences.privacy.sharePhotos ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Configurações do App</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="theme">Tema</Label>
                      <select id="theme" className="w-full p-2 border rounded-md">
                        <option value="light">Claro</option>
                        <option value="dark">Escuro</option>
                        <option value="auto">Automático</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="language">Idioma</Label>
                      <select id="language" className="w-full p-2 border rounded-md">
                        <option value="pt-BR">Português (Brasil)</option>
                        <option value="en-US">English (US)</option>
                        <option value="es-ES">Español</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="units">Unidades</Label>
                      <select id="units" className="w-full p-2 border rounded-md">
                        <option value="metric">Métrico (kg, cm)</option>
                        <option value="imperial">Imperial (lbs, ft)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      <select id="timezone" className="w-full p-2 border rounded-md">
                        <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                        <option value="America/New_York">Nova York (GMT-5)</option>
                        <option value="Europe/London">Londres (GMT+0)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Segurança e Privacidade
              </CardTitle>
              <CardDescription>
                Gerencie sua segurança e dados pessoais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Alterar Senha</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Senha Atual</Label>
                      <Input id="currentPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nova Senha</Label>
                      <Input id="newPassword" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                      <Input id="confirmPassword" type="password" />
                    </div>
                    <Button>
                      <Shield className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3">Dados Pessoais</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Exportar Dados</div>
                        <div className="text-sm text-muted-foreground">Baixar todos os seus dados em formato JSON</div>
                      </div>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Excluir Conta</div>
                        <div className="text-sm text-muted-foreground">Remover permanentemente sua conta e todos os dados</div>
                      </div>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
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
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Atualize sua foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Alterar Foto</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="w-5 h-5 mr-2 text-green-600" />
              Backup dos Dados
            </CardTitle>
            <CardDescription>
              Faça backup de todas as suas informações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Fazer Backup</Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2 text-purple-600" />
              Configurações
            </CardTitle>
            <CardDescription>
              Ajustes avançados do aplicativo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Configurar</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
