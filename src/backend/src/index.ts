// Load environment variables FIRST
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

// Import configurations
import { config } from './config/config-simple';
import { logger } from './utils/logger';
import { connectDatabase, getPrismaClient } from './config/database';
import { connectRedis } from './config/redis';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { tenantMiddleware } from './middleware/tenant';

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
import { exerciseRoutes } from './routes/exercises';
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

// CRM routes (Sprint 4)
import crmApiRoutes from './routes/crm.routes';

// AI Agents routes (Sprint 4)
import aiAgentsRoutes from './routes/ai-agents.routes';

// Upload routes
import uploadRoutes from './routes/upload';

// Marketplace routes
import marketplaceRoutes from './routes/marketplace';

// Sprint 5 - Admin Business Routes
import tenantAdminRoutes from './routes/admin/tenants';
import revenueAdminRoutes from './routes/admin/revenue';
import usersAdminRoutes from './routes/admin/users';
import platformAdminRoutes from './routes/admin/platform';
import reportsAdminRoutes from './routes/admin/reports';

// Environment variables already loaded at the top

class FitOSServer {
  private app: express.Application;
  private server: any;
  private io!: SocketIOServer;

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
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'x-user-role'],
      preflightContinue: false,
      optionsSuccessStatus: 204
    }));

    // Compression
    this.app.use(compression());

    // Logging - Desabilitado para reduzir logs de requisições HTTP
    // this.app.use(morgan('combined', {
    //   stream: { write: (message) => logger.info(message.trim()) }
    // }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Tenant resolution
    this.app.use(tenantMiddleware);
  }

  private setupRoutes(): void {
    // Health check
    this.app.use('/api/health', healthRoutes);

    // Authentication routes (públicas)
    this.app.use('/api/auth', getAuthRoutes(getPrismaClient()).getRouter());

    // Super admin routes (protegidas por middleware)
    this.app.use('/api/super-admin', superAdminRoutes);
    
    // Super Admin Management routes (protegidas por middleware)
    this.app.use('/api/super-admin/management', superAdminManagementRoutes);
    
    // AI Costs routes (protegidas por middleware)
    this.app.use('/api/super-admin/ai-costs', aiCostsRoutes);
    
    // Cost Management routes (protegidas por middleware)
    this.app.use('/api/costs', costsRoutes);

    // Middleware de autenticação opcional para rotas de API
    const authMiddleware = getAuthMiddleware(getPrismaClient());

    // API routes (com autenticação opcional)
    this.app.use('/api/users', authMiddleware.optionalAuth, userRoutes);
    this.app.use('/api/workouts', authMiddleware.optionalAuth, workoutRoutes);
    this.app.use('/api/chat', authMiddleware.optionalAuth, chatRoutes);
    this.app.use('/api/admin', authMiddleware.optionalAuth, adminRoutes);
    this.app.use('/api/email', authMiddleware.optionalAuth, emailRoutes);
    this.app.use('/api/tenants', authMiddleware.optionalAuth, tenantRoutes);
    
    // New Sprint 3 API routes (com autenticação opcional)
    this.app.use('/api/exercises', authMiddleware.optionalAuth, exerciseRoutes);
    this.app.use('/api/clients', authMiddleware.optionalAuth, clientRoutes);
    this.app.use('/api/analytics', authMiddleware.optionalAuth, analyticsRoutes);
    this.app.use('/api/plan-limits', authMiddleware.optionalAuth, planLimitsRoutes);

    // Settings API routes (com autenticação)
    this.app.use('/api/settings', authMiddleware.optionalAuth, settingsRoutes);
    
    // Upload API routes (com autenticação)
    this.app.use('/api/upload', authMiddleware.optionalAuth, uploadRoutes);

    // Marketplace API routes (com autenticação)
    this.app.use('/api/marketplace', authMiddleware.requireAuth, marketplaceRoutes);

    // Sprint 4 API routes (com autenticação opcional)
    // Sprint 4 - Novas rotas
    this.app.use('/api/appointments', authMiddleware.optionalAuth, appointmentsRoutes);
    this.app.use('/api/bioimpedance', authMiddleware.optionalAuth, bioimpedanceRoutes);
    this.app.use('/api/crm', authMiddleware.optionalAuth, crmRoutes);
    this.app.use('/api/google-calendar', authMiddleware.optionalAuth, googleCalendarRoutes);
    this.app.use('/api/notifications', authMiddleware.optionalAuth, notificationsRoutes);
    this.app.use('/api/dashboard', authMiddleware.optionalAuth, dashboardRoutes);
    this.app.use('/api/appointment-templates', authMiddleware.optionalAuth, appointmentTemplatesRoutes);
    this.app.use('/api/availability', authMiddleware.optionalAuth, availabilityRoutes);
    this.app.use('/api/client-goals', authMiddleware.optionalAuth, clientGoalsRoutes);
    this.app.use('/api/appointment-comments', authMiddleware.optionalAuth, appointmentCommentsRoutes);
    this.app.use('/api/appointment-reviews', authMiddleware.optionalAuth, appointmentReviewsRoutes);
    this.app.use('/api/attendance', authMiddleware.optionalAuth, attendanceRoutes);
    this.app.use('/api/analytics', authMiddleware.optionalAuth, analyticsRoutes);
    this.app.use('/api/appointment-reminders', authMiddleware.optionalAuth, appointmentRemindersRoutes);
    this.app.use('/api/timeline', authMiddleware.optionalAuth, timelineRoutes);
    this.app.use('/api/reports', authMiddleware.optionalAuth, reportsRoutes);
    this.app.use('/api/audit-logs', authMiddleware.optionalAuth, auditLogsRoutes);
    this.app.use('/api/whatsapp', authMiddleware.optionalAuth, whatsappRoutes);
    this.app.use('/api/appointments/team', authMiddleware.optionalAuth, teamCalendarRoutes);

    // Nutrition API routes (Sprint 4) - com autenticação obrigatória
    this.app.use('/api/nutrition', authMiddleware.requireAuth, nutritionRoutes);

    // CRM API routes (Sprint 4) - com autenticação obrigatória
    this.app.use('/api/crm', authMiddleware.requireAuth, crmApiRoutes);

    // AI Agents API routes (Sprint 4) - com autenticação obrigatória
    this.app.use('/api/ai', authMiddleware.requireAuth, aiAgentsRoutes);

    // Sprint 5 - Admin Business Routes (com autenticação obrigatória)
    this.app.use('/api/admin/tenants', authMiddleware.requireAuth, tenantAdminRoutes);
    this.app.use('/api/admin/revenue', authMiddleware.requireAuth, revenueAdminRoutes);
    this.app.use('/api/admin/users', authMiddleware.requireAuth, usersAdminRoutes);
    this.app.use('/api/admin/platform', authMiddleware.requireAuth, platformAdminRoutes);
    this.app.use('/api/admin/reports', authMiddleware.requireAuth, reportsAdminRoutes);
    
    // Redis monitoring routes (protegidas por middleware)
    this.app.use('/api/admin/redis-monitor', authMiddleware.requireAuth, redisMonitorRoutes);

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
      
      logger.info('✅ Monitoring started');
    } catch (error) {
      logger.error('❌ Monitoring setup failed:', error);
    }
  }

  public async start(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Conexões paralelas para melhor performance
      logger.info('🚀 Starting FitOS Backend...');
      
      const connectionPromises = [
        connectDatabase().then(() => logger.info('✅ Database connected')),
      ];

      // Redis opcional - não falhar se não conectar
      if (process.env.SKIP_REDIS_CONNECTION !== 'true') {
        connectionPromises.push(
          connectRedis()
            .then(() => logger.info('✅ Redis connected'))
            .catch((error) => {
              logger.warn('⚠️ Redis connection failed, continuing without Redis');
              if (process.env.DEBUG === 'true') {
                logger.debug('Redis error details:', error);
              }
            })
        );
      } else {
        logger.info('⏭️ Skipping Redis connection (SKIP_REDIS_CONNECTION=true)');
      }

      // Aguardar todas as conexões em paralelo
      await Promise.all(connectionPromises);

      // Create HTTP server
      logger.info('🌐 Creating HTTP server...');
      this.server = createServer(this.app);

      // Socket.IO com Redis - inicializar sempre
      await this.setupSocketIO();

      // Inicializar sistema de filas
      await this.setupQueues();

      // Inicializar scheduler
      await this.setupScheduler();

      // Inicializar monitoramento
      await this.setupMonitoring();

      // Start server
      logger.info(`🚀 Starting server on port ${config.port}...`);
      this.server.listen(config.port, () => {
        const startupTime = Date.now() - startTime;
        logger.info(`🚀 FitOS Backend running on port ${config.port}`);
        logger.info(`📱 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Health check: http://localhost:${config.port}/api/health`);
        
        if (process.env.DEBUG === 'true') {
          logger.perf('Server startup', startTime);
        }
      });

      logger.info('✅ Server started successfully!');

      // Graceful shutdown
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));
      
      // Handle uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('❌ Uncaught Exception:', error);
        process.exit(1);
      });
      
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('❌ Unhandled Rejection at:', promise);
        logger.error('❌ Reason:', reason);
        process.exit(1);
      });

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    logger.info('🛑 Shutting down gracefully...');
    
    this.server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('❌ Forced shutdown');
      process.exit(1);
    }, 10000);
  }
}

// Start server
const server = new FitOSServer();
server.start().catch((error) => {
  logger.error('Failed to start FitOS server:', error);
  process.exit(1);
});

export default FitOSServer;
