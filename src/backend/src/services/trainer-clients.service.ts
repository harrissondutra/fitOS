import { PrismaClient } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';

export class TrainerClientsService {
  private prisma: PrismaClient | PrismaTenantWrapper;

  constructor(prisma: PrismaClient | PrismaTenantWrapper) {
    this.prisma = prisma;
  }

  async getAssignedClients(tenantId: string, trainerId: string) {
    const clientTrainerRelations = await (this.prisma as any).clientTrainer.findMany({
      where: { trainerId, isActive: true }
    });
    const clientIds = clientTrainerRelations.map((rel) => rel.clientId);

    const clientsData = await this.prisma.client.findMany({
      where: { id: { in: clientIds }, tenantId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    });

    return clientsData.map((client) => ({
      id: client.id,
      name: `${client.user.firstName} ${client.user.lastName}`,
      email: client.user.email,
      phone: client.user.phone,
      membershipType: (client as any).membershipType || 'Standard',
      status: (client as any).status || 'active',
      userId: client.userId,
      tenantId: client.tenantId,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    }));
  }

  async getClientStats(tenantId: string, trainerId: string, clientId: string) {
    const relation = await (this.prisma as any).clientTrainer.findFirst({
      where: { trainerId, clientId, isActive: true },
    });
    if (!relation) return null;

    const [totalWorkouts, completedWorkouts, pendingAssessments] = await Promise.all([
      this.prisma.workout.count({ where: { clientId, tenantId } }),
      this.prisma.workout.count({ where: { clientId, tenantId, completed: true } }),
      (this.prisma as any).physicalAssessment.count({ where: { clientId, tenantId } }),
    ]);

    return {
      totalWorkouts,
      completedWorkouts,
      completionRate: totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0,
      pendingAssessments,
      activePrograms: 0,
    };
  }
}
