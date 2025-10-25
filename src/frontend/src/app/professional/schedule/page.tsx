'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Users, Plus, Filter, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  location?: string;
  isVirtual: boolean;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  googleCalendarSynced: boolean;
  syncError?: string;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export default function ProfessionalSchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAvailabilityDialog, setShowAvailabilityDialog] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'consultation',
    title: '',
    description: '',
    scheduledAt: '',
    duration: 60,
    location: '',
    isVirtual: false,
    notes: ''
  });

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const startDate = view === 'day' 
        ? selectedDate 
        : startOfWeek(selectedDate, { weekStartsOn: 1 });
      const endDate = view === 'day' 
        ? selectedDate 
        : endOfWeek(selectedDate, { weekStartsOn: 1 });

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(selectedProfessional && { professionalId: selectedProfessional })
      });

      const response = await fetch(`/api/appointments?${params}`);
      const data = await response.json();

      if (data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, view, selectedProfessional]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const loadAvailabilitySlots = async (professionalId: string, date: Date) => {
    try {
      const params = new URLSearchParams({
        date: date.toISOString(),
        duration: '60'
      });

      const response = await fetch(`/api/appointments/availability/${professionalId}?${params}`);
      const data = await response.json();

      if (data.slots) {
        setAvailabilitySlots(data.slots);
      }
    } catch (error) {
      console.error('Erro ao carregar horários disponíveis:', error);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          professionalId: selectedProfessional || 'current-user'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Agendamento criado com sucesso!');
        setShowCreateDialog(false);
        setFormData({
          clientId: '',
          type: 'consultation',
          title: '',
          description: '',
          scheduledAt: '',
          duration: 60,
          location: '',
          isVirtual: false,
          notes: ''
        });
        loadAppointments();
      } else {
        toast.error(data.error || 'Erro ao criar agendamento');
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      case 'no_show': return 'Não compareceu';
      default: return status;
    }
  };

  const renderDayView = () => {
    const dayAppointments = appointments.filter(appointment => 
      isSameDay(parseISO(appointment.scheduledAt), selectedDate)
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAvailabilityDialog(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Ver Horários
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {dayAppointments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Nenhum agendamento para este dia</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((appointment) => (
              <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{appointment.title}</h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                        {appointment.googleCalendarSynced && (
                          <Badge variant="outline" className="text-green-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            Google
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(appointment.scheduledAt), "HH:mm")} - 
                        {format(addDays(parseISO(appointment.scheduledAt), appointment.duration / 1440), "HH:mm")}
                        {' '}({appointment.duration} min)
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {appointment.client.name}
                        </div>
                        {appointment.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {appointment.location}
                          </div>
                        )}
                        {appointment.isVirtual && (
                          <Badge variant="secondary">Virtual</Badge>
                        )}
                      </div>
                      {appointment.description && (
                        <p className="text-sm">{appointment.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDays = Array.from({ length: 7 }, (_, i) => 
      addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), i)
    );

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Semana de {format(weekDays[0], "dd/MM")} a {format(weekDays[6], "dd/MM/yyyy")}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {weekDays.map((day) => {
            const dayAppointments = appointments.filter(appointment => 
              isSameDay(parseISO(appointment.scheduledAt), day)
            );

            return (
              <Card key={day.toISOString()} className="min-h-[400px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {format(day, "EEE", { locale: ptBR })}
                  </CardTitle>
                  <CardDescription>
                    {format(day, "dd/MM")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900"
                    >
                      <div className="font-medium">{appointment.title}</div>
                      <div className="text-muted-foreground">
                        {format(parseISO(appointment.scheduledAt), "HH:mm")}
                      </div>
                      <div className="text-muted-foreground">
                        {appointment.client.name}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </div>

        <CalendarComponent
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border"
        />
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Sidebar-12 Style */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-xl font-semibold">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">Gerencie sua agenda</p>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {/* View Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Visualização</Label>
            <Select value={view} onValueChange={(value: any) => setView(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Dia</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mês</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Professional Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Profissional</Label>
            <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os profissionais" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="current">Eu</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Hoje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Agendados:</span>
                <span className="font-medium">
                  {appointments.filter(a => 
                    isSameDay(parseISO(a.scheduledAt), new Date()) && 
                    a.status === 'scheduled'
                  ).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Concluídos:</span>
                <span className="font-medium">
                  {appointments.filter(a => 
                    isSameDay(parseISO(a.scheduledAt), new Date()) && 
                    a.status === 'completed'
                  ).length}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button 
              className="w-full" 
              onClick={() => setShowCreateDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowAvailabilityDialog(true)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Horários
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Agenda</h2>
              <p className="text-muted-foreground">
                {view === 'day' && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {view === 'week' && `Semana de ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "dd/MM")} a ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "dd/MM/yyyy")}`}
                {view === 'month' && format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {view === 'day' && renderDayView()}
              {view === 'week' && renderWeekView()}
              {view === 'month' && renderMonthView()}
            </>
          )}
        </div>
      </div>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Crie um novo agendamento para um cliente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAppointment} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client1">João Silva</SelectItem>
                    <SelectItem value="client2">Maria Santos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consulta</SelectItem>
                    <SelectItem value="training">Treino</SelectItem>
                    <SelectItem value="nutrition">Nutrição</SelectItem>
                    <SelectItem value="bioimpedance">Bioimpedância</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Consulta Nutricional"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrição do agendamento"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Data e Hora</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duração (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                  min="15"
                  max="480"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Sala 1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isVirtual"
                checked={formData.isVirtual}
                onChange={(e) => setFormData({...formData, isVirtual: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="isVirtual">Agendamento virtual</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observações adicionais"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                Criar Agendamento
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Availability Dialog */}
      <Dialog open={showAvailabilityDialog} onOpenChange={setShowAvailabilityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Horários Disponíveis</DialogTitle>
            <DialogDescription>
              Horários disponíveis para {format(selectedDate, "dd/MM/yyyy")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {availabilitySlots.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum horário disponível para esta data
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {availabilitySlots.map((slot, index) => (
                  <Button
                    key={index}
                    variant={slot.available ? "outline" : "secondary"}
                    disabled={!slot.available}
                    className="text-sm"
                  >
                    {slot.startTime}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
