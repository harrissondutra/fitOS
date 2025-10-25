'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock, Calendar, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AvailabilitySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

interface AvailabilityBlock {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  createdAt: string;
}

const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

const timeSlots = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00'
];

export default function AvailabilityPage() {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSlotDialog, setShowSlotDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);
  const [editingBlock, setEditingBlock] = useState<AvailabilityBlock | null>(null);
  const [slotFormData, setSlotFormData] = useState({
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '18:00',
    isActive: true,
  });
  const [blockFormData, setBlockFormData] = useState({
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
  });

  useEffect(() => {
    fetchAvailability();
  }, []);

  const fetchAvailability = async () => {
    try {
      setIsLoading(true);
      const [slotsResponse, blocksResponse] = await Promise.all([
        fetch('/api/availability/slots'),
        fetch('/api/availability/blocks')
      ]);
      
      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json();
        setAvailabilitySlots(slotsData.slots || []);
      }
      
      if (blocksResponse.ok) {
        const blocksData = await blocksResponse.json();
        setAvailabilityBlocks(blocksData.blocks || []);
      }
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      toast.error('Erro ao carregar disponibilidade');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingSlot 
        ? `/api/availability/slots/${editingSlot.id}`
        : '/api/availability/slots';
      
      const method = editingSlot ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(slotFormData),
      });

      if (response.ok) {
        toast.success(
          editingSlot ? 'Horário atualizado com sucesso!' : 'Horário criado com sucesso!'
        );
        setShowSlotDialog(false);
        setEditingSlot(null);
        resetSlotForm();
        fetchAvailability();
      } else {
        throw new Error('Erro ao salvar horário');
      }
    } catch (error) {
      console.error('Erro ao salvar horário:', error);
      toast.error('Erro ao salvar horário');
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBlock 
        ? `/api/availability/blocks/${editingBlock.id}`
        : '/api/availability/blocks';
      
      const method = editingBlock ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blockFormData),
      });

      if (response.ok) {
        toast.success(
          editingBlock ? 'Bloqueio atualizado com sucesso!' : 'Bloqueio criado com sucesso!'
        );
        setShowBlockDialog(false);
        setEditingBlock(null);
        resetBlockForm();
        fetchAvailability();
      } else {
        throw new Error('Erro ao salvar bloqueio');
      }
    } catch (error) {
      console.error('Erro ao salvar bloqueio:', error);
      toast.error('Erro ao salvar bloqueio');
    }
  };

  const handleEditSlot = (slot: AvailabilitySlot) => {
    setEditingSlot(slot);
    setSlotFormData({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
    });
    setShowSlotDialog(true);
  };

  const handleEditBlock = (block: AvailabilityBlock) => {
    setEditingBlock(block);
    setBlockFormData({
      startDate: block.startDate,
      endDate: block.endDate,
      reason: block.reason,
    });
    setShowBlockDialog(true);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!confirm('Tem certeza que deseja excluir este horário?')) return;

    try {
      const response = await fetch(`/api/availability/slots/${slotId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Horário excluído com sucesso!');
        fetchAvailability();
      } else {
        throw new Error('Erro ao excluir horário');
      }
    } catch (error) {
      console.error('Erro ao excluir horário:', error);
      toast.error('Erro ao excluir horário');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Tem certeza que deseja excluir este bloqueio?')) return;

    try {
      const response = await fetch(`/api/availability/blocks/${blockId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Bloqueio excluído com sucesso!');
        fetchAvailability();
      } else {
        throw new Error('Erro ao excluir bloqueio');
      }
    } catch (error) {
      console.error('Erro ao excluir bloqueio:', error);
      toast.error('Erro ao excluir bloqueio');
    }
  };

  const resetSlotForm = () => {
    setSlotFormData({
      dayOfWeek: 1,
      startTime: '08:00',
      endTime: '18:00',
      isActive: true,
    });
  };

  const resetBlockForm = () => {
    setBlockFormData({
      startDate: new Date(),
      endDate: new Date(),
      reason: '',
    });
  };

  const handleSlotDialogClose = () => {
    setShowSlotDialog(false);
    setEditingSlot(null);
    resetSlotForm();
  };

  const handleBlockDialogClose = () => {
    setShowBlockDialog(false);
    setEditingBlock(null);
    resetBlockForm();
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
          <h1 className="text-3xl font-bold">Disponibilidade</h1>
          <p className="text-muted-foreground">
            Configure seus horários de atendimento e bloqueios
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => handleBlockDialogClose()}>
                <X className="h-4 w-4 mr-2" />
                Bloquear Período
              </Button>
            </DialogTrigger>
          </Dialog>
          
          <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => handleSlotDialogClose()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Horário
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Weekly Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Horários Semanais
          </CardTitle>
          <CardDescription>
            Configure seus horários de atendimento para cada dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {daysOfWeek.map((day) => {
              const daySlots = availabilitySlots.filter(slot => slot.dayOfWeek === day.value);
              return (
                <div key={day.value} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-24 font-medium">{day.label}</div>
                    <div className="flex gap-2">
                      {daySlots.length === 0 ? (
                        <span className="text-muted-foreground text-sm">Sem horários</span>
                      ) : (
                        daySlots.map((slot) => (
                          <Badge
                            key={slot.id}
                            variant={slot.isActive ? 'default' : 'secondary'}
                            className="flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {slot.startTime} - {slot.endTime}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSlotFormData(prev => ({ ...prev, dayOfWeek: day.value }));
                      setShowSlotDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Availability Blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />
            Bloqueios de Disponibilidade
          </CardTitle>
          <CardDescription>
            Bloqueie períodos específicos (férias, almoço, indisponibilidade)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {availabilityBlocks.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum bloqueio encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione bloqueios para períodos de indisponibilidade.
                </p>
                <Button onClick={() => setShowBlockDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Bloqueio
                </Button>
              </div>
            ) : (
              availabilityBlocks.map((block) => (
                <div key={block.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {format(block.startDate, 'dd/MM/yyyy', { locale: ptBR })} - 
                        {format(block.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <Badge variant="outline">{block.reason}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditBlock(block)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slot Dialog */}
      <Dialog open={showSlotDialog} onOpenChange={setShowSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Editar Horário' : 'Adicionar Horário'}
            </DialogTitle>
            <DialogDescription>
              Configure o horário de atendimento para {daysOfWeek.find(d => d.value === slotFormData.dayOfWeek)?.label}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSlotSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dayOfWeek">Dia da Semana</Label>
              <Select
                value={slotFormData.dayOfWeek.toString()}
                onValueChange={(value) => setSlotFormData(prev => ({ ...prev, dayOfWeek: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Horário Início</Label>
                <Select
                  value={slotFormData.startTime}
                  onValueChange={(value) => setSlotFormData(prev => ({ ...prev, startTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime">Horário Fim</Label>
                <Select
                  value={slotFormData.endTime}
                  onValueChange={(value) => setSlotFormData(prev => ({ ...prev, endTime: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={slotFormData.isActive}
                onCheckedChange={(checked) => setSlotFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="isActive">Ativo</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleSlotDialogClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingSlot ? 'Atualizar' : 'Adicionar'} Horário
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBlock ? 'Editar Bloqueio' : 'Adicionar Bloqueio'}
            </DialogTitle>
            <DialogDescription>
              Bloqueie um período específico de indisponibilidade
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(blockFormData.startDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={blockFormData.startDate}
                      onSelect={(date) => date && setBlockFormData(prev => ({ ...prev, startDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="space-y-2">
                <Label>Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      {format(blockFormData.endDate, 'dd/MM/yyyy', { locale: ptBR })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={blockFormData.endDate}
                      onSelect={(date) => date && setBlockFormData(prev => ({ ...prev, endDate: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo do Bloqueio</Label>
              <Input
                id="reason"
                value={blockFormData.reason}
                onChange={(e) => setBlockFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Ex: Férias, Almoço, Indisponível"
                required
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleBlockDialogClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingBlock ? 'Atualizar' : 'Adicionar'} Bloqueio
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
