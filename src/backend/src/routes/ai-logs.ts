/**
 * AI Logs Routes - Logs de consumo e uso de IA
 * 
 * Endpoints para monitorar e visualizar logs de consumo de IA
 */

import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database';
import { asyncHandler } from '../utils/async-handler';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/super-admin/ai/logs
 * Lista logs de consumo de IA com filtros e paginação
 */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  
  // Parâmetros de query
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;
  
  // Filtros
  const tenantId = req.query.tenantId as string | undefined;
  const provider = req.query.provider as string | undefined;
  const model = req.query.model as string | undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;
  const search = req.query.search as string | undefined;
  
  // Construir filtros
  const where: any = {};
  
  if (tenantId) {
    // Buscar clientId que pertence ao tenant
    const clients = await prisma.client.findMany({
      where: { tenantId },
      select: { id: true }
    });
    const clientIds = clients.map(c => c.id);
    where.clientId = { in: clientIds };
  }
  
  if (provider) {
    where.provider = provider;
  }
  
  if (model) {
    where.model = { contains: model, mode: 'insensitive' };
  }
  
  if (dateFrom || dateTo) {
    where.timestamp = {};
    if (dateFrom) {
      where.timestamp.gte = new Date(dateFrom);
    }
    if (dateTo) {
      where.timestamp.lte = new Date(dateTo);
    }
  }
  
  // Buscar logs com relacionamentos
  const [logs, total] = await Promise.all([
    prisma.aiCostTracking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            tenantId: true,
            tenant: {
              select: {
                id: true,
                name: true,
                subdomain: true,
                customDomain: true
              }
            }
          }
        }
      }
    }),
    prisma.aiCostTracking.count({ where })
  ]);
  
  // Formatar resposta
  const formattedLogs = logs.map(log => ({
    id: log.id,
    tenantId: log.client?.tenant?.id || log.client?.tenantId || null,
    tenantName: log.client?.tenant?.name || null,
    clientId: log.clientId,
    clientName: log.client?.name || null,
    provider: log.provider,
    model: log.model,
    inputTokens: log.inputTokens,
    outputTokens: log.outputTokens,
    totalTokens: log.inputTokens + log.outputTokens,
    cost: log.cost,
    currency: log.currency,
    isCacheHit: log.isCacheHit,
    metadata: log.metadata,
    timestamp: log.timestamp,
    createdAt: log.createdAt
  }));
  
  res.json({
    success: true,
    data: formattedLogs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: skip + logs.length < total
    }
  });
}));

/**
 * GET /api/super-admin/ai/logs/stats
 * Obtém estatísticas de consumo de IA
 */
