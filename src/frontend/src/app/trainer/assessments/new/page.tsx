'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export default function NewAssessmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [assessment, setAssessment] = useState({
    clientId: '',
    assessmentDate: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    bodyFat: '',
    muscleMass: '',
    measurements: {
      neck: '',
      chest: '',
      waist: '',
      hips: '',
      thigh: '',
      calf: '',
      biceps: ''
    },
    strength: {
      benchPress: '',
      squat: '',
      deadlift: ''
    },
    notes: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/api/trainer/clients');
      if (response.data.success && response.data.data) {
        setClients(response.data.data.map((client: any) => ({
          id: client.id,
          name: client.name
        })));
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setClientsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assessment.clientId) {
      toast.error('Selecione um cliente');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/assessments', assessment);
      toast.success('Avaliação física criada com sucesso!');
      router.push('/trainer/assessments');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar avaliação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold">Nova Avaliação Física</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  value={assessment.clientId}
                  onValueChange={(v) => setAssessment({ ...assessment, clientId: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientsLoading ? (
                      <SelectItem value="loading" disabled>Carregando clientes...</SelectItem>
                    ) : clients.length > 0 ? (
                      clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-clients" disabled>
                        Nenhum cliente disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="assessmentDate">Data da Avaliação *</Label>
                <Input
                  id="assessmentDate"
                  type="date"
                  value={assessment.assessmentDate}
                  onChange={(e) => setAssessment({ ...assessment, assessmentDate: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medidas Corporais */}
        <Card>
          <CardHeader>
            <CardTitle>Medidas Corporais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="Ex: 75.5"
                  value={assessment.weight}
                  onChange={(e) => setAssessment({ ...assessment, weight: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="Ex: 175"
                  value={assessment.height}
                  onChange={(e) => setAssessment({ ...assessment, height: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
                <Input
                  id="bodyFat"
                  type="number"
                  placeholder="Ex: 15.5"
                  value={assessment.bodyFat}
                  onChange={(e) => setAssessment({ ...assessment, bodyFat: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                <Input
                  id="muscleMass"
                  type="number"
                  placeholder="Ex: 35.2"
                  value={assessment.muscleMass}
                  onChange={(e) => setAssessment({ ...assessment, muscleMass: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Circunferências */}
        <Card>
          <CardHeader>
            <CardTitle>Circunferências (cm)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(assessment.measurements).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</Label>
                  <Input
                    id={key}
                    type="number"
                    placeholder="0.0"
                    value={value}
                    onChange={(e) => setAssessment({
                      ...assessment,
                      measurements: {
                        ...assessment.measurements,
                        [key]: e.target.value
                      }
                    })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testes de Força */}
        <Card>
          <CardHeader>
            <CardTitle>Testes de Força (kg)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(assessment.strength).map(([key, value]) => (
                <div key={key}>
                  <Label htmlFor={key}>{key}</Label>
                  <Input
                    id={key}
                    type="number"
                    placeholder="0"
                    value={value}
                    onChange={(e) => setAssessment({
                      ...assessment,
                      strength: {
                        ...assessment.strength,
                        [key]: e.target.value
                      }
                    })}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Adicione observações sobre a avaliação..."
              value={assessment.notes}
              onChange={(e) => setAssessment({ ...assessment, notes: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Avaliação
              </>
            )}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}

