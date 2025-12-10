import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
type PrismaUserPreferences = any;
import { CacheService } from '../config/redis.cache';
import { CreateUserPreferencesDto, UpdateUserPreferencesDto, PersonalizedWorkout, WorkoutRecommendation } from '../../../shared/types/sprint6';
import { logger } from '../utils/logger';

export class UserPreferencesService {
  private prisma: PrismaClient;
  private cache: CacheService;

  constructor() {
    this.prisma = getPrismaClient();
    this.cache = new CacheService();
  }

  /**
   * Obter ou criar preferências do usuário
   */
  async getUserPreferences(userId: string, tenantId: string): Promise<PrismaUserPreferences | null> {
    try {
      logger.info('Fetching user preferences', { userId, tenantId });

      // Tentar cache
      const cacheKey = `user_preferences:${userId}:${tenantId}`;
      const cached = await this.cache.get<PrismaUserPreferences>('preferences', cacheKey);
      if (cached) {
        return cached;
      }

      // TODO: Implementar quando modelo userPreferences for criado
      // Buscar do banco
      let preferences = null as any; // await this.prisma.userPreferences.findUnique({ where: { userId } });

      // Se não existe, criar com valores padrão
      if (!preferences) {
        preferences = {
          userId,
          tenantId,
          fitnessGoals: [],
          preferredWorkoutTypes: [],
          workoutDuration: '60min',
          intensityLevel: 'moderate',
          preferredWorkoutDays: [],
          preferredWorkoutTime: 'morning',
          dietaryRestrictions: [],
          nutritionGoals: [],
          preferredMusicGenres: [],
          spotifyConnected: false,
          emailNotifications: true,
          pushNotifications: true,
          reminderFrequency: 'daily'
        } as any;

        logger.info('Created default preferences', { userId, tenantId });
      }

      // Cache por 10 minutos
      await this.cache.set('preferences', cacheKey, preferences, 600);

      return preferences;
    } catch (error) {
      logger.error('Error fetching user preferences:', error);
      throw error;
    }
  }

  /**
   * Atualizar preferências do usuário
   */
  async updateUserPreferences(
    userId: string,
    tenantId: string,
    data: UpdateUserPreferencesDto
  ): Promise<PrismaUserPreferences> {
    try {
      logger.info('Updating user preferences', { userId, tenantId, data });

      // Buscar preferências existentes
      const existing = await this.getUserPreferences(userId, tenantId);

      if (!existing) {
        throw new Error('User preferences not found');
      }

      // Atualizar preferências
      const updated = {
        ...existing,
        fitnessGoals: data.fitnessGoals !== undefined ? data.fitnessGoals : existing.fitnessGoals,
        preferredWorkoutTypes: data.preferredWorkoutTypes !== undefined ? data.preferredWorkoutTypes : existing.preferredWorkoutTypes,
        workoutDuration: data.workoutDuration || existing.workoutDuration,
        intensityLevel: data.intensityLevel || existing.intensityLevel,
        preferredWorkoutDays: data.preferredWorkoutDays !== undefined ? data.preferredWorkoutDays : existing.preferredWorkoutDays,
        preferredWorkoutTime: data.preferredWorkoutTime || existing.preferredWorkoutTime,
        dietaryRestrictions: data.dietaryRestrictions !== undefined ? data.dietaryRestrictions : existing.dietaryRestrictions,
        nutritionGoals: data.nutritionGoals !== undefined ? data.nutritionGoals : existing.nutritionGoals,
        preferredMusicGenres: data.preferredMusicGenres !== undefined ? data.preferredMusicGenres : existing.preferredMusicGenres,
        emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : existing.emailNotifications,
        pushNotifications: data.pushNotifications !== undefined ? data.pushNotifications : existing.pushNotifications,
        reminderFrequency: data.reminderFrequency || existing.reminderFrequency
      } as any;
      // TODO: await this.prisma.userPreferences.update({ where: { userId }, data: { ... } });

      // Invalidar cache
      const cacheKey = `user_preferences:${userId}:${tenantId}`;
      await this.cache.del('preferences', cacheKey);

      logger.info('User preferences updated', { userId, tenantId });

      return updated;
    } catch (error) {
      logger.error('Error updating user preferences:', error);
      throw error;
    }
  }

