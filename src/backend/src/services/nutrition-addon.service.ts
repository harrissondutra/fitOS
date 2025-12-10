/**
 * Nutrition Addon Service - Sprint 7
 * Gestão de assinaturas e add-ons para funcionalidades nutricionais avançadas
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface NutritionAddonPlan {
  id: string;
  name: string;
  price: number;
  currency: 'BRL' | 'USD';
  billingCycle: 'monthly' | 'yearly';
  features: {
    bodyScanAI: boolean;
    claraAIAdvanced: boolean;
    tbcaTacoDatabase: boolean;
    prescriptionTemplates: boolean;
    maternalChildHealth: boolean;
    healthQuestionnaires: boolean;
    professionalPdfExport: boolean;
    aiInjuryPrevention: boolean;
  };
  aiCreditsIncluded: number;
  stripeProductId?: string;
  mercadoPagoProductId?: string;
}

export const NUTRITION_ADDON_PLANS: NutritionAddonPlan[] = [
  {
    id: 'nutrition-basic',
    name: 'Nutrição Básica',
    price: 49.90,
    currency: 'BRL',
    billingCycle: 'monthly',
    features: {
      bodyScanAI: false,
      claraAIAdvanced: true,
      tbcaTacoDatabase: true,
      prescriptionTemplates: true,
      maternalChildHealth: false,
      healthQuestionnaires: true,
      professionalPdfExport: true,
      aiInjuryPrevention: false
    },
    aiCreditsIncluded: 100
  },
  {
    id: 'nutrition-pro',
    name: 'Nutrição Profissional',
    price: 99.90,
    currency: 'BRL',
    billingCycle: 'monthly',
    features: {
      bodyScanAI: true,
      claraAIAdvanced: true,
      tbcaTacoDatabase: true,
      prescriptionTemplates: true,
      maternalChildHealth: true,
      healthQuestionnaires: true,
      professionalPdfExport: true,
      aiInjuryPrevention: true
    },
    aiCreditsIncluded: 500
  }
];

export class NutritionAddonService {
  /**
   * Obter plano add-on por ID
   */
  getPlanById(planId: string): NutritionAddonPlan | undefined {
    return NUTRITION_ADDON_PLANS.find(plan => plan.id === planId);
  }

  /**
   * Listar planos disponíveis
   */
  listPlans(): NutritionAddonPlan[] {
    return NUTRITION_ADDON_PLANS;
  }

  /**
   * Criar assinatura de add-on
   */
  async createSubscription(data: {
    tenantId: string;
    userId: string;
    addonPlanId: string;
    stripeSubscriptionId?: string;
    mercadoPagoSubscriptionId?: string;
  }) {
    try {
      const plan = this.getPlanById(data.addonPlanId);
      
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      // Definir data de término baseada no billing cycle
      const endDate = new Date();
      if (plan.billingCycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      const subscription = await prisma.nutritionAddonSubscription.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          addonPlanId: data.addonPlanId,
          status: 'active',
          enabledFeatures: plan.features,
          aiCreditsLimit: plan.aiCreditsIncluded,
          aiCreditsUsed: 0,
          startDate: new Date(),
          endDate,
          stripeSubscriptionId: data.stripeSubscriptionId,
          mercadoPagoSubscriptionId: data.mercadoPagoSubscriptionId
        }
      });

      logger.info(`Nutrition addon subscription created: ${subscription.id}`);

      return subscription;
    } catch (error) {
      logger.error('Error creating nutrition addon subscription:', error);
      throw error;
    }
  }

  /**
   * Obter assinatura ativa do usuário
   */
  async getActiveSubscription(tenantId: string, userId: string) {
    try {
      const subscription = await prisma.nutritionAddonSubscription.findFirst({
        where: {
          tenantId,
          userId,
          status: 'active',
          endDate: { gte: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      });

      return subscription;
    } catch (error) {
      logger.error('Error getting active subscription:', error);
      return null;
    }
  }

  /**
   * Verificar se usuário tem acesso a uma feature
   */
  async hasFeatureAccess(
    tenantId: string, 
    userId: string, 
    featureName: keyof NutritionAddonPlan['features']
  ): Promise<boolean> {
    try {
      // SUPER_ADMIN sempre tem acesso
      // TODO: Verificar role do usuário via middleware

      const subscription = await this.getActiveSubscription(tenantId, userId);
      
      if (!subscription) {
        return false;
      }

      const features = subscription.enabledFeatures as NutritionAddonPlan['features'];
      return features[featureName] === true;
    } catch (error) {
      logger.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Verificar se usuário tem créditos AI disponíveis
   */
  async hasAiCreditsAvailable(tenantId: string, userId: string): Promise<boolean> {
    try {
      const subscription = await this.getActiveSubscription(tenantId, userId);
      
      if (!subscription) {
        return false;
      }

      return subscription.aiCreditsUsed < subscription.aiCreditsLimit;
    } catch (error) {
      logger.error('Error checking AI credits:', error);
      return false;
    }
  }

  /**
   * Usar crédito AI
   */
  async useAiCredit(tenantId: string, userId: string) {
    try {
      const subscription = await prisma.nutritionAddonSubscription.findFirst({
        where: {
          tenantId,
          userId,
          status: 'active',
          endDate: { gte: new Date() }
        }
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.aiCreditsUsed >= subscription.aiCreditsLimit) {
        throw new Error('AI credits exhausted');
      }

      await prisma.nutritionAddonSubscription.update({
        where: { id: subscription.id },
        data: { aiCreditsUsed: { increment: 1 } }
      });

      logger.info(`AI credit used: ${subscription.aiCreditsUsed + 1}/${subscription.aiCreditsLimit}`);
    } catch (error) {
      logger.error('Error using AI credit:', error);
      throw error;
    }
  }

  /**
   * Cancelar assinatura
   */
  async cancelSubscription(subscriptionId: string) {
    try {
      await prisma.nutritionAddonSubscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      });

      logger.info(`Nutrition addon subscription cancelled: ${subscriptionId}`);
    } catch (error) {
      logger.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Criar trial gratuito (7 dias)
   */
  async createTrial(tenantId: string, userId: string) {
    try {
      // Verificar se já tem trial ativo
      const existingTrial = await prisma.nutritionAddonSubscription.findFirst({
        where: {
          tenantId,
          userId,
          status: 'trial',
          endDate: { gte: new Date() }
        }
      });

      if (existingTrial) {
        throw new Error('Usuário já possui trial ativo');
      }

      // Criar trial com plano Pro por 7 dias
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 7);

      const trial = await prisma.nutritionAddonSubscription.create({
        data: {
          tenantId,
          userId,
          addonPlanId: 'nutrition-pro',
          status: 'trial',
          enabledFeatures: NUTRITION_ADDON_PLANS.find(p => p.id === 'nutrition-pro')!.features,
          aiCreditsLimit: 50, // Trial limitado
          aiCreditsUsed: 0,
          startDate: new Date(),
          endDate
        }
      });

      logger.info(`Trial created for user: ${userId}`);

      return trial;
    } catch (error) {
      logger.error('Error creating trial:', error);
      throw error;
    }
  }
}

export default new NutritionAddonService();

