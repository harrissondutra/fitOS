import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { GoogleCalendarService } from './google-calendar.service';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

const prisma = getPrismaClient();

export interface CreateAppointmentData {
  tenantId: string;
  professionalId: string;
  clientId: string;
  type: 'consultation' | 'training' | 'nutrition' | 'bioimpedance';
  title: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  location?: string;
  isVirtual?: boolean;
  notes?: string;
}

export interface UpdateAppointmentData {
  title?: string;
  description?: string;
  scheduledAt?: Date;
  duration?: number;
  location?: string;
  isVirtual?: boolean;
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  cancellationReason?: string;
}

export interface AppointmentFilters {
  tenantId: string;
  professionalId?: string;
  clientId?: string;
  status?: string;
  type?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
}

export class SchedulingService {
  private prisma: PrismaClient;
  private googleCalendarService: GoogleCalendarService;
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor() {
    this.prisma = prisma; // reuse singleton defined above
    this.googleCalendarService = new GoogleCalendarService();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  /**
   * Cria novo agendamento
   */
  async createAppointment(data: CreateAppointmentData, userId: string): Promise<{
    success: boolean;
    appointment?: any;
    error?: string;
  }> {
    try {
      // Verifica disponibilidade
      const isAvailable = await this.checkAvailability(
        data.tenantId,
        data.professionalId,
        data.scheduledAt,
        data.duration
      );

      if (!isAvailable) {
        return {
          success: false,
          error: 'Horário não disponível para este profissional'
        };
      }

      // Cria agendamento
      const appointment = await this.prisma.appointment.create({
        data: {
          ...data,
          status: 'scheduled'
        },
        include: {
          professional: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Tenta sincronizar com Google Calendar do cliente
      await this.syncWithGoogleCalendar(appointment);

      // Cria lembretes automáticos
      await this.createReminders(appointment.id, data.scheduledAt);

      // Cria registro de presença
      await this.prisma.attendance.create({
        data: {
          appointmentId: appointment.id,
          clientId: data.clientId,
          tenantId: data.tenantId,
          status: 'scheduled'
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: data.tenantId,
        userId,
        action: 'create',
        entityType: 'appointment',
        entityId: appointment.id,
        changes: { after: appointment }
      });

      // Notificação
      await this.notificationService.create({
        userId: data.professionalId,
        tenantId: data.tenantId,
          type: 'info',
        title: 'Novo Agendamento',
        message: `Agendamento criado: ${data.title} - ${data.scheduledAt.toLocaleString()}`,
        data: { appointmentId: appointment.id }
      });

      return { success: true, appointment };
    } catch (error: any) {
      console.error('Erro ao criar agendamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza agendamento
   */
  async updateAppointment(
    appointmentId: string,
    data: UpdateAppointmentData,
    userId: string
  ): Promise<{ success: boolean; appointment?: any; error?: string }> {
    try {
      const existingAppointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!existingAppointment) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      // Verifica disponibilidade se mudou horário
      if (data.scheduledAt && data.scheduledAt !== existingAppointment.scheduledAt) {
        const isAvailable = await this.checkAvailability(
          existingAppointment.tenantId,
          existingAppointment.professionalId,
          data.scheduledAt,
          data.duration || existingAppointment.duration
        );

        if (!isAvailable) {
          return {
            success: false,
            error: 'Novo horário não disponível para este profissional'
          };
        }
      }

      const updatedAppointment = await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          ...data,
          ...(data.status === 'cancelled' && { cancelledAt: new Date() })
        },
        include: {
          professional: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Atualiza Google Calendar se necessário
      if (data.scheduledAt || data.title || data.description) {
        await this.syncWithGoogleCalendar(updatedAppointment);
      }

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: existingAppointment.tenantId,
        userId,
        action: 'update',
        entityType: 'appointment',
        entityId: appointmentId,
        changes: { before: existingAppointment, after: updatedAppointment }
      });

      // Notificação
      await this.notificationService.create({
        userId: existingAppointment.professionalId,
        tenantId: existingAppointment.tenantId,
          type: 'info',
        title: 'Agendamento Atualizado',
        message: `Agendamento atualizado: ${updatedAppointment.title}`,
        data: { appointmentId: updatedAppointment.id }
      });

      return { success: true, appointment: updatedAppointment };
    } catch (error: any) {
      console.error('Erro ao atualizar agendamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cancela agendamento
   */
  async cancelAppointment(
    appointmentId: string,
    reason: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId }
      });

      if (!appointment) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'cancelled',
          // cancellationReason: reason,
          // cancelledAt: new Date()
        }
      });

      // Remove do Google Calendar
      if (appointment.googleEventId) {
        await this.googleCalendarService.deleteEvent(
          appointment.professionalId,
          appointment.tenantId,
          appointment.googleEventId || ''
        );
      }

      // Cancela lembretes pendentes
      await this.prisma.appointmentReminder.updateMany({
        where: {
          appointmentId,
          status: 'pending'
        },
        data: { status: 'cancelled' }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: appointment.tenantId,
        userId,
        action: 'update',
        entityType: 'appointment',
        entityId: appointmentId,
        changes: { 
          before: appointment, 
          after: { ...appointment, status: 'cancelled', cancellationReason: reason } 
        }
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erro ao cancelar agendamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista agendamentos com filtros
   */
  async getAppointments(filters: AppointmentFilters): Promise<{
    success: boolean;
    appointments?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const where: any = {
        tenantId: filters.tenantId
      };

      if (filters.professionalId) {
        where.professionalId = filters.professionalId;
      }

      if (filters.clientId) {
        where.clientId = filters.clientId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.startDate || filters.endDate) {
        where.scheduledAt = {};
        if (filters.startDate) {
          where.scheduledAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.scheduledAt.lte = filters.endDate;
        }
      }

      const [appointments, total] = await Promise.all([
        this.prisma.appointment.findMany({
          where,
          include: {
            professional: {
              select: { id: true, name: true, email: true }
            },
            client: {
              select: { id: true, name: true, email: true, phone: true }
            },
            tenant: {
              select: { id: true, name: true }
            },
            attendance: true,
            review: true,
            _count: {
              select: { comments: true }
            }
          },
          orderBy: { scheduledAt: 'asc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        this.prisma.appointment.count({ where })
      ]);

      return { success: true, appointments, total };
    } catch (error: any) {
      console.error('Erro ao listar agendamentos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém agendamento por ID
   */
  async getAppointmentById(appointmentId: string): Promise<{
    success: boolean;
    appointment?: any;
    error?: string;
  }> {
    try {
      const appointment = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          professional: {
            select: { id: true, name: true, email: true }
          },
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          tenant: {
            select: { id: true, name: true }
          },
          attendance: true,
          review: true,
          comments: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'asc' }
          },
          reminders: {
            where: { status: 'pending' },
            orderBy: { scheduledFor: 'asc' }
          }
        }
      });

      if (!appointment) {
        return { success: false, error: 'Agendamento não encontrado' };
      }

      return { success: true, appointment };
    } catch (error: any) {
      console.error('Erro ao obter agendamento:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica disponibilidade de horário
   */
  async checkAvailability(
    tenantId: string,
    professionalId: string,
    scheduledAt: Date,
    duration: number
  ): Promise<boolean> {
    try {
      const endTime = new Date(scheduledAt.getTime() + duration * 60000);
      const dayOfWeek = scheduledAt.getDay();

      // Verifica se o profissional tem disponibilidade neste dia
      const availability = await this.prisma.professionalAvailability.findFirst({
        where: {
          tenantId,
          professionalId,
          dayOfWeek,
          isActive: true
        }
      });

      if (!availability) {
        return false;
      }

      // Verifica se está dentro do horário de trabalho
      const startTimeStr = scheduledAt.toTimeString().slice(0, 5);
      const endTimeStr = endTime.toTimeString().slice(0, 5);

      if (startTimeStr < availability.startTime || endTimeStr > availability.endTime) {
        return false;
      }

      // Verifica se não há bloqueios de disponibilidade
      const hasBlock = await this.prisma.availabilityBlock.findFirst({
        where: {
          tenantId,
          professionalId,
          startDate: { lte: scheduledAt },
          endDate: { gte: endTime }
        }
      });

      if (hasBlock) {
        return false;
      }

      // Verifica se não há conflitos com outros agendamentos
      const conflictingAppointment = await prisma.appointment.findFirst({
        where: {
          tenantId,
          professionalId,
          status: { in: ['scheduled', 'completed'] },
          OR: [
            {
              scheduledAt: {
                gte: scheduledAt,
                lt: endTime
              }
            },
            {
              scheduledAt: {
                lt: scheduledAt
              },
              duration: {
                gte: duration
              }
            }
          ]
        }
      });

      return !conflictingAppointment;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return false;
    }
  }

  /**
   * Obtém horários disponíveis para um profissional em uma data
   */
  async getAvailableSlots(
    tenantId: string,
    professionalId: string,
    date: Date,
    duration: number = 60
  ): Promise<AvailabilitySlot[]> {
    try {
      const dayOfWeek = date.getDay();
      const availability = await this.prisma.professionalAvailability.findFirst({
        where: {
          tenantId,
          professionalId,
          dayOfWeek,
          isActive: true
        }
      });

      if (!availability) {
        return [];
      }

      const slots: AvailabilitySlot[] = [];
      const startHour = parseInt(availability.startTime.split(':')[0]);
      const endHour = parseInt(availability.endTime.split(':')[0]);
      const startMinute = parseInt(availability.startTime.split(':')[1]);
      const endMinute = parseInt(availability.endTime.split(':')[1]);

      const startTime = new Date(date);
      startTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);

      // Gera slots de 30 em 30 minutos
      for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
        const slotEnd = new Date(time.getTime() + duration * 60000);
        
        if (slotEnd <= endTime) {
          const isAvailable = await this.checkAvailability(
            tenantId,
            professionalId,
            time,
            duration
          );

          slots.push({
            startTime: time.toTimeString().slice(0, 5),
            endTime: slotEnd.toTimeString().slice(0, 5),
            available: isAvailable
          });
        }
      }

      return slots;
    } catch (error) {
      console.error('Erro ao obter horários disponíveis:', error);
      return [];
    }
  }

  /**
   * Sincroniza agendamento com Google Calendar
   */
  private async syncWithGoogleCalendar(appointment: any): Promise<void> {
    try {
      const isConnected = true; // Simplificado por enquanto
      
      if (!isConnected) {
        return;
      }

      const event = {
        title: appointment.title,
        summary: appointment.title,
        description: appointment.description,
        start: {
          dateTime: appointment.scheduledAt.toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        end: {
          dateTime: new Date(
            appointment.scheduledAt.getTime() + appointment.duration * 60000
          ).toISOString(),
          timeZone: 'America/Sao_Paulo'
        },
        location: appointment.location
      };

      if (appointment.googleEventId) {
        await this.googleCalendarService.updateEvent(
          appointment.professionalId,
          appointment.tenantId,
          appointment.googleEventId || '',
          event
        );
      } else {
        const result = await this.googleCalendarService.createEvent(
          appointment.professionalId,
          appointment.tenantId,
          event
        );

        if (result.success && result.eventId) {
          await this.prisma.appointment.update({
            where: { id: appointment.id },
            data: {
              googleEventId: result.eventId,
              googleCalendarSynced: true
            }
          });
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar com Google Calendar:', error);
      
      // Marca como erro de sincronização
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          googleCalendarSynced: false,
          // syncError: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      });
    }
  }

  /**
   * Cria lembretes automáticos
   */
  private async createReminders(appointmentId: string, scheduledAt: Date): Promise<void> {
    try {
      const reminders = [
        {
          appointmentId,
          type: '24h_before',
          scheduledFor: new Date(scheduledAt.getTime() - 24 * 60 * 60 * 1000)
        },
        {
          appointmentId,
          type: '1h_before',
          scheduledFor: new Date(scheduledAt.getTime() - 60 * 60 * 1000)
        }
      ];

      await prisma.appointmentReminder.createMany({
        data: reminders
      });
    } catch (error) {
      console.error('Erro ao criar lembretes:', error);
    }
  }

  /**
   * Obtém estatísticas de agendamentos
   */
  async getAppointmentStats(tenantId: string, professionalId?: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const where: any = { tenantId };
      if (professionalId) {
        where.professionalId = professionalId;
      }

      const [
        total,
        completed,
        cancelled,
        noShow,
        thisMonth,
        thisWeek
      ] = await Promise.all([
        this.prisma.appointment.count({ where }),
        prisma.appointment.count({ where: { ...where, status: 'completed' } }),
        prisma.appointment.count({ where: { ...where, status: 'cancelled' } }),
        prisma.appointment.count({ where: { ...where, status: 'no_show' } }),
        prisma.appointment.count({
          where: {
            ...where,
            scheduledAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        prisma.appointment.count({
          where: {
            ...where,
            scheduledAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      const attendanceRate = total > 0 ? (completed / total) * 100 : 0;
      const cancellationRate = total > 0 ? (cancelled / total) * 100 : 0;

      return {
        success: true,
        stats: {
          total,
          completed,
          cancelled,
          noShow,
          thisMonth,
          thisWeek,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100
        }
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new SchedulingService();
