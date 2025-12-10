/**
 * Health Questionnaire Service - Sprint 7
 * Gerenciamento de questionários de saúde pré-consulta
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface HealthQuestionnaireData {
  type: 'metabolic' | 'dietary_pattern' | 'sleep' | 'digestive' | 'energy' | 'general';
  title: string;
  description: string;
  questions: any[];
}

export class HealthQuestionnaireService {
  /**
   * Criar questionário
   */
  async create(data: {
    tenantId?: string;
    createdById?: string;
    type: string;
    title: string;
    description?: string;
    questions: any[];
  }) {
    try {
      const questionnaire = await prisma.healthQuestionnaire.create({
        data: {
          tenantId: data.tenantId,
          createdById: data.createdById,
          type: data.type,
          title: data.title,
          description: data.description,
          questions: data.questions,
          isPublic: true,
          isActive: true
        }
      });

      logger.info(`Health questionnaire created: ${questionnaire.id}`);
      return questionnaire;
    } catch (error) {
      logger.error('Error creating health questionnaire:', error);
      throw error;
    }
  }

  /**
   * Listar questionários disponíveis
   */
  async list(filters: {
    tenantId?: string;
    type?: string;
    includePublic?: boolean;
  }) {
    try {
      const where: any = {
        isActive: true
      };

      // Questionários globais + específicos do tenant
      const orConditions: any[] = [
        { tenantId: null, isPublic: true } // Globais públicos
      ];

      if (filters.tenantId) {
        orConditions.push({ tenantId: filters.tenantId }); // Específicos do tenant
      }

      where.OR = orConditions;

      if (filters.type) {
        where.type = filters.type;
      }

      const questionnaires = await prisma.healthQuestionnaire.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return questionnaires;
    } catch (error) {
      logger.error('Error listing health questionnaires:', error);
      throw error;
    }
  }

  /**
   * Submeter resposta de questionário
   */
  async submitResponse(data: {
    tenantId: string;
    clientId: string;
    questionnaireId: string;
    nutritionistId?: string;
    responses: any;
    score?: number;
  }) {
    try {
      const response = await prisma.questionnaireResponse.create({
        data: {
          tenantId: data.tenantId,
          clientId: data.clientId,
          questionnaireId: data.questionnaireId,
          nutritionistId: data.nutritionistId,
          responses: data.responses,
          score: data.score,
          completedAt: new Date()
        }
      });

      // Incrementar contador de uso
      await prisma.healthQuestionnaire.update({
        where: { id: data.questionnaireId },
        data: { usageCount: { increment: 1 } }
      });

      logger.info(`Questionnaire response submitted: ${response.id}`);
      return response;
    } catch (error) {
      logger.error('Error submitting questionnaire response:', error);
      throw error;
    }
  }

  /**
   * Obter respostas de questionários do cliente
   */
  async getClientResponses(tenantId: string, clientId: string) {
    try {
      const responses = await prisma.questionnaireResponse.findMany({
        where: {
          tenantId,
          clientId
        },
        include: {
          questionnaire: true
        },
        orderBy: { completedAt: 'desc' }
      });

      return responses;
    } catch (error) {
      logger.error('Error getting client questionnaire responses:', error);
      throw error;
    }
  }
}

export default new HealthQuestionnaireService();

