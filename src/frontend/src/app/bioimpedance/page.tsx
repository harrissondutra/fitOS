'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Scale,
  TrendingUp,
  Users,
  BarChart3,
  FileText,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BioimpedanceMeasurement } from '@/shared/types';
import BioimpedanceForm from '@/components/bioimpedance/BioimpedanceForm';

export default function BioimpedancePage() {
  const [measurements, setMeasurements] = useState<BioimpedanceMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');

  useEffect(() => {
    fetchMeasurements();
  }, []);

  const fetchMeasurements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bioimpedance');
      
      if (!response.ok) {
        throw new Error('Erro ao carregar medições');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMeasurements(data.measurements || []);
      }
    } catch (error) {
      console.error('Erro ao carregar medições:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeasurement = async (formData: any) => {
    try {
      const response = await fetch('/api/bioimpedance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar medição');
      }

      const data = await response.json();
      
      if (data.success) {
        setShowForm(false);
        fetchMeasurements();
        // toast.success('Medição criada com sucesso');
      } else {
        // toast.error(data.error || 'Erro ao criar medição');
      }
    } catch (error) {
      console.error('Erro ao criar medição:', error);
      // toast.error('Erro ao criar medição');
    }
  };

  const filteredMeasurements = measurements.filter(measurement => {
    const matchesSearch = measurement.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         measurement.equipment?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'recent' && 
                          new Date(measurement.measuredAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

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

  const getBMIClassification = (bmi: number) => {
    if (bmi < 18.5) return 'Abaixo do peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidade';
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'bg-yellow-100 text-yellow-800';
    if (bmi < 25) return 'bg-green-100 text-green-800';
    if (bmi < 30) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Nova Medição de Bioimpedância</h1>
          <Button onClick={() => setShowForm(false)} variant="outline">
            Cancelar
          </Button>
        </div>
        <BioimpedanceForm onSubmit={handleCreateMeasurement} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bioimpedância</h1>
          <p className="text-gray-600">Medições de composição corporal e análise InBody</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Medição
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Medições</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{measurements.length}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde o mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Membros Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(measurements.map(m => m.clientId)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Membros com medições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IMC Médio</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {measurements.length > 0 
                ? (measurements.reduce((sum, m) => sum + m.bmi, 0) / measurements.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              kg/m²
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gordura Corporal Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {measurements.length > 0 
                ? (measurements.reduce((sum, m) => sum + m.bodyFatPercentage, 0) / measurements.length).toFixed(1)
                : '0.0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              PGC médio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por membro ou equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as medições</SelectItem>
                <SelectItem value="recent">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Medições */}
      <Card>
        <CardHeader>
          <CardTitle>Medições de Bioimpedância</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredMeasurements.length === 0 ? (
            <div className="text-center py-12">
              <Scale className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma medição encontrada
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando uma nova medição de bioimpedância'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Medição
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMeasurements.map((measurement) => (
                <div
                  key={measurement.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {measurement.client?.name || 'Cliente não identificado'}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(measurement.measuredAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Scale className="h-4 w-4" />
                              <span>{measurement.equipment || 'InBody270'}</span>
                            </div>
                            {measurement.professional && (
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>
                                  {measurement.professional.firstName} {measurement.professional.lastName}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* Dados principais */}
                      <div className="text-right space-y-1">
                        <div className="text-sm text-gray-600">Peso</div>
                        <div className="font-semibold">{measurement.weight.toFixed(1)}kg</div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-sm text-gray-600">IMC</div>
                        <div className="font-semibold">{measurement.bmi.toFixed(1)}</div>
                        <Badge className={getBMIColor(measurement.bmi)}>
                          {getBMIClassification(measurement.bmi)}
                        </Badge>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-sm text-gray-600">PGC</div>
                        <div className="font-semibold">{measurement.bodyFatPercentage.toFixed(1)}%</div>
                        <Badge className={getClassificationColor(measurement.weightClassification)}>
                          {measurement.weightClassification || 'Normal'}
                        </Badge>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-sm text-gray-600">Pontuação</div>
                        <div className="font-semibold text-blue-600">
                          {measurement.inbodyScore || 0}/100
                        </div>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex space-x-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/bioimpedance/${measurement.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Resumo dos dados */}
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Água Corporal:</span>
                      <span className="ml-2 font-medium">{measurement.totalBodyWater.toFixed(1)}L</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Massa Muscular:</span>
                      <span className="ml-2 font-medium">{measurement.skeletalMuscleMass.toFixed(1)}kg</span>
                    </div>
                    <div>
                      <span className="text-gray-600">TMB:</span>
                      <span className="ml-2 font-medium">{measurement.basalMetabolicRate.toFixed(0)} kcal</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gordura Visceral:</span>
                      <span className="ml-2 font-medium">Nível {measurement.visceralFatLevel || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
