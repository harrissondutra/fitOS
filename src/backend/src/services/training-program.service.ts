import { PrismaClient, TrainingProgram } from '@prisma/client';
import { logger } from '../utils/logger';

export interface TrainingProgramFormData {
  trainerId: string;
  clientId: string;
  name: string;
  description?: string;
  goal: string;
  duration: number;
  frequency: number;
  startDate: Date;
  endDate: Date;
  phases?: any[];
}

export class TrainingProgramService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Criar programa de treino
   */
  async createProgram(data: TrainingProgramFormData, tenantId: string): Promise<TrainingProgram> {
    // Validar se trainer tem acesso ao cliente
    const hasAccess = await this.validateTrainerClientAccess(data.trainerId, data.clientId, tenantId);
    if (!hasAccess) {
      throw new Error('Access denied: Client is not assigned to this trainer');
    }

    const program = await this.prisma.trainingProgram.create({
      data: {
        ...data,
        tenantId,
        phases: data.phases || []
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

    logger.info(`Training program created for client ${data.clientId} by trainer ${data.trainerId} in tenant ${tenantId}`);
    return program;
  }

  /**
   * Buscar programa por ID
   */
  async getProgramById(id: string, tenantId: string): Promise<TrainingProgram | null> {
    return await this.prisma.trainingProgram.findFirst({
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
   * Listar programas do cliente
   */
  async getClientPrograms(clientId: string, tenantId: string): Promise<TrainingProgram[]> {
    return await this.prisma.trainingProgram.findMany({
      where: { clientId, tenantId },
      include: {
        trainer: {
          select: { id: true, firstName: true, lastName: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });
  }

  /**
   * Listar programas do trainer
   */
  async getTrainerPrograms(trainerId: string, tenantId: string): Promise<TrainingProgram[]> {
    return await this.prisma.trainingProgram.findMany({
      where: { trainerId, tenantId },
      include: {
        client: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { startDate: 'desc' }
    });
  }

  /**
   * Atualizar programa
   */
  async updateProgram(id: string, data: Partial<TrainingProgramFormData>, tenantId: string): Promise<TrainingProgram> {
    const program = await this.prisma.trainingProgram.update({
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

    logger.info(`Training program updated: ${id} in tenant ${tenantId}`);
    return program;
  }

  /**
   * Desativar programa
   */
  async deactivateProgram(id: string, tenantId: string): Promise<TrainingProgram> {
    const program = await this.prisma.trainingProgram.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    logger.info(`Training program deactivated: ${id} in tenant ${tenantId}`);
    return program;
  }

  /**
   * Gerar periodização automatizada
   */
  async generatePeriodization(programId: string, goal: string, duration: number): Promise<any[]> {
    // Lógica para gerar periodização baseada no objetivo
    const phases: any[] = [];

    switch (goal.toLowerCase()) {
      case 'hypertrophy':
        phases.push(
          { week: '1-4', phase: 'Adaptação', focus: 'Volume', intensity: 'Baixa' },
          { week: '5-9', phase: 'Volume', focus: 'Hipertrofia', intensity: 'Média-Alta' },
          { week: '10-12', phase: 'Pico', focus: 'Força', intensity: 'Alta' }
        );
        break;
      case 'strength':
        phases.push(
          { week: '1-3', phase: 'Acumulação', focus: 'Volume', intensity: 'Média' },
          { week: '4-7', phase: 'Intensificação', focus: 'Força', intensity: 'Alta' },
          { week: '8', phase: 'Realização', focus: 'Peak', intensity: 'Muito Alta' }
        );
        break;
      case 'endurance':
        phases.push(
          { week: '1-4', phase: 'Base', focus: 'Aeróbico', intensity: 'Baixa' },
          { week: '5-8', phase: 'Build', focus: 'Tempo', intensity: 'Média' },
          { week: '9-12', phase: 'Peak', focus: 'Performance', intensity: 'Alta' }
        );
        break;
      default:
        phases.push(
          { week: '1-2', phase: 'Início', focus: 'Aprendizado', intensity: 'Baixa' },
          { week: '3-6', phase: 'Progressão', focus: 'Melhoria', intensity: 'Média' }
        );
    }

    return phases;
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
}

