import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../config/database';

const prisma = getPrismaClient();

export interface LogActionData {
  tenantId: string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'appointment' | 'member' | 'crm_client' | 'bioimpedance' | 'template' | 'availability' | 'user' | 'tenant';
  entityId: string;
  changes: {
    before?: any;
    after?: any;
  };
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditFilters {
  tenantId: string;
  userId?: string;
  entityType?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Registra ação no log de auditoria
   */
  async logAction(data: LogActionData): Promise<{
    success: boolean;
    auditLog?: any;
    error?: string;
  }> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          changes: data.changes,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      return { success: true, auditLog };
    } catch (error: any) {
      console.error('Erro ao registrar log de auditoria:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista logs de auditoria com filtros
   */
  async getAuditLogs(filters: AuditFilters): Promise<{
    success: boolean;
    logs?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const where: any = {
        tenantId: filters.tenantId
      };

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.entityType) {
        where.entityType = filters.entityType;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            tenant: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        prisma.auditLog.count({ where })
      ]);

      return { success: true, logs, total };
    } catch (error: any) {
      console.error('Erro ao listar logs de auditoria:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém histórico de alterações de uma entidade específica
   */
  async getEntityHistory(
    tenantId: string,
    entityType: string,
    entityId: string
  ): Promise<{
    success: boolean;
    history?: any[];
    error?: string;
  }> {
    try {
      const history = await prisma.auditLog.findMany({
        where: {
          tenantId,
          entityType,
          entityId
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return { success: true, history };
    } catch (error: any) {
      console.error('Erro ao obter histórico da entidade:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getAuditStats(tenantId: string, startDate?: Date, endDate?: Date): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const where: any = { tenantId };

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = startDate;
        }
        if (endDate) {
          where.createdAt.lte = endDate;
        }
      }

      const [
        total,
        byAction,
        byEntityType,
        byUser,
        recentActivity
      ] = await Promise.all([
        prisma.auditLog.count({ where }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where,
          _count: { action: true }
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          where,
          _count: { entityType: true }
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where,
          _count: { userId: true }
        }),
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      return {
        success: true,
        stats: {
          total,
          byAction: byAction.reduce((acc, item) => {
            acc[item.action] = item._count.action;
            return acc;
          }, {} as any),
          byEntityType: byEntityType.reduce((acc, item) => {
            acc[item.entityType] = item._count.entityType;
            return acc;
          }, {} as any),
          byUser: byUser.reduce((acc, item) => {
            acc[item.userId] = item._count.userId;
            return acc;
          }, {} as any),
          recentActivity
        }
      };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas de auditoria:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove logs de auditoria antigos (mais de 1 ano)
   */
  async cleanupOldLogs(): Promise<{
    success: boolean;
    deletedCount?: number;
    error?: string;
  }> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const result = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: oneYearAgo
          }
        }
      });

      return { success: true, deletedCount: result.count };
    } catch (error: any) {
      console.error('Erro ao limpar logs antigos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Exporta logs de auditoria para CSV
   */
  async exportAuditLogs(filters: AuditFilters): Promise<{
    success: boolean;
    csvData?: string;
    error?: string;
  }> {
    try {
      const result = await this.getAuditLogs(filters);
      
      if (!result.success || !result.logs) {
        return { success: false, error: 'Erro ao obter logs' };
      }

      const headers = [
        'Data',
        'Usuário',
        'Ação',
        'Tipo de Entidade',
        'ID da Entidade',
        'IP',
        'User Agent'
      ];

      const csvRows = [
        headers.join(','),
        ...result.logs.map(log => [
          log.createdAt.toISOString(),
          `"${log.user?.name || 'N/A'}"`,
          log.action,
          log.entityType,
          log.entityId,
          `"${log.ipAddress || 'N/A'}"`,
          `"${log.userAgent || 'N/A'}"`
        ].join(','))
      ];

      return { success: true, csvData: csvRows.join('\n') };
    } catch (error: any) {
      console.error('Erro ao exportar logs de auditoria:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verifica se uma ação é suspeita (muitas alterações em pouco tempo)
   */
  async detectSuspiciousActivity(
    tenantId: string,
    userId: string,
    timeWindowMinutes: number = 5,
    threshold: number = 10
  ): Promise<{
    success: boolean;
    isSuspicious?: boolean;
    activityCount?: number;
    error?: string;
  }> {
    try {
      const timeWindow = new Date();
      timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);

      const activityCount = await prisma.auditLog.count({
        where: {
          tenantId,
          userId,
          createdAt: {
            gte: timeWindow
          }
        }
      });

      return {
        success: true,
        isSuspicious: activityCount >= threshold,
        activityCount
      };
    } catch (error: any) {
      console.error('Erro ao detectar atividade suspeita:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new AuditService();
