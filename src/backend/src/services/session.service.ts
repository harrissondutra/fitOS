/**
 * Session Service - FitOS
 * 
 * Serviço para gerenciamento de sessões com Redis:
 * - Armazenar sessões ativas
 * - Blacklist de tokens revogados
 * - Rate limiting de login
 * - Refresh token tracking
 */

import { redisService } from './redis.service';
import { logger } from '../utils/logger';
import { generateCacheKey, calculateTTL } from '../utils/cache-utils';
import jwt from 'jsonwebtoken';

export interface SessionData {
  userId: string;
  tenantId?: string;
  role: string;
  email: string;
  ip: string;
  userAgent: string;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}

export interface LoginAttempt {
  ip: string;
  email: string;
  attempts: number;
  lastAttempt: Date;
  lockedUntil?: Date;
}

export class SessionService {
  private readonly SESSION_TTL = calculateTTL('session');
  private readonly LOGIN_ATTEMPT_TTL = 300; // 5 minutos
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 900; // 15 minutos

  /**
   * Criar nova sessão
   */
  async createSession(
    userId: string,
    tenantId: string | undefined,
    role: string,
    email: string,
    ip: string,
    userAgent: string
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    const now = new Date();

    const sessionData: SessionData = {
      userId,
      tenantId,
      role,
      email,
      ip,
      userAgent,
      createdAt: now,
      lastActivity: now,
      isActive: true
    };

    const sessionKey = generateCacheKey(`session:${sessionId}`, { userId });
    
    await redisService.set(sessionKey, sessionData, {
      namespace: 'sessions',
      ttl: this.SESSION_TTL
    });

    // Rastrear sessões ativas do usuário
    await this.trackUserSession(userId, sessionId);

    logger.info(`Session created for user ${userId} (${email}) from ${ip}`);
    return sessionId;
  }

  /**
   * Obter dados da sessão
   */
  async getSession(sessionId: string, userId?: string): Promise<SessionData | null> {
    const sessionKey = generateCacheKey(`session:${sessionId}`, { userId });
    
    const session = await redisService.get<SessionData>(sessionKey, {
      namespace: 'sessions',
      ttl: this.SESSION_TTL
    });

    if (!session || !session.isActive) {
      return null;
    }

    // Atualizar última atividade
    session.lastActivity = new Date();
    await redisService.set(sessionKey, session, {
      namespace: 'sessions',
      ttl: this.SESSION_TTL
    });

    return session;
  }

  /**
   * Invalidar sessão
   */
  async invalidateSession(sessionId: string, userId?: string): Promise<boolean> {
    const sessionKey = generateCacheKey(`session:${sessionId}`, { userId });
    
    const session = await redisService.get<SessionData>(sessionKey, {
      namespace: 'sessions'
    });

    if (session) {
      // Remover da lista de sessões ativas do usuário
      await this.removeUserSession(session.userId, sessionId);
    }

    const deleted = await redisService.del(sessionKey, {
      namespace: 'sessions'
    });

    if (deleted) {
      logger.info(`Session invalidated: ${sessionId} for user ${userId || 'unknown'}`);
    }

    return deleted;
  }

  /**
   * Invalidar todas as sessões do usuário
   */
  async invalidateUserSessions(userId: string): Promise<number> {
    const userSessionsKey = generateCacheKey(`user:sessions:${userId}`);
    const sessionIds = await redisService.get<string[]>(userSessionsKey, {
      namespace: 'sessions'
    });

    if (!sessionIds || sessionIds.length === 0) {
      return 0;
    }

    let invalidatedCount = 0;
    
    for (const sessionId of sessionIds) {
      const sessionKey = generateCacheKey(`session:${sessionId}`, { userId });
      const deleted = await redisService.del(sessionKey, {
        namespace: 'sessions'
      });
      
      if (deleted) {
        invalidatedCount++;
      }
    }

    // Limpar lista de sessões do usuário
    await redisService.del(userSessionsKey, {
      namespace: 'sessions'
    });

    logger.info(`Invalidated ${invalidatedCount} sessions for user ${userId}`);
    return invalidatedCount;
  }

