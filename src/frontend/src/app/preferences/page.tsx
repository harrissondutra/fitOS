"use client";

import { usePreferences } from "@/hooks/use-preferences";
import { PreferencesWizard } from "@/components/preferences/preferences-wizard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Save, RefreshCw } from "lucide-react";
import { toast } from "react-hot-toast";

export default function PreferencesPage() {
  const { preferences, loading, updatePreferences, refetch } = usePreferences();

  const handleSave = async () => {
    toast.success('Preferências salvas!');
    await refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="container mx-auto p-6">
        <PreferencesWizard onComplete={refetch} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suas Preferências</h1>
          <p className="text-muted-foreground">Personalize sua experiência no FitOS</p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="fitness" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fitness">Fitness</TabsTrigger>
          <TabsTrigger value="nutrition">Nutrição</TabsTrigger>
          <TabsTrigger value="music">Música</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
        </TabsList>

        <TabsContent value="fitness">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Fitness</CardTitle>
              <CardDescription>Configure seus objetivos e tipos de treino preferidos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Objetivos</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.fitnessGoals.map((goal) => (
                    <Badge key={goal} variant="default">
                      {goal.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Tipos de Treino</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredWorkoutTypes.map((type) => (
                    <Badge key={type} variant="secondary">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold mb-1">Duração</h3>
                  <p className="text-sm text-muted-foreground">{preferences.workoutDuration}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Intensidade</h3>
                  <p className="text-sm text-muted-foreground">{preferences.intensityLevel}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Nutrição</CardTitle>
              <CardDescription>Configure suas preferências alimentares</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Restrições Alimentares</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.dietaryRestrictions.length > 0 ? (
                    preferences.dietaryRestrictions.map((restriction) => (
                      <Badge key={restriction} variant="outline">
                        {restriction.replace('_', ' ')}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma restrição</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Objetivos Nutricionais</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.nutritionGoals.map((goal) => (
                    <Badge key={goal} variant="default">
                      {goal.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="music">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Música</CardTitle>
              <CardDescription>Configure suas preferências musicais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Gêneros Preferidos</h3>
                <div className="flex flex-wrap gap-2">
                  {preferences.preferredMusicGenres.map((genre) => (
                    <Badge key={genre} variant="secondary">
                      {genre.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-2">Spotify</h3>
                <p className={`text-sm ${preferences.spotifyConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {preferences.spotifyConnected ? '✓ Conectado' : '✗ Não conectado'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Configure como você quer ser notificado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Notificações por Email</h3>
                  <p className="text-sm text-muted-foreground">Receba notificações importantes por email</p>
                </div>
                <Badge variant={preferences.emailNotifications ? "default" : "outline"}>
                  {preferences.emailNotifications ? "Ativado" : "Desativado"}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Notificações Push</h3>
                  <p className="text-sm text-muted-foreground">Receba notificações no navegador</p>
                </div>
                <Badge variant={preferences.pushNotifications ? "default" : "outline"}>
                  {preferences.pushNotifications ? "Ativado" : "Desativado"}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-1">Frequência de Lembretes</h3>
                <p className="text-sm text-muted-foreground">{preferences.reminderFrequency}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

