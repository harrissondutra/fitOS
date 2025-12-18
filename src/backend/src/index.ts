// Load environment variables FIRST - Trigger restart
import dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
// import morgan from 'morgan'; // Desabilitado para reduzir logs
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { socketConfigManager } from './config/socket.config';
import { queueService } from './services/queue.service';
import { schedulerService } from './services/scheduler.service';
import { emailWorker } from './workers/email.worker';
import { analyticsWorker } from './workers/analytics.worker';
import { cacheWarmingService } from './services/cache-warming.service';
import { alertService } from './services/alert.service';
import { MetricsCollectionService } from './services/metrics-collection.service';
import { ServerScanAutomationService } from './services/server-scan-automation.service';
import { WebSocketService } from './services/websocket.service';

// Import configurations
import { config } from './config/config-simple';
import { logger } from './utils/logger';
import { connectDatabase, getPrismaClient } from './config/database';
import { connectRedis } from './config/redis';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { abortedRequestHandler } from './middleware/aborted-request-handler';
import { rateLimiter, tenantRateLimiterMiddleware, roleBasedRateLimiterMiddleware } from './middleware/rateLimiter';
// import { tenantMiddleware } from './middleware/tenant';
import { createTenantContextMiddleware } from './middleware/tenant-context.middleware';
import { ConnectionManagerService, connectionManager } from './services/connection-manager.service';

// Import routes
import { tenantExampleRoutes } from './routes/tenant-example';
import { userRoutes } from './routes/users';
import { workoutRoutes } from './routes/workouts';
import { chatRoutes } from './routes/chat';
import adminRoutes from './routes/admin';
import { healthRoutes } from './routes/health';
import { emailRoutes } from './routes/email';
import { tenantRoutes } from './routes/tenants';
import superAdminRoutes from './routes/super-admin';
import settingsRoutes from './routes/settings';
import schemaUserRoutes from './routes/schema-users';
// New Sprint 3 routes
import { exercisesRouter } from './routes/exercises';
import { clientRoutes } from './routes/clients';
import { planLimitsRoutes } from './routes/plan-limits';
// Authentication routes
import { getAuthRoutes } from './routes/auth.routes';
import { getAuthMiddleware } from './middleware/auth.middleware';

// Super Admin Management routes
import superAdminManagementRoutes from './routes/super-admin-management';
import redisMonitorRoutes from './routes/admin/redis-monitor';
import aiCostsRoutes from './routes/ai-costs';
import costsRoutes from './routes/costs';
// Multi-Tenancy Admin routes
import adminDatabaseRoutes from './routes/admin-database.routes';
// Super Admin Database Instances routes
import superAdminDatabaseInstancesRoutes from './routes/super-admin-database-instances.routes';
// Provider Authentication routes
import providerAuthRoutes from './routes/super-admin-provider-auth.routes';

// Sprint 4 routes
import appointmentsRoutes from './routes/appointments';
import bioimpedanceRoutes from './routes/bioimpedance';
import crmRoutes from './routes/crm';
import googleCalendarRoutes from './routes/google-calendar';
import notificationsRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import appointmentTemplatesRoutes from './routes/appointment-templates';
import availabilityRoutes from './routes/availability';
import clientGoalsRoutes from './routes/client-goals';
import appointmentCommentsRoutes from './routes/appointment-comments';
import appointmentReviewsRoutes from './routes/appointment-reviews';
import attendanceRoutes from './routes/attendance';
import analyticsRoutes from './routes/analytics';
import appointmentRemindersRoutes from './routes/appointment-reminders';
import timelineRoutes from './routes/timeline';
import reportsRoutes from './routes/reports';
import auditLogsRoutes from './routes/audit-logs';
import whatsappRoutes from './routes/whatsapp';
import teamCalendarRoutes from './routes/team-calendar';

// Nutrition routes (Sprint 4)
import nutritionRoutes from './routes/nutrition.routes';

// Nutrition Addon routes (Sprint 7)
import nutritionAddonRoutes from './routes/nutrition-addon.routes';
import injuryPreventionRoutes from './routes/injury-prevention.routes';
import foodDiaryTrackingRoutes from './routes/food-diary-tracking.routes';

// Sidebar Config routes
import sidebarConfigRoutes from './routes/sidebar-config.routes';

// Sprint 8: Personal Trainer System routes
import { physicalAssessmentRoutes } from './routes/physical-assessment.routes';
import { trainerChatRoutes } from './routes/trainer-chat.routes';
import { trainingProgramRoutes } from './routes/training-program.routes';
import { trainerStatsRoutes } from './routes/trainer-stats.routes';
import { trainerClientsRoutes } from './routes/trainer-clients.routes';
import goalIntegrationRoutes from './routes/goal-integration.routes';

