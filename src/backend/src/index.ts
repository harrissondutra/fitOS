import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { toNodeHandler } from 'better-auth/node';
import auth from './config/auth';

// Import configurations
import { config } from './config/config';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
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
import schemaUserRoutes from './routes/schema-users';

// Load environment variables
dotenv.config();

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
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: (message) => logger.info(message.trim()) }
    }));

    // Rate limiting
    this.app.use(rateLimiter);

    // Body parsing (aplicar apenas em rotas não-auth para evitar conflito com Better Auth)
    this.app.use((req, res, next) => {
      if (!req.path.startsWith('/api/auth')) {
        express.json({ limit: '10mb' })(req, res, next);
      } else {
        next();
      }
    });
    
    this.app.use((req, res, next) => {
      if (!req.path.startsWith('/api/auth')) {
        express.urlencoded({ extended: true, limit: '10mb' })(req, res, next);
      } else {
        next();
      }
    });

    // Tenant resolution
    this.app.use(tenantMiddleware);
  }

  private setupRoutes(): void {
    // Montar Better Auth PRIMEIRO (antes do body parser)
    // Isso é crítico para evitar travamento das requisições
    // Usar diretamente o handler Better Auth conforme documentação
    this.app.all('/api/auth/*', toNodeHandler(auth));

    // Health check
    this.app.use('/api/health', healthRoutes);


    // Super admin routes (protegidas por middleware)
    this.app.use('/api/super-admin', superAdminRoutes);

    // API routes (registrar antes das rotas de auth para evitar conflitos)
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/workouts', workoutRoutes);
    this.app.use('/api/chat', chatRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/email', emailRoutes);
    this.app.use('/api/tenants', tenantRoutes);

    // Schema-based tenant routes (com validação de limites)
    this.app.use('/', schemaUserRoutes);

    // Tenant example routes (demonstrates multitenancy)
    this.app.use('/', tenantExampleRoutes);

    // 404 handler
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

  private setupSocketIO(): void {
    try {
      logger.info('🔌 Setting up Socket.IO...');
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      });

      this.io.on('connection', (socket) => {
        logger.info(`Client connected: ${socket.id}`);

        socket.on('join-tenant', (tenantId: string) => {
          socket.join(`tenant-${tenantId}`);
          logger.info(`Client ${socket.id} joined tenant ${tenantId}`);
        });

        socket.on('disconnect', () => {
          logger.info(`Client disconnected: ${socket.id}`);
        });
      });
      
      logger.info('✅ Socket.IO setup complete');
    } catch (error) {
      logger.error('❌ Socket.IO setup failed:', error);
      throw error;
    }
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('✅ Database connected');

      // Connect to Redis (optional)
      try {
        await connectRedis();
        logger.info('✅ Redis connected');
      } catch (error) {
        logger.warn('⚠️ Redis connection failed, continuing without Redis:', error);
      }

      // Create HTTP server
      logger.info('🌐 Creating HTTP server...');
      this.server = createServer(this.app);

      // Setup Socket.IO (temporarily disabled)
      // this.setupSocketIO();

      // Start server
      logger.info(`🚀 Starting server on port ${config.port}...`);
      this.server.listen(config.port, () => {
        logger.info(`🚀 FitOS Backend running on port ${config.port}`);
        logger.info(`📱 Environment: ${config.nodeEnv}`);
        logger.info(`🔗 Health check: http://localhost:${config.port}/api/health`);
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
        logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
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
