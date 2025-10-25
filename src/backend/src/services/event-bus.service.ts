/**
 * Event Bus Service - FitOS
 * 
 * Sistema de eventos distribuído usando Redis Pub/Sub:
 * - Eventos de sistema
 * - Eventos de negócio
 * - Eventos de cache
 * - Eventos de notificação
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { generateCacheKey } from '../utils/cache-utils';

export interface EventData {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface EventHandler {
  (event: EventData): Promise<void> | void;
}

export class EventBusService {
  private handlers: Map<string, EventHandler[]> = new Map();
  private isSubscribed = false;
  private subscriptionId: string | null = null;

  constructor() {
    this.setupDefaultHandlers();
  }

  /**
   * Publicar evento
   */
  async publish(event: Omit<EventData, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventData: EventData = {
        id: this.generateEventId(),
        timestamp: new Date(),
        ...event
      };

      // Publicar no Redis
      const channel = this.getChannelName(event.type);
      await redisService.set(`event:${eventData.id}`, eventData, {
        namespace: 'events',
        ttl: 3600 // 1 hora
      });

      // Publicar via Pub/Sub
      await this.publishToRedis(channel, eventData);

      logger.debug(`Event published: ${event.type}`, {
        eventId: eventData.id,
        source: event.source,
        tenantId: event.tenantId
      });
    } catch (error) {
      logger.error('Error publishing event:', error);
    }
  }

  /**
   * Subscrever a eventos
   */
  async subscribe(eventType: string, handler: EventHandler): Promise<void> {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);

    // Subscrever no Redis se ainda não estiver
    if (!this.isSubscribed) {
      await this.subscribeToRedis();
    }

    logger.debug(`Subscribed to event: ${eventType}`);
  }

  /**
   * Cancelar subscrição
   */
  async unsubscribe(eventType: string, handler: EventHandler): Promise<void> {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }

    logger.debug(`Unsubscribed from event: ${eventType}`);
  }

  /**
   * Publicar evento de workout
   */
  async publishWorkoutEvent(type: 'started' | 'completed' | 'progress', data: any): Promise<void> {
    await this.publish({
      type: `workout:${type}`,
      source: 'workout-service',
      data,
      tenantId: data.tenantId,
      userId: data.userId
    });
  }

  /**
   * Publicar evento de analytics
   */
  async publishAnalyticsEvent(type: 'updated' | 'calculated', data: any): Promise<void> {
    await this.publish({
      type: `analytics:${type}`,
      source: 'analytics-service',
      data,
      tenantId: data.tenantId
    });
  }

  /**
   * Publicar evento de cache
   */
  async publishCacheEvent(type: 'invalidated' | 'warmed', data: any): Promise<void> {
    await this.publish({
      type: `cache:${type}`,
      source: 'cache-service',
      data,
      tenantId: data.tenantId
    });
  }

  /**
   * Publicar evento de notificação
   */
  async publishNotificationEvent(type: 'sent' | 'read' | 'failed', data: any): Promise<void> {
    await this.publish({
      type: `notification:${type}`,
      source: 'notification-service',
      data,
      tenantId: data.tenantId,
      userId: data.userId
    });
  }

  /**
   * Publicar evento de usuário
   */
  async publishUserEvent(type: 'created' | 'updated' | 'deleted' | 'login' | 'logout', data: any): Promise<void> {
    await this.publish({
      type: `user:${type}`,
      source: 'auth-service',
      data,
      tenantId: data.tenantId,
      userId: data.userId
    });
  }

  /**
   * Publicar evento de tenant
   */
  async publishTenantEvent(type: 'created' | 'updated' | 'deleted' | 'suspended', data: any): Promise<void> {
    await this.publish({
      type: `tenant:${type}`,
      source: 'tenant-service',
      data,
      tenantId: data.tenantId
    });
  }

  /**
   * Publicar evento de marketplace
   */
  async publishMarketplaceEvent(type: 'listing:created' | 'listing:updated' | 'order:created' | 'order:completed', data: any): Promise<void> {
    await this.publish({
      type: `marketplace:${type}`,
      source: 'marketplace-service',
      data,
      tenantId: data.tenantId,
      userId: data.userId
    });
  }

  /**
   * Publicar evento de sistema
   */
  async publishSystemEvent(type: 'startup' | 'shutdown' | 'error' | 'warning', data: any): Promise<void> {
    await this.publish({
      type: `system:${type}`,
      source: 'system',
      data
    });
  }

  /**
   * Obter eventos por tipo
   */
  async getEventsByType(eventType: string, limit: number = 100): Promise<EventData[]> {
    try {
      const pattern = `events:event:*`;
      const keys = await redisService.keys(pattern);
      
      const events: EventData[] = [];
      
      for (const key of keys.slice(0, limit)) {
        const event = await redisService.get<EventData>(key.replace('events:', ''), {
          namespace: 'events'
        });
        
        if (event && event.type === eventType) {
          events.push(event);
        }
      }
      
      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Error getting events by type:', error);
      return [];
    }
  }

  /**
   * Obter eventos por tenant
   */
  async getEventsByTenant(tenantId: string, limit: number = 100): Promise<EventData[]> {
    try {
      const pattern = `events:event:*`;
      const keys = await redisService.keys(pattern);
      
      const events: EventData[] = [];
      
      for (const key of keys.slice(0, limit)) {
        const event = await redisService.get<EventData>(key.replace('events:', ''), {
          namespace: 'events'
        });
        
        if (event && event.tenantId === tenantId) {
          events.push(event);
        }
      }
      
      return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      logger.error('Error getting events by tenant:', error);
      return [];
    }
  }

  /**
   * Obter estatísticas de eventos
   */
  async getEventStats(): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByTenant: Record<string, number>;
    recentEvents: EventData[];
  }> {
    try {
      const pattern = `events:event:*`;
      const keys = await redisService.keys(pattern);
      
      const events: EventData[] = [];
      const eventsByType: Record<string, number> = {};
      const eventsByTenant: Record<string, number> = {};
      
      for (const key of keys) {
        const event = await redisService.get<EventData>(key.replace('events:', ''), {
          namespace: 'events'
        });
        
        if (event) {
          events.push(event);
          
          // Contar por tipo
          eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
          
          // Contar por tenant
          if (event.tenantId) {
            eventsByTenant[event.tenantId] = (eventsByTenant[event.tenantId] || 0) + 1;
          }
        }
      }
      
      // Ordenar por timestamp e pegar os mais recentes
      const recentEvents = events
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);
      
      return {
        totalEvents: events.length,
        eventsByType,
        eventsByTenant,
        recentEvents
      };
    } catch (error) {
      logger.error('Error getting event stats:', error);
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsByTenant: {},
        recentEvents: []
      };
    }
  }

  /**
   * Configurar handlers padrão
   */
  private setupDefaultHandlers(): void {
    // Handler para eventos de cache
    this.subscribe('cache:invalidated', async (event) => {
      logger.debug('Cache invalidated event received', {
        eventId: event.id,
        tenantId: event.tenantId
      });
    });

    // Handler para eventos de workout
    this.subscribe('workout:completed', async (event) => {
      logger.debug('Workout completed event received', {
        eventId: event.id,
        userId: event.userId,
        workoutId: event.data.workoutId
      });
    });

    // Handler para eventos de sistema
    this.subscribe('system:error', async (event) => {
      logger.error('System error event received', {
        eventId: event.id,
        error: event.data.error
      });
    });
  }

  /**
   * Subscrever no Redis
   */
  private async subscribeToRedis(): Promise<void> {
    try {
      // Aqui você implementaria a subscrição real no Redis
      // Por enquanto, vamos simular
      this.isSubscribed = true;
      this.subscriptionId = `sub_${Date.now()}`;
      
      logger.info('Subscribed to Redis events');
    } catch (error) {
      logger.error('Error subscribing to Redis:', error);
    }
  }

  /**
   * Publicar no Redis
   */
  private async publishToRedis(channel: string, event: EventData): Promise<void> {
    try {
      // Aqui você implementaria a publicação real no Redis
      // Por enquanto, vamos simular
      logger.debug(`Publishing to Redis channel: ${channel}`, {
        eventId: event.id,
        eventType: event.type
      });
    } catch (error) {
      logger.error('Error publishing to Redis:', error);
    }
  }

  /**
   * Obter nome do canal
   */
  private getChannelName(eventType: string): string {
    return `fitos:events:${eventType}`;
  }

  /**
   * Gerar ID único para evento
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Processar evento recebido
   */
  private async processEvent(event: EventData): Promise<void> {
    try {
      const handlers = this.handlers.get(event.type) || [];
      
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          logger.error(`Error processing event ${event.id} with handler:`, error);
        }
      }
    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }

  /**
   * Fechar conexões
   */
  async close(): Promise<void> {
    try {
      this.handlers.clear();
      this.isSubscribed = false;
      this.subscriptionId = null;
      
      logger.info('Event bus closed');
    } catch (error) {
      logger.error('Error closing event bus:', error);
    }
  }
}

// Instância singleton
export const eventBusService = new EventBusService();