  /**
   * Verificar se token está na blacklist
   */
  async isTokenBlacklisted(tokenJti: string): Promise<boolean> {
    const blacklistKey = generateCacheKey(`blacklist:token:${tokenJti}`);
    return await redisService.exists(blacklistKey, {
      namespace: 'auth'
    });
  }

  /**
   * Adicionar token à blacklist
   */
  async blacklistToken(tokenJti: string, expiresAt: Date): Promise<void> {
    const blacklistKey = generateCacheKey(`blacklist:token:${tokenJti}`);
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    
    if (ttl > 0) {
      await redisService.set(blacklistKey, true, {
        namespace: 'auth',
        ttl
      });
      
      logger.debug(`Token blacklisted: ${tokenJti}`);
    }
  }

  /**
   * Registrar tentativa de login
   */
  async recordLoginAttempt(ip: string, email: string): Promise<LoginAttempt> {
    const ipKey = generateCacheKey(`login:attempts:ip:${ip}`);
    const emailKey = generateCacheKey(`login:attempts:email:${email}`);
    
    const now = new Date();
    
    // Obter tentativas por IP
    const ipAttempts = await redisService.get<LoginAttempt>(ipKey, {
      namespace: 'auth'
    }) || { ip, email: '', attempts: 0, lastAttempt: now };

    // Obter tentativas por email
    const emailAttempts = await redisService.get<LoginAttempt>(emailKey, {
      namespace: 'auth'
    }) || { ip: '', email, attempts: 0, lastAttempt: now };

    // Incrementar contadores
    ipAttempts.attempts++;
    ipAttempts.lastAttempt = now;
    
    emailAttempts.attempts++;
    emailAttempts.lastAttempt = now;

    // Verificar se deve bloquear
    if (ipAttempts.attempts >= this.MAX_LOGIN_ATTEMPTS) {
      ipAttempts.lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION * 1000);
    }

    if (emailAttempts.attempts >= this.MAX_LOGIN_ATTEMPTS) {
      emailAttempts.lockedUntil = new Date(now.getTime() + this.LOCKOUT_DURATION * 1000);
    }

    // Salvar tentativas
    await redisService.set(ipKey, ipAttempts, {
      namespace: 'auth',
      ttl: this.LOGIN_ATTEMPT_TTL
    });

    await redisService.set(emailKey, emailAttempts, {
      namespace: 'auth',
      ttl: this.LOGIN_ATTEMPT_TTL
    });

    logger.warn(`Login attempt recorded: IP ${ip}, Email ${email}, Attempts: IP=${ipAttempts.attempts}, Email=${emailAttempts.attempts}`);

