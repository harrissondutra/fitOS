import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { RequestWithTenant } from '../middleware/tenant';
import { getPrismaClient } from '../config/database';
import { ClientService, ClientFilters, ClientFormData } from '../services/client.service';
import { createClientService } from '../utils/service-factory';
import { ActivityLogService } from '../services/activity-log.service';
import { checkClientLimit, trackUsage } from '../middleware/plan-limits.middleware';
import { body, validationResult, query } from 'express-validator';

// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';

// PrismaClient global (mantido para logs e operações diretas)
const prisma = getPrismaClient();
const activityLogService = new ActivityLogService(prisma);

const router = Router();

// Interface para requisições com tenant
interface RequestWithTenantAndAuth extends RequestWithTenant {
  user?: {
    id: string;
    email: string;
    role: any; // aceitar roles legadas
    tenantId?: string;
    name?: string;
  };
}

// Get all clients
router.get('/', 
  [
    query('search').optional().isString().trim(),
    query('status').optional().isString().trim(),
    query('clientshipType').optional().isString().trim(),
    query('trainerId').optional().isString().trim(),
    query('createdFrom').optional().isISO8601(),
    query('createdTo').optional().isISO8601(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('sortBy').optional().isIn(['name', 'email', 'clientshipType', 'createdAt']),
    query('sortOrder').optional().isIn(['asc', 'desc'])
  ],
  trackUsage('client_list'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;
    
    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const filters: ClientFilters = {
      search: req.query.search as string,
      status: req.query.status as string,
      membershipType: req.query.membershipType as string,
      trainerId: req.query.trainerId as string,
      createdFrom: req.query.createdFrom as string,
      createdTo: req.query.createdTo as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      sortBy: req.query.sortBy as any,
      sortOrder: req.query.sortOrder as any
    };

    const clientService = await createClientService(req);
    const result = await clientService.getClients(filters, tenantId || 'default', req.user.role, req.user.id);

    return res.json({
      success: true,
      data: result
    });
  })
);

// Get client by ID
router.get('/:id', 
  trackUsage('client_view'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;
    
    // Verificar se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }
    
    const tenantId = req.tenantId || req.user?.tenantId;
    
    // SUPER_ADMIN pode acessar sem tenantId específico
    if (!tenantId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    const client = await clientService.getClientById(id, tenantId || 'default', req.user.role, req.user.id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: { message: 'Client not found' }
      });
    }

    return res.json({
      success: true,
      data: client
    });
  })
);

// Create new client
router.post('/',
  checkClientLimit,
  trackUsage('client_create'),
  [
    body('name').trim().isLength({ min: 1 }).withMessage('Client name is required'),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('clientshipType').isString().withMessage('Clientship type is required'),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
    body('biometricData').optional().isObject(),
    body('goals').optional().isObject(),
    body('userId').optional().isString()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    const clientData: ClientFormData = req.body;
    const client = await clientService.createClient(clientData, tenantId, req.user!.id);

    // Log activity
    await activityLogService.logClientActivity(
      client.id,
      'created',
      tenantId!,
      req.user!.id,
      { clientName: client.name }
    );

    return res.status(201).json({
      success: true,
      data: client
    });
  })
);

// Update client
router.put('/:id',
  trackUsage('client_update'),
  [
    body('name').optional().trim().isLength({ min: 1 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().isString().trim(),
    body('clientshipType').optional().isString(),
    body('status').optional().isIn(['active', 'inactive', 'suspended']),
    body('biometricData').optional().isObject(),
    body('goals').optional().isObject(),
    body('userId').optional().isString()
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    const clientData: Partial<ClientFormData> = req.body;
    const client = await clientService.updateClient(id, clientData, tenantId, req.user!.id, req.user!.role, req.user!.id);

    // Log activity
    await activityLogService.logClientActivity(
      client.id,
      'updated',
      tenantId!,
      req.user!.id,
      { clientName: client.name, changes: Object.keys(clientData) }
    );

    return res.json({
      success: true,
      data: client
    });
  })
);

// Delete client
router.delete('/:id',
  trackUsage('client_delete'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    
    // Get client info before deletion for logging
    const client = await clientService.getClientById(id, tenantId, req.user!.role, req.user!.id);
    
    await clientService.deleteClient(id, tenantId, req.user!.id, req.user!.role, req.user!.id);

    // Log activity
    if (client) {
      await activityLogService.logClientActivity(
        client.id,
        'updated', // Use 'updated' instead of 'deleted' since 'deleted' is not in the allowed types
        tenantId!,
        req.user!.id,
        { clientName: client.name, action: 'deleted' }
      );
    }

    return res.json({
      success: true,
      message: 'Client deleted successfully'
    });
  })
);

// Assign trainer to client
router.post('/:id/assign-trainer',
  trackUsage('client_assign_trainer'),
  [
    body('trainerId').isString().withMessage('Trainer ID is required')
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id: clientId } = req.params;
    const { trainerId } = req.body;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    await clientService.assignTrainer(clientId, trainerId, tenantId, req.user!.id);

    // Log activity
    await activityLogService.logClientActivity(
      clientId,
      'assigned_trainer',
      tenantId!,
      req.user!.id,
      { trainerId }
    );

    return res.json({
      success: true,
      message: 'Trainer assigned successfully'
    });
  })
);

// Unassign trainer from client
router.delete('/:id/trainer/:trainerId',
  trackUsage('client_unassign_trainer'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id: clientId, trainerId } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    await clientService.unassignTrainer(clientId, trainerId, tenantId, req.user!.id);

    // Log activity
    await activityLogService.logClientActivity(
      clientId,
      'unassigned_trainer',
      tenantId!,
      req.user!.id,
      { trainerId }
    );

    return res.json({
      success: true,
      message: 'Trainer unassigned successfully'
    });
  })
);

// Get clients by trainer
router.get('/trainer/:trainerId',
  trackUsage('client_list_by_trainer'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { trainerId } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);

    // Verificar se o usuário pode acessar estes membros
    if (req.user!.role === 'TRAINER' && req.user!.id !== trainerId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const clients = await clientService.getClientsByTrainer(trainerId, tenantId);

    return res.json({
      success: true,
      data: clients
    });
  })
);

// Get client progress
router.get('/:id/progress',
  trackUsage('client_progress'),
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const { id: clientId } = req.params;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    const progress = await clientService.getClientProgress(clientId, tenantId, req.user!.role, req.user!.id);

    return res.json({
      success: true,
      data: progress
    });
  })
);

// Get client activity history
router.get('/:id/history',
  trackUsage('client_history'),
  [
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }

    const { id: clientId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const tenantId = req.tenantId || req.user?.tenantId;

    if (!tenantId!) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    const timeline = await activityLogService.getClientTimeline(clientId, tenantId!, req.user!.role, req.user!.id, limit);

    return res.json({
      success: true,
      data: timeline
    });
  })
);

// Export clients to CSV
router.get('/export/csv',
  asyncHandler(async (req: RequestWithTenantAndAuth, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { message: 'Tenant not found' }
      });
    }

    // Usar service com wrapper para garantir isolamento multi-tenant
    const clientService = await createClientService(req);
    const clientIds = req.query.clientIds ? (req.query.clientIds as string).split(',') : [];
    const clients = await clientService.exportClientsToCSV(clientIds, tenantId);

    return res.json({
      success: true,
      data: clients
    });
  })
);

export { router as clientRoutes };
