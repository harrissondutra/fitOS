import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';

export interface CreateClientProfileData {
  tenantId: string;
  professionalId: string;
  clientId: string;
  leadSource?: string;
  status?: 'prospect' | 'active' | 'at_risk' | 'inactive' | 'churned';
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface UpdateClientProfileData {
  leadSource?: string;
  status?: 'prospect' | 'active' | 'at_risk' | 'inactive' | 'churned';
  lifetimeValue?: number;
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface CreateInteractionData {
  tenantId: string;
  clientId: string;
  professionalId: string;
  type: 'call' | 'email' | 'meeting' | 'workout' | 'nutrition' | 'note';
  subject: string;
  description?: string;
  outcome?: string;
  nextAction?: string;
  scheduledDate?: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  tags?: string[];
  attachments?: string[];
}

export interface CreateTaskData {
  tenantId: string;
  professionalId: string;
  clientId: string;
  title: string;
  description?: string;
  type: 'follow_up' | 'call' | 'email' | 'meeting';
  dueDate: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CRMFilters {
  tenantId: string;
  professionalId?: string;
  status?: string;
  leadSource?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export class ProfessionalCRMService {
  private prisma: PrismaClient | any; // Aceita PrismaClient ou PrismaTenantWrapper
  private notificationService: NotificationService;
  private auditService: AuditService;

  constructor(prisma?: PrismaClient | any) {
    // Se não fornecido, importar getPrismaClient para fallback
    // Mas preferencialmente sempre passar do request via factory
    this.prisma = prisma || (() => {
      const { getPrismaClient } = require('../config/database');
      return getPrismaClient();
    })();
    this.notificationService = new NotificationService();
    this.auditService = new AuditService();
  }

  /**
   * Cria perfil de cliente
   */
  async createClientProfile(data: CreateClientProfileData, userId: string): Promise<{
    success: boolean;
    clientProfile?: any;
    error?: string;
  }> {
    try {
      // Verifica se já existe perfil para este cliente
      const existingProfile = await this.prisma.clientProfile.findUnique({
        where: { clientId: data.clientId }
      });

      if (existingProfile) {
        return { success: false, error: 'Perfil de cliente já existe para este cliente' };
      }

      const clientProfile = await this.prisma.clientProfile.create({
        data: {
          ...data,
          // lastContact: new Date(),
          // tags: data.tags || [],
          // customFields: data.customFields || {}
        },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          },
          _count: {
            select: { interactions: true }
          }
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: data.tenantId,
        userId,
        action: 'create',
        entityType: 'crm_client',
        entityId: clientProfile.id,
        changes: { after: clientProfile }
      });

      // Notificação
      await this.notificationService.create({
        userId: data.professionalId,
        tenantId: data.tenantId,
          type: 'info',
        title: 'Novo Cliente no CRM',
        message: `Perfil criado para cliente ${clientProfile.id}`,
        data: { clientId: clientProfile.id }
      });

      return { success: true, clientProfile };
    } catch (error: any) {
      console.error('Erro ao criar perfil de cliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza perfil de cliente
   */
  async updateClientProfile(
    clientId: string,
    data: UpdateClientProfileData,
    userId: string
  ): Promise<{ success: boolean; clientProfile?: any; error?: string }> {
    try {
      const existingProfile = await this.prisma.clientProfile.findUnique({
        where: { id: clientId }
      });

      if (!existingProfile) {
        return { success: false, error: 'Perfil de cliente não encontrado' };
      }

      const clientProfile = await this.prisma.clientProfile.update({
        where: { id: clientId },
        data: {
          ...data,
          // lastContact: new Date()
        },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          },
          _count: {
            select: { interactions: true }
          }
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: existingProfile.tenantId,
        userId,
        action: 'update',
        entityType: 'crm_client',
        entityId: clientId,
        changes: { before: existingProfile, after: clientProfile }
      });

      return { success: true, clientProfile };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil de cliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista perfis de clientes
   */
  async getClientProfiles(filters: CRMFilters): Promise<{
    success: boolean;
    clients?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const where: any = {
        tenantId: filters.tenantId
      };

      if (filters.professionalId) {
        where.professionalId = filters.professionalId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.leadSource) {
        where.leadSource = filters.leadSource;
      }

      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags
        };
      }

      const [clients, total] = await Promise.all([
        this.prisma.clientProfile.findMany({
          where,
          include: {
            client: {
              select: { id: true, name: true, email: true, phone: true }
            },
            professional: {
              select: { id: true, name: true, email: true }
            },
            tenant: {
              select: { id: true, name: true }
            },
            _count: {
              select: { interactions: true }
            }
          },
          orderBy: { lastInteractionAt: 'desc' },
          take: filters.limit || 50,
          skip: filters.offset || 0
        }),
        this.prisma.clientProfile.count({ where })
      ]);

      return { success: true, clients, total };
    } catch (error: any) {
      console.error('Erro ao listar perfis de clientes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém perfil de cliente por ID
   */
  async getClientProfileById(clientId: string): Promise<{
    success: boolean;
    clientProfile?: any;
    error?: string;
  }> {
    try {
      const clientProfile = await this.prisma.clientProfile.findUnique({
        where: { id: clientId },
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          },
          interactions: {
            include: {
              professional: {
                select: { id: true, name: true, email: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          // tasks: {
          //   where: { status: 'pending' },
          //   orderBy: { dueDate: 'asc' }
          // },
          _count: {
            select: { interactions: true }
          }
        }
      });

      if (!clientProfile) {
        return { success: false, error: 'Perfil de cliente não encontrado' };
      }

      return { success: true, clientProfile };
    } catch (error: any) {
      console.error('Erro ao obter perfil de cliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria interação com cliente
   */
  async createInteraction(data: CreateInteractionData, userId: string): Promise<{
    success: boolean;
    interaction?: any;
    error?: string;
  }> {
    try {
      const interaction = await this.prisma.clientInteraction.create({
        data: {
          ...data,
          clientProfileId: data.clientId,
          // tags: data.tags || [],
          // attachments: data.attachments || []
        },
        include: {
          clientProfile: {
            include: {
              client: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Atualiza lastContact do cliente
      await this.prisma.clientProfile.update({
        where: { id: data.clientId },
        data: { lastInteractionAt: new Date() }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: data.tenantId,
        userId,
        action: 'create',
        entityType: 'crm_client',
        entityId: data.clientId,
        changes: { after: interaction }
      });

      return { success: true, interaction };
    } catch (error: any) {
      console.error('Erro ao criar interação:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Cria tarefa CRM
   */
  async createTask(data: CreateTaskData, userId: string): Promise<{
    success: boolean;
    task?: any;
    error?: string;
  }> {
    try {
      const task = await this.prisma.cRMTask.create({
        data: {
          ...data,
          priority: data.priority || 'normal'
        },
        include: {
          clientProfile: {
            include: {
              client: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: data.tenantId,
        userId,
        action: 'create',
        entityType: 'crm_client',
        entityId: data.clientId,
        changes: { after: task }
      });

      // Notificação - desabilitada temporariamente
      // await this.notificationService.createCRMTaskNotification(
      //   data.professionalId,
      //   task.name || 'Nova Tarefa',
      //   task.dueDate || new Date()
      // );

      return { success: true, task };
    } catch (error: any) {
      console.error('Erro ao criar tarefa CRM:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza tarefa CRM
   */
  async updateTask(
    taskId: string,
    data: {
      title?: string;
      description?: string;
      status?: 'pending' | 'completed' | 'cancelled';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      dueDate?: Date;
    },
    userId: string
  ): Promise<{ success: boolean; task?: any; error?: string }> {
    try {
      const existingTask = await this.prisma.cRMTask.findUnique({
        where: { id: taskId }
      });

      if (!existingTask) {
        return { success: false, error: 'Tarefa não encontrada' };
      }

      const updateData: any = { ...data };
      if (data.status === 'completed') {
        updateData.completedAt = new Date();
      }

      const task = await this.prisma.cRMTask.update({
        where: { id: taskId },
        data: updateData,
        include: {
          clientProfile: {
            include: {
              client: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          tenant: {
            select: { id: true, name: true }
          }
        }
      });

      // Log de auditoria
      await this.auditService.logAction({
        tenantId: existingTask.tenantId,
        userId,
        action: 'update',
        entityType: 'crm_client',
        entityId: existingTask.clientProfileId || existingTask.id,
        changes: { before: existingTask, after: task }
      });

      return { success: true, task };
    } catch (error: any) {
      console.error('Erro ao atualizar tarefa:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Lista tarefas CRM
   */
  async getTasks(
    tenantId: string,
    professionalId?: string,
    status?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    success: boolean;
    tasks?: any[];
    total?: number;
    error?: string;
  }> {
    try {
      const where: any = { tenantId };

      if (professionalId) {
        where.professionalId = professionalId;
      }

      if (status) {
        where.status = status;
      }

      const [tasks, total] = await Promise.all([
        this.prisma.cRMTask.findMany({
          where,
          include: {
            clientProfile: {
              include: {
                client: {
                  select: { id: true, name: true, email: true }
                }
              }
            },
            professional: {
              select: { id: true, name: true, email: true }
            },
            tenant: {
              select: { id: true, name: true }
            }
          },
          orderBy: { dueDate: 'asc' },
          take: limit,
          skip: offset
        }),
        this.prisma.cRMTask.count({ where })
      ]);

      return { success: true, tasks, total };
    } catch (error: any) {
      console.error('Erro ao listar tarefas CRM:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém pipeline de clientes (Kanban)
   */
  async getClientPipeline(tenantId: string, professionalId?: string): Promise<{
    success: boolean;
    pipeline?: any;
    error?: string;
  }> {
    try {
      const where: any = { tenantId };
      if (professionalId) {
        where.professionalId = professionalId;
      }

      const clients = await this.prisma.clientProfile.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true, email: true, phone: true }
          },
          professional: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { interactions: true }
          }
        },
          orderBy: { lastInteractionAt: 'desc' }
      });

      // Agrupa por status
      const pipeline = {
        prospect: clients.filter(c => c.status === 'prospect'),
        active: clients.filter(c => c.status === 'active'),
        at_risk: clients.filter(c => c.status === 'at_risk'),
        inactive: clients.filter(c => c.status === 'inactive'),
        churned: clients.filter(c => c.status === 'churned')
      };

      return { success: true, pipeline };
    } catch (error: any) {
      console.error('Erro ao obter pipeline de clientes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém estatísticas do CRM
   */
  async getCRMStats(tenantId: string, professionalId?: string): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const where: any = { tenantId };
      if (professionalId) {
        where.professionalId = professionalId;
      }

      const [
        totalClients,
        byStatus,
        byLeadSource,
        totalInteractions,
        totalTasks,
        pendingTasks,
        overdueTasks
      ] = await Promise.all([
        this.prisma.clientProfile.count({ where }),
        this.prisma.clientProfile.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),
        this.prisma.clientProfile.groupBy({
          by: ['status'],
          where,
          _count: { status: true }
        }),
        this.prisma.clientInteraction.count({ where }),
        this.prisma.cRMTask.count({ where }),
        this.prisma.cRMTask.count({
          where: { ...where, status: 'pending' }
        }),
        this.prisma.cRMTask.count({
          where: {
            ...where,
            status: 'pending',
            dueDate: { lt: new Date() }
          }
        })
      ]);

      const stats = {
        totalClients,
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {} as any),
        byLeadSource: byLeadSource.reduce((acc, item) => {
          acc[item.status || 'unknown'] = item._count.status;
          return acc;
        }, {} as any),
        totalInteractions,
        totalTasks,
        pendingTasks,
        overdueTasks,
        conversionRate: totalClients > 0 ? 
          ((byStatus.find(s => s.status === 'active')?._count.status || 0) / totalClients) * 100 : 0
      };

      return { success: true, stats };
    } catch (error: any) {
      console.error('Erro ao obter estatísticas do CRM:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtém insights de cliente
   */
  async getClientInsights(clientId: string): Promise<{
    success: boolean;
    insights?: any;
    error?: string;
  }> {
    try {
      const [client, interactions, tasks] = await Promise.all([
        this.prisma.clientProfile.findUnique({
          where: { id: clientId },
          include: {
            client: {
              select: { id: true, name: true, email: true }
            }
          }
        }),
        this.prisma.clientInteraction.findMany({
          where: { clientProfileId: clientId },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        this.prisma.cRMTask.findMany({
          where: { clientProfileId: clientId },
          orderBy: { dueDate: 'asc' }
        })
      ]);

      if (!client) {
        return { success: false, error: 'Cliente não encontrado' };
      }

      const insights = {
        client,
        recentInteractions: interactions,
        upcomingTasks: tasks.filter(t => t.status === 'pending'),
        overdueTasks: tasks.filter(t => t.status === 'pending' && t.dueDate && t.dueDate < new Date()),
        interactionFrequency: this.calculateInteractionFrequency(interactions),
        taskCompletionRate: tasks.length > 0 ? 
          (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
        daysSinceLastContact: Math.floor(
          (new Date().getTime() - (client.lastInteractionAt?.getTime() || new Date().getTime())) / (1000 * 60 * 60 * 24)
        )
      };

      return { success: true, insights };
    } catch (error: any) {
      console.error('Erro ao obter insights do cliente:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calcula frequência de interações
   */
  private calculateInteractionFrequency(interactions: any[]): number {
    if (interactions.length < 2) return 0;

    const sortedInteractions = interactions.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const timeDiff = new Date(sortedInteractions[sortedInteractions.length - 1].createdAt).getTime() - 
                    new Date(sortedInteractions[0].createdAt).getTime();
    
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    
    return daysDiff > 0 ? interactions.length / daysDiff : 0;
  }
}

export default new ProfessionalCRMService();