    return {
      ip,
      email,
      attempts: Math.max(ipAttempts.attempts, emailAttempts.attempts),
      lastAttempt: now,
      lockedUntil: ipAttempts.lockedUntil || emailAttempts.lockedUntil
    };
  }

  /**
   * Limpar tentativas de login após login bem-sucedido
   */
  async clearLoginAttempts(ip: string, email: string): Promise<void> {
    const ipKey = generateCacheKey(`login:attempts:ip:${ip}`);
    const emailKey = generateCacheKey(`login:attempts:email:${email}`);
    
    await Promise.all([
      redisService.del(ipKey, { namespace: 'auth' }),
      redisService.del(emailKey, { namespace: 'auth' })
    ]);

    logger.debug(`Login attempts cleared for IP ${ip}, Email ${email}`);
  }

  /**
   * Verificar se IP/email está bloqueado
   */
  async isBlocked(ip: string, email: string): Promise<{ blocked: boolean; reason?: string; lockedUntil?: Date }> {
    const ipKey = generateCacheKey(`login:attempts:ip:${ip}`);
    const emailKey = generateCacheKey(`login:attempts:email:${email}`);
    
    const [ipAttempts, emailAttempts] = await Promise.all([
      redisService.get<LoginAttempt>(ipKey, { namespace: 'auth' }),
      redisService.get<LoginAttempt>(emailKey, { namespace: 'auth' })
    ]);

    const now = new Date();

    // Verificar bloqueio por IP
    if (ipAttempts && ipAttempts.lockedUntil && ipAttempts.lockedUntil > now) {
      return {
        blocked: true,
        reason: 'IP blocked due to too many failed attempts',
        lockedUntil: ipAttempts.lockedUntil
      };
    }

    // Verificar bloqueio por email
    if (emailAttempts && emailAttempts.lockedUntil && emailAttempts.lockedUntil > now) {
      return {
        blocked: true,
        reason: 'Email blocked due to too many failed attempts',
        lockedUntil: emailAttempts.lockedUntil
      };
    }

    return { blocked: false };
  }

  /**
   * Rastrear sessão do usuário
   */
  private async trackUserSession(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = generateCacheKey(`user:sessions:${userId}`);
    
    const existingSessions = await redisService.get<string[]>(userSessionsKey, {
      namespace: 'sessions'
    }) || [];

    if (!existingSessions.includes(sessionId)) {
      existingSessions.push(sessionId);
      await redisService.set(userSessionsKey, existingSessions, {
        namespace: 'sessions',
        ttl: this.SESSION_TTL
      });
    }
  }

  /**
   * Remover sessão do usuário
   */
  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const userSessionsKey = generateCacheKey(`user:sessions:${userId}`);
    
    const existingSessions = await redisService.get<string[]>(userSessionsKey, {
      namespace: 'sessions'
    }) || [];

    const updatedSessions = existingSessions.filter(id => id !== sessionId);
    
    if (updatedSessions.length === 0) {
      await redisService.del(userSessionsKey, {
        namespace: 'sessions'
      });
    } else {
      await redisService.set(userSessionsKey, updatedSessions, {
        namespace: 'sessions',
        ttl: this.SESSION_TTL
      });
    }
  }

  /**
   * Gerar ID único para sessão
   */
  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Obter estatísticas de sessões
   */
  async getSessionStats(): Promise<{
    activeSessions: number;
    totalUsers: number;
    blockedIPs: number;
    blockedEmails: number;
  }> {
    try {
      const [sessionKeys, userKeys, blockedIPKeys, blockedEmailKeys] = await Promise.all([
        redisService.keys('sessions:session:*'),
        redisService.keys('sessions:user:sessions:*'),
        redisService.keys('auth:login:attempts:ip:*'),
        redisService.keys('auth:login:attempts:email:*')
      ]);

      // Contar IPs e emails bloqueados
      let blockedIPs = 0;
      let blockedEmails = 0;

      for (const ipKey of blockedIPKeys) {
        const attempts = await redisService.get<LoginAttempt>(ipKey.replace('auth:', ''), {
          namespace: 'auth'
        });
        if (attempts && attempts.lockedUntil && attempts.lockedUntil > new Date()) {
          blockedIPs++;
        }
      }

      for (const emailKey of blockedEmailKeys) {
        const attempts = await redisService.get<LoginAttempt>(emailKey.replace('auth:', ''), {
          namespace: 'auth'
        });
        if (attempts && attempts.lockedUntil && attempts.lockedUntil > new Date()) {
          blockedEmails++;
        }
      }

      return {
        activeSessions: sessionKeys.length,
        totalUsers: userKeys.length,
        blockedIPs,
        blockedEmails
      };
    } catch (error) {
      logger.error('Error getting session stats:', error);
      return {
        activeSessions: 0,
        totalUsers: 0,
        blockedIPs: 0,
        blockedEmails: 0
      };
    }
  }

  /**
   * Limpar sessões expiradas
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const sessionKeys = await redisService.keys('sessions:session:*');
      let cleanedCount = 0;

      for (const key of sessionKeys) {
        const session = await redisService.get<SessionData>(key.replace('sessions:', ''), {
          namespace: 'sessions'
        });

        if (!session || !session.isActive) {
          await redisService.del(key.replace('sessions:', ''), {
            namespace: 'sessions'
          });
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }
}

// Instância singleton
export const sessionService = new SessionService();



