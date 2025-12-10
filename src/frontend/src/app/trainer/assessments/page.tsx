'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar, User, BarChart2, TrendingUp, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Assessment {
  id: string;
  client: {
    id: string;
    name: string;
    email?: string;
  };
  assessmentDate: string;
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
}

export default function TrainerAssessmentsPage() {
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      // TODO: Implementar endpoint GET /api/assessments para trainer
      // const response = await api.get('/api/assessments');
      // setAssessments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Avaliações Físicas</h1>
          <p className="text-muted-foreground">Gerencie avaliações físicas dos seus clientes</p>
        </div>
        <Button onClick={() => router.push('/trainer/assessments/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Avaliações</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximas 7 Dias</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
      </div>

      {/* Assessments List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : assessments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="overflow-hidden transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {assessment.client.name}
                  </CardTitle>
                  <Badge variant="secondary">
                    {new Date(assessment.assessmentDate).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
                <CardDescription>{assessment.client.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {assessment.weight && assessment.height && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Peso</p>
                      <p className="font-semibold">{assessment.weight} kg</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Altura</p>
                      <p className="font-semibold">{assessment.height} cm</p>
                    </div>
                  </div>
                )}
                {assessment.bodyFat !== null && (
                  <div>
                    <p className="text-muted-foreground text-sm">Gordura Corporal</p>
                    <p className="font-semibold">{assessment.bodyFat}%</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/trainer/assessments/${assessment.id}`)}
                  >
                    <BarChart2 className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/trainer/assessments/${assessment.id}/compare`)}
                  >
                    <TrendingUp className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando a primeira avaliação física para seus clientes
            </p>
            <Button onClick={() => router.push('/trainer/assessments/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Avaliação
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

