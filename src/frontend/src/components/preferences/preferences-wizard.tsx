"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "react-hot-toast";

interface PreferencesWizardProps {
  onComplete: () => void;
  initialData?: any;
}

export function PreferencesWizard({ onComplete, initialData }: PreferencesWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [preferences, setPreferences] = useState({
    fitnessGoals: initialData?.fitnessGoals || [],
    preferredWorkoutTypes: initialData?.preferredWorkoutTypes || [],
    workoutDuration: initialData?.workoutDuration || "60min",
    intensityLevel: initialData?.intensityLevel || "moderate",
    preferredWorkoutDays: initialData?.preferredWorkoutDays || [],
    preferredWorkoutTime: initialData?.preferredWorkoutTime || "morning",
    dietaryRestrictions: initialData?.dietaryRestrictions || [],
    nutritionGoals: initialData?.nutritionGoals || [],
    preferredMusicGenres: initialData?.preferredMusicGenres || [],
    emailNotifications: initialData?.emailNotifications !== false,
    pushNotifications: initialData?.pushNotifications !== false,
    reminderFrequency: initialData?.reminderFrequency || "daily",
  });

  const steps = [
    {
      title: "Objetivos de Fitness",
      fields: ["fitnessGoals", "preferredWorkoutTypes", "workoutDuration", "intensityLevel"]
    },
    {
      title: "Horários Preferidos",
      fields: ["preferredWorkoutDays", "preferredWorkoutTime"]
    },
    {
      title: "Preferências de Nutrição",
      fields: ["dietaryRestrictions", "nutritionGoals"]
    },
    {
      title: "Música e Notificações",
      fields: ["preferredMusicGenres", "emailNotifications", "pushNotifications", "reminderFrequency"]
    }
  ];

  const handleToggle = (field: string, value: string) => {
    setPreferences(prev => {
      const current = prev[field] || [];
      const index = current.indexOf(value);
      
      if (index > -1) {
        return { ...prev, [field]: current.filter((v: string) => v !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) throw new Error('Failed to save preferences');

      toast.success('Preferências salvas com sucesso!');
      onComplete();
    } catch (error) {
      toast.error('Erro ao salvar preferências');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Objetivos de Fitness</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'strength', 'general_health'].map((goal) => (
                    <Badge
                      key={goal}
                      variant={preferences.fitnessGoals.includes(goal) ? "default" : "outline"}
                      className="cursor-pointer py-2"
                      onClick={() => handleToggle('fitnessGoals', goal)}
                    >
                      {goal.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">Tipos de Treino Preferidos</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {['cardio', 'strength', 'yoga', 'hiit', 'pilates', 'crossfit'].map((type) => (
                    <Badge
                      key={type}
                      variant={preferences.preferredWorkoutTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer py-2"
                      onClick={() => handleToggle('preferredWorkoutTypes', type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duração do Treino</Label>
                  <Select value={preferences.workoutDuration} onValueChange={(value) => setPreferences(prev => ({ ...prev, workoutDuration: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30min">30 minutos</SelectItem>
                      <SelectItem value="45min">45 minutos</SelectItem>
                      <SelectItem value="60min">60 minutos</SelectItem>
                      <SelectItem value="90min">90 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Nível de Intensidade</Label>
                  <Select value={preferences.intensityLevel} onValueChange={(value) => setPreferences(prev => ({ ...prev, intensityLevel: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="mixed">Variado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Dias da Semana Preferidos</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <Badge
                    key={day}
                    variant={preferences.preferredWorkoutDays.includes(day) ? "default" : "outline"}
                    className="cursor-pointer py-2"
                    onClick={() => handleToggle('preferredWorkoutDays', day)}
                  >
                    {day.slice(0, 3)}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Horário Preferido</Label>
              <Select value={preferences.preferredWorkoutTime} onValueChange={(value) => setPreferences(prev => ({ ...prev, preferredWorkoutTime: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Manhã</SelectItem>
                  <SelectItem value="afternoon">Tarde</SelectItem>
                  <SelectItem value="evening">Noite</SelectItem>
                  <SelectItem value="night">Madrugada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Restrições Alimentares</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['vegetarian', 'vegan', 'gluten_free', 'lactose_free', 'kosher', 'halal'].map((restriction) => (
                  <Badge
                    key={restriction}
                    variant={preferences.dietaryRestrictions.includes(restriction) ? "default" : "outline"}
                    className="cursor-pointer py-2"
                    onClick={() => handleToggle('dietaryRestrictions', restriction)}
                  >
                    {restriction.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-semibold">Objetivos Nutricionais</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['high_protein', 'low_carb', 'balanced', 'keto', 'paleo', 'mediterranean'].map((goal) => (
                  <Badge
                    key={goal}
                    variant={preferences.nutritionGoals.includes(goal) ? "default" : "outline"}
                    className="cursor-pointer py-2"
                    onClick={() => handleToggle('nutritionGoals', goal)}
                  >
                    {goal.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Gêneros Musicais Preferidos</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {['pop', 'rock', 'electronic', 'hip_hop', 'jazz', 'classical', 'latin', 'country'].map((genre) => (
                  <Badge
                    key={genre}
                    variant={preferences.preferredMusicGenres.includes(genre) ? "default" : "outline"}
                    className="cursor-pointer py-2"
                    onClick={() => handleToggle('preferredMusicGenres', genre)}
                  >
                    {genre.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="email"
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked as boolean }))}
                />
                <Label htmlFor="email">Notificações por Email</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="push"
                  checked={preferences.pushNotifications}
                  onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked as boolean }))}
                />
                <Label htmlFor="push">Notificações Push</Label>
              </div>
            </div>

            <div>
              <Label>Frequência de Lembretes</Label>
              <Select value={preferences.reminderFrequency} onValueChange={(value) => setPreferences(prev => ({ ...prev, reminderFrequency: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Diário</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Configurar Preferências</CardTitle>
        <CardDescription>
          Nos conte sobre você para personalizarmos sua experiência
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Progress */}
          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Step Content */}
          <div className="min-h-[300px]">
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0 || loading}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(prev => prev + 1)}>
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

