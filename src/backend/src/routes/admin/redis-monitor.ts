/**
 * Redis Monitor Routes - FitOS
 * 
 * Rotas para monitoramento do Redis:
 * - Health dashboard
 * - Estatísticas de cache
 * - Métricas de performance
 * - Alertas e notificações
 */

import { Router, Request, Response } from 'express';
import { redisService } from '../../services/redis.service';
import { queueService } from '../../services/queue.service';
import { sessionService } from '../../services/session.service';
import { presenceService } from '../../services/presence.service';
import { eventBusService } from '../../services/event-bus.service';
import { schedulerService } from '../../services/scheduler.service';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/admin/redis-monitor/health
 * Health check do Redis
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await redisService.healthCheck();
    const info = await redisService.getInfo();
    
    res.json({
      success: true,
      data: {
        redis: health,
        info: {
          version: info.redis_version,
          uptime: info.uptime_in_seconds,
          connected_clients: info.connected_clients,
          used_memory: info.used_memory_human,
          used_memory_peak: info.used_memory_peak_human,
          total_commands_processed: info.total_commands_processed,
          keyspace_hits: info.keyspace_hits,
          keyspace_misses: info.keyspace_misses
        }
      }
    });
  } catch (error) {
    logger.error('Redis health check failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Redis health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/stats
 * Estatísticas gerais do Redis
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const [cacheStats, sessionStats, presenceStats, eventStats, queueStats] = await Promise.all([
      redisService.getStats(),
      sessionService.getSessionStats(),
      presenceService.getPresenceStats(),
      eventBusService.getEventStats(),
      queueService.getQueueStats()
    ]);

    res.json({
      success: true,
      data: {
        cache: cacheStats,
        sessions: sessionStats,
        presence: presenceStats,
        events: eventStats,
        queues: queueStats
      }
    });
  } catch (error) {
    logger.error('Failed to get Redis stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get Redis statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/cache
 * Estatísticas de cache
 */
router.get('/cache', async (req: Request, res: Response) => {
  try {
    const stats = redisService.getStats();
    const info = await redisService.getInfo();
    
    // Calcular hit ratio
    const hits = info.keyspace_hits || 0;
    const misses = info.keyspace_misses || 0;
    const total = hits + misses;
    const hitRatio = total > 0 ? (hits / total) * 100 : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        hitRatio: Math.round(hitRatio * 100) / 100,
        totalRequests: total,
        hits,
        misses
      }
    });
  } catch (error) {
    logger.error('Failed to get cache stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get cache statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/keys
 * Listar chaves do Redis
 */
router.get('/keys', async (req: Request, res: Response) => {
  try {
    const { pattern = '*', limit = 100 } = req.query;
    
    const keys = await redisService.keys(pattern as string);
    const limitedKeys = keys.slice(0, parseInt(limit as string));
    
    // Obter informações das chaves
    const keyInfo = await Promise.all(
      limitedKeys.map(async (key) => {
        const ttl = await redisService.ttl(key);
        const type = await redisService.get(key, { serialize: false });
        
        return {
          key,
          ttl,
          type: typeof type,
          size: JSON.stringify(type).length
        };
      })
    );

    res.json({
      success: true,
      data: {
        total: keys.length,
        shown: limitedKeys.length,
        keys: keyInfo
      }
    });
  } catch (error) {
    logger.error('Failed to get Redis keys:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get Redis keys',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/memory
 * Informações de memória
 */
router.get('/memory', async (req: Request, res: Response) => {
  try {
    const info = await redisService.getInfo();
    
    const memoryInfo = {
      used: {
        bytes: info.used_memory,
        human: info.used_memory_human
      },
      peak: {
        bytes: info.used_memory_peak,
        human: info.used_memory_peak_human
      },
      fragmentation: info.mem_fragmentation_ratio,
      rss: {
        bytes: info.used_memory_rss,
        human: info.used_memory_rss_human
      },
      system: {
        bytes: info.total_system_memory,
        human: info.total_system_memory_human
      }
    };

    // Calcular percentual de uso
    const usagePercent = info.total_system_memory > 0 
      ? (info.used_memory / info.total_system_memory) * 100 
      : 0;

    res.json({
      success: true,
      data: {
        ...memoryInfo,
        usagePercent: Math.round(usagePercent * 100) / 100
      }
    });
  } catch (error) {
    logger.error('Failed to get memory info:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get memory information',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/queues
 * Estatísticas das filas
 */
router.get('/queues', async (req: Request, res: Response) => {
  try {
    const stats = await queueService.getQueueStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get queue statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/sessions
 * Estatísticas de sessões
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const stats = await sessionService.getSessionStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get session stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get session statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/presence
 * Estatísticas de presença
 */
router.get('/presence', async (req: Request, res: Response) => {
  try {
    const stats = await presenceService.getPresenceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get presence stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get presence statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/events
 * Estatísticas de eventos
 */
router.get('/events', async (req: Request, res: Response) => {
  try {
    const stats = await eventBusService.getEventStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Failed to get event stats:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get event statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * GET /api/admin/redis-monitor/scheduler
 * Status do scheduler
 */
router.get('/scheduler', async (req: Request, res: Response) => {
  try {
    const jobs = schedulerService.getJobsStatus();
    const isRunning = schedulerService.isSchedulerRunning();
    
    res.json({
      success: true,
      data: {
        isRunning,
        jobs
      }
    });
  } catch (error) {
    logger.error('Failed to get scheduler status:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get scheduler status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/admin/redis-monitor/flush
 * Limpar cache Redis
 */
router.post('/flush', async (req: Request, res: Response) => {
  try {
    const { pattern } = req.body;
    
    if (pattern) {
      // Limpar chaves por padrão
      const keys = await redisService.keys(pattern);
      let deletedCount = 0;
      
      for (const key of keys) {
        const deleted = await redisService.del(key);
        if (deleted) deletedCount++;
      }
      
      res.json({
        success: true,
        data: {
          message: `Cleared ${deletedCount} keys matching pattern: ${pattern}`,
          deletedCount
        }
      });
    } else {
      // Limpar todo o banco
      await redisService.flush();
      
      res.json({
        success: true,
        data: {
          message: 'Redis database flushed successfully'
        }
      });
    }
  } catch (error) {
    logger.error('Failed to flush Redis:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to flush Redis',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/admin/redis-monitor/cleanup
 * Executar limpeza de dados expirados
 */
router.post('/cleanup', async (req: Request, res: Response) => {
  try {
    const [sessionCleanup, presenceCleanup] = await Promise.all([
      sessionService.cleanupExpiredSessions(),
      presenceService.cleanupExpiredPresence()
    ]);
    
    res.json({
      success: true,
      data: {
        message: 'Cleanup completed successfully',
        sessionsCleaned: sessionCleanup,
        presenceCleaned: presenceCleanup
      }
    });
  } catch (error) {
    logger.error('Failed to run cleanup:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to run cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/admin/redis-monitor/scheduler/toggle
 * Habilitar/desabilitar job do scheduler
 */
router.post('/scheduler/toggle', async (req: Request, res: Response) => {
  try {
    const { jobId, enabled } = req.body;
    
    if (!jobId || typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'jobId and enabled (boolean) are required'
        }
      });
    }
    
    schedulerService.toggleJob(jobId, enabled);
    
    return res.json({
      success: true,
      data: {
        message: `Job ${jobId} ${enabled ? 'enabled' : 'disabled'}`
      }
    });
  } catch (error) {
    logger.error('Failed to toggle scheduler job:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to toggle scheduler job',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

/**
 * POST /api/admin/redis-monitor/scheduler/execute
 * Executar job do scheduler manualmente
 */
router.post('/scheduler/execute', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.body;
    
    if (!jobId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'jobId is required'
        }
      });
    }
    
    await schedulerService.executeJobManually(jobId);
    
    return res.json({
      success: true,
      data: {
        message: `Job ${jobId} executed successfully`
      }
    });
  } catch (error) {
    logger.error('Failed to execute scheduler job:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to execute scheduler job',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    });
  }
});

export default router;
