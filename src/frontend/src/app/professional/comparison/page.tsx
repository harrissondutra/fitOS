'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Activity, Loader2, ArrowRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BiometricMeasurement {
  id: string;
  dataType: string;
  value: number;
  unit: string;
  recordedAt: string;
  client: {
    id: string;
    name: string;
  };
}

interface ComparisonData {
  before: BiometricMeasurement;
  after: BiometricMeasurement;
  change: number;
  changePercent: number;
  isImprovement: boolean;
}

const measurementTypes = [
  { value: 'weight', label: 'Peso', unit: 'kg', icon: '⚖️' },
  { value: 'body_fat_percentage', label: 'Gordura Corporal', unit: '%', icon: '🩸' },
  { value: 'muscle_mass', label: 'Massa Muscular', unit: 'kg', icon: '💪' },
  { value: 'water_percentage', label: 'Água Corporal', unit: '%', icon: '💧' },
  { value: 'bone_mass', label: 'Massa Óssea', unit: 'kg', icon: '🦴' },
  { value: 'bmi', label: 'IMC', unit: 'kg/m²', icon: '📊' },
  { value: 'visceral_fat', label: 'Gordura Visceral', unit: 'nível', icon: '🫀' },
  { value: 'metabolic_age', label: 'Idade Metabólica', unit: 'anos', icon: '⏰' },
];

export default function ComparisonPage() {
  const [measurements, setMeasurements] = useState<BiometricMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('weight');
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [clients, setMembers] = useState<Array<{ id: string; name: string }>>([]);

  const generateComparisonData = useCallback((measurements: BiometricMeasurement[]) => {
    if (measurements.length < 2) {
      setComparisonData([]);
      return;
    }

    // Ordenar por data (mais antiga primeiro)
    const sortedMeasurements = [...measurements].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );

    const comparisons: ComparisonData[] = [];
    
    // Comparar cada medição com a anterior
    for (let i = 1; i < sortedMeasurements.length; i++) {
      const before = sortedMeasurements[i - 1];
      const after = sortedMeasurements[i];
      
      const change = after.value - before.value;
      const changePercent = before.value !== 0 ? (change / before.value) * 100 : 0;
      
      // Determinar se é melhoria baseado no tipo de medição
      const isImprovement = getIsImprovement(selectedType, change);
      
      comparisons.push({
        before,
        after,
        change,
        changePercent,
        isImprovement
      });
    }

    setComparisonData(comparisons);
  }, [selectedType]);

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/clients');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.clients || []);
      }
    } catch (error) {
      console.error('Erro ao buscar membros:', error);
    }
  }, []);

  const fetchMeasurements = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        clientId: selectedMember,
        dataType: selectedType
      });
      
      const response = await fetch(`/api/bioimpedance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMeasurements(data.measurements || []);
        generateComparisonData(data.measurements || []);
      }
    } catch (error) {
      console.error('Erro ao buscar medições:', error);
      toast.error('Erro ao carregar medições');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMember, selectedType, generateComparisonData]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    if (clients.length > 0) {
      fetchMeasurements();
    }
  }, [clients.length, fetchMeasurements]);

  const getIsImprovement = (type: string, change: number): boolean => {
    const improvementTypes = ['muscle_mass', 'water_percentage', 'bone_mass'];
    const decreaseTypes = ['body_fat_percentage', 'visceral_fat', 'metabolic_age'];
    
    if (improvementTypes.includes(type)) {
      return change > 0; // Aumento é bom
    } else if (decreaseTypes.includes(type)) {
      return change < 0; // Diminuição é boa
    } else if (type === 'weight' || type === 'bmi') {
      // Para peso e IMC, depende do contexto (assumindo perda de peso como melhoria)
      return change < 0;
    }
    
    return change > 0; // Padrão: aumento é bom
  };

  const getChangeIcon = (change: number, isImprovement: boolean) => {
    if (change === 0) return <Minus className="h-4 w-4" />;
    if (isImprovement) {
      return change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
    } else {
      return change > 0 ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />;
    }
  };

  const getChangeColor = (change: number, isImprovement: boolean) => {
    if (change === 0) return 'text-muted-foreground';
    if (isImprovement) {
      return change > 0 ? 'text-green-600' : 'text-red-600';
    } else {
      return change > 0 ? 'text-red-600' : 'text-green-600';
    }
  };

  const getMeasurementTypeInfo = (type: string) => {
    return measurementTypes.find(t => t.value === type) || measurementTypes[0];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comparação de Medições</h1>
          <p className="text-muted-foreground">
            Compare medições biométricas e acompanhe a evolução dos clientes
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Cliente</label>
              <Select value={selectedMember} onValueChange={setSelectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Clientes</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo de Medição</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {measurementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.icon} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Results */}
      <div className="space-y-4">
        {comparisonData.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma comparação disponível</h3>
              <p className="text-muted-foreground">
                {measurements.length < 2 
                  ? 'É necessário ter pelo menos 2 medições para fazer comparações.'
                  : 'Nenhuma medição encontrada para o cliente e tipo selecionados.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          comparisonData.map((comparison, index) => {
            const typeInfo = getMeasurementTypeInfo(selectedType);
            const changeIcon = getChangeIcon(comparison.change, comparison.isImprovement);
            const changeColor = getChangeColor(comparison.change, comparison.isImprovement);
            
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{typeInfo.icon}</div>
                        <div>
                          <h3 className="text-lg font-semibold">{typeInfo.label}</h3>
                          <p className="text-sm text-muted-foreground">
                            {comparison.before.client.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={comparison.isImprovement ? "default" : "destructive"}>
                          {comparison.isImprovement ? 'Melhoria' : 'Piora'}
                        </Badge>
                        <div className={`flex items-center gap-1 ${changeColor}`}>
                          {changeIcon}
                          <span className="font-semibold">
                            {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comparison Values */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Before */}
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">Antes</div>
                        <div className="text-2xl font-bold">
                          {comparison.before.value} {typeInfo.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(comparison.before.recordedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-6 w-6 text-muted-foreground" />
                      </div>

                      {/* After */}
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">Depois</div>
                        <div className="text-2xl font-bold">
                          {comparison.after.value} {typeInfo.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(comparison.after.recordedAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </div>
                      </div>
                    </div>

                    {/* Change Details */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mudança Absoluta</span>
                        <span className={`font-semibold ${changeColor}`}>
                          {comparison.change > 0 ? '+' : ''}{comparison.change.toFixed(2)} {typeInfo.unit}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Mudança Percentual</span>
                        <span className={`font-semibold ${changeColor}`}>
                          {comparison.changePercent > 0 ? '+' : ''}{comparison.changePercent.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Período</span>
                        <span className="text-sm text-muted-foreground">
                          {Math.ceil(
                            (new Date(comparison.after.recordedAt).getTime() - 
                             new Date(comparison.before.recordedAt).getTime()) / 
                            (1000 * 60 * 60 * 24)
                          )} dias
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progresso da Mudança</span>
                        <span className={changeColor}>
                          {Math.abs(comparison.changePercent).toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(Math.abs(comparison.changePercent), 100)} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {comparisonData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo das Comparações</CardTitle>
            <CardDescription>
              Estatísticas gerais das comparações realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {comparisonData.filter(c => c.isImprovement).length}
                </div>
                <div className="text-sm text-muted-foreground">Melhorias</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {comparisonData.filter(c => !c.isImprovement).length}
                </div>
                <div className="text-sm text-muted-foreground">Pioras</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {comparisonData.length}
                </div>
                <div className="text-sm text-muted-foreground">Total de Comparações</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
