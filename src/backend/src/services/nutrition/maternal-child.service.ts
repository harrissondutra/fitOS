/**
 * Maternal-Child Assessment Service - Sprint 7
 * Acompanhamento gestacional e infantil com curvas WHO
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface MaternalAssessmentData {
  tenantId: string;
  clientId: string;
  trimester: number;
  gestationalAge?: number;
  currentWeight?: number;
  initialWeight?: number;
  height?: number;
  bloodPressure?: string;
  supplements?: string[];
  notes?: string;
}

export interface ChildAssessmentData {
  tenantId: string;
  clientId: string;
  age: number; // meses
  gender: 'male' | 'female' | 'other';
  weight?: number;
  height?: number;
  headCircum?: number;
  notes?: string;
}

export class MaternalChildService {
  /**
   * Criar avaliação gestacional
   */
  async createMaternalAssessment(data: MaternalAssessmentData) {
    try {
      const assessment = await prisma.maternalAssessment.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          trimester: data.trimester,
          gestationalAge: data.gestationalAge,
          currentWeight: data.currentWeight,
          initialWeight: data.initialWeight,
          height: data.height,
          bloodPressure: data.bloodPressure,
          supplements: data.supplements || [],
          notes: data.notes,
          createdAt: new Date()
        }
      });

      logger.info(`Maternal assessment created: ${assessment.id}`);
      return assessment;
    } catch (error) {
      logger.error('Error creating maternal assessment:', error);
      throw error;
    }
  }

  /**
   * Obter avaliações gestacionais do cliente
   */
  async getMaternalAssessments(tenantId: string, clientId: string) {
    try {
      const assessments = await prisma.maternalAssessment.findMany({
        where: {
          tenantId,
          clientId
        },
        orderBy: { createdAt: 'desc' }
      });

      return assessments;
    } catch (error) {
      logger.error('Error getting maternal assessments:', error);
      throw error;
    }
  }

  /**
   * Criar avaliação infantil
   */
  async createChildAssessment(data: ChildAssessmentData) {
    try {
      // Calcular percentis WHO
      const whoPercentile = await this.calculateWHOPercentile({
        age: data.age,
        gender: data.gender,
        weight: data.weight,
        height: data.height,
        headCircum: data.headCircum
      });

      const assessment = await prisma.childAssessment.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          age: data.age,
          gender: data.gender,
          weight: data.weight,
          height: data.height,
          headCircum: data.headCircum,
          whoPercentile,
          notes: data.notes,
          createdAt: new Date()
        }
      });

      logger.info(`Child assessment created: ${assessment.id}`);
      return assessment;
    } catch (error) {
      logger.error('Error creating child assessment:', error);
      throw error;
    }
  }

  /**
   * Obter avaliações infantis do cliente
   */
  async getChildAssessments(tenantId: string, clientId: string) {
    try {
      const assessments = await prisma.childAssessment.findMany({
        where: {
          tenantId,
          clientId
        },
        orderBy: { createdAt: 'desc' }
      });

      return assessments;
    } catch (error) {
      logger.error('Error getting child assessments:', error);
      throw error;
    }
  }

  /**
   * Calcular percentis WHO (simplificado)
   * Nota: Implementação real usaria dados completos das curvas WHO
   */
  private async calculateWHOPercentile(data: {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight?: number;
    height?: number;
    headCircum?: number;
  }) {
    // Placeholder - Implementação real usaria dados das curvas WHO
    // Exemplo de estrutura retornada:
    return {
      weightForAge: {
        percentile: data.weight ? 50 : null,
        zScore: 0
      },
      heightForAge: {
        percentile: data.height ? 50 : null,
        zScore: 0
      },
      weightForHeight: {
        percentile: data.weight && data.height ? 50 : null,
        zScore: 0
      },
      headCircumferenceForAge: {
        percentile: data.headCircum ? 50 : null,
        zScore: 0
      }
    };
  }
}

export default new MaternalChildService();
