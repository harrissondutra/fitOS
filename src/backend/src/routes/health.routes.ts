/**
 * Health Check Routes
 * 
 * Endpoints para verificação de saúde da aplicação:
 * - Health check básico
 * - Health check detalhado com dependências
 * - Status dos serviços externos
 */

import { Router } from 'express';
import { getPrismaClient } from '../config/database';
import { getRedisClient } from '../config/redis';

const router = Router();
const prisma = getPrismaClient();
const redis = getRedisClient();

/**
 * GET /api/health
 * Health check básico
 */
router.get('/', async (req, res) => {
  try {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/detailed
 * Health check detalhado com dependências
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      redis: 'unknown',
      stripe: 'unknown',
      mercadopago: 'unknown'
    },
    memory: {
      used: process.memoryUsage().heapUsed,
      total: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external
    }
  };

  let overallHealthy = true;

  // Check Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'healthy';
  } catch (error) {
    health.services.database = 'unhealthy';
    overallHealthy = false;
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'healthy';
  } catch (error) {
    health.services.redis = 'unhealthy';
    overallHealthy = false;
  }

  // Check Stripe
  try {
    if (process.env.STRIPE_SECRET_KEY) {
      health.services.stripe = 'configured';
    } else {
      health.services.stripe = 'not_configured';
    }
  } catch (error) {
    health.services.stripe = 'error';
  }

  // Check Mercado Pago
  try {
    if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
      health.services.mercadopago = 'configured';
    } else {
      health.services.mercadopago = 'not_configured';
    }
  } catch (error) {
    health.services.mercadopago = 'error';
  }

  health.status = overallHealthy ? 'healthy' : 'unhealthy';

  const statusCode = overallHealthy ? 200 : 503;
  res.status(statusCode).json(health);
});

/**
 * GET /api/health/readiness
 * Readiness check para Kubernetes/Docker
 */
router.get('/readiness', async (req, res) => {
  try {
    // Check critical dependencies
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/health/liveness
 * Liveness check para Kubernetes/Docker
 */
router.get('/liveness', async (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;

