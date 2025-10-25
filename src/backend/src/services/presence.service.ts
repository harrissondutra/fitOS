/**
 * Presence Detection Service - FitOS
 * 
 * Serviço para detecção de presença de usuários:
 * - Usuários online
 * - Última atividade
 * - Status do usuário
 * - Lista de usuários online por tenant
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { generatePresenceCacheKey, calculateTTL } from '../utils/cache-utils';

export interface PresenceData {
  userId: string;
  email: string;
  role: string;
  tenantId: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActivity: Date;
  connectedAt: Date;
  ip?: string;
  userAgent?: string;
  socketId?: string;
}

export interface PresenceStats {
  totalOnline: number;
  onlineByTenant: Record<string, number>;
  onlineByRole: Record<string, number>;
  recentActivity: PresenceData[];
}

export class PresenceService {
  private readonly PRESENCE_TTL = 300; // 5 minutos
  private readonly ACTIVITY_TTL = 3600; // 1 hora

  /**
   * Marcar usuário como online
   */
  async setUserOnline(
    userId: string,
    email: string,
    role: string,
    tenantId: string,
    ip?: string,
    userAgent?: string,
    socketId?: string
  ): Promise<void> {
    try {
      const now = new Date();
      const presenceData: PresenceData = {
        userId,
        email,
        role,
        tenantId,
        status: 'online',
        lastActivity: now,
        connectedAt: now,
        ip,
        userAgent,
        socketId
      };

      // Salvar presença do usuário
      const presenceKey = generatePresenceCacheKey(userId, 'user');
      await redisService.set(presenceKey, presenceData, {
        namespace: 'presence',
        ttl: this.PRESENCE_TTL
      });

      // Salvar última atividade
      const activityKey = generatePresenceCacheKey(userId, 'last');
      await redisService.set(activityKey, now, {
        namespace: 'presence',
        ttl: this.ACTIVITY_TTL
      });

      // Adicionar à lista de usuários online do tenant
      await this.addToTenantOnlineList(tenantId, userId);

      // Adicionar à lista global de usuários online
      await this.addToGlobalOnlineList(userId);

      logger.debug(`User marked as online: ${email} (${role}) in tenant ${tenantId}`);
    } catch (error) {
      logger.error('Error setting user online:', error);
    }
  }

  /**
   * Marcar usuário como offline
   */
  async setUserOffline(userId: string, tenantId: string): Promise<void> {
    try {
      // Obter dados da presença
      const presenceKey = generatePresenceCacheKey(userId, 'user');
      const presenceData = await redisService.get<PresenceData>(presenceKey, {
        namespace: 'presence'
      });

      if (presenceData) {
        // Atualizar status para offline
        presenceData.status = 'offline';
        presenceData.lastActivity = new Date();

        // Salvar com TTL menor para offline
        await redisService.set(presenceKey, presenceData, {
          namespace: 'presence',
          ttl: 60 // 1 minuto para usuários offline
        });
      }

      // Remover da lista de usuários online do tenant
      await this.removeFromTenantOnlineList(tenantId, userId);

      // Remover da lista global de usuários online
      await this.removeFromGlobalOnlineList(userId);

      logger.debug(`User marked as offline: ${userId} in tenant ${tenantId}`);
    } catch (error) {
      logger.error('Error setting user offline:', error);
    }
  }

  /**
   * Atualizar status do usuário
   */
  async updateUserStatus(
    userId: string,
    status: 'online' | 'away' | 'busy',
    tenantId: string
  ): Promise<void> {
    try {
      const presenceKey = generatePresenceCacheKey(userId, 'user');
      const presenceData = await redisService.get<PresenceData>(presenceKey, {
        namespace: 'presence'
      });

      if (presenceData) {
        presenceData.status = status;
        presenceData.lastActivity = new Date();

        await redisService.set(presenceKey, presenceData, {
          namespace: 'presence',
          ttl: this.PRESENCE_TTL
        });

        logger.debug(`User status updated: ${userId} -> ${status}`);
      }
    } catch (error) {
      logger.error('Error updating user status:', error);
    }
  }

  /**
   * Atualizar última atividade
   */
  async updateLastActivity(userId: string): Promise<void> {
    try {
      const now = new Date();
      const activityKey = generatePresenceCacheKey(userId, 'last');
      
      await redisService.set(activityKey, now, {
        namespace: 'presence',
        ttl: this.ACTIVITY_TTL
      });

      // Atualizar presença se existir
      const presenceKey = generatePresenceCacheKey(userId, 'user');
      const presenceData = await redisService.get<PresenceData>(presenceKey, {
        namespace: 'presence'
      });

      if (presenceData && presenceData.status !== 'offline') {
        presenceData.lastActivity = now;
        await redisService.set(presenceKey, presenceData, {
          namespace: 'presence',
          ttl: this.PRESENCE_TTL
        });
      }
    } catch (error) {
      logger.error('Error updating last activity:', error);
    }
  }

  /**
   * Obter usuários online por tenant
   */
  async getOnlineUsersByTenant(tenantId: string): Promise<PresenceData[]> {
    try {
      const tenantKey = generatePresenceCacheKey(`tenant:${tenantId}`, 'status');
      const userIds = await redisService.get<string[]>(tenantKey, {
        namespace: 'presence'
      }) || [];

      const users: PresenceData[] = [];

      for (const userId of userIds) {
        const presenceKey = generatePresenceCacheKey(userId, 'user');
        const presenceData = await redisService.get<PresenceData>(presenceKey, {
          namespace: 'presence'
        });

        if (presenceData && presenceData.status !== 'offline') {
          users.push(presenceData);
        }
      }

      return users.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      logger.error('Error getting online users by tenant:', error);
      return [];
    }
  }

  /**
   * Obter usuários online globalmente
   */
  async getGlobalOnlineUsers(): Promise<PresenceData[]> {
    try {
      const globalKey = generatePresenceCacheKey('global', 'status');
      const userIds = await redisService.get<string[]>(globalKey, {
        namespace: 'presence'
      }) || [];

      const users: PresenceData[] = [];

      for (const userId of userIds) {
        const presenceKey = generatePresenceCacheKey(userId, 'user');
        const presenceData = await redisService.get<PresenceData>(presenceKey, {
          namespace: 'presence'
        });

        if (presenceData && presenceData.status !== 'offline') {
          users.push(presenceData);
        }
      }

      return users.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
    } catch (error) {
      logger.error('Error getting global online users:', error);
      return [];
    }
  }

  /**
   * Obter presença de usuário específico
   */
  async getUserPresence(userId: string): Promise<PresenceData | null> {
    try {
      const presenceKey = generatePresenceCacheKey(userId, 'user');
      return await redisService.get<PresenceData>(presenceKey, {
        namespace: 'presence'
      });
    } catch (error) {
      logger.error('Error getting user presence:', error);
      return null;
    }
  }

  /**
   * Obter última atividade do usuário
   */
  async getLastActivity(userId: string): Promise<Date | null> {
    try {
      const activityKey = generatePresenceCacheKey(userId, 'last');
      return await redisService.get<Date>(activityKey, {
        namespace: 'presence'
      });
    } catch (error) {
      logger.error('Error getting last activity:', error);
      return null;
    }
  }

  /**
   * Obter estatísticas de presença
   */
  async getPresenceStats(): Promise<PresenceStats> {
    try {
      const globalUsers = await this.getGlobalOnlineUsers();
      
      const onlineByTenant: Record<string, number> = {};
      const onlineByRole: Record<string, number> = {};
      
      for (const user of globalUsers) {
        // Contar por tenant
        onlineByTenant[user.tenantId] = (onlineByTenant[user.tenantId] || 0) + 1;
        
        // Contar por role
        onlineByRole[user.role] = (onlineByRole[user.role] || 0) + 1;
      }

      return {
        totalOnline: globalUsers.length,
        onlineByTenant,
        onlineByRole,
        recentActivity: globalUsers.slice(0, 20) // Últimos 20 usuários ativos
      };
    } catch (error) {
      logger.error('Error getting presence stats:', error);
      return {
        totalOnline: 0,
        onlineByTenant: {},
        onlineByRole: {},
        recentActivity: []
      };
    }
  }

  /**
   * Limpar presenças expiradas
   */
  async cleanupExpiredPresence(): Promise<number> {
    try {
      const presenceKeys = await redisService.keys('presence:user:*');
      let cleanedCount = 0;

      for (const key of presenceKeys) {
        const presenceData = await redisService.get<PresenceData>(key.replace('presence:', ''), {
          namespace: 'presence'
        });

        if (!presenceData) {
          continue;
        }

        // Verificar se a presença expirou (mais de 5 minutos sem atividade)
        const now = new Date();
        const timeSinceActivity = now.getTime() - presenceData.lastActivity.getTime();
        const fiveMinutes = 5 * 60 * 1000;

        if (timeSinceActivity > fiveMinutes) {
          // Marcar como offline
          await this.setUserOffline(presenceData.userId, presenceData.tenantId);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired presence records`);
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up expired presence:', error);
      return 0;
    }
  }

  /**
   * Adicionar usuário à lista de online do tenant
   */
  private async addToTenantOnlineList(tenantId: string, userId: string): Promise<void> {
    try {
      const tenantKey = generatePresenceCacheKey(`tenant:${tenantId}`, 'status');
      const userIds = await redisService.get<string[]>(tenantKey, {
        namespace: 'presence'
      }) || [];

      if (!userIds.includes(userId)) {
        userIds.push(userId);
        await redisService.set(tenantKey, userIds, {
          namespace: 'presence',
          ttl: this.PRESENCE_TTL
        });
      }
    } catch (error) {
      logger.error('Error adding user to tenant online list:', error);
    }
  }

  /**
   * Remover usuário da lista de online do tenant
   */
  private async removeFromTenantOnlineList(tenantId: string, userId: string): Promise<void> {
    try {
      const tenantKey = generatePresenceCacheKey(`tenant:${tenantId}`, 'status');
      const userIds = await redisService.get<string[]>(tenantKey, {
        namespace: 'presence'
      }) || [];

      const updatedUserIds = userIds.filter(id => id !== userId);
      
      if (updatedUserIds.length === 0) {
        await redisService.del(tenantKey, {
          namespace: 'presence'
        });
      } else {
        await redisService.set(tenantKey, updatedUserIds, {
          namespace: 'presence',
          ttl: this.PRESENCE_TTL
        });
      }
    } catch (error) {
      logger.error('Error removing user from tenant online list:', error);
    }
  }

  /**
   * Adicionar usuário à lista global de online
   */
  private async addToGlobalOnlineList(userId: string): Promise<void> {
    try {
      const globalKey = generatePresenceCacheKey('global', 'status');
      const userIds = await redisService.get<string[]>(globalKey, {
        namespace: 'presence'
      }) || [];

      if (!userIds.includes(userId)) {
        userIds.push(userId);
        await redisService.set(globalKey, userIds, {
          namespace: 'presence',
          ttl: this.PRESENCE_TTL
        });
      }
    } catch (error) {
      logger.error('Error adding user to global online list:', error);
    }
  }

  /**
   * Remover usuário da lista global de online
   */
  private async removeFromGlobalOnlineList(userId: string): Promise<void> {
    try {
      const globalKey = generatePresenceCacheKey('global', 'status');
      const userIds = await redisService.get<string[]>(globalKey, {
        namespace: 'presence'
      }) || [];

      const updatedUserIds = userIds.filter(id => id !== userId);
      
      if (updatedUserIds.length === 0) {
        await redisService.del(globalKey, {
          namespace: 'presence'
        });
      } else {
        await redisService.set(globalKey, updatedUserIds, {
          namespace: 'presence',
          ttl: this.PRESENCE_TTL
        });
      }
    } catch (error) {
      logger.error('Error removing user from global online list:', error);
    }
  }

  /**
   * Verificar se usuário está online
   */
  async isUserOnline(userId: string): Promise<boolean> {
    try {
      const presenceData = await this.getUserPresence(userId);
      return presenceData ? presenceData.status !== 'offline' : false;
    } catch (error) {
      logger.error('Error checking if user is online:', error);
      return false;
    }
  }

  /**
   * Obter contagem de usuários online por tenant
   */
  async getOnlineCountByTenant(tenantId: string): Promise<number> {
    try {
      const users = await this.getOnlineUsersByTenant(tenantId);
      return users.length;
    } catch (error) {
      logger.error('Error getting online count by tenant:', error);
      return 0;
    }
  }

  /**
   * Obter contagem global de usuários online
   */
  async getGlobalOnlineCount(): Promise<number> {
    try {
      const users = await this.getGlobalOnlineUsers();
      return users.length;
    } catch (error) {
      logger.error('Error getting global online count:', error);
      return 0;
    }
  }
}

// Instância singleton
export const presenceService = new PresenceService();
