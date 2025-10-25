'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Target, TrendingUp, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientGoal {
  id: string;
  clientId: string;
  client: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  description?: string;
  type: string;
  target: number;
  current: number;
  unit: string;
  startDate: string;
  targetDate: string;
  status: 'active' | 'achieved' | 'cancelled';
  achievedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const goalTypes = [
  { value: 'weight_loss', label: 'Perda de Peso' },
  { value: 'muscle_gain', label: 'Ganho de Massa' },
  { value: 'performance', label: 'Performance' },
  { value: 'endurance', label: 'Resistência' },
  { value: 'flexibility', label: 'Flexibilidade' },
  { value: 'other', label: 'Outro' },
];

const units = [
  { value: 'kg', label: 'Quilogramas (kg)' },
  { value: '%', label: 'Percentual (%)' },
  { value: 'cm', label: 'Centímetros (cm)' },
  { value: 'min', label: 'Minutos' },
  { value: 'reps', label: 'Repetições' },
  { value: 'other', label: 'Outro' },
];

export default function ClientGoalsPage() {
  const [goals, setGoals] = useState<ClientGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<ClientGoal | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'achieved' | 'cancelled'>('all');
  const [formData, setFormData] = useState({
    clientId: '',
    title: '',
    description: '',
    type: '',
    target: 0,
    current: 0,
    unit: 'kg',
    startDate: new Date(),
    targetDate: new Date(),
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/client-goals');
      if (response.ok) {
        const data = await response.json();
        setGoals(data.goals || []);
      }
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      toast.error('Erro ao carregar metas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingGoal 
        ? `/api/client-goals/${editingGoal.id}`
        : '/api/client-goals';
      
      const method = editingGoal ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingGoal ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!'
        );
        setShowCreateDialog(false);
        setEditingGoal(null);
        resetForm();
        fetchGoals();
      } else {
        throw new Error('Erro ao salvar meta');
      }
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast.error('Erro ao salvar meta');
    }
  };

  const handleEdit = (goal: ClientGoal) => {
    setEditingGoal(goal);
    setFormData({
      clientId: goal.clientId,
      title: goal.title,
      description: goal.description || '',
      type: goal.type,
      target: goal.target,
      current: goal.current,
      unit: goal.unit,
      startDate: new Date(goal.startDate),
      targetDate: new Date(goal.targetDate),
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    try {
      const response = await fetch(`/api/client-goals/${goalId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Meta excluída com sucesso!');
        fetchGoals();
      } else {
        throw new Error('Erro ao excluir meta');
      }
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      toast.error('Erro ao excluir meta');
    }
  };

  const handleUpdateProgress = async (goalId: string, newCurrent: number) => {
    try {
      const response = await fetch(`/api/client-goals/${goalId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ current: newCurrent }),
      });

      if (response.ok) {
        toast.success('Progresso atualizado com sucesso!');
        fetchGoals();
      } else {
        throw new Error('Erro ao atualizar progresso');
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      toast.error('Erro ao atualizar progresso');
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      title: '',
      description: '',
      type: '',
      target: 0,
      current: 0,
      unit: 'kg',
      startDate: new Date(),
      targetDate: new Date(),
    });
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingGoal(null);
    resetForm();
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    return goal.status === filter;
  });

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'achieved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'achieved': return 'Conquistada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconhecida';
    }
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
          <h1 className="text-3xl font-bold">Metas dos Clientes</h1>
          <p className="text-muted-foreground">
            Acompanhe e gerencie os objetivos dos seus clientes
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{goals.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ativas</p>
                <p className="text-2xl font-bold text-blue-600">
                  {goals.filter(g => g.status === 'active').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conquistadas</p>
                <p className="text-2xl font-bold text-green-600">
                  {goals.filter(g => g.status === 'achieved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-purple-600">
                  {goals.length > 0 
                    ? Math.round((goals.filter(g => g.status === 'achieved').length / goals.length) * 100)
                    : 0}%
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Todas ({goals.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          onClick={() => setFilter('active')}
        >
          Ativas ({goals.filter(g => g.status === 'active').length})
        </Button>
        <Button
          variant={filter === 'achieved' ? 'default' : 'outline'}
          onClick={() => setFilter('achieved')}
        >
          Conquistadas ({goals.filter(g => g.status === 'achieved').length})
        </Button>
        <Button
          variant={filter === 'cancelled' ? 'default' : 'outline'}
          onClick={() => setFilter('cancelled')}
        >
          Canceladas ({goals.filter(g => g.status === 'cancelled').length})
        </Button>
      </div>

      {/* Goals List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma meta encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all' 
                    ? 'Crie a primeira meta para começar a acompanhar o progresso dos clientes.'
                    : `Nenhuma meta com status "${getStatusLabel(filter)}" encontrada.`
                  }
                </p>
                {filter === 'all' && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeira Meta
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const progressPercentage = getProgressPercentage(goal.current, goal.target);
            const daysRemaining = differenceInDays(new Date(goal.targetDate), new Date());
            const isOverdue = daysRemaining < 0 && goal.status === 'active';
            
            return (
              <Card key={goal.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <CardDescription>
                        {goal.client.name} • {goalTypes.find(t => t.value === goal.type)?.label || goal.type}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(goal)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(goal.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span className="font-medium">
                          {goal.current} / {goal.target} {goal.unit}
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                      <div className="text-right text-sm text-muted-foreground">
                        {progressPercentage.toFixed(1)}% concluído
                      </div>
                    </div>

                    {/* Status and Dates */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(goal.status)}>
                          {getStatusLabel(goal.status)}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">
                            Atrasada
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Meta: {format(new Date(goal.targetDate), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      
                      {daysRemaining > 0 && goal.status === 'active' && (
                        <div className="text-sm text-muted-foreground">
                          {daysRemaining} dias restantes
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {goal.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {goal.description}
                      </p>
                    )}

                    {/* Update Progress Button */}
                    {goal.status === 'active' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          const newCurrent = prompt(
                            `Atualizar progresso para ${goal.client.name}:\n\nMeta: ${goal.target} ${goal.unit}\nAtual: ${goal.current} ${goal.unit}\n\nNovo valor:`,
                            goal.current.toString()
                          );
                          if (newCurrent && !isNaN(Number(newCurrent))) {
                            handleUpdateProgress(goal.id, Number(newCurrent));
                          }
                        }}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Atualizar Progresso
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
            </DialogTitle>
            <DialogDescription>
              {editingGoal 
                ? 'Atualize as informações da meta do cliente.'
                : 'Defina uma nova meta para acompanhar o progresso do cliente.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Meta *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Perder 5kg"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva a meta em detalhes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="target">Valor Alvo *</Label>
                <Input
                  id="target"
                  type="number"
                  step="0.1"
                  value={formData.target}
                  onChange={(e) => setFormData(prev => ({ ...prev, target: parseFloat(e.target.value) }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="current">Valor Atual</Label>
                <Input
                  id="current"
                  type="number"
                  step="0.1"
                  value={formData.current}
                  onChange={(e) => setFormData(prev => ({ ...prev, current: parseFloat(e.target.value) }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade *</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(formData.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Data Meta</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(formData.targetDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.targetDate}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, targetDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingGoal ? 'Atualizar' : 'Criar'} Meta
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
