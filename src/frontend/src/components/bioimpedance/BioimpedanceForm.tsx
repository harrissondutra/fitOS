'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BioimpedanceMeasurementFormData } from '@/shared/types';

interface BioimpedanceFormProps {
  onSubmit: (data: BioimpedanceMeasurementFormData) => void;
  loading?: boolean;
  initialData?: Partial<BioimpedanceMeasurementFormData>;
}

export default function BioimpedanceForm({ 
  onSubmit, 
  loading = false, 
  initialData = {} 
}: BioimpedanceFormProps) {
  const [formData, setFormData] = useState<BioimpedanceMeasurementFormData>({
    // Dados básicos
    height: initialData.height || 0,
    age: initialData.age || 0,
    gender: initialData.gender || 'male',
    weight: initialData.weight || 0,
    
    // Composição corporal
    totalBodyWater: initialData.totalBodyWater || 0,
    protein: initialData.protein || 0,
    minerals: initialData.minerals || 0,
    bodyFatMass: initialData.bodyFatMass || 0,
    skeletalMuscleMass: initialData.skeletalMuscleMass || 0,
    
    // Obesidade
    bmi: initialData.bmi || 0,
    bodyFatPercentage: initialData.bodyFatPercentage || 0,
    waistHipRatio: initialData.waistHipRatio || 0,
    visceralFatLevel: initialData.visceralFatLevel || 0,
    
    // Dados adicionais
    fatFreeMass: initialData.fatFreeMass || 0,
    basalMetabolicRate: initialData.basalMetabolicRate || 0,
    obesityDegree: initialData.obesityDegree || 0,
    skeletalMuscleIndex: initialData.skeletalMuscleIndex || 0,
    recommendedCalories: initialData.recommendedCalories || 0,
    
    // Controles
    idealWeight: initialData.idealWeight || 0,
    weightControl: initialData.weightControl || 0,
    fatControl: initialData.fatControl || 0,
    muscleControl: initialData.muscleControl || 0,
    
    // Análise segmentar - Massa magra
    leftArmMuscle: initialData.leftArmMuscle || 0,
    rightArmMuscle: initialData.rightArmMuscle || 0,
    trunkMuscle: initialData.trunkMuscle || 0,
    leftLegMuscle: initialData.leftLegMuscle || 0,
    rightLegMuscle: initialData.rightLegMuscle || 0,
    
    // Análise segmentar - Gordura
    leftArmFat: initialData.leftArmFat || 0,
    rightArmFat: initialData.rightArmFat || 0,
    trunkFat: initialData.trunkFat || 0,
    leftLegFat: initialData.leftLegFat || 0,
    rightLegFat: initialData.rightLegFat || 0,
    
    // Impedância bioelétrica - 20kHz
    impedance20kRightArm: initialData.impedance20kRightArm || 0,
    impedance20kLeftArm: initialData.impedance20kLeftArm || 0,
    impedance20kTrunk: initialData.impedance20kTrunk || 0,
    impedance20kRightLeg: initialData.impedance20kRightLeg || 0,
    impedance20kLeftLeg: initialData.impedance20kLeftLeg || 0,
    
    // Impedância bioelétrica - 100kHz
    impedance100kRightArm: initialData.impedance100kRightArm || 0,
    impedance100kLeftArm: initialData.impedance100kLeftArm || 0,
    impedance100kTrunk: initialData.impedance100kTrunk || 0,
    impedance100kRightLeg: initialData.impedance100kRightLeg || 0,
    impedance100kLeftLeg: initialData.impedance100kLeftLeg || 0,
    
    // Dados adicionais
    equipment: initialData.equipment || 'InBody270',
    operator: initialData.operator || '',
    notes: initialData.notes || '',
    qrCode: initialData.qrCode || ''
  });

  const handleInputChange = (field: keyof BioimpedanceMeasurementFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBMI = () => {
    if (formData.height > 0 && formData.weight > 0) {
      const heightInMeters = formData.height / 100;
      const bmi = formData.weight / (heightInMeters * heightInMeters);
      handleInputChange('bmi', Math.round(bmi * 100) / 100);
    }
  };

  const calculateIdealWeight = () => {
    if (formData.height > 0) {
      const heightInMeters = formData.height / 100;
      // Fórmula simples para peso ideal (IMC 22)
      const idealWeight = 22 * (heightInMeters * heightInMeters);
      handleInputChange('idealWeight', Math.round(idealWeight * 10) / 10);
    }
  };

  const calculateControls = () => {
    if (formData.idealWeight > 0) {
      const weightControl = formData.weight - formData.idealWeight;
      const fatControl = formData.bodyFatMass - (formData.idealWeight * 0.15); // Assumindo 15% de gordura ideal
      const muscleControl = formData.skeletalMuscleMass - (formData.idealWeight * 0.45); // Assumindo 45% de massa muscular ideal
      
      handleInputChange('weightControl', Math.round(weightControl * 10) / 10);
      handleInputChange('fatControl', Math.round(fatControl * 10) / 10);
      handleInputChange('muscleControl', Math.round(muscleControl * 10) / 10);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Medição de Bioimpedância</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básicos</TabsTrigger>
                <TabsTrigger value="composition">Composição</TabsTrigger>
                <TabsTrigger value="segmental">Segmentar</TabsTrigger>
                <TabsTrigger value="impedance">Impedância</TabsTrigger>
              </TabsList>

              {/* Dados Básicos */}
              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                      onBlur={() => {
                        calculateBMI();
                        calculateIdealWeight();
                        calculateControls();
                      }}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Idade (anos)</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={formData.weight}
                      onChange={(e) => handleInputChange('weight', parseFloat(e.target.value))}
                      onBlur={() => {
                        calculateBMI();
                        calculateControls();
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bmi">IMC (calculado automaticamente)</Label>
                    <Input
                      id="bmi"
                      type="number"
                      step="0.1"
                      value={formData.bmi}
                      onChange={(e) => handleInputChange('bmi', parseFloat(e.target.value))}
                      readOnly
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="idealWeight">Peso Ideal (calculado automaticamente)</Label>
                    <Input
                      id="idealWeight"
                      type="number"
                      step="0.1"
                      value={formData.idealWeight}
                      onChange={(e) => handleInputChange('idealWeight', parseFloat(e.target.value))}
                      readOnly
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipment">Equipamento</Label>
                  <Input
                    id="equipment"
                    value={formData.equipment}
                    onChange={(e) => handleInputChange('equipment', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="operator">Operador</Label>
                  <Input
                    id="operator"
                    value={formData.operator}
                    onChange={(e) => handleInputChange('operator', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                  />
                </div>
              </TabsContent>

              {/* Composição Corporal */}
              <TabsContent value="composition" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalBodyWater">Água Corporal Total (L)</Label>
                    <Input
                      id="totalBodyWater"
                      type="number"
                      step="0.1"
                      value={formData.totalBodyWater}
                      onChange={(e) => handleInputChange('totalBodyWater', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="protein">Proteína (kg)</Label>
                    <Input
                      id="protein"
                      type="number"
                      step="0.1"
                      value={formData.protein}
                      onChange={(e) => handleInputChange('protein', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minerals">Minerais (kg)</Label>
                    <Input
                      id="minerals"
                      type="number"
                      step="0.1"
                      value={formData.minerals}
                      onChange={(e) => handleInputChange('minerals', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyFatMass">Massa de Gordura (kg)</Label>
                    <Input
                      id="bodyFatMass"
                      type="number"
                      step="0.1"
                      value={formData.bodyFatMass}
                      onChange={(e) => handleInputChange('bodyFatMass', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skeletalMuscleMass">Massa Muscular Esquelética (kg)</Label>
                    <Input
                      id="skeletalMuscleMass"
                      type="number"
                      step="0.1"
                      value={formData.skeletalMuscleMass}
                      onChange={(e) => handleInputChange('skeletalMuscleMass', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodyFatPercentage">PGC - Porcentual de Gordura Corporal (%)</Label>
                    <Input
                      id="bodyFatPercentage"
                      type="number"
                      step="0.1"
                      value={formData.bodyFatPercentage}
                      onChange={(e) => handleInputChange('bodyFatPercentage', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="waistHipRatio">Relação Cintura-Quadril</Label>
                    <Input
                      id="waistHipRatio"
                      type="number"
                      step="0.01"
                      value={formData.waistHipRatio}
                      onChange={(e) => handleInputChange('waistHipRatio', parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="visceralFatLevel">Nível de Gordura Visceral (1-59)</Label>
                    <Input
                      id="visceralFatLevel"
                      type="number"
                      min="1"
                      max="59"
                      value={formData.visceralFatLevel}
                      onChange={(e) => handleInputChange('visceralFatLevel', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fatFreeMass">Massa Livre de Gordura (kg)</Label>
                    <Input
                      id="fatFreeMass"
                      type="number"
                      step="0.1"
                      value={formData.fatFreeMass}
                      onChange={(e) => handleInputChange('fatFreeMass', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="basalMetabolicRate">Taxa Metabólica Basal (kcal)</Label>
                    <Input
                      id="basalMetabolicRate"
                      type="number"
                      value={formData.basalMetabolicRate}
                      onChange={(e) => handleInputChange('basalMetabolicRate', parseInt(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="obesityDegree">Grau de Obesidade (%)</Label>
                    <Input
                      id="obesityDegree"
                      type="number"
                      step="0.1"
                      value={formData.obesityDegree}
                      onChange={(e) => handleInputChange('obesityDegree', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="skeletalMuscleIndex">SMI - Skeletal Muscle Index (kg/m²)</Label>
                    <Input
                      id="skeletalMuscleIndex"
                      type="number"
                      step="0.1"
                      value={formData.skeletalMuscleIndex}
                      onChange={(e) => handleInputChange('skeletalMuscleIndex', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recommendedCalories">Ingestão Calórica Recomendada (kcal)</Label>
                  <Input
                    id="recommendedCalories"
                    type="number"
                    value={formData.recommendedCalories}
                    onChange={(e) => handleInputChange('recommendedCalories', parseInt(e.target.value))}
                    required
                  />
                </div>
              </TabsContent>

              {/* Análise Segmentar */}
              <TabsContent value="segmental" className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-4">Massa Muscular (kg)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leftArmMuscle">Braço Esquerdo</Label>
                      <Input
                        id="leftArmMuscle"
                        type="number"
                        step="0.1"
                        value={formData.leftArmMuscle}
                        onChange={(e) => handleInputChange('leftArmMuscle', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rightArmMuscle">Braço Direito</Label>
                      <Input
                        id="rightArmMuscle"
                        type="number"
                        step="0.1"
                        value={formData.rightArmMuscle}
                        onChange={(e) => handleInputChange('rightArmMuscle', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trunkMuscle">Tronco</Label>
                      <Input
                        id="trunkMuscle"
                        type="number"
                        step="0.1"
                        value={formData.trunkMuscle}
                        onChange={(e) => handleInputChange('trunkMuscle', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leftLegMuscle">Perna Esquerda</Label>
                      <Input
                        id="leftLegMuscle"
                        type="number"
                        step="0.1"
                        value={formData.leftLegMuscle}
                        onChange={(e) => handleInputChange('leftLegMuscle', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rightLegMuscle">Perna Direita</Label>
                      <Input
                        id="rightLegMuscle"
                        type="number"
                        step="0.1"
                        value={formData.rightLegMuscle}
                        onChange={(e) => handleInputChange('rightLegMuscle', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-4">Gordura (kg)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="leftArmFat">Braço Esquerdo</Label>
                      <Input
                        id="leftArmFat"
                        type="number"
                        step="0.1"
                        value={formData.leftArmFat}
                        onChange={(e) => handleInputChange('leftArmFat', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rightArmFat">Braço Direito</Label>
                      <Input
                        id="rightArmFat"
                        type="number"
                        step="0.1"
                        value={formData.rightArmFat}
                        onChange={(e) => handleInputChange('rightArmFat', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trunkFat">Tronco</Label>
                      <Input
                        id="trunkFat"
                        type="number"
                        step="0.1"
                        value={formData.trunkFat}
                        onChange={(e) => handleInputChange('trunkFat', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="leftLegFat">Perna Esquerda</Label>
                      <Input
                        id="leftLegFat"
                        type="number"
                        step="0.1"
                        value={formData.leftLegFat}
                        onChange={(e) => handleInputChange('leftLegFat', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rightLegFat">Perna Direita</Label>
                      <Input
                        id="rightLegFat"
                        type="number"
                        step="0.1"
                        value={formData.rightLegFat}
                        onChange={(e) => handleInputChange('rightLegFat', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Impedância Bioelétrica */}
              <TabsContent value="impedance" className="space-y-6">
                <div>
                  <h4 className="font-semibold text-lg mb-4">Impedância 20kHz (Ω)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="impedance20kRightArm">Braço Direito</Label>
                      <Input
                        id="impedance20kRightArm"
                        type="number"
                        step="0.1"
                        value={formData.impedance20kRightArm}
                        onChange={(e) => handleInputChange('impedance20kRightArm', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance20kLeftArm">Braço Esquerdo</Label>
                      <Input
                        id="impedance20kLeftArm"
                        type="number"
                        step="0.1"
                        value={formData.impedance20kLeftArm}
                        onChange={(e) => handleInputChange('impedance20kLeftArm', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance20kTrunk">Tronco</Label>
                      <Input
                        id="impedance20kTrunk"
                        type="number"
                        step="0.1"
                        value={formData.impedance20kTrunk}
                        onChange={(e) => handleInputChange('impedance20kTrunk', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance20kRightLeg">Perna Direita</Label>
                      <Input
                        id="impedance20kRightLeg"
                        type="number"
                        step="0.1"
                        value={formData.impedance20kRightLeg}
                        onChange={(e) => handleInputChange('impedance20kRightLeg', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance20kLeftLeg">Perna Esquerda</Label>
                      <Input
                        id="impedance20kLeftLeg"
                        type="number"
                        step="0.1"
                        value={formData.impedance20kLeftLeg}
                        onChange={(e) => handleInputChange('impedance20kLeftLeg', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-lg mb-4">Impedância 100kHz (Ω)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="impedance100kRightArm">Braço Direito</Label>
                      <Input
                        id="impedance100kRightArm"
                        type="number"
                        step="0.1"
                        value={formData.impedance100kRightArm}
                        onChange={(e) => handleInputChange('impedance100kRightArm', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance100kLeftArm">Braço Esquerdo</Label>
                      <Input
                        id="impedance100kLeftArm"
                        type="number"
                        step="0.1"
                        value={formData.impedance100kLeftArm}
                        onChange={(e) => handleInputChange('impedance100kLeftArm', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance100kTrunk">Tronco</Label>
                      <Input
                        id="impedance100kTrunk"
                        type="number"
                        step="0.1"
                        value={formData.impedance100kTrunk}
                        onChange={(e) => handleInputChange('impedance100kTrunk', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance100kRightLeg">Perna Direita</Label>
                      <Input
                        id="impedance100kRightLeg"
                        type="number"
                        step="0.1"
                        value={formData.impedance100kRightLeg}
                        onChange={(e) => handleInputChange('impedance100kRightLeg', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="impedance100kLeftLeg">Perna Esquerda</Label>
                      <Input
                        id="impedance100kLeftLeg"
                        type="number"
                        step="0.1"
                        value={formData.impedance100kLeftLeg}
                        onChange={(e) => handleInputChange('impedance100kLeftLeg', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Medição'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
