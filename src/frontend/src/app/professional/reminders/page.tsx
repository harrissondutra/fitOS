'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Mail, MessageSquare, Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Reminder {
  id: string;
  type: string;
  status: string;
  scheduledFor: string;
  sentAt?: string;
  appointment: {
    id: string;
    title: string;
    scheduledAt: string;
    client: {
      name: string;
      email?: string;
      phone?: string;
    };
  };
  createdAt: string;
}

const reminderTypes = [
  { value: '24h_before', label: '24 horas antes' },
  { value: '1h_before', label: '1 hora antes' },
  { value: '30min_before', label: '30 minutos antes' },
  { value: 'custom', label: 'Personalizado' },
];

const reminderStatuses = [
  { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  { value: 'sent', label: 'Enviado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  { value: 'failed', label: 'Falhou', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all');
  const [formData, setFormData] = useState({
    appointmentId: '',
    type: '24h_before',
    customHours: 24,
    customMinutes: 0,
    message: '',
    enabled: true,
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/appointment-reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Erro ao buscar lembretes:', error);
      toast.error('Erro ao carregar lembretes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingReminder 
        ? `/api/appointment-reminders/${editingReminder.id}`
        : '/api/appointment-reminders';
      
      const method = editingReminder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(
          editingReminder ? 'Lembrete atualizado com sucesso!' : 'Lembrete criado com sucesso!'
        );
        setShowCreateDialog(false);
        setEditingReminder(null);
        resetForm();
        fetchReminders();
      } else {
        throw new Error('Erro ao salvar lembrete');
      }
    } catch (error) {
      console.error('Erro ao salvar lembrete:', error);
      toast.error('Erro ao salvar lembrete');
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      appointmentId: reminder.appointment.id,
      type: reminder.type,
      customHours: 24,
      customMinutes: 0,
      message: '',
      enabled: true,
    });
    setShowCreateDialog(true);
  };

  const handleDelete = async (reminderId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lembrete?')) return;

    try {
      const response = await fetch(`/api/appointment-reminders/${reminderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Lembrete excluído com sucesso!');
        fetchReminders();
      } else {
        throw new Error('Erro ao excluir lembrete');
      }
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      toast.error('Erro ao excluir lembrete');
    }
  };

  const handleResend = async (reminderId: string) => {
    try {
      const response = await fetch(`/api/appointment-reminders/${reminderId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Lembrete reenviado com sucesso!');
        fetchReminders();
      } else {
        throw new Error('Erro ao reenviar lembrete');
      }
    } catch (error) {
      console.error('Erro ao reenviar lembrete:', error);
      toast.error('Erro ao reenviar lembrete');
    }
  };

  const resetForm = () => {
    setFormData({
      appointmentId: '',
      type: '24h_before',
      customHours: 24,
      customMinutes: 0,
      message: '',
      enabled: true,
    });
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingReminder(null);
    resetForm();
  };

  const filteredReminders = reminders.filter(reminder => {
    if (filter === 'all') return true;
    return reminder.status === filter;
  });

  const getStatusInfo = (status: string) => {
    return reminderStatuses.find(s => s.value === status) || reminderStatuses[0];
  };

  const getTypeLabel = (type: string) => {
    return reminderTypes.find(t => t.value === type)?.label || type;
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
          <h1 className="text-3xl font-bold">Lembretes</h1>
          <p className="text-muted-foreground">
            Gerencie lembretes automáticos de agendamentos
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Lembrete
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
                <p className="text-2xl font-bold">{reminders.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {reminders.filter(r => r.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enviados</p>
                <p className="text-2xl font-bold text-green-600">
                  {reminders.filter(r => r.status === 'sent').length}
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
                <p className="text-sm text-muted-foreground">Falharam</p>
                <p className="text-2xl font-bold text-red-600">
                  {reminders.filter(r => r.status === 'failed').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
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
          Todos ({reminders.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pendentes ({reminders.filter(r => r.status === 'pending').length})
        </Button>
        <Button
          variant={filter === 'sent' ? 'default' : 'outline'}
          onClick={() => setFilter('sent')}
        >
          Enviados ({reminders.filter(r => r.status === 'sent').length})
        </Button>
        <Button
          variant={filter === 'failed' ? 'default' : 'outline'}
          onClick={() => setFilter('failed')}
        >
          Falharam ({reminders.filter(r => r.status === 'failed').length})
        </Button>
      </div>

      {/* Reminders List */}
      <div className="space-y-4">
        {filteredReminders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum lembrete encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'Os lembretes aparecerão aqui quando forem criados.'
                  : `Nenhum lembrete com status "${getStatusInfo(filter).label}" encontrado.`
                }
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Lembrete
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredReminders.map((reminder) => {
            const statusInfo = getStatusInfo(reminder.status);
            const StatusIcon = reminder.status === 'sent' ? CheckCircle : 
                              reminder.status === 'failed' ? XCircle : 
                              AlertCircle;
            
            return (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{reminder.appointment.title}</h3>
                            <Badge className={statusInfo.color}>
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {getTypeLabel(reminder.type)} • {reminder.appointment.client.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        {reminder.status === 'failed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResend(reminder.id)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Reenviar
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(reminder)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(reminder.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="pl-11 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Agendado: {format(new Date(reminder.appointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Bell className="h-4 w-4" />
                        <span>
                          Lembrete: {format(new Date(reminder.scheduledFor), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      
                      {reminder.sentAt && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span>
                            Enviado: {format(new Date(reminder.sentAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      
                      {reminder.appointment.client.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span>{reminder.appointment.client.email}</span>
                        </div>
                      )}
                      
                      {reminder.appointment.client.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MessageSquare className="h-4 w-4" />
                          <span>{reminder.appointment.client.phone}</span>
                        </div>
                      )}
                    </div>
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
              {editingReminder ? 'Editar Lembrete' : 'Criar Novo Lembrete'}
            </DialogTitle>
            <DialogDescription>
              {editingReminder 
                ? 'Atualize as configurações do lembrete.'
                : 'Configure um lembrete automático para um agendamento.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentId">Agendamento *</Label>
              <Input
                id="appointmentId"
                value={formData.appointmentId}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentId: e.target.value }))}
                placeholder="ID do agendamento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Lembrete *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {reminderTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.type === 'custom' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customHours">Horas</Label>
                  <Input
                    id="customHours"
                    type="number"
                    min="0"
                    max="168"
                    value={formData.customHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, customHours: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="customMinutes">Minutos</Label>
                  <Input
                    id="customMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.customMinutes}
                    onChange={(e) => setFormData(prev => ({ ...prev, customMinutes: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem Personalizada</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Mensagem personalizada para o lembrete..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
              />
              <Label htmlFor="enabled">Ativo</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleDialogClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingReminder ? 'Atualizar' : 'Criar'} Lembrete
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
