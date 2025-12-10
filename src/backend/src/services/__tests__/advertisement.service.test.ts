/**
 * Tests for Advertisement Service
 * Testes unitários para o serviço de anúncios
 */

import { AdvertisementService } from '../advertisement.service';
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

// Mock Redis
jest.mock('ioredis', () => ({
  Redis: jest.fn(),
}));

describe('AdvertisementService', () => {
  let service: AdvertisementService;
  let mockPrisma: jest.Mocked<PrismaClient>;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    // Setup mocks
    mockPrisma = {
      advertisement: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
      },
    } as any;

    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      incr: jest.fn(),
    } as any;

    service = new AdvertisementService(mockPrisma, mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAdvertisement', () => {
    it('should create a new advertisement successfully', async () => {
      const adData = {
        tenantId: 'tenant-123',
        type: 'banner',
        position: 'header',
        title: 'Test Ad',
        description: 'Test Description',
        isActive: true,
        priority: 1,
      };

      const expectedAd = {
        id: 'ad-123',
        ...adData,
        impressionCount: 0,
        clickCount: 0,
        conversionCount: 0,
        avgRelevanceScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.advertisement.create.mockResolvedValue(expectedAd as any);
      mockRedis.del.mockResolvedValue(1);

      const result = await service.createAdvertisement(adData);

      expect(result).toEqual(expectedAd);
      expect(mockPrisma.advertisement.create).toHaveBeenCalledWith({
        data: adData,
      });
      expect(mockRedis.del).toHaveBeenCalled();
    });

    it('should throw error if tenant does not exist', async () => {
      const adData = {
        tenantId: 'invalid-tenant',
        type: 'banner',
        position: 'header',
      };

      mockPrisma.advertisement.create.mockRejectedValue(
        new Error('Tenant not found')
      );

      await expect(service.createAdvertisement(adData)).rejects.toThrow(
        'Tenant not found'
      );
    });
  });

  describe('getRelevantAd', () => {
    it('should return relevant ads for a position', async () => {
      const position = 'header';
      const userContext = {
        userId: 'user-123',
        tenantId: 'tenant-123',
        plan: 'individual',
      };
      const tenantId = 'tenant-123';

      const mockAds = [
        {
          id: 'ad-1',
          tenantId,
          type: 'banner',
          position,
          isActive: true,
          priority: 10,
          avgRelevanceScore: 0.9,
        },
        {
          id: 'ad-2',
          tenantId,
          type: 'banner',
          position,
          isActive: true,
          priority: 5,
          avgRelevanceScore: 0.7,
        },
      ];

      mockRedis.get.mockResolvedValue(null);
      mockPrisma.advertisement.findMany.mockResolvedValue(mockAds as any);
      mockRedis.setex.mockResolvedValue('OK');

      const result = await service.getRelevantAd(
        position,
        userContext,
        tenantId,
        1
      );

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return cached ads if available', async () => {
      const position = 'header';
      const cachedAds = [
        {
          id: 'ad-1',
          tenantId: 'tenant-123',
          type: 'banner',
          position,
        },
      ];

      mockRedis.get.mockResolvedValue(JSON.stringify(cachedAds));

      const result = await service.getRelevantAd(
        position,
        {},
        'tenant-123',
        1
      );

      expect(result).toEqual(cachedAds);
      expect(mockPrisma.advertisement.findMany).not.toHaveBeenCalled();
    });
  });

  describe('shouldShowAds', () => {
    it('should return true for individual plan', async () => {
      const result = await service.shouldShowAds('individual', 'tenant-123');
      expect(result).toBe(true);
    });

    it('should return true for professional plan', async () => {
      const result = await service.shouldShowAds(
        'professional',
        'tenant-123'
      );
      expect(result).toBe(true);
    });

    it('should return false for enterprise plan', async () => {
      const result = await service.shouldShowAds('enterprise', 'tenant-123');
      expect(result).toBe(false);
    });

    it('should return false for custom plan', async () => {
      const result = await service.shouldShowAds('custom', 'tenant-123');
      expect(result).toBe(false);
    });
  });

  describe('registerImpression', () => {
    it('should register an impression successfully', async () => {
      const adId = 'ad-123';
      const tenantId = 'tenant-123';

      mockPrisma.advertisement.update.mockResolvedValue({
        id: adId,
        impressionCount: 1,
      } as any);

      await service.registerImpression(adId, tenantId, 0.8, 'user-123');

      expect(mockPrisma.advertisement.update).toHaveBeenCalledWith({
        where: { id: adId, tenantId },
        data: {
          impressionCount: { increment: 1 },
        },
      });
    });

    it('should update relevance score', async () => {
      const adId = 'ad-123';
      const tenantId = 'tenant-123';
      const relevanceScore = 0.9;

      mockPrisma.advertisement.findUnique.mockResolvedValue({
        id: adId,
        impressionCount: 10,
        avgRelevanceScore: 0.8,
      } as any);

      mockPrisma.advertisement.update.mockResolvedValue({
        id: adId,
        impressionCount: 11,
        avgRelevanceScore: 0.81,
      } as any);

      await service.registerImpression(adId, tenantId, relevanceScore);

      expect(mockPrisma.advertisement.update).toHaveBeenCalled();
    });
  });

  describe('registerClick', () => {
    it('should register a click successfully', async () => {
      const adId = 'ad-123';
      const tenantId = 'tenant-123';

      mockPrisma.advertisement.update.mockResolvedValue({
        id: adId,
        clickCount: 1,
      } as any);

      await service.registerClick(adId, tenantId, 'user-123');

      expect(mockPrisma.advertisement.update).toHaveBeenCalledWith({
        where: { id: adId, tenantId },
        data: {
          clickCount: { increment: 1 },
        },
      });
    });
  });

  describe('registerConversion', () => {
    it('should register a conversion successfully', async () => {
      const adId = 'ad-123';
      const tenantId = 'tenant-123';
      const value = 100.0;

      mockPrisma.advertisement.update.mockResolvedValue({
        id: adId,
        conversionCount: 1,
      } as any);

      await service.registerConversion(adId, tenantId, value);

      expect(mockPrisma.advertisement.update).toHaveBeenCalledWith({
        where: { id: adId, tenantId },
        data: {
          conversionCount: { increment: 1 },
        },
      });
    });
  });

  describe('getAdvertisementStats', () => {
    it('should return advertisement statistics', async () => {
      const adId = 'ad-123';
      const mockAd = {
        id: adId,
        impressionCount: 1000,
        clickCount: 50,
        conversionCount: 5,
        avgRelevanceScore: 0.85,
      };

      mockPrisma.advertisement.findUnique.mockResolvedValue(mockAd as any);

      const stats = await service.getAdvertisementStats(adId);

      expect(stats).toEqual({
        impressions: 1000,
        clicks: 50,
        conversions: 5,
        ctr: 0.05, // 50/1000
        conversionRate: 0.1, // 5/50
        avgRelevance: 0.85,
      });
    });

    it('should handle zero impressions', async () => {
      const adId = 'ad-123';
      const mockAd = {
        id: adId,
        impressionCount: 0,
        clickCount: 0,
        conversionCount: 0,
        avgRelevanceScore: 0,
      };

      mockPrisma.advertisement.findUnique.mockResolvedValue(mockAd as any);

      const stats = await service.getAdvertisementStats(adId);

      expect(stats.ctr).toBe(0);
      expect(stats.conversionRate).toBe(0);
    });
  });
});
