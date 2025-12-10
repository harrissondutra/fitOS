import { Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { getTenantPrisma } from './get-tenant-prisma';
import { getTenantPrismaWrapper } from './prisma-tenant-helper';
import { PrismaTenantWrapper } from '../services/prisma-tenant-wrapper.service';
import { ExerciseService } from '../services/exercise.service';
import { UserService } from '../services/user.service';
import { ClientService } from '../services/client.service';
import { WorkoutService } from '../services/workout.service';
import { BillingService } from '../services/billing.service';
import { ClientGoalsService } from '../services/client-goals.service';
import { GoalWorkoutIntegrationService } from '../services/goal-workout-integration.service';
import { AnalyticsService } from '../services/analytics.service';
import { TrainerStatsService } from '../services/trainer-stats.service';
import { TrainerClientsService } from '../services/trainer-clients.service';
import { ProfessionalCRMService } from '../services/professional-crm.service';
import { AiProviderService } from '../services/ai-provider.service';
import { BioimpedanceService } from '../services/bioimpedance.service';
import { SchedulingService } from '../services/scheduling.service';
import { getPrismaClient } from '../config/database';

/**
 * Factory para criar services com tenant context automático
 * Usa PrismaTenantWrapper quando disponível no request
 * 
 * @example
 * // Em uma rota:
 * const exerciseService = createExerciseService(req);
 * const exercises = await exerciseService.getExercises(filters, tenantId, role);
 */
export async function createExerciseService(req?: Request): Promise<ExerciseService> {
  // Se temos tenantId no request, usar wrapper para isolamento
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new ExerciseService(prisma);
  }
  // Fallback para compatibilidade retroativa
  const prisma = getTenantPrisma(req);
  return new ExerciseService(prisma);
}

export async function createUserService(req?: Request): Promise<UserService> {
  // Se temos tenantId no request, usar wrapper para isolamento
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new UserService(prisma);
  }
  // Fallback para compatibilidade retroativa
  const prisma = getTenantPrisma(req);
  return new UserService(prisma);
}

export async function createClientService(req?: Request): Promise<ClientService> {
  // Se temos tenantId no request, usar wrapper para isolamento
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new ClientService(prisma);
  }
  // Fallback para compatibilidade retroativa
  const prisma = getTenantPrisma(req);
  return new ClientService(prisma);
}

export async function createWorkoutService(req?: Request): Promise<WorkoutService> {
  // Se temos tenantId no request, usar wrapper para isolamento
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new WorkoutService(prisma);
  }
  // Fallback para compatibilidade retroativa
  const prisma = getTenantPrisma(req);
  return new WorkoutService(prisma);
}

export async function createBillingService(req?: Request): Promise<BillingService> {
  // Se temos tenantId no request, usar wrapper para isolamento
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new BillingService(prisma);
  }
  // Fallback para compatibilidade retroativa
  const prisma = getTenantPrisma(req);
  return new BillingService(prisma);
}

export async function createClientGoalsService(req?: Request): Promise<ClientGoalsService> {
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new ClientGoalsService(prisma);
  }
  const prisma = getTenantPrisma(req);
  return new ClientGoalsService(prisma);
}

export async function createGoalWorkoutIntegrationService(req?: Request): Promise<GoalWorkoutIntegrationService> {
  // Se temos tenantId no request, usar wrapper para isolamento
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new GoalWorkoutIntegrationService(prisma);
  }
  // Fallback para compatibilidade retroativa
  const prisma = getTenantPrisma(req);
  return new GoalWorkoutIntegrationService(prisma);
}

export async function createAnalyticsService(req?: Request): Promise<AnalyticsService> {
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new AnalyticsService(prisma);
  }
  const prisma = getTenantPrisma(req);
  return new AnalyticsService(prisma);
}

// removido overload assíncrono duplicado

export async function createTrainerStatsService(req?: Request): Promise<TrainerStatsService> {
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new TrainerStatsService(prisma);
  }
  const prisma = getTenantPrisma(req);
  return new TrainerStatsService(prisma);
}

export async function createTrainerClientsService(req?: Request): Promise<TrainerClientsService> {
  if (req && (req as any).tenantId) {
    const tenantId = (req as any).tenantId;
    const prisma = await getTenantPrismaWrapper(tenantId);
    return new TrainerClientsService(prisma);
  }
  const prisma = getTenantPrisma(req);
  return new TrainerClientsService(prisma);
}

export function createProfessionalCRMService(req?: Request): ProfessionalCRMService {
  const prisma = getTenantPrisma(req);
  return new ProfessionalCRMService(prisma);
}

export function createAiProviderService(req?: Request): AiProviderService {
  const prisma = getTenantPrisma(req);
  return new AiProviderService(prisma);
}

export function createBioimpedanceService(req?: Request): BioimpedanceService {
  const prisma = getTenantPrisma(req);
  return new BioimpedanceService(prisma);
}

export function createSchedulingService(req?: Request): SchedulingService {
  return new SchedulingService();
}

/**
 * Helper para obter PrismaClient com tenant context do request
 * Útil para services que ainda não foram refatorados
 */
export function getPrismaFromRequest(req?: Request): PrismaClient | any {
  return getTenantPrisma(req);
}

