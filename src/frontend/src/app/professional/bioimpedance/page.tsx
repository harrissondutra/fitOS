'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Download, TrendingUp, TrendingDown, Scale, Activity, Target, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, subDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface BioimpedanceMeasurement {
  id: string;
  clientId: string;
  measuredAt: string;
  data: {
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female';
    bodyFat: number;
    muscleMass: number;
    boneMass: number;
    waterPercentage: number;
    visceralFat: number;
    subcutaneousFat: number;
    bmi: number;
    bmr: number;
    metabolicAge: number;
    bodyDensity: number;
    waistCircumference: number;
    hipCircumference: number;
    chestCircumference: number;
    armCircumference: number;
    thighCircumference: number;
  };
  client: {
    id: string;
    name: string;
    email: string;
  };
}

interface Member {
  id: string;
  name: string;
  email: string;
}

export default function BioimpedancePage() {
  const [measurements, setMeasurements] = useState<BioimpedanceMeasurement[]>([]);
  const [clients, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedMeasurement, setSelectedMeasurement] = useState<BioimpedanceMeasurement | null>(null);
  const [showComparisonDialog, setShowComparisonDialog] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState({
    clientId: '',
    weight: '',
    height: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    bodyFat: '',
    muscleMass: '',
    boneMass: '',
    waterPercentage: '',
    visceralFat: '',
    subcutaneousFat: '',
    waistCircumference: '',
    hipCircumference: '',
    chestCircumference: '',
    armCircumference: '',
    thighCircumference: '',
    notes: ''
  });

  useEffect(() => {
    loadMeasurements();
    loadMembers();
  }, []);

  const loadMeasurements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bioimpedance');
      const data = await response.json();

      if (data.measurements) {
        setMeasurements(data.measurements);
      }
    } catch (error) {
      console.error('Erro ao carregar medições:', error);
      toast.error('Erro ao carregar medições');
    } finally {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    try {
      const response = await fetch('/api/clients');
      const data = await response.json();

      if (data.clients) {
        setMembers(data.clients);
      }
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
    }
  };

  const handleCreateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const measurementData = {
        ...formData,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        age: parseInt(formData.age),
        bodyFat: parseFloat(formData.bodyFat),
        muscleMass: parseFloat(formData.muscleMass),
        boneMass: parseFloat(formData.boneMass),
        waterPercentage: parseFloat(formData.waterPercentage),
        visceralFat: parseFloat(formData.visceralFat),
        subcutaneousFat: parseFloat(formData.subcutaneousFat),
        waistCircumference: parseFloat(formData.waistCircumference),
        hipCircumference: parseFloat(formData.hipCircumference),
        chestCircumference: parseFloat(formData.chestCircumference),
        armCircumference: parseFloat(formData.armCircumference),
        thighCircumference: parseFloat(formData.thighCircumference)
      };

      const response = await fetch('/api/bioimpedance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          measurement: measurementData,
          professionalId: 'current-user'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Medição registrada com sucesso!');
        setShowCreateDialog(false);
        setFormData({
          clientId: '',
          weight: '',
          height: '',
          age: '',
          gender: 'male',
          bodyFat: '',
          muscleMass: '',
          boneMass: '',
          waterPercentage: '',
          visceralFat: '',
          subcutaneousFat: '',
          waistCircumference: '',
          hipCircumference: '',
          chestCircumference: '',
          armCircumference: '',
          thighCircumference: '',
          notes: ''
        });
        loadMeasurements();
      } else {
        toast.error(data.error || 'Erro ao registrar medição');
      }
    } catch (error) {
      console.error('Erro ao registrar medição:', error);
      toast.error('Erro ao registrar medição');
    }
  };

  const handleCompareMeasurements = async (measurement1Id: string, measurement2Id: string) => {
    try {
      const response = await fetch(`/api/bioimpedance/compare/${measurement1Id}/${measurement2Id}`);
      const data = await response.json();

      if (data.comparison) {
        setComparisonData(data.comparison);
        setShowComparisonDialog(true);
      }
    } catch (error) {
      console.error('Erro ao comparar medições:', error);
      toast.error('Erro ao comparar medições');
    }
  };

  const getMemberEvolution = (clientId: string) => {
    return measurements
      .filter(m => m.clientId === clientId)
      .sort((a, b) => new Date(a.measuredAt).getTime() - new Date(b.measuredAt).getTime());
  };

  const getRecentMeasurements = () => {
    return measurements
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime())
      .slice(0, 5);
  };

  const getStats = () => {
    const total = measurements.length;
    const thisMonth = measurements.filter(m => 
      new Date(m.measuredAt) >= subMonths(new Date(), 1)
    ).length;
    const thisWeek = measurements.filter(m => 
      new Date(m.measuredAt) >= subDays(new Date(), 7)
    ).length;

    return { total, thisMonth, thisWeek };
  };

  const getChartData = (clientId: string) => {
    const evolution = getMemberEvolution(clientId);
    return evolution.map(m => ({
      date: format(new Date(m.measuredAt), 'dd/MM'),
      weight: m.data.weight,
      bodyFat: m.data.bodyFat,
      muscleMass: m.data.muscleMass,
      bmi: m.data.bmi
    }));
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bioimpedância</h1>
          <p className="text-muted-foreground">
            Gerencie medições biométricas e acompanhe a evolução dos clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Medição
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Medição de Bioimpedância</DialogTitle>
                <DialogDescription>
                  Registre uma nova medição biométrica para um cliente
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMeasurement} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientId">Cliente</Label>
                    <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender} onValueChange={(value: any) => setFormData({...formData, gender: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Básicos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({...formData, height: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="age">Idade (anos)</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Composição Corporal</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bodyFat">Gordura Corporal (%)</Label>
                      <Input
                        id="bodyFat"
                        type="number"
                        step="0.1"
                        value={formData.bodyFat}
                        onChange={(e) => setFormData({...formData, bodyFat: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                      <Input
                        id="muscleMass"
                        type="number"
                        step="0.1"
                        value={formData.muscleMass}
                        onChange={(e) => setFormData({...formData, muscleMass: e.target.value})}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="boneMass">Massa Óssea (kg)</Label>
                      <Input
                        id="boneMass"
                        type="number"
                        step="0.1"
                        value={formData.boneMass}
                        onChange={(e) => setFormData({...formData, boneMass: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="waterPercentage">Água (%)</Label>
                      <Input
                        id="waterPercentage"
                        type="number"
                        step="0.1"
                        value={formData.waterPercentage}
                        onChange={(e) => setFormData({...formData, waterPercentage: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="visceralFat">Gordura Visceral</Label>
                      <Input
                        id="visceralFat"
                        type="number"
                        step="0.1"
                        value={formData.visceralFat}
                        onChange={(e) => setFormData({...formData, visceralFat: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subcutaneousFat">Gordura Subcutânea (kg)</Label>
                      <Input
                        id="subcutaneousFat"
                        type="number"
                        step="0.1"
                        value={formData.subcutaneousFat}
                        onChange={(e) => setFormData({...formData, subcutaneousFat: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Circunferências</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="waistCircumference">Cintura (cm)</Label>
                      <Input
                        id="waistCircumference"
                        type="number"
                        step="0.1"
                        value={formData.waistCircumference}
                        onChange={(e) => setFormData({...formData, waistCircumference: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hipCircumference">Quadril (cm)</Label>
                      <Input
                        id="hipCircumference"
                        type="number"
                        step="0.1"
                        value={formData.hipCircumference}
                        onChange={(e) => setFormData({...formData, hipCircumference: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chestCircumference">Peito (cm)</Label>
                      <Input
                        id="chestCircumference"
                        type="number"
                        step="0.1"
                        value={formData.chestCircumference}
                        onChange={(e) => setFormData({...formData, chestCircumference: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="armCircumference">Braço (cm)</Label>
                      <Input
                        id="armCircumference"
                        type="number"
                        step="0.1"
                        value={formData.armCircumference}
                        onChange={(e) => setFormData({...formData, armCircumference: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thighCircumference">Coxa (cm)</Label>
                      <Input
                        id="thighCircumference"
                        type="number"
                        step="0.1"
                        value={formData.thighCircumference}
                        onChange={(e) => setFormData({...formData, thighCircumference: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Observações adicionais sobre a medição"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    Registrar Medição
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Medições</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisMonth} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisWeek} esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Com medições registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média IMC</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {measurements.length > 0 
                ? (measurements.reduce((acc, m) => acc + m.data.bmi, 0) / measurements.length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Índice de Massa Corporal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Measurements */}
      <Card>
        <CardHeader>
          <CardTitle>Medições Recentes</CardTitle>
          <CardDescription>
            Últimas medições registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead>IMC</TableHead>
                  <TableHead>Gordura (%)</TableHead>
                  <TableHead>Massa Muscular</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getRecentMeasurements().map((measurement) => (
                  <TableRow key={measurement.id}>
                    <TableCell className="font-medium">
                      {measurement.client.name}
                    </TableCell>
                    <TableCell>
                      {format(new Date(measurement.measuredAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{measurement.data.weight} kg</TableCell>
                    <TableCell>{measurement.data.bmi.toFixed(1)}</TableCell>
                    <TableCell>{measurement.data.bodyFat.toFixed(1)}%</TableCell>
                    <TableCell>{measurement.data.muscleMass.toFixed(1)} kg</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedMeasurement(measurement)}
                        >
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Implementar comparação
                            toast.info('Funcionalidade de comparação em desenvolvimento');
                          }}
                        >
                          Comparar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Evolution Chart */}
      {selectedMember && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução do Cliente</CardTitle>
            <CardDescription>
              Gráfico de evolução das medições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData(selectedMember)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="bodyFat" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="muscleMass" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Member Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Cliente para Análise</CardTitle>
          <CardDescription>
            Escolha um cliente para ver sua evolução detalhada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
