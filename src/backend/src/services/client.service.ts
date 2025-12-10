import { PrismaClient, Client } from '@prisma/client';
import { PrismaTenantWrapper } from './prisma-tenant-wrapper.service';
// Tipos temporários para evitar erros de compilação após remoção da autenticação
type UserRole = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'TRAINER' | 'CLIENT';
import { logger } from '../utils/logger';
import { redisService } from './redis.service';
import { generateCacheKey, calculateTTL, hashParams } from '../utils/cache-utils';

export interface ClientFilters {
  search?: string;
  status?: string;
  membershipType?: string;
  trainerId?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  membershipType: string;
  status?: string;
  biometricData?: any;
  goals?: any;
  userId: string;
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  totalWorkouts: number;
  completedWorkouts: number;
  completionRate: number;
  lastWorkoutDate?: Date;
  averageWorkoutsPerWeek: number;
  goals: any;
  biometricTrends: {
    weight?: Array<{ date: Date; value: number }>;
    bodyFat?: Array<{ date: Date; value: number }>;
    muscleMass?: Array<{ date: Date; value: number }>;
  };
}

export class ClientService {
  constructor(private prisma: PrismaClient | PrismaTenantWrapper) {}

  /**
   * Listar clientes com filtros e paginação
   */
  async getClients(filters: ClientFilters, tenantId: string, userRole: UserRole, userId?: string) {
    const {
      search,
      status,
      membershipType,
      trainerId,
      createdFrom,
      createdTo,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = filters;

    // Verificar cache primeiro
    const cacheKey = generateCacheKey(`clients:list:${hashParams(filters)}`, { tenantId });
    const cached = await redisService.get(cacheKey, {
      namespace: 'clients',
      ttl: calculateTTL('user')
    });

    if (cached) {
      logger.debug(`Client list cache HIT for tenant ${tenantId}`);
      return cached;
    }

    logger.debug(`Client list cache MISS for tenant ${tenantId}`);

    const where: any = {};
    
    where.tenantId = tenantId;

    // Filtro por busca (nome ou email)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtro por status
    if (status) {
      where.status = status;
    }

    // Filtro por tipo de membro
    if (membershipType) {
      where.membershipType = membershipType;
    }

    // Filtro por trainer
    if (trainerId) {
      where.trainers = {
        some: {
          trainerId,
          isActive: true
        }
      };
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

    // Validação de escopo por role
    if (userRole === 'TRAINER' && tenantId) {
      // Trainers só podem ver clientes atribuídos (apenas se tiver tenantId)
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (assignedClients.length > 0) {
        where.id = { in: assignedClients };
      } else {
        // Se não tiver clientes atribuídos, retornar lista vazia
        where.id = { in: [] };
      }
    }

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          },
          trainers: {
            where: { isActive: true },
            include: {
              trainer: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          _count: {
            select: {
              workouts: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit
      }),
      this.prisma.client.count({ where })
    ]);

    const result = {
      clients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };

    // Salvar no cache
    await redisService.set(cacheKey, result, {
      namespace: 'clients',
      ttl: calculateTTL('user')
    });

    return result;
  }

  /**
   * Buscar cliente por ID
   */
  async getClientById(id: string, tenantId: string, userRole: UserRole, userId?: string): Promise<Client | null> {
    // Verificar cache primeiro
    const cacheKey = generateCacheKey(`client:${id}`, { tenantId });
    const cached = await redisService.get<Client>(cacheKey, {
      namespace: 'clients',
      ttl: calculateTTL('user')
    });

    if (cached) {
      logger.debug(`Client cache HIT for ID ${id}`);
      return cached;
    }

    logger.debug(`Client cache MISS for ID ${id}`);
    
    const where: any = { id };
    
    // SUPER_ADMIN pode ver qualquer cliente, outros roles precisam de tenantId
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // Validação de escopo por role
    if (userRole === 'TRAINER' && tenantId) {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(id)) {
        return null;
      }
    }

    const client = await this.prisma.client.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        trainers: {
          where: { isActive: true },
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        workouts: {
          select: {
            id: true,
            name: true,
            completed: true,
            completedAt: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        biometricRecords: {
          select: {
            id: true,
            dataType: true,
            value: true,
            unit: true,
            recordedAt: true
          },
          orderBy: { recordedAt: 'desc' },
          take: 20
        }
      }
    });

    // Salvar no cache se encontrado
    if (client) {
      await redisService.set(cacheKey, client, {
        namespace: 'clients',
        ttl: calculateTTL('user')
      });
    }

    return client;
  }

