'use client';

/**
 * Health Questionnaires Page - Sprint 7
 * Gerenciamento de questionários de saúde pré-consulta
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle, Clock } from 'lucide-react';

interface Questionnaire {
  id: string;
  type: 'metabolic' | 'dietary_pattern' | 'sleep' | 'digestive' | 'energy' | 'general';
  title: string;
  description: string;
  questions: any[];
  usageCount: number;
}

export default function HealthQuestionnairesPage() {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const fetchQuestionnaires = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/nutrition/questionnaires');
      
      if (!res.ok) throw new Error('Erro ao carregar questionários');
      
      const data = await res.json();
      setQuestionnaires(data.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuestionnaire = (questionnaire: Questionnaire) => {
    setSelectedQuestionnaire(questionnaire);
    setResponses({});
  };

  const handleSubmit = async () => {
    if (!selectedQuestionnaire) return;
    
    try {
      setSubmitting(true);
      
      const res = await fetch('/api/nutrition/questionnaires/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionnaireId: selectedQuestionnaire.id,
          responses
        })
      });
      
      if (!res.ok) throw new Error('Erro ao salvar respostas');
      
      // Limpar estado
      setSelectedQuestionnaire(null);
      setResponses({});
      
      // Recarregar questionários
      fetchQuestionnaires();
      
      // Success feedback
      alert('Questionário salvo com sucesso!');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      metabolic: 'Metabólico',
      dietary_pattern: 'Padrão Alimentar',
      sleep: 'Sono',
      digestive: 'Digestivo',
      energy: 'Energia',
      general: 'Geral'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4" />
          <p>Carregando questionários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Se questionário selecionado, exibir formulário
  if (selectedQuestionnaire) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedQuestionnaire(null)}
          className="mb-6"
        >
          ← Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {selectedQuestionnaire.title}
            </CardTitle>
            <CardDescription>{selectedQuestionnaire.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {selectedQuestionnaire.questions.map((question, index) => (
              <div key={index} className="space-y-2">
                <label className="text-sm font-medium">
                  {question.question}
                </label>
                
                {question.type === 'text' && (
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-md"
                    value={responses[question.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                  />
                )}
                
                {question.type === 'textarea' && (
                  <textarea
                    className="w-full px-4 py-2 border rounded-md min-h-[100px]"
                    value={responses[question.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                  />
                )}
                
                {question.type === 'select' && (
                  <select
                    className="w-full px-4 py-2 border rounded-md"
                    value={responses[question.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [question.id]: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {question.options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setSelectedQuestionnaire(null)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Salvando...' : 'Salvar Respostas'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Lista de questionários disponíveis
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Questionários de Saúde</h1>
        <p className="text-muted-foreground">
          Avalie seus clientes com questionários pré-consulta
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {questionnaires.map((questionnaire) => (
          <Card 
            key={questionnaire.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleStartQuestionnaire(questionnaire)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{questionnaire.title}</CardTitle>
                <Badge variant="secondary">{getTypeLabel(questionnaire.type)}</Badge>
              </div>
              <CardDescription>{questionnaire.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4" />
                {questionnaire.usageCount} usado{questionnaire.usageCount !== 1 ? 's' : ''}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {questionnaires.length === 0 && (
        <Alert>
          <AlertDescription>
            Nenhum questionário disponível no momento.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

