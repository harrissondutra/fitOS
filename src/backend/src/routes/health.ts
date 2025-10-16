import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { getRedisClient } from '../config/redis';
import { logger } from '../utils/logger';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'unknown',
        redis: 'unknown',
      },
    };

    // Check database connection
    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      logger.error('Database health check failed:', error);
    }

    // Check Redis connection
    try {
      const redis = getRedisClient();
      await redis.ping();
      healthCheck.services.redis = 'healthy';
    } catch (error) {
      healthCheck.services.redis = 'unhealthy';
      logger.error('Redis health check failed:', error);
    }

    // Determine overall status
    const allServicesHealthy = Object.values(healthCheck.services).every(
      status => status === 'healthy'
    );

    if (!allServicesHealthy) {
      healthCheck.status = 'degraded';
    }

    const statusCode = allServicesHealthy ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// Detailed health check with more information
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const detailedHealth = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      services: {
        database: {
          status: 'unknown',
          responseTime: 0,
        },
        redis: {
          status: 'unknown',
          responseTime: 0,
        },
      },
    };

    // Check database with response time
    try {
      const prisma = getPrismaClient();
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const dbEnd = Date.now();
      
      detailedHealth.services.database = {
        status: 'healthy',
        responseTime: dbEnd - dbStart,
      };
    } catch (error) {
      detailedHealth.services.database = {
        status: 'unhealthy',
        responseTime: 0,
      };
      logger.error('Database detailed health check failed:', error);
    }

    // Check Redis with response time
    try {
      const redis = getRedisClient();
      const redisStart = Date.now();
      await redis.ping();
      const redisEnd = Date.now();
      
      detailedHealth.services.redis = {
        status: 'healthy',
        responseTime: redisEnd - redisStart,
      };
    } catch (error) {
      detailedHealth.services.redis = {
        status: 'unhealthy',
        responseTime: 0,
      };
      logger.error('Redis detailed health check failed:', error);
    }

    // Determine overall status
    const allServicesHealthy = Object.values(detailedHealth.services).every(
      service => service.status === 'healthy'
    );

    if (!allServicesHealthy) {
      detailedHealth.status = 'degraded';
    }

    const statusCode = allServicesHealthy ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    logger.error('Detailed health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
    });
  }
});

export { router as healthRoutes };