  /**
   * Criar novo cliente
   */
  async createClient(clientData: ClientFormData, tenantId: string, createdBy: string): Promise<Client> {
    // Verificar se email já existe no tenant (se fornecido)
    if (clientData.email) {
      const existingClient = await this.prisma.client.findFirst({
        where: {
          email: clientData.email,
          tenantId
        }
      });

      if (existingClient) {
        throw new Error('Email já está em uso neste tenant');
      }
    }

    const client = await this.prisma.client.create({
      data: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone,
        membershipType: clientData.membershipType,
        status: clientData.status || 'active',
        biometricData: clientData.biometricData || {},
        goals: clientData.goals || {},
        userId: clientData.userId,
        tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Invalidar cache de clientes do tenant
    await this.invalidateClientCache(tenantId);

    logger.info(`Client created: ${client.name} in tenant ${tenantId} by ${createdBy}`);
    return client;
  }

  /**
   * Atualizar cliente
   */
  async updateClient(
    id: string,
    clientData: Partial<ClientFormData>,
    tenantId: string,
    updatedBy: string,
    userRole: UserRole,
    userId?: string
  ): Promise<Client> {
    // Verificar se cliente existe e usuário tem permissão
    const existingClient = await this.getClientById(id, tenantId, userRole, userId);

    if (!existingClient) {
      throw new Error('Cliente não encontrado ou acesso negado');
    }

    // Verificar se email já existe (se estiver sendo alterado)
    if (clientData.email && clientData.email !== existingClient.email) {
      const emailExists = await this.prisma.client.findFirst({
        where: {
          email: clientData.email,
          tenantId,
          id: { not: id }
        }
      });

      if (emailExists) {
        throw new Error('Email já está em uso neste tenant');
      }
    }

    const updateData: any = {
      ...clientData,
      updatedAt: new Date()
    };

    const client = await this.prisma.client.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        trainers: {
          where: { isActive: true },
          include: {
            trainer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Invalidar cache de clientes do tenant
    await this.invalidateClientCache(tenantId);

    logger.info(`Client updated: ${client.name} in tenant ${tenantId} by ${updatedBy}`);
    return client;
  }

  /**
   * Deletar cliente
   */
  async deleteClient(id: string, tenantId: string, deletedBy: string, userRole: UserRole, userId?: string): Promise<void> {
    // Verificar se cliente existe e usuário tem permissão
    const existingClient = await this.getClientById(id, tenantId, userRole, userId);

    if (!existingClient) {
      throw new Error('Cliente não encontrado ou acesso negado');
    }

    await this.prisma.client.delete({
      where: { id }
    });

    // Invalidar cache de clientes do tenant
    await this.invalidateClientCache(tenantId);

    logger.info(`Client deleted: ${existingClient.name} in tenant ${tenantId} by ${deletedBy}`);
  }

  /**
   * Atribuir trainer a um cliente
   */
  async assignTrainer(clientId: string, trainerId: string, tenantId: string, assignedBy: string): Promise<void> {
    // Verificar se cliente existe
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId }
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    // Verificar se trainer existe
    const trainer = await this.prisma.user.findFirst({
      where: { id: trainerId, tenantId, role: 'TRAINER' }
    });

    if (!trainer) {
      throw new Error('Trainer não encontrado');
    }

    // Verificar se já está atribuído
    const existingAssignment = await (this.prisma as any).clientTrainer.findFirst({
      where: {
        clientId,
        trainerId,
        isActive: true
      }
    });

    if (existingAssignment) {
      throw new Error('Trainer já está atribuído a este cliente');
    }

    await (this.prisma as any).clientTrainer.create({
      data: {
        clientId,
        trainerId,
        assignedBy,
        isActive: true
      }
    });

    logger.info(`Trainer assigned: ${trainerId} to client ${clientId} in tenant ${tenantId} by ${assignedBy}`);
  }

  /**
   * Remover trainer de um cliente
   */
  async unassignTrainer(clientId: string, trainerId: string, tenantId: string, unassignedBy: string): Promise<void> {
    const assignment = await (this.prisma as any).clientTrainer.findFirst({
      where: {
        clientId,
        trainerId,
        isActive: true
      }
    });

    if (!assignment) {
      throw new Error('Atribuição não encontrada');
    }

    await (this.prisma as any).clientTrainer.update({
      where: { id: assignment.id },
      data: { isActive: false }
    });

    logger.info(`Trainer unassigned: ${trainerId} from client ${clientId} in tenant ${tenantId} by ${unassignedBy}`);
  }

  /**
   * Obter clientes atribuídos a um trainer
   */
  async getClientsByTrainer(trainerId: string, tenantId: string): Promise<Client[]> {
    const assignments = await (this.prisma as any).clientTrainer.findMany({
      where: {
        trainerId,
        isActive: true,
        client: {
          tenantId
        }
      },
      include: {
        client: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            },
            _count: {
              select: {
                workouts: true
              }
            }
          }
        }
      }
    });

    return assignments.map(a => a.client);
  }

