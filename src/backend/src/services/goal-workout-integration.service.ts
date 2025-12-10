/**
 * Goal-Workout Integration Service - Sprint 8
 * 
 * Integra goals com workouts e assessments para evolução do cliente
 */

import { PrismaClient } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';
import { logger } from '../utils/logger';

export interface GoalCreationFromAssessment {
  clientId: string;
  tenantId: string;
  assessmentData: {
    weight?: number;
    bodyFat?: number;
    muscleMass?: number;
    measurements?: Record<string, number>;
  };
  targetDate: Date;
}

export class GoalWorkoutIntegrationService {
  private prisma: PrismaClient | PrismaTenantWrapper;

  constructor(prisma?: PrismaClient | PrismaTenantWrapper) {
    if (prisma) {
      this.prisma = prisma;
    } else {
      const { getPrismaClient } = require('../config/database');
      this.prisma = getPrismaClient();
    }
  }

  /**
   * Cria goals baseados em uma avaliação física
   */
  async createGoalsFromAssessment(data: GoalCreationFromAssessment) {
    try {
      const goals = [];

      // 1. Goal de Peso (se houver dados de peso)
      if (data.assessmentData.weight) {
        const weightGoal = await (this.prisma as any).clientGoal.create({
          data: {
            clientId: data.clientId,
            tenantId: data.tenantId,
            title: 'Meta de Peso',
            description: 'Meta de peso baseada na avaliação física inicial',
            type: 'weight',
            target: data.assessmentData.weight * 0.95, // Perda de 5% como exemplo
            current: data.assessmentData.weight,
            unit: 'kg',
            startDate: new Date(),
            targetDate: data.targetDate,
            status: 'active'
          }
        });
        goals.push(weightGoal);
      }

      // 2. Goal de Gordura Corporal
      if (data.assessmentData.bodyFat) {
        const bodyFatGoal = await (this.prisma as any).clientGoal.create({
          data: {
            clientId: data.clientId,
            tenantId: data.tenantId,
            title: 'Meta de Gordura Corporal',
            description: 'Redução de gordura corporal',
            type: 'body_fat',
            target: data.assessmentData.bodyFat * 0.9, // Redução de 10%
            current: data.assessmentData.bodyFat,
            unit: '%',
            startDate: new Date(),
            targetDate: data.targetDate,
            status: 'active'
          }
        });
        goals.push(bodyFatGoal);
      }

      // 3. Goal de Massa Muscular
      if (data.assessmentData.muscleMass) {
        const muscleGoal = await (this.prisma as any).clientGoal.create({
          data: {
            clientId: data.clientId,
            tenantId: data.tenantId,
            title: 'Meta de Massa Muscular',
            description: 'Ganho de massa magra',
            type: 'muscle_mass',
            target: data.assessmentData.muscleMass * 1.1, // Aumento de 10%
            current: data.assessmentData.muscleMass,
            unit: 'kg',
            startDate: new Date(),
            targetDate: data.targetDate,
            status: 'active'
          }
        });
        goals.push(muscleGoal);
      }

      logger.info(`✅ Created ${goals.length} goals from assessment for client ${data.clientId}`);
      return goals;
    } catch (error) {
      logger.error('Error creating goals from assessment:', error);
      throw error;
    }
  }

  /**
   * Atualiza progresso de goals baseado em workouts completados
   */
  async updateGoalsFromWorkouts(clientId: string, tenantId: string) {
    try {
      // Buscar workouts completados
      const completedWorkouts = await this.prisma.workout.findMany({
        where: {
          clientId,
          tenantId,
          completed: true
        },
        orderBy: { completedAt: 'desc' },
        take: 30 // Últimos 30 workouts
      });

      // Buscar goals ativos
      const activeGoals = await (this.prisma as any).clientGoal.findMany({
        where: {
          clientId,
          tenantId,
          status: 'active'
        }
      });

      // Atualizar goals baseado no progresso
      const updatedGoals = [];
      for (const goal of activeGoals) {
        let newCurrent = goal.current;

        switch (goal.type) {
          case 'performance':
            // Aumentar performance baseado em workouts completados
            newCurrent = goal.current + (completedWorkouts.length * 0.5);
            break;
          
          case 'endurance':
            // Melhorar endurance baseado no número de treinos completados
            newCurrent = goal.current + (completedWorkouts.length * 5); // +5 minutos por treino completado
            break;
        }

        if (newCurrent !== goal.current) {
            const updatedGoal = await (this.prisma as any).clientGoal.update({
            where: { id: goal.id },
            data: { current: newCurrent }
          });
          updatedGoals.push(updatedGoal);
        }
      }

      logger.info(`✅ Updated ${updatedGoals.length} goals from workouts for client ${clientId}`);
      return updatedGoals;
    } catch (error) {
      logger.error('Error updating goals from workouts:', error);
      throw error;
    }
  }

  /**
   * Busca goals do cliente com progresso
   */
  async getClientGoals(clientId: string, tenantId: string) {
    try {
      const goals = await (this.prisma as any).clientGoal.findMany({
        where: {
          clientId,
          tenantId
        },
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Calcular progresso
      const goalsWithProgress = goals.map(goal => {
        const progress = ((goal.current / goal.target) * 100);
        const daysRemaining = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        return {
          ...goal,
          progress: Math.min(progress, 100),
          daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
          isOnTrack: progress >= 50 || daysRemaining > 7
        };
      });

      return goalsWithProgress;
    } catch (error) {
      logger.error('Error getting client goals:', error);
      throw error;
    }
  }

  /**
   * Atualiza o progresso de um goal específico
   */
  async updateGoalProgress(goalId: string, newCurrent: number, tenantId: string) {
    try {
      const goal = await (this.prisma as any).clientGoal.findFirst({
        where: {
          id: goalId,
          tenantId
        }
      });

      if (!goal) {
        throw new Error('Goal not found');
      }

      const updatedGoal = await (this.prisma as any).clientGoal.update({
        where: { id: goalId },
        data: {
          current: newCurrent,
          status: newCurrent >= goal.target ? 'achieved' : goal.status
        }
      });

      // Se a meta foi alcançada, marcar como achieved
      if (updatedGoal.status === 'achieved' && !goal.achievedAt) {
        await (this.prisma as any).clientGoal.update({
          where: { id: goalId },
          data: { achievedAt: new Date() }
        });
      }

      logger.info(`✅ Updated goal progress: ${goalId}`);
      return updatedGoal;
    } catch (error) {
      logger.error('Error updating goal progress:', error);
      throw error;
    }
  }
}
