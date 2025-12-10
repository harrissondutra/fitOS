import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { ProviderIntegrationService } from './provider-integration.service';
import { getRedisClient } from '../config/redis';

export class WebSocketService {
  private io: SocketIOServer;
  private providerService: ProviderIntegrationService;
  private redis: any;
  private metricsIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;

    this.providerService = new ProviderIntegrationService();
    this.redis = getRedisClient();

    this.setupEventHandlers();
    logger.info('WebSocket service initialized for real-time server metrics');
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      logger.info('Client connected to WebSocket', { socketId: socket.id });

      // Client se inscreve para receber métricas de um servidor específico
      socket.on('subscribe:server:metrics', async (data: { serverId: string }) => {
        const { serverId } = data;
        logger.info('Client subscribed to server metrics', { socketId: socket.id, serverId });

        // Join room do servidor
        socket.join(`server:${serverId}`);

        // Enviar métricas imediatamente
        await this.sendServerMetrics(serverId, socket);

        // Iniciar intervalo de atualização (a cada 5 segundos)
        this.startMetricsInterval(serverId);
      });

      // Client se desinscreve
      socket.on('unsubscribe:server:metrics', (data: { serverId: string }) => {
        const { serverId } = data;
        logger.info('Client unsubscribed from server metrics', { socketId: socket.id, serverId });

        socket.leave(`server:${serverId}`);

        // Se ninguém mais está escutando, parar o intervalo
        const room = this.io.sockets.adapter.rooms.get(`server:${serverId}`);
        if (!room || room.size === 0) {
          this.stopMetricsInterval(serverId);
        }
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected from WebSocket', { socketId: socket.id });
      });

      // Ping/Pong para manter conexão viva
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  private startMetricsInterval(serverId: string): void {
    // Se já existe intervalo, não criar outro
    if (this.metricsIntervals.has(serverId)) {
      return;
    }

    // Atualizar métricas a cada 5 segundos
    const interval = setInterval(async () => {
      await this.broadcastServerMetrics(serverId);
    }, 5000);

    this.metricsIntervals.set(serverId, interval);
    logger.info('Started metrics interval', { serverId });
  }

  private stopMetricsInterval(serverId: string): void {
    const interval = this.metricsIntervals.get(serverId);
    if (interval) {
      clearInterval(interval);
      this.metricsIntervals.delete(serverId);
      logger.info('Stopped metrics interval', { serverId });
    }
  }

  private async sendServerMetrics(serverId: string, socket: Socket): Promise<void> {
    try {
      // Buscar SSH key do Redis
      const sshKey = await this.redis.get(`fitos:ssh:key:${serverId}`);
      if (!sshKey) {
        socket.emit('server:metrics:error', {
          serverId,
          error: 'SSH key not found',
        });
        return;
      }

      // Buscar dados do servidor do Redis cache
      const cachedData = await this.redis.get(`fitos:server:scan:${serverId}`);
      if (!cachedData) {
        socket.emit('server:metrics:error', {
          serverId,
          error: 'Server data not found',
        });
        return;
      }

      const serverData = JSON.parse(cachedData);
      const { host, port, username } = serverData;

      // Obter health atual via SSH
      const result = await this.providerService.getHealthAndContainersViaSSH({
        sshHost: host,
        sshPort: port || 22,
        sshUsername: username,
        sshKey,
      });

      // Enviar métricas
      socket.emit('server:metrics:update', {
        serverId,
        health: result.health,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Error sending server metrics', { serverId, error });
      socket.emit('server:metrics:error', {
        serverId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async broadcastServerMetrics(serverId: string): Promise<void> {
    try {
      // Verificar se alguém está ouvindo
      const room = this.io.sockets.adapter.rooms.get(`server:${serverId}`);
      if (!room || room.size === 0) {
        this.stopMetricsInterval(serverId);
        return;
      }

      // Buscar SSH key do Redis
      const sshKey = await this.redis.get(`fitos:ssh:key:${serverId}`);
      if (!sshKey) {
        this.io.to(`server:${serverId}`).emit('server:metrics:error', {
          serverId,
          error: 'SSH key not found',
        });
        return;
      }

      // Buscar dados do servidor do Redis cache
      const cachedData = await this.redis.get(`fitos:server:scan:${serverId}`);
      if (!cachedData) {
        this.io.to(`server:${serverId}`).emit('server:metrics:error', {
          serverId,
          error: 'Server data not found',
        });
        return;
      }

      const serverData = JSON.parse(cachedData);
      const { host, port, username } = serverData;

      // Obter health atual via SSH
      const result = await this.providerService.getHealthAndContainersViaSSH({
        sshHost: host,
        sshPort: port || 22,
        sshUsername: username,
        sshKey,
      });

      // Broadcast para todos no room
      this.io.to(`server:${serverId}`).emit('server:metrics:update', {
        serverId,
        health: result.health,
        timestamp: Date.now(),
      });

      logger.debug('Broadcasted server metrics', { serverId, listeners: room.size });
    } catch (error) {
      logger.error('Error broadcasting server metrics', { serverId, error });
      this.io.to(`server:${serverId}`).emit('server:metrics:error', {
        serverId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Broadcast manual de evento (para uso externo)
  public broadcastContainerAction(serverId: string, action: string, containerId: string): void {
    this.io.to(`server:${serverId}`).emit('server:container:action', {
      serverId,
      action,
      containerId,
      timestamp: Date.now(),
    });
    logger.info('Broadcasted container action', { serverId, action, containerId });
  }

  public broadcastImageAction(serverId: string, action: string, imageId: string): void {
    this.io.to(`server:${serverId}`).emit('server:image:action', {
      serverId,
      action,
      imageId,
      timestamp: Date.now(),
    });
    logger.info('Broadcasted image action', { serverId, action, imageId });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }

  public async shutdown(): Promise<void> {
    // Parar todos os intervalos
    this.metricsIntervals.forEach((interval) => clearInterval(interval));
    this.metricsIntervals.clear();

    // Fechar conexões
    await this.redis.quit();
    this.io.close();
    logger.info('WebSocket service shutdown');
  }
}
