'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Heart,
  Zap,
  Users,
  Calendar,
  QrCode
} from 'lucide-react';
import { BioimpedanceMeasurement, BioimpedanceAnalysis } from '@/shared/types';

interface BioimpedanceReportProps {
  measurement: BioimpedanceMeasurement;
  analysis: BioimpedanceAnalysis;
  exerciseEstimates: any[];
  history?: any[];
}

export default function BioimpedanceReport({ 
  measurement, 
  analysis, 
  exerciseEstimates,
  history = []
}: BioimpedanceReportProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getClassificationColor = (classification: string) => {
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

  const getProgressPercentage = (value: number, min: number, max: number) => {
    const range = max - min;
    const position = value - min;
    return Math.min(Math.max((position / range) * 100, 0), 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Relatório de Composição Corporal</h1>
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4" />
            <span>{measurement.client?.name}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(measurement.measuredAt)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Scale className="h-4 w-4" />
            <span>{measurement.equipment || 'InBody270'}</span>
          </div>
        </div>
      </div>

      {/* InBody Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Pontuação InBody</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-blue-600">
              {analysis.inbodyScore.total}/{analysis.inbodyScore.max}
            </div>
            <Badge className={getClassificationColor(analysis.inbodyScore.classification)}>
              {analysis.inbodyScore.classification}
            </Badge>
            <Progress 
              value={analysis.inbodyScore.total} 
              className="w-full h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Análise de Composição Corporal */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Composição Corporal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Object.entries(analysis.bodyComposition).map(([key, data]) => (
              <div key={key} className="space-y-2">
                <div className="text-sm font-medium text-gray-600">
                  {key === 'totalBodyWater' && 'Água Corporal Total'}
                  {key === 'protein' && 'Proteína'}
                  {key === 'minerals' && 'Minerais'}
                  {key === 'bodyFatMass' && 'Massa de Gordura'}
                  {key === 'weight' && 'Peso'}
                </div>
                <div className="text-2xl font-bold">
                  {data.value.toFixed(1)}
                  {key === 'totalBodyWater' && 'L'}
                  {key === 'protein' && 'kg'}
                  {key === 'minerals' && 'kg'}
                  {key === 'bodyFatMass' && 'kg'}
                  {key === 'weight' && 'kg'}
                </div>
                <div className="text-xs text-gray-500">
                  Normal: {data.normal.min}-{data.normal.max}
                  {key === 'totalBodyWater' && 'L'}
                  {key === 'protein' && 'kg'}
                  {key === 'minerals' && 'kg'}
                  {key === 'bodyFatMass' && 'kg'}
                  {key === 'weight' && 'kg'}
                </div>
                <Badge className={getClassificationColor(data.classification)}>
                  {data.classification}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise Músculo-Gordura */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Músculo-Gordura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analysis.muscleFatAnalysis).map(([key, data]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {key === 'weight' && 'Peso'}
                    {key === 'skeletalMuscleMass' && 'Massa Muscular Esquelética'}
                    {key === 'bodyFatMass' && 'Massa de Gordura'}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg font-bold">{data.value.toFixed(1)}kg</span>
                    <Badge className={getClassificationColor(data.classification)}>
                      {data.classification}
                    </Badge>
                  </div>
                </div>
                <Progress 
                  value={getProgressPercentage(data.value, 0, data.value * 1.5)} 
                  className="h-2"
                />
                <div className="text-xs text-gray-500">
                  {data.percentage.toFixed(1)}% do peso total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Análise de Obesidade */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Obesidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(analysis.obesityAnalysis).map(([key, data]) => (
              <div key={key} className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {data.value.toFixed(1)}
                    {key === 'bmi' && ' kg/m²'}
                    {key === 'bodyFatPercentage' && '%'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {key === 'bmi' && 'IMC (Índice de Massa Corporal)'}
                    {key === 'bodyFatPercentage' && 'PGC (Porcentual de Gordura Corporal)'}
                  </div>
                </div>
                <div className="text-center">
                  <Badge className={getClassificationColor(data.classification)}>
                    {data.classification}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Faixa normal: {data.normal.min}-{data.normal.max}
                  {key === 'bmi' && ' kg/m²'}
                  {key === 'bodyFatPercentage' && '%'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controle de Peso */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Peso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {analysis.weightControl.idealWeight.toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-600">Peso Ideal</div>
            </div>
            <div className="text-center space-y-2">
              <div className={`text-2xl font-bold ${analysis.weightControl.weightControl < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.weightControl.weightControl > 0 ? '+' : ''}{analysis.weightControl.weightControl.toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-600">Controle de Peso</div>
            </div>
            <div className="text-center space-y-2">
              <div className={`text-2xl font-bold ${analysis.weightControl.fatControl < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.weightControl.fatControl > 0 ? '+' : ''}{analysis.weightControl.fatControl.toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-600">Controle de Gordura</div>
            </div>
            <div className="text-center space-y-2">
              <div className={`text-2xl font-bold ${analysis.weightControl.muscleControl < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {analysis.weightControl.muscleControl > 0 ? '+' : ''}{analysis.weightControl.muscleControl.toFixed(1)}kg
              </div>
              <div className="text-sm text-gray-600">Controle Muscular</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relação Cintura-Quadril e Gordura Visceral */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Relação Cintura-Quadril</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <div className="text-3xl font-bold text-blue-600">
                {analysis.waistHipRatio.value.toFixed(2)}
              </div>
              <Badge className={getClassificationColor(analysis.waistHipRatio.classification)}>
                {analysis.waistHipRatio.classification}
              </Badge>
              <div className="text-xs text-gray-500">
                Normal: {analysis.waistHipRatio.normal.min}-{analysis.waistHipRatio.normal.max}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gordura Visceral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <div className="text-3xl font-bold text-blue-600">
                Nível {analysis.visceralFat.level}
              </div>
              <Badge className={getClassificationColor(analysis.visceralFat.classification)}>
                {analysis.visceralFat.classification}
              </Badge>
              <div className="text-xs text-gray-500">
                Abaixo de 10 é considerado normal
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados Adicionais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Massa Livre de Gordura</div>
              <div className="text-xl font-bold">{analysis.additionalData.fatFreeMass.value.toFixed(1)}kg</div>
              <Badge className={getClassificationColor(analysis.additionalData.fatFreeMass.classification)}>
                {analysis.additionalData.fatFreeMass.classification}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Taxa Metabólica Basal</div>
              <div className="text-xl font-bold">{analysis.additionalData.basalMetabolicRate.value.toFixed(0)} kcal</div>
              <Badge className={getClassificationColor(analysis.additionalData.basalMetabolicRate.classification)}>
                {analysis.additionalData.basalMetabolicRate.classification}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">Grau de Obesidade</div>
              <div className="text-xl font-bold">{analysis.additionalData.obesityDegree.value.toFixed(0)}%</div>
              <Badge className={getClassificationColor(analysis.additionalData.obesityDegree.classification)}>
                {analysis.additionalData.obesityDegree.classification}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-600">SMI</div>
              <div className="text-xl font-bold">{analysis.additionalData.skeletalMuscleIndex.toFixed(1)} kg/m²</div>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Ingestão Calórica Recomendada</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">
              {analysis.additionalData.recommendedCalories.toFixed(0)} kcal
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise Segmentar */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Segmentar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Massa Muscular */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Massa Muscular</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analysis.segmentalAnalysis.muscle).map(([key, data]) => (
                  <div key={key} className="text-center space-y-2">
                    <div className="text-sm font-medium text-gray-600">
                      {key === 'leftArm' && 'Braço Esquerdo'}
                      {key === 'rightArm' && 'Braço Direito'}
                      {key === 'trunk' && 'Tronco'}
                      {key === 'leftLeg' && 'Perna Esquerda'}
                      {key === 'rightLeg' && 'Perna Direita'}
                    </div>
                    <div className="text-xl font-bold">{data.value.toFixed(1)}kg</div>
                    <div className="text-xs text-gray-500">{data.percentage.toFixed(1)}%</div>
                    <Badge className={getClassificationColor(data.classification)}>
                      {data.classification}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Gordura */}
            <div>
              <h4 className="font-semibold text-lg mb-4">Gordura</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {Object.entries(analysis.segmentalAnalysis.fat).map(([key, data]) => (
                  <div key={key} className="text-center space-y-2">
                    <div className="text-sm font-medium text-gray-600">
                      {key === 'leftArm' && 'Braço Esquerdo'}
                      {key === 'rightArm' && 'Braço Direito'}
                      {key === 'trunk' && 'Tronco'}
                      {key === 'leftLeg' && 'Perna Esquerda'}
                      {key === 'rightLeg' && 'Perna Direita'}
                    </div>
                    <div className="text-xl font-bold">{data.value.toFixed(1)}kg</div>
                    <div className="text-xs text-gray-500">{data.percentage.toFixed(1)}%</div>
                    <Badge className={getClassificationColor(data.classification)}>
                      {data.classification}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estimativas de Calorias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Perdas de Calorias do Exercício (30 min)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {exerciseEstimates.map((exercise, index) => (
              <div key={index} className="p-3 border rounded-lg text-center space-y-1">
                <div className="text-sm font-medium">{exercise.activity}</div>
                <div className="text-lg font-bold text-blue-600">{exercise.calories30min} kcal</div>
                <Badge 
                  className={
                    exercise.intensity === 'low' ? 'bg-green-100 text-green-800' :
                    exercise.intensity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    exercise.intensity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-red-100 text-red-800'
                  }
                >
                  {exercise.intensity}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Histórico */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico da Composição Corporal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-gray-600">Peso (kg)</div>
                  <div className="text-lg font-bold">84.7</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Massa Muscular (kg)</div>
                  <div className="text-lg font-bold">37.8</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">PGC (%)</div>
                  <div className="text-lg font-bold">21.8</div>
                </div>
              </div>
              {/* Aqui você pode adicionar um gráfico de linha mostrando a evolução */}
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code */}
      {measurement.qrCode && (
        <Card>
          <CardContent className="text-center py-8">
            <QrCode className="h-32 w-32 mx-auto mb-4" />
            <p className="text-sm text-gray-600">
              Escaneie o Código QR para ver os resultados no site
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
