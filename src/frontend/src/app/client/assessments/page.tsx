'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, TrendingUp, Calendar, BarChart2 } from 'lucide-react';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Assessment {
  id: string;
  assessmentDate: string;
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: any;
  strength?: any;
  trainer: {
    firstName: string;
    lastName: string;
  };
}

export default function ClientAssessmentsPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      // TODO: Implementar endpoint GET /api/assessments/client/:clientId
      // const response = await api.get('/api/assessments/client');
      // setAssessments(response.data.data.assessments || []);
      
      // Mock data para demonstração
      setAssessments([
        {
          id: '1',
          assessmentDate: '2024-01-15',
          weight: 75.5,
          height: 175,
          bodyFat: 15.2,
          muscleMass: 35.8,
          trainer: { firstName: 'João', lastName: 'Silva' }
        },
        {
          id: '2',
          assessmentDate: '2024-02-15',
          weight: 74.0,
          height: 175,
          bodyFat: 14.5,
          muscleMass: 36.5,
          trainer: { firstName: 'João', lastName: 'Silva' }
        }
      ]);
    } catch (error) {
      console.error('Error fetching assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Avaliações Físicas</h1>
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Avaliações Físicas</h1>
        <p className="text-muted-foreground">Acompanhe seu progresso e evolução</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações Totais</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assessments.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Última Avaliação</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.length > 0 
                ? new Date(assessments[0].assessmentDate).toLocaleDateString('pt-BR')
                : 'N/A'
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assessments.length >= 2 ? '📈' : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              Comparação disponível
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Assessments */}
      {assessments.length > 0 ? (
        <Tabs defaultValue="timeline" className="space-y-4">
          <TabsList>
            <TabsTrigger value="timeline">Linha do Tempo</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="compare">Comparar</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {assessments.map((assessment) => (
                <Card 
                  key={assessment.id} 
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => setSelectedAssessment(assessment)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {new Date(assessment.assessmentDate).toLocaleDateString('pt-BR')}
                      </CardTitle>
                      <Badge variant="secondary">
                        Recente
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Avaliado por {assessment.trainer.firstName} {assessment.trainer.lastName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assessment.weight && (
                      <div>
                        <p className="text-sm text-muted-foreground">Peso</p>
                        <p className="text-xl font-bold">{assessment.weight} kg</p>
                      </div>
                    )}
                    {assessment.bodyFat !== null && assessment.bodyFat !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground">Gordura Corporal</p>
                        <p className="text-xl font-bold">{assessment.bodyFat}%</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart2 className="h-16 w-16 mx-auto mb-4" />
                  <p>Selecione uma avaliação para ver os detalhes</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare">
            <Card>
              <CardHeader>
                <CardTitle>Comparar Avaliações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                  <p>Selecione duas avaliações para comparar</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground">
              Seu trainer ainda não realizou avaliações físicas. Entre em contato!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

