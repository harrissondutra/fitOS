/**
 * Session Policy Service
 * 
 * Gerencia políticas de sessão por role, com Device Fingerprinting
 * para permitir múltiplos dispositivos legítimos enquanto previne abuse.
 */

import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';
import { UserRole } from '../../../shared/types/auth.types';
import { logger } from '../utils/logger';
import { deviceFraudDetector } from './device-fraud-detector.service';

const prisma = getPrismaClient();

export interface DeviceFingerprint {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  hardwareConcurrency: number;
  // Não incluir IP para evitar bloqueios com VPN/mobile
}

export interface SessionPolicy {
  maxSessions: number; // -1 = ilimitado
  maxSessionsPerDevice: number; // Quantas sessões simultâneas no mesmo dispositivo
  enforceSingleSession: boolean;
  allowMultipleDevices: boolean;
  maxDevices: number; // Máximo de dispositivos diferentes
}

// Configuração de políticas por role
const SESSION_POLICIES: Record<UserRole | 'PROFESSIONAL' | 'EMPLOYEE', SessionPolicy> = {
  SUPER_ADMIN: {
    maxSessions: 2, // Desktop + Mobile oficial
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 2
  },

  OWNER: {
    maxSessions: 3, // Desktop + Mobile + Tablet
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 3
  },

  ADMIN: {
    maxSessions: 3, // Desktop + Mobile + Tablet
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 3
  },

  TRAINER: {
    maxSessions: 4, // Desktop + Mobile + Tablet + Desktop casa
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 4
  },

  NUTRITIONIST: {
    maxSessions: 4, // Desktop + Mobile + Tablet + Desktop casa
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 4
  },

  PROFESSIONAL: {
    maxSessions: 4, // Desktop + Mobile + Tablet + Desktop casa
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 4
  },

  EMPLOYEE: {
    maxSessions: 1, // Uma sessão apenas do dispositivo principal
    maxSessionsPerDevice: 1,
    enforceSingleSession: true,
    allowMultipleDevices: false, // Funcionário = usuário fixo
    maxDevices: 1
  },

  CLIENT: {
    maxSessions: 2, // Mobile + Desktop
    maxSessionsPerDevice: 1,
    enforceSingleSession: false,
    allowMultipleDevices: true,
    maxDevices: 2
  }
};

export class SessionPolicyService {
  /**
   * Obter política de sessão para um role
   */
  getPolicy(role: UserRole | 'PROFESSIONAL' | 'EMPLOYEE'): SessionPolicy {
    return SESSION_POLICIES[role] || SESSION_POLICIES.CLIENT;
  }

  /**
   * Gerar fingerprint de dispositivo
   */
  generateDeviceFingerprint(req: any): DeviceFingerprint {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLanguage = req.headers['accept-language'] || '';

    return {
      userAgent: userAgent.substring(0, 200), // Limitar tamanho
      platform: userAgent.includes('Windows') ? 'Windows'
        : userAgent.includes('Mac') ? 'Mac'
          : userAgent.includes('Linux') ? 'Linux'
            : userAgent.includes('Android') ? 'Android'
              : userAgent.includes('iOS') ? 'iOS'
                : 'Unknown',
      language: acceptLanguage.split(',')[0] || 'pt-BR',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: '', // Será preenchido no frontend
      hardwareConcurrency: 0 // Será preenchido no frontend
    };
  }

  /**
   * Criar sessão com validação de política e detecção de fraude
   */
  async createSession(
    userId: string,
    role: UserRole,
    deviceFingerprint: DeviceFingerprint,
    ipAddress?: string
  ): Promise<{ session: any; terminatedSessions: number; fraudDetection?: any }> {
    const policy = this.getPolicy(role);

    // Buscar sessões ativas
    const activeSessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    let terminatedSessions = 0;

    // Se enforceSingleSession = true, terminar todas as anteriores
    if (policy.enforceSingleSession) {
      await prisma.session.updateMany({
        where: { userId, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date() } // Expirar imediatamente
      });
      terminatedSessions = activeSessions.length;
    } else {
      // Se não, aplicar limites de dispositivos
      const devices = this.groupSessionsByDevice(activeSessions);

      // Remover dispositivos extras
      if (devices.size >= policy.maxDevices && policy.maxDevices > 0) {
        const devicesToRemove = Array.from(devices.entries())
          .sort((a, b) => new Date(a[1][0]?.createdAt || 0).getTime() - new Date(b[1][0]?.createdAt || 0).getTime())
          .slice(0, devices.size - policy.maxDevices + 1);

        for (const [deviceKey, sessions] of devicesToRemove) {
          await prisma.session.updateMany({
            where: { userId, id: { in: sessions.map(s => s.id) } },
            data: { expiresAt: new Date() }
          });
          terminatedSessions += sessions.length;
        }
      }

      // Remover sessões extras no mesmo dispositivo
      if (activeSessions.length >= policy.maxSessions && policy.maxSessions > 0) {
        const sessionsToTerminate = activeSessions
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, activeSessions.length - policy.maxSessions + 1);

        await prisma.session.updateMany({
          where: { userId, id: { in: sessionsToTerminate.map(s => s.id) } },
          data: { expiresAt: new Date() }
        });
        terminatedSessions += sessionsToTerminate.length;
      }
    }