// CRM routes (Sprint 4)
import crmApiRoutes from './routes/crm.routes';

// AI Agents routes (Sprint 4)
import aiAgentsRoutes from './routes/ai-agents.routes';
// AI Management routes
import aiRoutes from './routes/ai.routes';
// AI User routes (para clientes, profissionais e empresas)
import aiUserRoutes from './routes/ai-user.routes';

// Advertisement routes (Monetization System)
import advertisementRoutes from './routes/advertisement.routes';

// Upload routes
import uploadRoutes from './routes/upload';

// Marketplace routes
import marketplaceRoutes from './routes/marketplace';

// Subscription routes (SAAS Billing)
import subscriptionRoutes from './routes/subscription.routes';
import contactRoutes from './routes/contact.routes';

// Sprint 5 - Admin Business Routes
import tenantAdminRoutes from './routes/admin/tenants';
import revenueAdminRoutes from './routes/admin/revenue';
import usersAdminRoutes from './routes/admin/users';
import platformAdminRoutes from './routes/admin/platform';
import reportsAdminRoutes from './routes/admin/reports';
import cronRoutes from './routes/cron.routes';

// Environment variables already loaded at the top

class FitOSServer {
  private app: express.Application;
  private server: any;
  private io!: SocketIOServer;
  private wsService!: WebSocketService;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    logger.info(`🛡️ CORS Origins configured: ${Array.isArray(config.cors.origins) ? config.cors.origins.map(o => o.toString()).join(', ') : config.cors.origins}`);
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'x-user-role'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    // Compression
    this.app.use(compression() as any);

    // Logging - Desabilitado para reduzir logs de requisições HTTP
    // this.app.use(morgan('combined', {
    //   stream: { write: (message) => logger.info(message.trim()) }
    // }));

    // Rate limiting
    this.app.use(rateLimiter);

    // 1. Webhooks - DEVEM vir antes do global express.json para preservar o raw body
    // Usamos express.raw para capturar o corpo binário exato necessário para validação do Stripe
    const billingWebhooks = require('./routes/webhooks/billing.routes').default;
    this.app.use('/api/webhooks', express.raw({ type: '*/*', limit: '10mb' }), (req, res, next) => {
      // O express.raw coloca o Buffer em req.body. Vamos mover para rawBody para manter compatibilidade
      if (Buffer.isBuffer(req.body)) {
        (req as any).rawBody = req.body;
      }
      // Debug log para garantir que o middleware está rodando
      console.log(`Webhook middleware hit: ${req.method} ${req.url}, rawBody present: ${!!(req as any).rawBody}, length: ${(req as any).rawBody?.length}`);
      next();
    }, billingWebhooks);

    // 2. Body parsing global para outras rotas
    this.app.use(express.json({ limit: '10mb' }));

    // Tratar requisições abortadas pelo cliente (deve vir após express.json)
    this.app.use(abortedRequestHandler);
    this.app.use(express.urlencoded({ extended: true }));

    // Tenant resolution (context by strategy: row/schema/database)
    const tenantContext = createTenantContextMiddleware(connectionManager);
    this.app.use(tenantContext);

