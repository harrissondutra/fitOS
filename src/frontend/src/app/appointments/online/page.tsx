"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar, Video, Clock, User, ExternalLink, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

interface OnlineAppointment {
  id: string;
  professionalType: string;
  appointmentType: string;
  scheduledAt: string;
  duration: number;
  platform: string;
  meetingLink?: string;
  status: string;
  professional?: {
    name: string;
    email: string;
  };
}

export default function OnlineAppointmentsPage() {
  const [appointments, setAppointments] = useState<OnlineAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    professionalId: "",
    professionalType: "",
    appointmentType: "",
    scheduledAt: "",
    duration: 60,
    platform: "zoom"
  });

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointments/online');

      if (!response.ok) throw new Error('Failed to fetch appointments');

      const data = await response.json();

      if (data.success) {
        setAppointments(data.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch('/api/appointments/online', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create appointment');

      const data = await response.json();

      if (data.success) {
        toast.success('Agendamento criado com sucesso!');
        setShowCreateForm(false);
        setFormData({
          professionalId: "",
          professionalType: "",
          appointmentType: "",
          scheduledAt: "",
          duration: 60,
          platform: "zoom"
        });
        await fetchAppointments();
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      toast.error('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'zoom':
        return '📹';
      case 'meet':
        return '🎥';
      case 'teams':
        return '👥';
      default:
        return '📞';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500';
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Atendimentos Online</h1>
          <p className="text-muted-foreground">Gerencie suas consultas online</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Agendamento
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Agendamento</CardTitle>
            <CardDescription>Agende uma consulta online com um profissional</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de Profissional</Label>
                  <Select value={formData.professionalType} onValueChange={(value) => setFormData(prev => ({ ...prev, professionalType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nutritionist">Nutricionista</SelectItem>
                      <SelectItem value="personal_trainer">Personal Trainer</SelectItem>
                      <SelectItem value="physiotherapist">Fisioterapeuta</SelectItem>
                      <SelectItem value="psychologist">Psicólogo</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tipo de Atendimento</Label>
                  <Select value={formData.appointmentType} onValueChange={(value) => setFormData(prev => ({ ...prev, appointmentType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial_consultation">Consulta Inicial</SelectItem>
                      <SelectItem value="followup">Acompanhamento</SelectItem>
                      <SelectItem value="assessment">Avaliação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Data e Hora</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    min={15}
                    max={240}
                    required
                  />
                </div>

                <div>
                  <Label>Plataforma</Label>
                  <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="meet">Google Meet</SelectItem>
                      <SelectItem value="teams">Microsoft Teams</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Criando..." : "Criar Agendamento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : appointments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{appointment.professionalType}</CardTitle>
                    <CardDescription className="mt-2">
                      {appointment.appointmentType}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(appointment.status)}>
                    {appointment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  <span>{format(new Date(appointment.scheduledAt), "PPP p")}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{appointment.duration} minutos</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4" />
                  <span>{getPlatformIcon(appointment.platform)} {appointment.platform}</span>
                </div>

                {appointment.professional && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4" />
                    <span>{appointment.professional.name}</span>
                  </div>
                )}

                {appointment.meetingLink && (
                  <Button
                    variant="default"
                    className="w-full"
                    onClick={() => window.open(appointment.meetingLink, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Entrar na Reunião
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Você ainda não tem agendamentos online
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

