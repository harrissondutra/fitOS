import { PrismaClient, PhysicalAssessment } from '@prisma/client';
import { logger } from '../utils/logger';

export interface PhysicalAssessmentFormData {
  clientId: string;
  trainerId: string;
  assessmentDate: Date;
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: any;
  strength?: any;
  cardio?: any;
  flexibility?: any;
  photos?: string[];
  notes?: string;
  goals?: any;
}

export class PhysicalAssessmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar nova avaliação física
   */
  async createAssessment(data: PhysicalAssessmentFormData, tenantId: string): Promise<PhysicalAssessment> {
    // Validar se trainer tem acesso ao cliente
    const hasAccess = await this.validateTrainerClientAccess(data.trainerId, data.clientId, tenantId);
    if (!hasAccess) {
      throw new Error('Access denied: Client is not assigned to this trainer');
    }

    const assessment = await this.prisma.physicalAssessment.create({
      data: {
        ...data,
        tenantId
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        trainer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    logger.info(`Physical assessment created for client ${data.clientId} by trainer ${data.trainerId} in tenant ${tenantId}`);
    return assessment;
  }

  /**
   * Buscar avaliação por ID
   */
  async getAssessmentById(id: string, tenantId: string): Promise<PhysicalAssessment | null> {
    return await this.prisma.physicalAssessment.findFirst({
      where: { id, tenantId },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        trainer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });
  }

  /**
   * Buscar histórico de avaliações do cliente
   */
  async getAssessmentHistory(clientId: string, tenantId: string): Promise<PhysicalAssessment[]> {
    return await this.prisma.physicalAssessment.findMany({
      where: { clientId, tenantId },
      include: {
        trainer: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { assessmentDate: 'desc' }
    });
  }

  /**
   * Comparar duas avaliações
   */
  async compareAssessments(assessmentId1: string, assessmentId2: string, tenantId: string) {
    const [assessment1, assessment2] = await Promise.all([
      this.getAssessmentById(assessmentId1, tenantId),
      this.getAssessmentById(assessmentId2, tenantId)
    ]);

    if (!assessment1 || !assessment2) {
      throw new Error('One or both assessments not found');
    }

    return {
      weightChange: assessment1.weight && assessment2.weight ? assessment2.weight - assessment1.weight : 0,
      bodyFatChange: assessment1.bodyFat && assessment2.bodyFat ? assessment2.bodyFat - assessment1.bodyFat : 0,
      muscleMassChange: assessment1.muscleMass && assessment2.muscleMass ? assessment2.muscleMass - assessment1.muscleMass : 0,
      measurementsChange: this.compareMeasurements(assessment1.measurements, assessment2.measurements),
      dateRange: {
        from: assessment1.assessmentDate,
        to: assessment2.assessmentDate
      }
    };
  }

  /**
   * Atualizar avaliação
   */
  async updateAssessment(id: string, data: Partial<PhysicalAssessmentFormData>, tenantId: string): Promise<PhysicalAssessment> {
    const assessment = await this.prisma.physicalAssessment.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        },
        trainer: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    logger.info(`Physical assessment updated: ${id} in tenant ${tenantId}`);
    return assessment;
  }

  /**
   * Deletar avaliação
   */
  async deleteAssessment(id: string, tenantId: string): Promise<void> {
    await this.prisma.physicalAssessment.delete({
      where: { id }
    });

    logger.info(`Physical assessment deleted: ${id} in tenant ${tenantId}`);
  }

  /**
   * Validar se trainer tem acesso ao cliente
   */
  private async validateTrainerClientAccess(trainerId: string, clientId: string, tenantId: string): Promise<boolean> {
    const relation = await this.prisma.clientTrainer.findFirst({
      where: {
        trainerId,
        clientId,
        isActive: true,
        client: { tenantId }
      }
    });
    return !!relation;
  }

  /**
   * Comparar medidas
   */
  private compareMeasurements(measurements1: any, measurements2: any): any {
    if (!measurements1 || !measurements2) return {};

    const changes: any = {};
    for (const key in measurements2) {
      if (measurements1[key] && measurements2[key]) {
        changes[key] = {
          from: measurements1[key],
          to: measurements2[key],
          change: measurements2[key] - measurements1[key]
        };
      }
    }
    return changes;
  }
}

