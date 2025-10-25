import { PrismaClient, User } from '@prisma/client';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';
type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';
import { UserFilters, UserBulkAction, CSVImportResult, UserFormData } from '../../../shared/types';

export class UserService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Listar usuários com filtros e paginação
   */
  async getUsers(filters: UserFilters, tenantId: string, userRole: UserRole) {
    const {
      search,
      role,
      status,
      createdFrom,
      createdTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    const where: any = {
      status: { not: 'DELETED' } // Excluir usuários deletados por padrão
    };
    
    // SUPER_ADMIN pode ver todos os usuários, outros roles precisam de tenantId
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Filtro por busca (nome ou email)
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por role
    if (role) {
      where.role = role;
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por data de criação
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) {
        where.createdAt.gte = new Date(createdFrom);
      }
      if (createdTo) {
        where.createdAt.lte = new Date(createdTo);
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      this.prisma.user.count({ where })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Buscar usuário por ID
   */
  async getUserById(id: string, tenantId: string, userRole: UserRole): Promise<User | null> {
    const where: any = { id };
    
    // SUPER_ADMIN pode ver qualquer usuário, outros roles precisam de tenantId
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // SUPER_ADMIN pode acessar qualquer tenant
    if (userRole !== 'SUPER_ADMIN') {
      where.status = { not: 'DELETED' };
    }

    return this.prisma.user.findFirst({
      where,
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            tenantType: true
          }
        }
      }
    });
  }

  /**
   * Criar novo usuário
   */
  async createUser(userData: UserFormData, tenantId: string, createdBy: string): Promise<User> {
    // Verificar se email já existe no tenant
    const where: any = { email: userData.email };
    if (tenantId) {
      where.tenantId = tenantId;
    }
    
    const existingUser = await this.prisma.user.findFirst({
      where
    });

    if (existingUser) {
      throw new Error('Email já está em uso neste tenant');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password!, 12);

    const user = await this.prisma.user.create({
      data: {
        email: userData.email,
        // password removido - agora é gerenciado via Account
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        status: userData.status || 'ACTIVE',
        tenantId,
        profile: {}
      }
    });

    logger.info(`User created: ${user.email} in tenant ${tenantId} by ${createdBy}`);
    return user;
  }

  /**
   * Atualizar usuário
   */
  async updateUser(
    id: string,
    userData: Partial<UserFormData>,
    tenantId: string,
    updatedBy: string
  ): Promise<User> {
    // Verificar se usuário existe
    const existingUser = await this.prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!existingUser) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: userData.email,
          tenantId,
          id: { not: id }
        }
      });

      if (emailExists) {
        throw new Error('Email já está em uso neste tenant');
      }
    }

    const updateData: any = {
      ...userData,
      updatedAt: new Date()
    };

    // Remover senha se não for fornecida
    if (!userData.password) {
      delete updateData.password;
    } else {
      updateData.password = await bcrypt.hash(userData.password, 12);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData
    });

    logger.info(`User updated: ${user.email} in tenant ${tenantId} by ${updatedBy}`);
    return user;
  }

  /**
   * Soft delete de usuário
   */
  async deleteUser(id: string, tenantId: string, deletedBy: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        status: 'DELETED',
        updatedAt: new Date()
      }
    });

    logger.info(`User soft deleted: ${user.email} in tenant ${tenantId} by ${deletedBy}`);
  }

  /**
   * Redefinir senha de usuário
   */
  async resetUserPassword(id: string, newPassword: string, tenantId: string, resetBy: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id },
      data: {
        // password removido - agora é gerenciado via Account
        updatedAt: new Date()
      }
    });

    logger.info(`Password reset for user: ${user.email} in tenant ${tenantId} by ${resetBy}`);
  }

  /**
   * Ações em lote
   */
  async bulkAction(action: UserBulkAction, tenantId: string, performedBy: string): Promise<{ success: number; failed: number }> {
    const { action: actionType, userIds, reason } = action;
    let success = 0;
    let failed = 0;

    for (const userId of userIds) {
      try {
        switch (actionType) {
          case 'activate':
            await this.prisma.user.update({
              where: { id: userId },
              data: { status: 'ACTIVE', updatedAt: new Date() }
            });
            break;
          case 'deactivate':
            await this.prisma.user.update({
              where: { id: userId },
              data: { status: 'INACTIVE', updatedAt: new Date() }
            });
            break;
          case 'delete':
            await this.prisma.user.update({
              where: { id: userId },
              data: { status: 'DELETED', updatedAt: new Date() }
            });
            break;
        }
        success++;
      } catch (error) {
        logger.error(`Bulk action failed for user ${userId}:`, error);
        failed++;
      }
    }

    logger.info(`Bulk action ${actionType} completed: ${success} success, ${failed} failed by ${performedBy}`);
    return { success, failed };
  }

  /**
   * Exportar usuários para CSV
   */
  async exportUsersToCSV(userIds: string[], tenantId: string): Promise<any[]> {
    const where: any = {
      tenantId,
      status: { not: 'DELETED' }
    };

    if (userIds.length > 0) {
      where.id = { in: userIds };
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Verificar limites de plano
   */
  async checkPlanLimits(tenantId: string, role: UserRole): Promise<{ canCreate: boolean; current: number; limit: number }> {
    // TODO: Implementar verificação de limites de plano
    // Por enquanto, retorna que pode criar
    return {
      canCreate: true,
      current: 0,
      limit: 100
    };
  }
}