  /**
   * Obter progresso de um cliente
   */
  async getClientProgress(clientId: string, tenantId: string, userRole: UserRole, userId?: string): Promise<ClientProgress> {
    // Validação de escopo por role
    if (userRole === 'TRAINER') {
      const assignedClients = await this.getAssignedClients(userId!, tenantId);
      if (!assignedClients.includes(clientId)) {
        throw new Error('Acesso negado: cliente não atribuído');
      }
    }

    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        workouts: {
          select: {
            id: true,
            completed: true,
            completedAt: true,
            createdAt: true
          }
        },
        biometricRecords: {
          select: {
            dataType: true,
            value: true,
            recordedAt: true
          },
          orderBy: { recordedAt: 'desc' }
        }
      }
    });

    if (!client) {
      throw new Error('Cliente não encontrado');
    }

    const totalWorkouts = client.workouts.length;
    const completedWorkouts = client.workouts.filter(w => w.completed).length;
    const completionRate = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

    // Calcular média de workouts por semana (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const workoutsLast30Days = client.workouts.filter(w => 
      w.createdAt >= thirtyDaysAgo
    ).length;

    const averageWorkoutsPerWeek = (workoutsLast30Days / 30) * 7;

    // Último workout
    const lastWorkout = client.workouts
      .filter(w => w.completed)
      .sort((a, b) => b.completedAt!.getTime() - a.completedAt!.getTime())[0];

    // Processar dados biométricos por tipo
    const biometricTrends = {
      weight: client.biometricRecords
        .filter(r => r.dataType === 'weight')
        .map(r => ({ date: r.recordedAt, value: r.value }))
        .slice(0, 20),
      bodyFat: client.biometricRecords
        .filter(r => r.dataType === 'body_fat')
        .map(r => ({ date: r.recordedAt, value: r.value }))
        .slice(0, 20),
      muscleMass: client.biometricRecords
        .filter(r => r.dataType === 'muscle_mass')
        .map(r => ({ date: r.recordedAt, value: r.value }))
        .slice(0, 20)
    };

    return {
      clientId: client.id,
      clientName: client.name,
      totalWorkouts,
      completedWorkouts,
      completionRate: Math.round(completionRate * 100) / 100,
      lastWorkoutDate: lastWorkout?.completedAt || undefined,
      averageWorkoutsPerWeek: Math.round(averageWorkoutsPerWeek * 100) / 100,
      goals: client.goals as any,
      biometricTrends
    };
  }

  /**
   * Obter clientes atribuídos a um trainer
   */
  private async getAssignedClients(trainerId: string, tenantId: string): Promise<string[]> {
    const where: any = {
      trainerId,
      isActive: true
    };
    
    // SUPER_ADMIN pode ver todos os clientes, outros roles precisam de tenantId
    if (tenantId) {
      where.client = { tenantId };
    }
    
    const assignments = await (this.prisma as any).clientTrainer.findMany({
      where,
      select: {
        clientId: true
      }
    });

    return assignments.map(a => a.clientId);
  }

  /**
   * Exportar clientes para CSV
   */
  async exportClientsToCSV(clientIds: string[], tenantId: string): Promise<any[]> {
    const where: any = {
      tenantId
    };

    if (clientIds.length > 0) {
      where.id = { in: clientIds };
    }

    return this.prisma.client.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true
          }
        },
        trainers: {
          where: { isActive: true },
          include: {
            trainer: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: {
            workouts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Invalidar cache de clientes do tenant
   */
  private async invalidateClientCache(tenantId: string): Promise<void> {
    try {
      // Invalidar cache de listas de clientes
      await redisService.invalidatePattern(`tenant:${tenantId}:clients:*`, {
        namespace: 'clients'
      });
      
      // Invalidar cache de clientes individuais do tenant
      await redisService.invalidatePattern(`tenant:${tenantId}:client:*`, {
        namespace: 'clients'
      });

      logger.debug(`Client cache invalidated for tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Error invalidating client cache for tenant ${tenantId}:`, error);
    }
  }
}