router.get('/stats', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  
  const tenantId = req.query.tenantId as string | undefined;
  const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Últimos 30 dias
  const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : new Date();
  
  // Construir filtros
  const where: any = {
    timestamp: {
      gte: dateFrom,
      lte: dateTo
    }
  };
  
  if (tenantId) {
    const clients = await prisma.client.findMany({
      where: { tenantId },
      select: { id: true }
    });
    const clientIds = clients.map(c => c.id);
    where.clientId = { in: clientIds };
  }
  
  // Estatísticas gerais
  const [totalLogs, totalCost, totalTokens, cacheHits] = await Promise.all([
    prisma.aiCostTracking.count({ where }),
    prisma.aiCostTracking.aggregate({
      where,
      _sum: { cost: true }
    }),
    prisma.aiCostTracking.aggregate({
      where,
      _sum: {
        inputTokens: true,
        outputTokens: true
      }
    }),
    prisma.aiCostTracking.count({
      where: { ...where, isCacheHit: true }
    })
  ]);
  
  // Consumo por provider
  const consumptionByProvider = await prisma.aiCostTracking.groupBy({
    by: ['provider'],
    where,
    _sum: {
      cost: true,
      inputTokens: true,
      outputTokens: true
    },
    _count: true,
    orderBy: {
      _sum: {
        cost: 'desc'
      }
    }
  });
  
  // Consumo por modelo
  const consumptionByModel = await prisma.aiCostTracking.groupBy({
    by: ['model'],
    where,
    _sum: {
      cost: true,
      inputTokens: true,
      outputTokens: true
    },
    _count: true,
    orderBy: {
      _sum: {
        cost: 'desc'
      }
    },
    take: 10 // Top 10 modelos
  });
  
  // Consumo por tenant
  // Buscar todos os tenants que têm clientes com logs
  const allClientsWithLogs = await prisma.client.findMany({
    where: tenantId ? { tenantId } : {},
    select: {
      id: true,
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true
        }
      }
    },
    distinct: ['tenantId']
  });
  
  const tenantConsumption = await Promise.all(
    allClientsWithLogs.map(async (client) => {
      // Buscar todos os clientes deste tenant
      const tenantClients = await prisma.client.findMany({
        where: { tenantId: client.tenantId },
        select: { id: true }
      });
      const tenantClientIds = tenantClients.map(c => c.id);
      
      const tenantLogs = await prisma.aiCostTracking.aggregate({
        where: {
          clientId: { in: tenantClientIds },
          timestamp: {
            gte: dateFrom,
            lte: dateTo
          }
        },
        _sum: {
          cost: true,
          inputTokens: true,
          outputTokens: true
        },
        _count: true
      });
      
      return {
        tenantId: client.tenant?.id || client.tenantId || null,
        tenantName: client.tenant?.name || null,
        totalCost: tenantLogs._sum.cost || 0,
        totalTokens: (tenantLogs._sum.inputTokens || 0) + (tenantLogs._sum.outputTokens || 0),
        requestCount: tenantLogs._count || 0
      };
    })
  );
  
  // Consumo por dia (últimos 30 dias)
  // Buscar todos os logs no período e agrupar por dia
  const allLogs = await prisma.aiCostTracking.findMany({
    where,
    select: {
      timestamp: true,
      cost: true,
      inputTokens: true,
      outputTokens: true
    }
  });
  
  // Agrupar por dia
  const dailyMap = new Map<string, { cost: number; tokens: number; count: number }>();
  
  allLogs.forEach(log => {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    const existing = dailyMap.get(date) || { cost: 0, tokens: 0, count: 0 };
    dailyMap.set(date, {
      cost: existing.cost + log.cost,
      tokens: existing.tokens + log.inputTokens + log.outputTokens,
      count: existing.count + 1
    });
  });
  
  const dailyConsumption = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      cost: data.cost,
      tokens: data.tokens,
      requestCount: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  res.json({
    success: true,
    data: {
      total: {
        logs: totalLogs,
        cost: totalCost._sum.cost || 0,
        tokens: (totalTokens._sum.inputTokens || 0) + (totalTokens._sum.outputTokens || 0),
        cacheHits,
        cacheHitRate: totalLogs > 0 ? (cacheHits / totalLogs) * 100 : 0
      },
      byProvider: consumptionByProvider.map(item => ({
        provider: item.provider,
        cost: item._sum.cost || 0,
        tokens: (item._sum.inputTokens || 0) + (item._sum.outputTokens || 0),
        requestCount: item._count
      })),
      byModel: consumptionByModel.map(item => ({
        model: item.model,
        cost: item._sum.cost || 0,
        tokens: (item._sum.inputTokens || 0) + (item._sum.outputTokens || 0),
        requestCount: item._count
      })),
      byTenant: tenantConsumption
        .filter(t => t.totalCost > 0)
        .sort((a, b) => b.totalCost - a.totalCost),
      byDay: dailyConsumption
    }
  });
}));

/**
 * GET /api/super-admin/ai/logs/tenants
 * Lista todos os tenants que têm consumo de IA
 */
router.get('/tenants', asyncHandler(async (req: Request, res: Response) => {
  const prisma = getPrismaClient();
  
  // Buscar todos os clientIds que têm logs
  const logsWithClients = await prisma.aiCostTracking.findMany({
    select: {
      clientId: true
    },
    distinct: ['clientId']
  });
  
  const clientIds = logsWithClients.map(log => log.clientId);
  
  // Buscar clients e seus tenants
  const clients = await prisma.client.findMany({
    where: {
      id: { in: clientIds }
    },
    select: {
      tenantId: true,
      tenant: {
        select: {
          id: true,
          name: true,
          subdomain: true,
          customDomain: true,
          createdAt: true
        }
      }
    },
    distinct: ['tenantId']
  });
  
  const tenants = clients
    .map(c => c.tenant)
    .filter((t, index, self) => t && index === self.findIndex(tt => tt?.id === t.id))
    .map(t => ({
      id: t!.id,
      name: t!.name,
      domain: t!.customDomain || t!.subdomain || null,
      createdAt: t!.createdAt
    }));
  
  res.json({
    success: true,
    data: tenants.sort((a, b) => a.name.localeCompare(b.name))
  });
}));

export default router;

