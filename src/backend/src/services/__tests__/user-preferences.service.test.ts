import { UserPreferencesService } from '../user-preferences.service';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../../config/redis.cache';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../config/redis.cache');

describe('UserPreferencesService', () => {
  let service: UserPreferencesService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockCache: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockCache = new CacheService() as jest.Mocked<CacheService>;
    service = new UserPreferencesService();
    
    // Use reflection to inject mocks
    (service as any).prisma = mockPrisma;
    (service as any).cache = mockCache;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserPreferences', () => {
    it('should fetch user preferences from cache', async () => {
      const mockPreferences = {
        id: '1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        fitnessGoals: ['weight_loss'],
        preferredWorkoutTypes: ['cardio'],
        workoutDuration: '60min',
        intensityLevel: 'moderate',
        preferredWorkoutDays: ['monday'],
        preferredWorkoutTime: 'morning',
        dietaryRestrictions: [],
        nutritionGoals: [],
        preferredMusicGenres: [],
        spotifyConnected: false,
        emailNotifications: true,
        pushNotifications: true,
        reminderFrequency: 'daily',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get = jest.fn().mockResolvedValue(mockPreferences);

      const result = await service.getUserPreferences('user-1', 'tenant-1');

      expect(mockCache.get).toHaveBeenCalledWith('preferences', 'user_preferences:user-1:tenant-1');
      expect(result).toEqual(mockPreferences);
    });

    it('should create default preferences if not exists', async () => {
      mockCache.get = jest.fn().mockResolvedValue(null);
      mockPrisma.userPreferences.findUnique = jest.fn().mockResolvedValue(null);
      mockPrisma.userPreferences.create = jest.fn().mockResolvedValue({
        id: '1',
        userId: 'user-1',
        tenantId: 'tenant-1',
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
        reminderFrequency: 'daily',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockCache.set = jest.fn().mockResolvedValue(undefined);

      const result = await service.getUserPreferences('user-1', 'tenant-1');

      expect(mockPrisma.userPreferences.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences', async () => {
      const existing = {
        id: '1',
        userId: 'user-1',
        tenantId: 'tenant-1',
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
        reminderFrequency: 'daily',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get = jest.fn().mockResolvedValue(existing);
      mockPrisma.userPreferences.update = jest.fn().mockResolvedValue({
        ...existing,
        fitnessGoals: ['weight_loss']
      });
      mockCache.del = jest.fn().mockResolvedValue(undefined);

      const updates = { fitnessGoals: ['weight_loss'] };
      const result = await service.updateUserPreferences('user-1', 'tenant-1', updates);

      expect(mockPrisma.userPreferences.update).toHaveBeenCalled();
      expect(result.fitnessGoals).toEqual(['weight_loss']);
    });
  });

  describe('getPersonalizedWorkouts', () => {
    it('should return personalized workouts based on preferences', async () => {
      const mockPreferences = {
        id: '1',
        userId: 'user-1',
        tenantId: 'tenant-1',
        fitnessGoals: ['weight_loss'],
        preferredWorkoutTypes: ['cardio'],
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
        reminderFrequency: 'daily',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCache.get = jest.fn().mockResolvedValue(mockPreferences);
      mockPrisma.workout.findMany = jest.fn().mockResolvedValue([
        { id: '1', name: 'Cardio Blast', exercises: [], deletedAt: null }
      ]);

      const result = await service.getPersonalizedWorkouts('user-1', 'tenant-1', { limit: 10, offset: 0 });

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

