import { Router } from 'express';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/permissions';
import { body, query, validationResult } from 'express-validator';
import { getPrismaClient } from '../config/database';
import { costManagementService } from '../services/cost-management.service';
import { costTrackerService } from '../services/cost-tracker.service';
import { logger } from '../utils/logger';

const router = Router();
const prisma = getPrismaClient();
const authMiddleware = getAuthMiddleware();

// Middleware de autenticação obrigatória para custos
router.use(authMiddleware.requireAuth);

/**
 * @route GET /api/costs/dashboard
 * @desc Obter dashboard completo de custos
 * @access SUPER_ADMIN
 */
router.get('/dashboard', requireRole(['SUPER_ADMIN']), async (req: any, res) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId as string,
      serviceId: req.query.serviceId as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      tenantId: req.query.tenantId as string,
      clientId: req.query.clientId as string,
    };

    const dashboard = await costManagementService.getDashboard(filters);

    res.json({
      success: true,
      data: dashboard,
    });
  } catch (error: any) {
    logger.error('Error getting cost dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/categories
 * @desc Listar categorias de custos
 * @access SUPER_ADMIN
 */
router.get('/categories', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const categories = await costManagementService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    logger.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/services
 * @desc Listar serviços de custos
 * @access SUPER_ADMIN
 */
router.get('/services', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const categoryId = req.query.categoryId as string;
    const services = await costManagementService.getServices(categoryId);

    res.json({
      success: true,
      data: services,
    });
  } catch (error: any) {
    logger.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/entries
 * @desc Listar entradas de custos com paginação
 * @access SUPER_ADMIN
 */
router.get('/entries', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId as string,
      serviceId: req.query.serviceId as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      tenantId: req.query.tenantId as string,
      clientId: req.query.clientId as string,
    };

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    const result = await costManagementService.getCostEntries(filters, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error('Error getting cost entries:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/costs/entries
 * @desc Criar entrada de custo manual
 * @access SUPER_ADMIN
 */
router.post('/entries',
  requireRole(['SUPER_ADMIN']),
  [
    body('categoryId').isString().notEmpty().withMessage('Categoria é obrigatória'),
    body('serviceId').isString().notEmpty().withMessage('Serviço é obrigatório'),
    body('amount').isNumeric().withMessage('Valor deve ser numérico'),
    body('currency').optional().isString(),
    body('date').optional().isISO8601().withMessage('Data deve ser válida'),
    body('description').optional().isString(),
    body('tags').optional().isArray(),
    body('metadata').optional().isObject(),
    body('revenueGenerated').optional().isNumeric(),
    body('tenantId').optional().isString(),
    body('clientId').optional().isString(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const entry = await costManagementService.createCostEntry({
        ...req.body,
        createdBy: req.user.id,
      });

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error: any) {
      logger.error('Error creating cost entry:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * @route PUT /api/costs/entries/:id
 * @desc Atualizar entrada de custo
 * @access SUPER_ADMIN
 */
router.put('/entries/:id',
  requireRole(['SUPER_ADMIN']),
  [
    body('amount').optional().isNumeric(),
    body('currency').optional().isString(),
    body('date').optional().isISO8601(),
    body('description').optional().isString(),
    body('tags').optional().isArray(),
    body('metadata').optional().isObject(),
    body('revenueGenerated').optional().isNumeric(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const entry = await costManagementService.updateCostEntry(req.params.id, req.body);

      res.json({
        success: true,
        data: entry,
      });
    } catch (error: any) {
      logger.error('Error updating cost entry:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * @route DELETE /api/costs/entries/:id
 * @desc Deletar entrada de custo
 * @access SUPER_ADMIN
 */
router.delete('/entries/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    await costManagementService.deleteCostEntry(req.params.id);

    res.json({
      success: true,
      message: 'Entrada de custo deletada com sucesso',
    });
  } catch (error: any) {
    logger.error('Error deleting cost entry:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/summary
 * @desc Obter resumo de custos
 * @access SUPER_ADMIN
 */
router.get('/summary', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId as string,
      serviceId: req.query.serviceId as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      tenantId: req.query.tenantId as string,
      clientId: req.query.clientId as string,
    };

    const dashboard = await costManagementService.getDashboard(filters);

    res.json({
      success: true,
      data: {
        totalCost: dashboard.totalCost,
        totalCostPreviousMonth: dashboard.totalCostPreviousMonth,
        costVariation: dashboard.costVariation,
        projectedCost: dashboard.projectedCost,
        fixedVsVariable: dashboard.fixedVsVariable,
      },
    });
  } catch (error: any) {
    logger.error('Error getting cost summary:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/trends
 * @desc Obter dados de tendência
 * @access SUPER_ADMIN
 */
router.get('/trends', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const months = parseInt(req.query.months as string) || 6;
    const trends = await costManagementService.getTrendsData(months);

    res.json({
      success: true,
      data: trends,
    });
  } catch (error: any) {
    logger.error('Error getting trends:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/comparison
 * @desc Obter comparação inteligente
 * @access SUPER_ADMIN
 */
router.get('/comparison', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId as string,
      serviceId: req.query.serviceId as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      tenantId: req.query.tenantId as string,
      clientId: req.query.clientId as string,
    };

    const comparison = await costManagementService.getSmartComparison(filters);

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    logger.error('Error getting comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/projection
 * @desc Obter projeção de custos
 * @access SUPER_ADMIN
 */
router.get('/projection', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      categoryId: req.query.categoryId as string,
      serviceId: req.query.serviceId as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      tenantId: req.query.tenantId as string,
      clientId: req.query.clientId as string,
    };

    const dashboard = await costManagementService.getDashboard(filters);

    res.json({
      success: true,
      data: {
        projectedCost: dashboard.projectedCost,
        currentCost: dashboard.totalCost,
        daysRemaining: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate(),
      },
    });
  } catch (error: any) {
    logger.error('Error getting projection:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/budgets
 * @desc Listar orçamentos
 * @access SUPER_ADMIN
 */
router.get('/budgets', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const budgets = await prisma.costBudget.findMany({
      include: {
        category: true,
        alerts: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: budgets,
    });
  } catch (error: any) {
    logger.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/costs/budgets
 * @desc Criar orçamento
 * @access SUPER_ADMIN
 */
router.post('/budgets',
  requireRole(['SUPER_ADMIN']),
  [
    body('categoryId').optional().isString(),
    body('monthlyLimit').isNumeric().withMessage('Limite mensal é obrigatório'),
    body('currency').optional().isString(),
    body('alertAt75').optional().isBoolean(),
    body('alertAt90').optional().isBoolean(),
    body('startDate').isISO8601().withMessage('Data de início é obrigatória'),
    body('endDate').optional().isISO8601(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const budget = await costManagementService.createBudget(req.body);

      res.status(201).json({
        success: true,
        data: budget,
      });
    } catch (error: any) {
      logger.error('Error creating budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * @route PUT /api/costs/budgets/:id
 * @desc Atualizar orçamento
 * @access SUPER_ADMIN
 */
router.put('/budgets/:id',
  requireRole(['SUPER_ADMIN']),
  [
    body('monthlyLimit').optional().isNumeric(),
    body('currency').optional().isString(),
    body('alertAt75').optional().isBoolean(),
    body('alertAt90').optional().isBoolean(),
    body('startDate').optional().isISO8601(),
    body('endDate').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const budget = await prisma.costBudget.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          updatedAt: new Date(),
        },
        include: {
          category: true,
        },
      });

      res.json({
        success: true,
        data: budget,
      });
    } catch (error: any) {
      logger.error('Error updating budget:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * @route DELETE /api/costs/budgets/:id
 * @desc Deletar orçamento
 * @access SUPER_ADMIN
 */
router.delete('/budgets/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    await prisma.costBudget.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Orçamento deletado com sucesso',
    });
  } catch (error: any) {
    logger.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route GET /api/costs/alerts
 * @desc Listar alertas
 * @access SUPER_ADMIN
 */
router.get('/alerts', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    const status = req.query.status as string;
    const alerts = await costManagementService.getAlerts(status);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    logger.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route PUT /api/costs/alerts/:id/acknowledge
 * @desc Reconhecer alerta
 * @access SUPER_ADMIN
 */
router.put('/alerts/:id/acknowledge', requireRole(['SUPER_ADMIN']), async (req: any, res) => {
  try {
    const alert = await costManagementService.acknowledgeAlert(req.params.id, req.user.id);

    res.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    logger.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route DELETE /api/costs/alerts/:id
 * @desc Deletar alerta
 * @access SUPER_ADMIN
 */
router.delete('/alerts/:id', requireRole(['SUPER_ADMIN']), async (req, res) => {
  try {
    await prisma.costAlert.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'Alerta deletado com sucesso',
    });
  } catch (error: any) {
    logger.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
    });
  }
});

/**
 * @route POST /api/costs/export
 * @desc Exportar relatório
 * @access SUPER_ADMIN
 */
router.post('/export',
  requireRole(['SUPER_ADMIN']),
  [
    body('format').isIn(['csv', 'json']).withMessage('Formato deve ser csv ou json'),
    body('filters').optional().isObject(),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      const { format, filters = {} } = req.body;
      const report = await costManagementService.exportReport(filters, format);

      const filename = `cost-report-${new Date().toISOString().split('T')[0]}.${format}`;
      
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(report);
    } catch (error: any) {
      logger.error('Error exporting report:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

/**
 * @route POST /api/costs/track
 * @desc Rastrear uso automaticamente (para testes)
 * @access SUPER_ADMIN
 */
router.post('/track',
  requireRole(['SUPER_ADMIN']),
  [
    body('categoryName').isString().notEmpty().withMessage('Nome da categoria é obrigatório'),
    body('serviceName').isString().notEmpty().withMessage('Nome do serviço é obrigatório'),
    body('usage').isObject().withMessage('Dados de uso são obrigatórios'),
    body('usage.quantity').isNumeric().withMessage('Quantidade deve ser numérica'),
    body('usage.unit').isString().notEmpty().withMessage('Unidade é obrigatória'),
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array(),
        });
      }

      await costTrackerService.trackUsage({
        ...req.body,
        tenantId: req.user.tenantId,
        createdBy: req.user.id,
      });

      res.json({
        success: true,
        message: 'Uso rastreado com sucesso',
      });
    } catch (error: any) {
      logger.error('Error tracking usage:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
      });
    }
  }
);

export default router;

