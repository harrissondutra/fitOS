/**
 * Meal Plan Template Service - Sprint 7
 * Gerenciamento de templates de prescrições
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

const prisma = new PrismaClient();

export interface MealPlanTemplateData {
  name: string;
  description?: string;
  category: string;
  style?: string;
  template: any;
  tenantId?: string | null;
  createdById?: string;
  isPublic?: boolean;
}

export class MealPlanTemplateService {
  /**
   * Listar templates disponíveis
   */
  async list(filters: {
    tenantId?: string;
    category?: string;
    style?: string;
    isPublic?: boolean;
  }) {
    try {
      const where: any = {
        OR: []
      };

      // Templates globais públicos
      where.OR.push({
        tenantId: null,
        isPublic: true
      });

      // Templates específicos do tenant
      if (filters.tenantId) {
        where.OR.push({ tenantId: filters.tenantId });
      }

      // Filtros opcionais
      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.style) {
        where.style = filters.style;
      }

      if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }

      const templates = await prisma.mealPlanTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      return templates;
    } catch (error) {
      logger.error('Error listing meal plan templates:', error);
      throw error;
    }
  }

  /**
   * Obter template por ID
   */
  async getById(id: string) {
    try {
      const template = await prisma.mealPlanTemplate.findUnique({
        where: { id }
      });

      return template;
    } catch (error) {
      logger.error('Error getting meal plan template:', error);
      throw error;
    }
  }

  /**
   * Criar novo template
   */
  async create(data: MealPlanTemplateData) {
    try {
      const template = await prisma.mealPlanTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          style: data.style || 'general',
          template: data.template,
          tenantId: data.tenantId,
          createdById: data.createdById,
          isPublic: data.isPublic ?? true
        }
      });

      logger.info(`Meal plan template created: ${template.id}`);
      return template;
    } catch (error) {
      logger.error('Error creating meal plan template:', error);
      throw error;
    }
  }

  /**
   * Contar uso do template
   */
  async incrementUsageCount(id: string) {
    try {
      const template = await prisma.mealPlanTemplate.update({
        where: { id },
        data: {
          usageCount: { increment: 1 }
        }
      });

      return template;
    } catch (error) {
      logger.error('Error incrementing template usage count:', error);
      throw error;
    }
  }
}

export default new MealPlanTemplateService();