    // Detectar fraude ANTES de criar a sessão
    const fraudDetection = await deviceFraudDetector.detectFraud(
      userId,
      deviceFingerprint as any
    );

    // Log detecção
    if (fraudDetection.isFraud) {
      logger.warn('Fraud detection triggered:', {
        userId,
        confidence: fraudDetection.confidence,
        reasons: fraudDetection.reasons,
        action: fraudDetection.recommendedAction
      });
    }

    // Se confiança alta de fraude, bloquear
    if (fraudDetection.confidence >= 70 && fraudDetection.recommendedAction === 'BLOCK') {
      throw new Error('FRAUD_DETECTED: ' + fraudDetection.reasons.join('; '));
    }

    // Criar nova sessão
    const prismaAny = prisma as any;
    const session = await prismaAny.session.create({
      data: {
        userId,
        token: this.generateToken(),
        deviceInfo: deviceFingerprint as any,
        ipAddress: ipAddress || 'unknown',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      } as any
    });

    return { session, terminatedSessions, fraudDetection };
  }

  /**
   * Validar se sessão é válida (é a mais recente ou dentro do limite?)
   */
  async validateSession(sessionId: string, userId: string): Promise<{
    valid: boolean;
    reason?: string;
    terminated?: boolean;
  }> {
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        userId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return {
        valid: false,
        reason: 'Session expired or not found'
      };
    }

    // Buscar política do usuário
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { valid: false, reason: 'User not found' };
    }

    const policy = this.getPolicy(user.role as UserRole);

    // Se enforceSingleSession, verificar se é a sessão mais recente
    if (policy.enforceSingleSession) {
      const latestSession = await prisma.session.findFirst({
        where: { userId, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' }
      });

      if (latestSession?.id !== sessionId) {
        // Terminar esta sessão
        await prisma.session.update({
          where: { id: sessionId },
          data: { expiresAt: new Date() }
        });

        return {
          valid: false,
          reason: 'New session created on another device',
          terminated: true
        };
      }
    }

    return { valid: true };
  }

  /**
   * Agrupar sessões por dispositivo
   */
  private groupSessionsByDevice(sessions: any[]): Map<string, any[]> {
    const devices = new Map<string, any[]>();

    for (const session of sessions) {
      const deviceKey = this.getDeviceKey(session.deviceInfo);

      if (!devices.has(deviceKey)) {
        devices.set(deviceKey, []);
      }

      devices.get(deviceKey)!.push(session);
    }

    return devices;
  }

  /**
   * Gerar chave única para dispositivo
   */
  private getDeviceKey(deviceInfo: any): string {
    // Usar combinação de user agent, platform e timezone
    // Não usar IP para evitar bloquear VPN/mobile
    const keyParts = [
      deviceInfo.userAgent,
      deviceInfo.platform,
      deviceInfo.timezone
    ];

    return keyParts.join('||');
  }

  /**
   * Gerar token único
   */
  private generateToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Obter estatísticas de sessões de um usuário
   */
  async getUserSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    devices: string[];
    latestLogin: Date | null;
  }> {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const activeSessions = sessions.filter(s => s.expiresAt > new Date());
    const devices = new Set(
      activeSessions
        .map(s => this.getDeviceKey(s.deviceInfo))
        .filter(Boolean)
    );

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      devices: Array.from(devices),
      latestLogin: sessions[0]?.createdAt || null
    };
  }

  /**
   * Terminar todas as sessões de um usuário
   */
  async terminateAllSessions(userId: string): Promise<number> {
    const result = await prisma.session.updateMany({
      where: { userId },
      data: { expiresAt: new Date() }
    });

    return result.count;
  }

  /**
   * Terminar sessões de um dispositivo específico
   */
  async terminateDeviceSessions(userId: string, deviceKey: string): Promise<number> {
    const sessions = await prisma.session.findMany({
      where: { userId, expiresAt: { gt: new Date() } }
    });

    const deviceSessions = sessions.filter(s =>
      this.getDeviceKey(s.deviceInfo) === deviceKey
    );

    const result = await prisma.session.updateMany({
      where: { id: { in: deviceSessions.map(s => s.id) } },
      data: { expiresAt: new Date() }
    });

    return result.count;
  }
}

// Singleton
export const sessionPolicyService = new SessionPolicyService();

