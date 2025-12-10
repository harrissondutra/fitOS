'use client';

/**
 * Maternal-Child Assessment Page - Sprint 7
 * Avaliação nutricional gestacional e infantil com curvas WHO
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Baby, Heart, TrendingUp } from 'lucide-react';

export default function MaternalChildPage() {
  const [activeTab, setActiveTab] = useState<'maternal' | 'child'>('maternal');
  const [maternalData, setMaternalData] = useState({
    trimester: '',
    gestationalAge: '',
    currentWeight: '',
    initialWeight: '',
    height: '',
    bloodPressure: '',
    supplements: []
  });

  const [childData, setChildData] = useState({
    ageMonths: '',
    gender: 'male',
    weight: '',
    height: '',
    headCircum: '',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleMaternalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/nutrition/maternal-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maternalData)
      });

      if (!res.ok) throw new Error('Erro ao salvar avaliação');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setMaternalData({
        trimester: '',
        gestationalAge: '',
        currentWeight: '',
        initialWeight: '',
        height: '',
        bloodPressure: '',
        supplements: []
      });
    } catch (err) {
      alert('Erro ao salvar dados');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/nutrition/child-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(childData)
      });

      if (!res.ok) throw new Error('Erro ao salvar avaliação');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      setChildData({
        ageMonths: '',
        gender: 'male',
        weight: '',
        height: '',
        headCircum: '',
        notes: ''
      });
    } catch (err) {
      alert('Erro ao salvar dados');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
          <Baby className="h-10 w-10 text-primary" />
          Avaliação Materno-Infantil
        </h1>
        <p className="text-muted-foreground">
          Acompanhamento nutricional gestacional e infantil com curvas WHO
        </p>
      </div>

      {success && (
        <Alert className="mb-6">
          <AlertDescription>Avaliação salva com sucesso!</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="maternal">
            <Heart className="h-4 w-4 mr-2" />
            Avaliação Gestacional
          </TabsTrigger>
          <TabsTrigger value="child">
            <Baby className="h-4 w-4 mr-2" />
            Avaliação Infantil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="maternal">
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Gestacional</CardTitle>
              <CardDescription>
                Registre dados de acompanhamento da gestação
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleMaternalSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="trimester">Trimestre</Label>
                    <select
                      id="trimester"
                      className="w-full px-4 py-2 border rounded-md"
                      value={maternalData.trimester}
                      onChange={(e) => setMaternalData({ ...maternalData, trimester: e.target.value })}
                      required
                    >
                      <option value="">Selecione...</option>
                      <option value="1">1º Trimestre</option>
                      <option value="2">2º Trimestre</option>
                      <option value="3">3º Trimestre</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gestationalAge">Idade Gestacional (semanas)</Label>
                    <Input
                      id="gestationalAge"
                      type="number"
                      placeholder="Ex: 28"
                      value={maternalData.gestationalAge}
                      onChange={(e) => setMaternalData({ ...maternalData, gestationalAge: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialWeight">Peso Inicial (kg)</Label>
                    <Input
                      id="initialWeight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 65.5"
                      value={maternalData.initialWeight}
                      onChange={(e) => setMaternalData({ ...maternalData, initialWeight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentWeight">Peso Atual (kg)</Label>
                    <Input
                      id="currentWeight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 72.0"
                      value={maternalData.currentWeight}
                      onChange={(e) => setMaternalData({ ...maternalData, currentWeight: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Ex: 165"
                      value={maternalData.height}
                      onChange={(e) => setMaternalData({ ...maternalData, height: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bloodPressure">Pressão Arterial</Label>
                  <Input
                    id="bloodPressure"
                    type="text"
                    placeholder="Ex: 120/80"
                    value={maternalData.bloodPressure}
                    onChange={(e) => setMaternalData({ ...maternalData, bloodPressure: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Suplementos (separados por vírgula)</Label>
                  <Input
                    type="text"
                    placeholder="Ex: Ácido fólico, Ferro, D3"
                    onChange={(e) => setMaternalData({ 
                      ...maternalData, 
                      supplements: e.target.value.split(',').map(s => s.trim()) 
                    })}
                  />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Salvando...' : 'Salvar Avaliação Gestacional'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="child">
          <Card>
            <CardHeader>
              <CardTitle>Avaliação Infantil</CardTitle>
              <CardDescription>
                Registre dados de crescimento e desenvolvimento com curvas WHO
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleChildSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ageMonths">Idade (meses)</Label>
                    <Input
                      id="ageMonths"
                      type="number"
                      placeholder="Ex: 6"
                      value={childData.ageMonths}
                      onChange={(e) => setChildData({ ...childData, ageMonths: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <select
                      id="gender"
                      className="w-full px-4 py-2 border rounded-md"
                      value={childData.gender}
                      onChange={(e) => setChildData({ ...childData, gender: e.target.value })}
                      required
                    >
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 7.5"
                      value={childData.weight}
                      onChange={(e) => setChildData({ ...childData, weight: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 65.5"
                      value={childData.height}
                      onChange={(e) => setChildData({ ...childData, height: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="headCircum">Perímetro Cefálico (cm)</Label>
                    <Input
                      id="headCircum"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 42.3"
                      value={childData.headCircum}
                      onChange={(e) => setChildData({ ...childData, headCircum: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <textarea
                    id="notes"
                    className="w-full px-4 py-2 border rounded-md min-h-[100px]"
                    placeholder="Notas adicionais sobre a avaliação..."
                    value={childData.notes}
                    onChange={(e) => setChildData({ ...childData, notes: e.target.value })}
                  />
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Os dados serão calculados automaticamente com base nas curvas de crescimento WHO.
                  </AlertDescription>
                </Alert>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Salvando...' : 'Salvar Avaliação Infantil'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




