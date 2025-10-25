import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisService } from '../services/redis.service';
import { config } from './config-simple';
import { logger } from '../utils/logger';
import { Server as HttpServer } from 'http';

class SocketConfigManager {
  private io: SocketIOServer | null = null;

  public async initialize(httpServer: HttpServer): Promise<SocketIOServer> {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: Array.isArray(config.cors.origins) ? config.cors.origins : (config.cors.origins as string).split(','),
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    if ((config as any).features?.enableRedisPubsub) {
      try {
        const pubClient = redisService.getClient();
        const subClient = redisService.getSubscriber();

        // Certifique-se de que os clientes Redis estão prontos
        await pubClient.ping();
        await subClient.ping();

        this.io.adapter(createAdapter(pubClient, subClient));
        logger.info('✅ Socket.IO Redis adapter enabled for Pub/Sub');
      } catch (error) {
        logger.error('❌ Failed to initialize Socket.IO Redis adapter, falling back to in-memory:', error);
        // Continua sem o adaptador Redis se houver erro
      }
    } else {
      logger.info('⏭️ Redis Pub/Sub for Socket.IO is disabled by feature flag.');
    }

    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join-tenant', (tenantId: string) => {
        socket.join(`tenant-${tenantId}`);
        logger.info(`Client ${socket.id} joined tenant ${tenantId}`);
      });

      socket.on('leave-tenant', (tenantId: string) => {
        socket.leave(`tenant-${tenantId}`);
        logger.info(`Client ${socket.id} left tenant ${tenantId}`);
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });

    return this.io;
  }

  public getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO not initialized. Call initialize() first.');
    }
    return this.io;
  }

  public emitToTenant(tenantId: string, event: string, data: any): void {
    if (this.io) {
      this.io.to(`tenant-${tenantId}`).emit(event, data);
      logger.debug(`Emitted event '${event}' to tenant ${tenantId}`);
    } else {
      logger.warn('Socket.IO not initialized, cannot emit event.');
    }
  }

  public emitToUser(userId: string, event: string, data: any): void {
    if (this.io) {
      // Para emitir para um usuário específico, você precisaria de um mapeamento userId -> socketId
      // Isso pode ser feito mantendo um Map no servidor ou usando um recurso do adaptador Redis
      // Exemplo simplificado (pode não funcionar em multi-instância sem um mapeamento explícito):
      this.io.to(userId).emit(event, data); // Assumindo que o userId é usado como socket.id ou um room
      logger.debug(`Emitted event '${event}' to user ${userId}`);
    } else {
      logger.warn('Socket.IO not initialized, cannot emit event.');
    }
  }
}

export const socketConfigManager = new SocketConfigManager();