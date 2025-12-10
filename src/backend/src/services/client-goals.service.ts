import { PrismaClient } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';

export interface ListClientGoalsParams {
  tenantId: string;
  role: 'TRAINER' | 'ADMIN' | 'OWNER' | 'SUPER_ADMIN' | string;
  userId: string;
  status?: string;
  clientId?: string;
}

export class ClientGoalsService {
  private prisma: PrismaClient | PrismaTenantWrapper;

  constructor(prisma: PrismaClient | PrismaTenantWrapper) {
    this.prisma = prisma;
  }

  async listGoals(params: ListClientGoalsParams) {
    const prisma = this.prisma as any;
    const whereClause: any = {
      tenantId: params.tenantId,
    };

    if (params.status) {
      whereClause.status = params.status;
    }

    if (params.clientId) {
      whereClause.clientId = params.clientId;
    }

    if (params.role === 'TRAINER') {
      const trainerClients = await prisma.clientTrainer.findMany({
        where: { trainerId: params.userId },
        select: { clientId: true },
      });
      const clientIds = trainerClients.map((tm) => tm.clientId);
      whereClause.clientId = { in: clientIds };
    }

    return await prisma.clientGoal.findMany({
      where: whereClause,
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGoal(input: {
    tenantId: string;
    role: string;
    userId: string;
    data: {
      clientId: string;
      title: string;
      description?: string;
      type: string;
      target: number | string;
      current: number | string;
      unit: string;
      startDate: string | Date;
      targetDate: string | Date;
    };
  }) {
    const { tenantId, role, userId, data } = input;

    const client = await (this.prisma as any).client.findFirst({
      where: { id: data.clientId, tenantId },
    });
    if (!client) {
      return { notFound: true };
    }

    if (role === 'TRAINER') {
      const trainerClient = await (this.prisma as any).clientTrainer.findFirst({
        where: { clientId: data.clientId, trainerId: userId },
      });
      if (!trainerClient) {
        return { forbidden: true };
      }
    }

    if (new Date(data.targetDate) <= new Date(data.startDate)) {
      return { invalidDates: true };
    }

    const goal = await (this.prisma as any).clientGoal.create({
      data: {
        clientId: data.clientId,
        tenantId,
        title: data.title,
        description: data.description,
        type: data.type,
        target: parseFloat(String(data.target)),
        current: parseFloat(String(data.current)),
        unit: data.unit,
        startDate: new Date(data.startDate),
        targetDate: new Date(data.targetDate),
        status: 'active',
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return { goal };
  }

  async getGoalById(id: string, tenantId: string) {
    return await (this.prisma as any).clientGoal.findFirst({
      where: { id, tenantId },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async canAccessClient(clientId: string, role: string, userId: string) {
    if (role !== 'TRAINER') return true;
    const trainerClient = await (this.prisma as any).clientTrainer.findFirst({
      where: { clientId, trainerId: userId },
    });
    return Boolean(trainerClient);
  }

  async updateGoal(id: string, tenantId: string, role: string, userId: string, updateData: any) {
    const existingGoal = await (this.prisma as any).clientGoal.findFirst({
      where: { id, tenantId },
    });
    if (!existingGoal) return { notFound: true };

    if (!(await this.canAccessClient(existingGoal.clientId, role, userId))) {
      return { forbidden: true };
    }

    if (updateData.startDate && updateData.targetDate) {
      if (new Date(updateData.targetDate) <= new Date(updateData.startDate)) {
        return { invalidDates: true };
      }
    }

    const newCurrent = updateData.current !== undefined ? parseFloat(String(updateData.current)) : existingGoal.current;
    const newTarget = updateData.target !== undefined ? parseFloat(String(updateData.target)) : existingGoal.target;
    if (newCurrent >= newTarget && existingGoal.status === 'active') {
      updateData.status = 'achieved';
      updateData.achievedAt = new Date();
    }

    const goal = await (this.prisma as any).clientGoal.update({
      where: { id },
      data: {
        ...updateData,
        target: updateData.target ? parseFloat(String(updateData.target)) : undefined,
        current: updateData.current ? parseFloat(String(updateData.current)) : undefined,
        startDate: updateData.startDate ? new Date(updateData.startDate) : undefined,
        targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return { goal };
  }

  async updateProgress(id: string, tenantId: string, role: string, userId: string, current: number | string) {
    const existingGoal = await (this.prisma as any).clientGoal.findFirst({
      where: { id, tenantId },
    });
    if (!existingGoal) return { notFound: true };

    if (!(await this.canAccessClient(existingGoal.clientId, role, userId))) {
      return { forbidden: true };
    }

    const newCurrent = parseFloat(String(current));
    const updateData: any = { current: newCurrent };

    if (newCurrent >= existingGoal.target && existingGoal.status === 'active') {
      updateData.status = 'achieved';
      updateData.achievedAt = new Date();
    }

    const goal = await (this.prisma as any).clientGoal.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return { goal };
  }

  async deleteGoal(id: string, tenantId: string, role: string, userId: string) {
    const existingGoal = await (this.prisma as any).clientGoal.findFirst({
      where: { id, tenantId },
    });
    if (!existingGoal) return { notFound: true };

    if (!(await this.canAccessClient(existingGoal.clientId, role, userId))) {
      return { forbidden: true };
    }

    await (this.prisma as any).clientGoal.delete({ where: { id } });
    return { deleted: true };
  }
}
