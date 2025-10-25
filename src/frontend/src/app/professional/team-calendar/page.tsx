'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Users, Filter, Plus, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TeamAppointment {
  id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  status: string;
  professional: {
    id: string;
    name: string;
    color: string;
  };
  client: {
    id: string;
    name: string;
  };
}

const viewTypes = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'day', label: 'Dia' },
];

const statusColors = {
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  no_show: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
};

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30', '22:00'
];

export default function TeamCalendarPage() {
  const [appointments, setAppointments] = useState<TeamAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<'week' | 'month' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<string>('all');
  const [professionals, setProfessionals] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<TeamAppointment | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        startDate: startOfWeek(currentDate).toISOString(),
        endDate: endOfWeek(currentDate).toISOString(),
        professionalId: selectedProfessional,
      });
      
      const response = await fetch(`/api/appointments/team?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments || []);
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, selectedProfessional]);

  useEffect(() => {
    fetchAppointments();
    fetchProfessionals();
  }, [fetchAppointments]);

  const fetchProfessionals = async () => {
    try {
      const response = await fetch('/api/users?role=TRAINER');
      if (response.ok) {
        const data = await response.json();
        const professionalsData = data.users.map((user: any, index: number) => ({
          id: user.id,
          name: user.name,
          color: `hsl(${(index * 137.5) % 360}, 70%, 50%)`
        }));
        setProfessionals(professionalsData);
      }
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Segunda-feira
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt);
      return isSameDay(aptDate, date);
    });
  };

  const getAppointmentsForTimeSlot = (date: Date, timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduledAt);
      const aptEnd = new Date(aptDate);
      aptEnd.setMinutes(aptEnd.getMinutes() + apt.duration);

      return isSameDay(aptDate, date) && 
             aptDate < slotEnd && 
             aptEnd > slotStart;
    });
  };

  const getAppointmentStyle = (appointment: TeamAppointment) => {
    const professional = professionals.find(p => p.id === appointment.professional.id);
    return {
      backgroundColor: professional?.color || '#3b82f6',
      color: 'white',
      borderLeft: `4px solid ${professional?.color || '#3b82f6'}`,
    };
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
          <h1 className="text-3xl font-bold">Calendário da Equipe</h1>
          <p className="text-muted-foreground">
            Visualize todos os agendamentos da equipe em um só lugar
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <h2 className="text-lg font-semibold">
                {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <Select value={viewType} onValueChange={(value: any) => setViewType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {viewTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Profissionais</SelectItem>
                  {professionals.map((professional) => (
                    <SelectItem key={professional.id} value={professional.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: professional.color }}
                        />
                        {professional.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card>
        <CardContent className="p-0">
          {viewType === 'week' && (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Header with days */}
                <div className="grid grid-cols-8 border-b">
                  <div className="p-4 font-medium text-muted-foreground">Horário</div>
                  {getWeekDays().map((day) => (
                    <div key={day.toISOString()} className="p-4 text-center border-l">
                      <div className="font-medium">
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(day, 'dd/MM', { locale: ptBR })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time slots */}
                <div className="grid grid-cols-8">
                  {timeSlots.map((timeSlot) => (
                    <div key={timeSlot} className="contents">
                      <div className="p-2 text-sm text-muted-foreground border-b">
                        {timeSlot}
                      </div>
                      {getWeekDays().map((day) => (
                        <div key={`${day.toISOString()}-${timeSlot}`} className="p-1 border-b border-l min-h-[60px]">
                          {getAppointmentsForTimeSlot(day, timeSlot).map((appointment) => (
                            <div
                              key={appointment.id}
                              className="text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80"
                              style={getAppointmentStyle(appointment)}
                              onClick={() => setSelectedAppointment(appointment)}
                            >
                              <div className="font-medium truncate">
                                {appointment.title}
                              </div>
                              <div className="opacity-90 truncate">
                                {appointment.client.name}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewType === 'day' && (
            <div className="p-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">
                  {format(currentDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
                </h3>
              </div>
              
              <div className="space-y-2">
                {timeSlots.map((timeSlot) => {
                  const appointments = getAppointmentsForTimeSlot(currentDate, timeSlot);
                  return (
                    <div key={timeSlot} className="flex items-center gap-4 p-2 border-b">
                      <div className="w-16 text-sm text-muted-foreground">
                        {timeSlot}
                      </div>
                      <div className="flex-1 flex gap-2">
                        {appointments.map((appointment) => (
                          <div
                            key={appointment.id}
                            className="flex-1 p-2 rounded cursor-pointer hover:opacity-80"
                            style={getAppointmentStyle(appointment)}
                            onClick={() => setSelectedAppointment(appointment)}
                          >
                            <div className="font-medium">{appointment.title}</div>
                            <div className="text-sm opacity-90">
                              {appointment.client.name} • {appointment.professional.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointment Details Modal */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Agendamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre o agendamento selecionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Título</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.title}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={statusColors[selectedAppointment.status as keyof typeof statusColors]}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Data e Hora</Label>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedAppointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Duração</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.duration} minutos
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.client.name}
                  </p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Profissional</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedAppointment.professional.name}
                  </p>
                </div>
                
                {selectedAppointment.location && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Local</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.location}
                    </p>
                  </div>
                )}
                
                {selectedAppointment.description && (
                  <div className="col-span-2">
                    <Label className="text-sm font-medium">Descrição</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedAppointment.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
