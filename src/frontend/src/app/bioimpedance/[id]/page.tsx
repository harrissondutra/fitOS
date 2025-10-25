'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Calendar,
  Scale,
  User,
  Stethoscope,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BioimpedanceMeasurement, BioimpedanceAnalysis } from '@/shared/types';
import BioimpedanceReport from '@/components/bioimpedance/BioimpedanceReport';

export default function BioimpedanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [measurement, setMeasurement] = useState<BioimpedanceMeasurement | null>(null);
  const [analysis, setAnalysis] = useState<BioimpedanceAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchMeasurement(params.id as string);
    }
  }, [params?.id]);

  const fetchMeasurement = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/bioimpedance/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao carregar medição');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMeasurement(data.measurement);
        
        // Buscar análise
        const analysisResponse = await fetch(`/api/bioimpedance/${id}/analysis`);
        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          if (analysisData.success) {
            setAnalysis(analysisData.analysis);
          }
        }
      } else {
        setError(data.error?.message || 'Erro ao carregar medição');
      }
    } catch (error) {
      console.error('Erro ao carregar medição:', error);
      setError('Erro ao carregar medição');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Implementar download de PDF
    console.log('Download PDF');
  };

  const handleShare = () => {
    // Implementar compartilhamento
    if (navigator.share) {
      navigator.share({
        title: 'Relatório de Bioimpedância',
        text: `Relatório de bioimpedância de ${measurement?.client?.name}`,
        url: window.location.href
      });
    } else {
      // Fallback para copiar URL
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getClassificationColor = (classification?: string) => {
    switch (classification) {
      case 'Normal': return 'bg-green-100 text-green-800';
      case 'Acima': return 'bg-red-100 text-red-800';
      case 'Abaixo': return 'bg-yellow-100 text-yellow-800';
      case 'Excelente': return 'bg-green-100 text-green-800';
      case 'Bom': return 'bg-blue-100 text-blue-800';
      case 'Regular': return 'bg-yellow-100 text-yellow-800';
      case 'Precisa melhorar': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando medição...</p>
        </div>
      </div>
    );
  }

  if (error || !measurement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar medição</h2>
          <p className="text-gray-600 mb-4">{error || 'Medição não encontrada'}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.back()} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Relatório de Bioimpedância</h1>
            <p className="text-gray-600">
              {measurement.client?.name || 'Cliente não identificado'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleShare} variant="outline">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
          <Button onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Informações da Medição */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5" />
            <span>Informações da Medição</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Data da Medição</p>
                <p className="font-semibold">
                  {format(new Date(measurement.measuredAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Equipamento</p>
                <p className="font-semibold">{measurement.equipment || 'InBody270'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">Profissional</p>
                <p className="font-semibold">
                  {measurement.professional 
                    ? `${measurement.professional.firstName} ${measurement.professional.lastName}`
                    : 'Não informado'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-600">ID da Medição</p>
                <p className="font-semibold">{measurement.measurementId || measurement.id.slice(-8)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Dados Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Peso</p>
              <p className="text-2xl font-bold">{measurement.weight.toFixed(1)} kg</p>
              <Badge className={getClassificationColor(measurement.weightClassification)}>
                {measurement.weightClassification || 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">IMC</p>
              <p className="text-2xl font-bold">{measurement.bmi.toFixed(1)}</p>
              <Badge className={getClassificationColor(measurement.bmiClassification)}>
                {measurement.bmiClassification || 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Gordura Corporal</p>
              <p className="text-2xl font-bold">{measurement.bodyFatPercentage.toFixed(1)}%</p>
              <Badge className={getClassificationColor(measurement.bodyFatClassification)}>
                {measurement.bodyFatClassification || 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600">Pontuação InBody</p>
              <p className="text-2xl font-bold text-blue-600">
                {measurement.inbodyScore || 0}/100
              </p>
              <Badge className={getClassificationColor(measurement.inbodyScore ? 
                (measurement.inbodyScore >= 90 ? 'Excelente' : 
                 measurement.inbodyScore >= 80 ? 'Bom' : 
                 measurement.inbodyScore >= 70 ? 'Regular' : 'Precisa melhorar') : 'Normal'
              )}>
                {measurement.inbodyScore ? 
                  (measurement.inbodyScore >= 90 ? 'Excelente' : 
                   measurement.inbodyScore >= 80 ? 'Bom' : 
                   measurement.inbodyScore >= 70 ? 'Regular' : 'Precisa melhorar') : 'Normal'
                }
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatório Completo */}
      {analysis && (
        <BioimpedanceReport measurement={measurement} analysis={analysis} exerciseEstimates={[]} />
      )}

      {/* Observações */}
      {measurement.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{measurement.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}