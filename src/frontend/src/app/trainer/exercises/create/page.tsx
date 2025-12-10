'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, X, Save } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { ExerciseVideoUpload } from '@/components/trainer/exercise-video-upload';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Antebraço',
  'Quadríceps', 'Posteriores', 'Glúteos', 'Panturrilha', 'Abdômen', 'Cardio'
];

const EQUIPMENTS = [
  'Nenhum', 'Barra', 'Halter', 'Máquina', 'Cabos', 'Elástico',
  'Bosu', 'TRX', 'Kettlebell', 'Medicine Ball', 'Corpo Livre'
];

export default function CreateExercisePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'strength',
    difficulty: 'beginner',
    instructions: '',
    tips: '',
    isPublic: true
  });

  const toggleMuscleGroup = (muscleGroup: string) => {
    setSelectedMuscleGroups(prev =>
      prev.includes(muscleGroup)
        ? prev.filter(m => m !== muscleGroup)
        : [...prev, muscleGroup]
    );
  };

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exerciseData = {
        ...formData,
        muscleGroups: selectedMuscleGroups,
        equipment: selectedEquipment,
        videoUrl: videoUrl || undefined
      };

      const response = await api.post('/api/exercises', exerciseData);

      if (response.data.success) {
        toast.success('Exercício criado com sucesso!');
        router.push('/trainer/exercises');
      }
    } catch (error: any) {
      console.error('Error creating exercise:', error);
      toast.error('Erro ao criar exercício');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Criar Novo Exercício</h1>
        <p className="text-muted-foreground">Adicione um exercício à sua biblioteca</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Exercício *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Supino Reto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o exercício..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Força</SelectItem>
                    <SelectItem value="cardio">Cardio</SelectItem>
                    <SelectItem value="flexibility">Flexibilidade</SelectItem>
                    <SelectItem value="balance">Equilíbrio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">Dificuldade *</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grupos Musculares */}
        <Card>
          <CardHeader>
            <CardTitle>Grupos Musculares Trabalhados *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(muscle => (
                <Button
                  key={muscle}
                  type="button"
                  variant={selectedMuscleGroups.includes(muscle) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleMuscleGroup(muscle)}
                >
                  {selectedMuscleGroups.includes(muscle) && <X className="h-3 w-3 mr-1" />}
                  {muscle}
                </Button>
              ))}
            </div>
            {selectedMuscleGroups.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Selecione pelo menos um grupo muscular
              </p>
            )}
          </CardContent>
        </Card>

        {/* Equipamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Equipamentos Necessários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENTS.map(equipment => (
                <Button
                  key={equipment}
                  type="button"
                  variant={selectedEquipment.includes(equipment) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleEquipment(equipment)}
                >
                  {selectedEquipment.includes(equipment) && <X className="h-3 w-3 mr-1" />}
                  {equipment}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upload de Vídeo */}
        {videoUrl && (
          <ExerciseVideoUpload
            exerciseId="temp" // Será usado após criar o exercício
            currentVideoUrl={videoUrl}
            onUploadComplete={(url) => setVideoUrl(url)}
          />
        )}

        {/* Instruções e Dicas */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções e Dicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Instruções de Execução</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Descreva como executar o exercício..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tips">Dicas</Label>
              <Textarea
                id="tips"
                value={formData.tips}
                onChange={(e) => setFormData(prev => ({ ...prev, tips: e.target.value }))}
                placeholder="Dicas para melhor execução..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name || selectedMuscleGroups.length === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvando...' : 'Salvar Exercício'}
          </Button>
        </div>
      </form>
    </div>
  );
}

