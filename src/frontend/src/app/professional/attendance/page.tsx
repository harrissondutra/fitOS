'use client';

import { useState, useEffect } from 'react';
import { Calendar, User, Clock, MapPin, Loader2, CheckCircle, XCircle, AlertCircle, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attendance {
  id: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: 'scheduled' | 'checked_in' | 'completed' | 'no_show';
  createdAt: string;
  appointment: {
    id: string;
    title: string;
    scheduledAt: string;
    location?: string;
    client: {
      id: string;
      name: string;
      phone?: string;
    };
  };
  client: {
    id: string;
    name: string;
  };
}

const statusConfig = {
  scheduled: {
    label: 'Agendado',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: Calendar
  },
  checked_in: {
    label: 'Presente',
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: CheckCircle
  },
  completed: {
    label: 'Concluído',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    icon: CheckCircle
  },
  no_show: {
    label: 'Faltou',
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: XCircle
  }
};

export default function AttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'checked_in' | 'completed' | 'no_show'>('all');
  const [formData, setFormData] = useState({
    status: 'checked_in',
  });

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/attendance');
      if (response.ok) {
        const data = await response.json();
        setAttendances(data.attendances || []);
      }
    } catch (error) {
      console.error('Erro ao buscar presenças:', error);
      toast.error('Erro ao carregar presenças');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async (attendance: Attendance) => {
    try {
      const response = await fetch(`/api/attendance/${attendance.id}/check-in`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'checked_in' }),
      });

      if (response.ok) {
        toast.success('Check-in realizado com sucesso!');
        fetchAttendances();
      } else {
        throw new Error('Erro ao fazer check-in');
      }
    } catch (error) {
      console.error('Erro ao fazer check-in:', error);
      toast.error('Erro ao fazer check-in');
    }
  };

  const handleCheckOut = async (attendance: Attendance) => {
    try {
      const response = await fetch(`/api/attendance/${attendance.id}/check-out`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (response.ok) {
        toast.success('Check-out realizado com sucesso!');
        fetchAttendances();
      } else {
        throw new Error('Erro ao fazer check-out');
      }
    } catch (error) {
      console.error('Erro ao fazer check-out:', error);
      toast.error('Erro ao fazer check-out');
    }
  };

  const handleStatusUpdate = async (attendanceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Status atualizado com sucesso!');
        fetchAttendances();
      } else {
        throw new Error('Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredAttendances = attendances.filter(attendance => {
    if (filter === 'all') return true;
    return attendance.status === filter;
  });

  const getStats = () => {
    const total = attendances.length;
    const checkedIn = attendances.filter(a => a.status === 'checked_in').length;
    const completed = attendances.filter(a => a.status === 'completed').length;
    const noShow = attendances.filter(a => a.status === 'no_show').length;
    const attendanceRate = total > 0 ? Math.round(((checkedIn + completed) / total) * 100) : 0;

    return { total, checkedIn, completed, noShow, attendanceRate };
  };

  const { total, checkedIn, completed, noShow, attendanceRate } = getStats();

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
          <h1 className="text-3xl font-bold">Presença</h1>
          <p className="text-muted-foreground">
            Gerencie check-in e check-out dos clientes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Presentes</p>
                <p className="text-2xl font-bold text-green-600">{checkedIn}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold text-purple-600">{completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faltaram</p>
                <p className="text-2xl font-bold text-red-600">{noShow}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-600" />
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
          Todos ({total})
        </Button>
        <Button
          variant={filter === 'scheduled' ? 'default' : 'outline'}
          onClick={() => setFilter('scheduled')}
        >
          Agendados ({attendances.filter(a => a.status === 'scheduled').length})
        </Button>
        <Button
          variant={filter === 'checked_in' ? 'default' : 'outline'}
          onClick={() => setFilter('checked_in')}
        >
          Presentes ({checkedIn})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          onClick={() => setFilter('completed')}
        >
          Concluídos ({completed})
        </Button>
        <Button
          variant={filter === 'no_show' ? 'default' : 'outline'}
          onClick={() => setFilter('no_show')}
        >
          Faltaram ({noShow})
        </Button>
      </div>

      {/* Attendances List */}
      <div className="space-y-4">
        {filteredAttendances.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <LogIn className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma presença encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {filter === 'all' 
                  ? 'As presenças dos clientes aparecerão aqui quando houver agendamentos.'
                  : `Nenhuma presença com status "${statusConfig[filter as keyof typeof statusConfig]?.label}" encontrada.`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAttendances.map((attendance) => {
            const statusInfo = statusConfig[attendance.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo?.icon || AlertCircle;
            
            return (
              <Card key={attendance.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${statusInfo?.color}`}>
                          <StatusIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{attendance.appointment.title}</h3>
                            <Badge className={statusInfo?.color}>
                              {statusInfo?.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {attendance.client.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {attendance.status === 'scheduled' && (
                          <Button
                            size="sm"
                            onClick={() => handleCheckIn(attendance)}
                          >
                            <LogIn className="h-4 w-4 mr-2" />
                            Check-in
                          </Button>
                        )}
                        
                        {attendance.status === 'checked_in' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckOut(attendance)}
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Check-out
                          </Button>
                        )}
                        
                        {attendance.status === 'scheduled' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusUpdate(attendance.id, 'no_show')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Marcar Faltou
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Times */}
                    <div className="pl-11 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          Agendado: {format(new Date(attendance.appointment.scheduledAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      
                      {attendance.checkInAt && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                          <LogIn className="h-4 w-4" />
                          <span>
                            Check-in: {format(new Date(attendance.checkInAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      
                      {attendance.checkOutAt && (
                        <div className="flex items-center gap-2 text-sm text-purple-600">
                          <LogOut className="h-4 w-4" />
                          <span>
                            Check-out: {format(new Date(attendance.checkOutAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      
                      {attendance.appointment.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{attendance.appointment.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Client Info */}
                    <div className="pl-11">
                      <Separator className="my-3" />
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{attendance.appointment.client.name}</span>
                        {attendance.appointment.client.phone && (
                          <>
                            <span>•</span>
                            <span>{attendance.appointment.client.phone}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