  /**
   * Obter workouts personalizados baseados nas preferências
   */
  async getPersonalizedWorkouts(
    userId: string,
    tenantId: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<PersonalizedWorkout[]> {
    try {
      const preferences = await this.getUserPreferences(userId, tenantId);
      if (!preferences) {
        return [];
      }

      const limit = options.limit || 10;
      const offset = options.offset || 0;

      // Cache key baseado nas preferências
      const cacheKey = `personalized_workouts:${userId}:${JSON.stringify(preferences.fitnessGoals).slice(0, 50)}`;

      // Tentar cache
      const cached = await this.cache.get<PersonalizedWorkout[]>('workouts', cacheKey);
      if (cached) {
        return cached;
      }

      // Buscar workouts do banco
      const workouts = await this.prisma.workout.findMany({
        where: {
          tenantId
          // TODO: deletedAt não existe no schema
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }
      });

      // Personalizar workouts baseado nas preferências
      const personalized: PersonalizedWorkout[] = workouts.map(workout => {
        const matchScore = this.calculateWorkoutMatchScore(workout, preferences);
        
        return {
          id: workout.id,
          name: workout.name || 'Workout',
          description: workout.description || '',
          exercises: workout.exercises as any[] || [],
          estimatedDuration: parseInt(preferences.workoutDuration.replace('min', '')) || 60,
          difficulty: preferences.intensityLevel,
          matchScore
        };
      }).sort((a, b) => b.matchScore - a.matchScore);

      // Cache por 5 minutos
      await this.cache.set('workouts', cacheKey, personalized, 300);

      return personalized;
    } catch (error) {
      logger.error('Error fetching personalized workouts:', error);
      throw error;
    }
  }

  /**
   * Obter recomendações de workouts usando IA/ML
   */
  async getWorkoutRecommendations(
    userId: string,
    tenantId: string,
    limit: number = 5
  ): Promise<WorkoutRecommendation[]> {
    try {
      const preferences = await this.getUserPreferences(userId, tenantId);
      if (!preferences) {
        return [];
      }

      // Obter workouts personalizados
      const personalizedWorkouts = await this.getPersonalizedWorkouts(userId, tenantId, { limit: limit * 3 });

      // Gerar recomendações com razões
      const recommendations: WorkoutRecommendation[] = personalizedWorkouts.slice(0, limit).map(workout => {
        const reasons = this.generateRecommendationReasons(workout, preferences);
        
        return {
          workoutId: workout.id,
          score: workout.matchScore,
          reasons
        };
      });

      return recommendations;
    } catch (error) {
      logger.error('Error getting workout recommendations:', error);
      throw error;
    }
  }

  /**
   * Calcular score de compatibilidade do workout com preferências
   */
  private calculateWorkoutMatchScore(
    workout: any,
    preferences: PrismaUserPreferences
  ): number {
    let score = 50; // Score base

    // Verificar compatibilidade com tipos de workout preferidos
    const workoutType = workout.type?.toLowerCase() || '';
    const preferredTypes = (preferences.preferredWorkoutTypes as string[]).map(t => t.toLowerCase());
    
    if (preferredTypes.some(type => workoutType.includes(type))) {
      score += 30;
    }

    // Verificar compatibilidade com goals
    const workoutGoals = workout.goals || [];
    const userGoals = preferences.fitnessGoals as string[];
    
    if (workoutGoals.some((goal: string) => userGoals.includes(goal))) {
      score += 20;
    }

    // Normalizar para 0-100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Gerar razões para recomendação
   */
  private generateRecommendationReasons(
    workout: PersonalizedWorkout,
    preferences: PrismaUserPreferences
  ): string[] {
    const reasons: string[] = [];

    const preferredTypes = preferences.preferredWorkoutTypes as string[];
    const userGoals = preferences.fitnessGoals as string[];

    if (preferredTypes.length > 0) {
      reasons.push(`Baseado nos tipos de treino que você prefere: ${preferredTypes.join(', ')}`);
    }

    if (userGoals.length > 0) {
      reasons.push(`Alinhado com seus objetivos: ${userGoals.join(', ')}`);
    }

    if (workout.matchScore >= 80) {
      reasons.push('Excelente compatibilidade com suas preferências');
    } else if (workout.matchScore >= 60) {
      reasons.push('Boa compatibilidade com suas preferências');
    }

    return reasons.length > 0 ? reasons : ['Recomendado para você'];
  }

  /**
   * Criar workout personalizado de template
   */
  async createWorkoutFromTemplate(
    userId: string,
    tenantId: string,
    templateName: string
  ): Promise<PersonalizedWorkout> {
    try {
      const preferences = await this.getUserPreferences(userId, tenantId);
      if (!preferences) {
        throw new Error('User preferences not found');
      }

      // Templates de workout baseados em preferências
      const templates = this.getWorkoutTemplates();

      // Selecionar template mais apropriado
      const selectedTemplate = templates.find(t => 
        t.type.toLowerCase() === templateName.toLowerCase()
      ) || templates[0];

      const workout: PersonalizedWorkout = {
        id: `template_${Date.now()}`,
        name: selectedTemplate.name,
        description: selectedTemplate.description,
        exercises: selectedTemplate.exercises.map(ex => ({
          ...ex,
          difficulty: preferences.intensityLevel
        })),
        estimatedDuration: parseInt(preferences.workoutDuration.replace('min', '')) || 60,
        difficulty: preferences.intensityLevel,
        matchScore: 100 // Templates sempre têm score perfeito
      };

      logger.info('Created workout from template', { userId, templateName });

      return workout;
    } catch (error) {
      logger.error('Error creating workout from template:', error);
      throw error;
    }
  }

  /**
   * Obter templates de workout
   */
  private getWorkoutTemplates() {
    return [
      {
        type: 'weight_loss',
        name: 'Cardio & HIIT',
        description: 'Treino focado em queima de calorias e perda de peso',
        exercises: [
          {
            name: 'Jumping Jacks',
            description: 'Exercício de aquecimento',
            sets: 3,
            reps: 20,
            duration: 30
          },
          {
            name: 'Burpees',
            description: 'Exercício completo de alta intensidade',
            sets: 4,
            reps: 10,
            duration: 45
          }
        ]
      },
      {
        type: 'muscle_gain',
        name: 'Strength Training',
        description: 'Treino focado em ganho de massa muscular',
        exercises: [
          {
            name: 'Push-ups',
            description: 'Flexões de braço',
            sets: 4,
            reps: 12
          },
          {
            name: 'Pull-ups',
            description: 'Barra fixa',
            sets: 3,
            reps: 8
          }
        ]
      },
      {
        type: 'endurance',
        name: 'Endurance Builder',
        description: 'Treino focado em resistência e stamina',
        exercises: [
          {
            name: 'Running',
            description: 'Corrida contínua',
            duration: 1800
          },
          {
            name: 'Cycling',
            description: 'Ciclismo',
            duration: 1800
          }
        ]
      }
    ];
  }
}

