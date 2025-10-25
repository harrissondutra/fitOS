import { Router } from 'express';
import { ProfessionalCRMService } from '../services/professional-crm.service';
import { getAuthMiddleware } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';
import { requireRole, requireResourceAccess, requireCRMAccess } from '../middleware/permissions';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();
const crmService = new ProfessionalCRMService();
const prisma = new PrismaClient();
const authMiddleware = getAuthMiddleware(prisma);

// Middleware de autenticação para todas as rotas
router.use(authMiddleware.requireAuth);

// Middleware para verificar acesso ao CRM (não MEMBER)
router.use(requireCRMAccess);

/**
 * @route POST /api/crm/clients
 * @desc Criar perfil de cliente
 * @access OWNER, ADMIN, TRAINER
 */
router.post(
  '/clients',
  [
    body('memberId').isString().notEmpty(),
    body('leadSource').optional().isString(),
    body('status').optional().isIn(['prospect', 'active', 'at_risk', 'inactive', 'churned']),
    body('tags').optional().isArray(),
    body('customFields').optional().isObject()
  ],
  requireRole(['OWNER', 'ADMIN', 'TRAINER']),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.createClientProfile(
        {
          ...req.body,
          tenantId: req.user.tenantId,
          professionalId: req.user.id
        },
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        message: 'Perfil de cliente criado com sucesso',
        clientProfile: result.clientProfile
      });
    } catch (error: any) {
      console.error('Erro ao criar perfil de cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/crm/clients
 * @desc Listar perfis de clientes
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/clients',
  [
    query('status').optional().isString(),
    query('leadSource').optional().isString(),
    query('tags').optional().isArray(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const filters = {
        tenantId: req.user.tenantId,
        ...req.query
      };

      // Ajusta filtros baseado na role
      if (req.user.role === 'TRAINER') {
        filters.professionalId = req.user.id;
      }

      const result = await crmService.getClientProfiles(filters);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        clients: result.clients,
        total: result.total,
        limit: filters.limit || 50,
        offset: filters.offset || 0
      });
    } catch (error: any) {
      console.error('Erro ao listar perfis de clientes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/crm/clients/:id
 * @desc Obter perfil de cliente por ID
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/clients/:id',
  [param('id').isString().notEmpty()],
  requireResourceAccess('crm_client'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.getClientProfileById(req.params.id);

      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }

      res.json({ clientProfile: result.clientProfile });
    } catch (error: any) {
      console.error('Erro ao obter perfil de cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/crm/clients/:id
 * @desc Atualizar perfil de cliente
 * @access OWNER, ADMIN, TRAINER
 */
router.put(
  '/clients/:id',
  [
    param('id').isString().notEmpty(),
    body('leadSource').optional().isString(),
    body('status').optional().isIn(['prospect', 'active', 'at_risk', 'inactive', 'churned']),
    body('lifetimeValue').optional().isFloat({ min: 0 }),
    body('tags').optional().isArray(),
    body('customFields').optional().isObject()
  ],
  requireResourceAccess('crm_client'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.updateClientProfile(
        req.params.id,
        req.body,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        message: 'Perfil de cliente atualizado com sucesso',
        clientProfile: result.clientProfile
      });
    } catch (error: any) {
      console.error('Erro ao atualizar perfil de cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route POST /api/crm/interactions
 * @desc Criar interação com cliente
 * @access OWNER, ADMIN, TRAINER
 */
router.post(
  '/interactions',
  [
    body('clientId').isString().notEmpty(),
    body('type').isIn(['call', 'email', 'meeting', 'workout', 'nutrition', 'note']),
    body('subject').isString().notEmpty(),
    body('description').optional().isString(),
    body('outcome').optional().isString(),
    body('nextAction').optional().isString(),
    body('scheduledDate').optional().isISO8601(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('tags').optional().isArray(),
    body('attachments').optional().isArray()
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.createInteraction(
        {
          ...req.body,
          tenantId: req.user.tenantId,
          professionalId: req.user.id
        },
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        message: 'Interação criada com sucesso',
        interaction: result.interaction
      });
    } catch (error: any) {
      console.error('Erro ao criar interação:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route POST /api/crm/tasks
 * @desc Criar tarefa CRM
 * @access OWNER, ADMIN, TRAINER
 */
router.post(
  '/tasks',
  [
    body('clientId').isString().notEmpty(),
    body('title').isString().notEmpty(),
    body('description').optional().isString(),
    body('type').isIn(['follow_up', 'call', 'email', 'meeting']),
    body('dueDate').isISO8601(),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent'])
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.createTask(
        {
          ...req.body,
          tenantId: req.user.tenantId,
          professionalId: req.user.id
        },
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.status(201).json({
        message: 'Tarefa CRM criada com sucesso',
        task: result.task
      });
    } catch (error: any) {
      console.error('Erro ao criar tarefa CRM:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/crm/tasks
 * @desc Listar tarefas CRM
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/tasks',
  [
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 })
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const professionalId = req.user.role === 'TRAINER' ? req.user.id : undefined;

      const result = await crmService.getTasks(
        req.user.tenantId,
        professionalId,
        req.query.status,
        req.query.limit || 50,
        req.query.offset || 0
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        tasks: result.tasks,
        total: result.total,
        limit: req.query.limit || 50,
        offset: req.query.offset || 0
      });
    } catch (error: any) {
      console.error('Erro ao listar tarefas CRM:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route PUT /api/crm/tasks/:id
 * @desc Atualizar tarefa CRM
 * @access OWNER, ADMIN, TRAINER
 */
router.put(
  '/tasks/:id',
  [
    param('id').isString().notEmpty(),
    body('title').optional().isString(),
    body('description').optional().isString(),
    body('status').optional().isIn(['pending', 'completed', 'cancelled']),
    body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
    body('dueDate').optional().isISO8601()
  ],
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.updateTask(
        req.params.id,
        req.body,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({
        message: 'Tarefa CRM atualizada com sucesso',
        task: result.task
      });
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa CRM:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/crm/pipeline
 * @desc Obter pipeline de clientes (Kanban)
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/pipeline',
  [],
  async (req: any, res) => {
    try {
      const professionalId = req.user.role === 'TRAINER' ? req.user.id : undefined;

      const result = await crmService.getClientPipeline(
        req.user.tenantId,
        professionalId
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ pipeline: result.pipeline });
    } catch (error: any) {
      console.error('Erro ao obter pipeline:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/crm/stats
 * @desc Obter estatísticas do CRM
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/stats',
  [],
  async (req: any, res) => {
    try {
      const professionalId = req.user.role === 'TRAINER' ? req.user.id : undefined;

      const result = await crmService.getCRMStats(
        req.user.tenantId,
        professionalId
      );

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ stats: result.stats });
    } catch (error: any) {
      console.error('Erro ao obter estatísticas do CRM:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

/**
 * @route GET /api/crm/clients/:id/insights
 * @desc Obter insights de cliente
 * @access OWNER, ADMIN, TRAINER
 */
router.get(
  '/clients/:id/insights',
  [param('id').isString().notEmpty()],
  requireResourceAccess('crm_client'),
  async (req: any, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const result = await crmService.getClientInsights(req.params.id);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ insights: result.insights });
    } catch (error: any) {
      console.error('Erro ao obter insights do cliente:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
);

export default router;
