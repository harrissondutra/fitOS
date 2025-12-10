import { PrismaClient } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';

export type AnalyticsRole = 'TRAINER' | 'ADMIN' | 'OWNER' | 'SUPER_ADMIN' | string;

export class AnalyticsService {
  private prisma: PrismaClient | PrismaTenantWrapper;

  constructor(prisma: PrismaClient | PrismaTenantWrapper) {
    this.prisma = prisma;
  }

  async getAnalytics(params: { tenantId: string; userId: string; role: AnalyticsRole; periodDays: number }) {
    const { tenantId, userId, role, periodDays } = params;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const whereAppointments: any = { tenantId, scheduledAt: { gte: startDate } };
    if (role === 'TRAINER') whereAppointments.professionalId = userId;

    // Appointments
    const prisma = this.prisma as any;
    const appointments = await prisma.appointment.findMany({
      where: whereAppointments,
      include: { client: { select: { id: true, name: true } } },
    });

    const appointmentsByDay = appointments.reduce((acc: any, appointment: any) => {
      const date = (appointment.scheduledAt as Date).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, count: 0, completed: 0 };
      acc[date].count++;
      if (appointment.status === 'completed') acc[date].completed++;
      return acc;
    }, {} as Record<string, { date: string; count: number; completed: number }>);

    const appointmentsByType = appointments.reduce((acc: any, appointment: any) => {
      const type = (appointment as any).type || 'unknown';
      if (!acc[type]) acc[type] = { type, count: 0 };
      acc[type].count++;
      return acc;
    }, {} as Record<string, { type: string; count: number }>);

    // Bioimpedance
    const bioimpedanceData = await prisma.biometricData.findMany({
      where: { tenantId, recordedAt: { gte: startDate } },
      orderBy: { recordedAt: 'asc' },
    });

    const progressData = bioimpedanceData.reduce((acc: any, d: any) => {
      const date = (d.recordedAt as Date).toISOString().split('T')[0];
      if (!acc[date]) acc[date] = { date, weight: 0, bodyFat: 0, count: 0 };
      if (d.dataType === 'weight') acc[date].weight += d.value;
      else if (d.dataType === 'body_fat_percentage') acc[date].bodyFat += d.value;
      acc[date].count++;
      return acc;
    }, {} as Record<string, { date: string; weight: number; bodyFat: number; count: number }>);

    Object.values(progressData).forEach((row: any) => {
      if (row.count > 0) {
        row.weight = row.weight / row.count;
        row.bodyFat = row.bodyFat / row.count;
      }
    });

    const avg = (arr: number[]) => (arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0);

    const weights = bioimpedanceData.filter((d: any) => d.dataType === 'weight').map((d: any) => d.value);
    const fats = bioimpedanceData
      .filter((d: any) => d.dataType === 'body_fat_percentage')
      .map((d: any) => d.value);

    // CRM
    const crmData = await prisma.clientProfile.findMany({
      where: { tenantId },
      include: { _count: { select: { interactions: true } } },
    });

    const pipeline = crmData.reduce((acc: any, p: any) => {
      const stage = (p as any).stage || 'prospect';
      if (!acc[stage]) acc[stage] = { stage, count: 0 };
      acc[stage].count++;
      return acc;
    }, {} as Record<string, { stage: string; count: number }>);

    // Goals
    const goals = await prisma.clientGoal.findMany({
      where: { tenantId, createdAt: { gte: startDate } },
    });

    const goalsStats = {
      total: goals.length,
      achieved: goals.filter((g: any) => g.status === 'achieved').length,
      inProgress: goals.filter((g: any) => g.status === 'active').length,
      overdue: goals.filter((g: any) => g.status === 'active' && new Date(g.targetDate) < new Date()).length,
    };

    return {
      appointments: {
        total: appointments.length,
        completed: appointments.filter((a: any) => a.status === 'completed').length,
        cancelled: appointments.filter((a: any) => a.status === 'cancelled').length,
        noShow: appointments.filter((a: any) => a.status === 'no_show').length,
        byDay: Object.values(appointmentsByDay),
        byType: Object.values(appointmentsByType),
      },
      bioimpedance: {
        totalMeasurements: bioimpedanceData.length,
        averageWeight: avg(weights),
        averageBodyFat: avg(fats),
        progressData: Object.values(progressData),
      },
      crm: {
        totalClients: crmData.length,
        activeClients: crmData.filter((c: any) => (c as any).stage === 'active').length,
        pipeline: Object.values(pipeline),
        conversions: [], // Sem dados simulados; preencher quando houver métrica real
      },
      goals: goalsStats,
    };
  }
}