    // Rate limiting por tenant e por role (após resolução de tenant/usuário)
    this.app.use(tenantRateLimiterMiddleware);
    this.app.use(roleBasedRateLimiterMiddleware);
  }

  private setupRoutes(): void {
    // Health check
    this.app.use('/api/health', healthRoutes);

    // Authentication routes (públicas) - usar lazy evaluation para evitar criar PrismaClient antes de connectDatabase()
    this.app.use('/api/auth', (req, res, next) => {
      // Não passar prisma - deixar lazy getter funcionar
      getAuthRoutes().getRouter()(req, res, next);
    });

    // Super admin routes (protegidas por middleware)
    this.app.use('/api/super-admin', superAdminRoutes);
    // Multi-Tenancy Admin routes (protegidas por SUPER_ADMIN)
    this.app.use('/api/admin/database', adminDatabaseRoutes);
    // Super Admin Database Instances routes (protegidas por SUPER_ADMIN)
    this.app.use('/api/super-admin/database', superAdminDatabaseInstancesRoutes);

    // Provider Authentication routes (protegidas por SUPER_ADMIN)
    this.app.use('/api/super-admin/provider-auth', providerAuthRoutes);

    // Sidebar Config routes (protegidas por middleware)
    this.app.use('/api/sidebar', sidebarConfigRoutes);

    // Super Admin Management routes (protegidas por middleware)
    this.app.use('/api/super-admin/management', superAdminManagementRoutes);

    // AI Costs routes (protegidas por middleware)
    this.app.use('/api/super-admin/ai-costs', aiCostsRoutes);

    // Cost Management routes (protegidas por middleware)
    this.app.use('/api/costs', costsRoutes);

    // Webhooks routes are now handled in setupMiddleware to preserve rawBody

    // Middleware de autenticação opcional para rotas de API - usar lazy evaluation
    // Não criar aqui, será criado quando necessário

    // Helper para obter authMiddleware de forma lazy
    const getAuthMiddlewareLazy = () => getAuthMiddleware();

    // API routes (com autenticação opcional)
    this.app.use('/api/users', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), userRoutes);
    this.app.use('/api/workouts', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), workoutRoutes);
    this.app.use('/api/chat', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), chatRoutes);
    this.app.use('/api/admin', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), adminRoutes);
    this.app.use('/api/email', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), emailRoutes);
    this.app.use('/api/tenants', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), tenantRoutes);

    // New Sprint 3 API routes (com autenticação opcional)
    this.app.use('/api/exercises', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), exercisesRouter);
    this.app.use('/api/clients', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), clientRoutes);
    this.app.use('/api/analytics', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), analyticsRoutes);
    this.app.use('/api/plan-limits', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), planLimitsRoutes);

    // Settings API routes (com autenticação)
    this.app.use('/api/settings', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), settingsRoutes);

    // Upload API routes (com autenticação)
    this.app.use('/api/upload', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), uploadRoutes);

    // Marketplace API routes (com autenticação)
    this.app.use('/api/marketplace', getAuthMiddlewareLazy().requireAuth(), marketplaceRoutes);

    // Subscription API routes (SAAS Billing) (com autenticação)
    this.app.use('/api/subscription', subscriptionRoutes);

    // Contact API routes (Vendas/Suporte) (público)
    this.app.use('/api/contact', contactRoutes);


    // Sprint 4 API routes (com autenticação opcional)
    // Sprint 4 - Novas rotas
    this.app.use('/api/appointments', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), appointmentsRoutes);
    this.app.use('/api/bioimpedance', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), bioimpedanceRoutes);
    this.app.use('/api/crm', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), crmRoutes);
    this.app.use('/api/google-calendar', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), googleCalendarRoutes);
    this.app.use('/api/notifications', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), notificationsRoutes);
    this.app.use('/api/dashboard', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), dashboardRoutes);
    this.app.use('/api/appointment-templates', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), appointmentTemplatesRoutes);
    this.app.use('/api/availability', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), availabilityRoutes);
    this.app.use('/api/client-goals', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), clientGoalsRoutes);
    this.app.use('/api/appointment-comments', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), appointmentCommentsRoutes);
    this.app.use('/api/appointment-reviews', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), appointmentReviewsRoutes);
    this.app.use('/api/attendance', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), attendanceRoutes);
    this.app.use('/api/analytics', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), analyticsRoutes);
    this.app.use('/api/advertisements', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), advertisementRoutes);
    this.app.use('/api/appointment-reminders', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), appointmentRemindersRoutes);
    this.app.use('/api/timeline', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), timelineRoutes);
    this.app.use('/api/reports', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), reportsRoutes);
    this.app.use('/api/audit-logs', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), auditLogsRoutes);
    this.app.use('/api/whatsapp', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), whatsappRoutes);

    // Cron Routes (Vercel Cron Jobs) - Não requer autenticação de usuário, mas token de cron
    this.app.use('/api/cron', cronRoutes);

    this.app.use('/api/appointments/team', (req, res, next) => getAuthMiddlewareLazy().optionalAuth(req, res, next), teamCalendarRoutes);

    // Nutrition API routes (Sprint 4) - com autenticação obrigatória
    this.app.use('/api/nutrition', getAuthMiddlewareLazy().requireAuth(), nutritionRoutes);

    // Nutrition Addon routes (Sprint 7) - com autenticação obrigatória
    this.app.use('/api/nutrition-addon', getAuthMiddlewareLazy().requireAuth(), nutritionAddonRoutes);

    // Injury Prevention routes (Sprint 7)
    this.app.use('/api/injury-prevention', getAuthMiddlewareLazy().requireAuth(), injuryPreventionRoutes);

    // Food Diary Tracking routes (Sprint 7)
    this.app.use('/api/nutrition/tracking', getAuthMiddlewareLazy().requireAuth(), foodDiaryTrackingRoutes);

    // Sprint 8: Personal Trainer System routes (com autenticação obrigatória)
    this.app.use('/api/assessments', getAuthMiddlewareLazy().requireAuth(), physicalAssessmentRoutes);
    this.app.use('/api/trainer-chat', getAuthMiddlewareLazy().requireAuth(), trainerChatRoutes);
    this.app.use('/api/training-programs', getAuthMiddlewareLazy().requireAuth(), trainingProgramRoutes);
    this.app.use('/api/trainer', getAuthMiddlewareLazy().requireAuth(), trainerStatsRoutes);
    this.app.use('/api/trainer', getAuthMiddlewareLazy().requireAuth(), trainerClientsRoutes);

    // Goal integration routes (com autenticação obrigatória)
    this.app.use('/api/goal-integration', getAuthMiddlewareLazy().requireAuth(), goalIntegrationRoutes);

    // CRM API routes (Sprint 4) - com autenticação obrigatória
    this.app.use('/api/crm', getAuthMiddlewareLazy().requireAuth(), crmApiRoutes);

    // AI Agents API routes (Sprint 4) - com autenticação obrigatória
    this.app.use('/api/ai-agents', getAuthMiddlewareLazy().requireAuth(), aiAgentsRoutes);

    // AI Management routes (Super Admin) - autenticação aplicada dentro do router aiRoutes
    // (com checkSessionActivity: false para evitar deslogar SUPER_ADMIN)
    this.app.use('/api/super-admin/ai', aiRoutes);

    // AI User routes (para clientes, profissionais e empresas) - com autenticação obrigatória
    this.app.use('/api/ai', getAuthMiddlewareLazy().requireAuth(), aiUserRoutes);

    // Sprint 5 - Admin Business Routes (com autenticação obrigatória)
    this.app.use('/api/admin/tenants', getAuthMiddlewareLazy().requireAuth(), tenantAdminRoutes);
    this.app.use('/api/admin/revenue', getAuthMiddlewareLazy().requireAuth(), revenueAdminRoutes);
    this.app.use('/api/admin/users', getAuthMiddlewareLazy().requireAuth(), usersAdminRoutes);
    this.app.use('/api/admin/platform', getAuthMiddlewareLazy().requireAuth(), platformAdminRoutes);
    this.app.use('/api/admin/reports', getAuthMiddlewareLazy().requireAuth(), reportsAdminRoutes);

    // Redis monitoring routes (protegidas por middleware)
    this.app.use('/api/admin/redis-monitor', getAuthMiddlewareLazy().requireAuth(), redisMonitorRoutes);

    // Schema-based tenant routes (com validação de limites)
    this.app.use('/', schemaUserRoutes);

    // Tenant example routes (demonstrates multitenancy)
    this.app.use('/', tenantExampleRoutes);

    // 404 handler
    this.setup404Handler();
  }

  private setup404Handler(): void {
    // 404 handler - must be last
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.originalUrl
      });
    });
  }

  private setupErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async setupSocketIO(): Promise<void> {
    try {
      logger.info('🔌 Setting up Socket.IO with Redis...');
      this.io = await socketConfigManager.initialize(this.server);
      logger.info('✅ Socket.IO setup complete with Redis adapter');

      // Initialize WebSocket Service for real-time server metrics using existing Socket.IO instance
      logger.info('📡 Setting up WebSocket Service for real-time metrics...');
      this.wsService = new WebSocketService(this.io);
      logger.info('✅ WebSocket Service initialized (using existing Socket.IO instance)');
    } catch (error) {
      logger.error('❌ Socket.IO setup failed:', error);
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    try {
      logger.info('📋 Setting up job queues...');

      // Verificar se o serviço de filas está pronto
      if (queueService.isReady()) {
        logger.info('✅ Job queues initialized');
      } else {
        logger.warn('⚠️ Job queues not ready');
      }
    } catch (error) {
      logger.error('❌ Queue setup failed:', error);
    }
  }

  private async setupScheduler(): Promise<void> {
    try {
      logger.info('⏰ Setting up scheduler...');
      schedulerService.start();
      logger.info('✅ Scheduler started');
    } catch (error) {
      logger.error('❌ Scheduler setup failed:', error);
    }
  }

  private async setupMonitoring(): Promise<void> {
    try {
      logger.info('📊 Setting up monitoring...');

      // Inicializar cache warming
      await cacheWarmingService.initialize();

      // Inicializar alertas
      alertService.startMonitoring(30000); // Verificar a cada 30 segundos
      // Iniciar coleta automática de métricas (a cada 5 min)
      try {
        const metricsService = new MetricsCollectionService();
        metricsService.startAutoCollection(5);
        logger.info('✅ Metrics collection started');
      } catch (err) {
        logger.warn('⚠️ Failed to start metrics collection', err);
      }

      // Iniciar automação de scan de servidores SSH (a cada 5 min)
      try {
        const scanInterval = Number(process.env.SERVER_SCAN_INTERVAL_MINUTES || 5);
        const serverScanService = new ServerScanAutomationService();
        serverScanService.startAutoScan(scanInterval);
        logger.info(`✅ Server scan automation started (interval: ${scanInterval} minutes)`);
      } catch (err) {
        logger.warn('⚠️ Failed to start server scan automation', err);
      }

      logger.info('✅ Monitoring started');
    } catch (error) {
      logger.error('❌ Monitoring setup failed:', error);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async start(): Promise<void> {
    const startTime = Date.now();

    try {
      // Conexões paralelas para melhor performance
      logger.info('🚀 Starting FitOS Backend...');

      const connectionPromises = [
        connectDatabase()
          .then(() => logger.info('✅ Database connected'))
          .catch((error) => {
            logger.warn('⚠️ Database connection failed during startup, continuing...');
            // Não fazer throw na Vercel, pois a conexão pode ser estabelecida por request em serverless
            if (!process.env.VERCEL) {
              logger.warn('⚠️ Some features may not work until database is available');
            }
          }),
      ];

      // Redis - Desabilitar na Vercel por padrão se não houver URL configurada, ou conectar se houver
      if (process.env.SKIP_REDIS_CONNECTION !== 'true' && !process.env.VERCEL) {
        connectionPromises.push(
          connectRedis()
            .then(() => logger.info('✅ Redis connected'))
            .catch((error) => {
              logger.warn('⚠️ Redis connection failed, continuing without Redis');
            })
        );
      } else {
        logger.info('⏭️ Skipping Redis connection (Serverless/Vercel or SKIP_REDIS_CONNECTION=true)');
      }

      // Aguardar conexões
      await Promise.all(connectionPromises);

      // Create HTTP server
      logger.info('🌐 Creating HTTP server...');
      this.server = createServer(this.app);

      // SERVICE INITIALIZATION STRATEGY
      // 1. Vercel (Serverless): Disable persistent services (Socket.io, Cron, Queues)
      // 2. Railway/Local (Long-running): Enable all services
      const isServerless = process.env.VERCEL === '1';

      if (!isServerless) {
        logger.info('🚀 Initializing persistent services (Railway/Local mode)...');

        // Socket.IO com Redis
        await this.setupSocketIO();

        // Inicializar sistema de filas
        await this.setupQueues();

        // Inicializar scheduler
        await this.setupScheduler();

        // Inicializar monitoramento
        await this.setupMonitoring();

        // Start server only if NOT in Vercel (Vercel exports the function, doesn't listen on port directly)
        logger.info(`🚀 Starting server on port ${config.port}...`);
        this.server.listen(config.port, () => {
          const startupTime = Date.now() - startTime;
          logger.info(`🚀 FitOS Backend running on port ${config.port}`);
          logger.info(`📱 Environment: ${config.nodeEnv}`);
          logger.info(`🔗 Health check: http://localhost:${config.port}/api/health`);
        });

        this.setupGracefulShutdown();
      } else {
        logger.info('⚡ Running in Vercel Serverless Mode - Persistent services (Socket.io, Cron, Queues) disabled.');
      }

      logger.info('✅ Server initialized successfully!');

    } catch (error) {
      logger.error('Failed to start server:', error);
      if (!process.env.VERCEL) process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    // Graceful shutdown
    process.on('SIGTERM', this.gracefulShutdown.bind(this));
    process.on('SIGINT', this.gracefulShutdown.bind(this));
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('🛑 Shutting down gracefully...');

    if (this.wsService) {
      await this.wsService.shutdown();
    }

    if (this.server) {
      this.server.close(() => {
        logger.info('✅ Server closed');
        process.exit(0);
      });
    }

    setTimeout(() => {
      logger.error('❌ Forced shutdown');
      process.exit(1);
    }, 10000);
  }
}

// Start server if run directly (not imported as a module)
const server = new FitOSServer();

// Só invoca start se for executado diretamente, não se for importado pela Vercel function
if (require.main === module) {
  server.start().catch((error) => {
    logger.error('Failed to start FitOS server:', error);
    process.exit(1);
  });
}

export default server;
