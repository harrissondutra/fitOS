import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';

export class CRMAutomationService {
  private prisma: PrismaClient;
  private cronJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeCronJobs();
  }

  private initializeCronJobs() {
    // Verificar tarefas vencidas a cada hora
    this.scheduleCronJob('check-overdue-tasks', '0 * * * *', async () => {
      await this.checkOverdueTasks();
    });

    // Verificar follow-ups pendentes a cada 6 horas
    this.scheduleCronJob('check-pending-followups', '0 */6 * * *', async () => {
      await this.checkPendingFollowUps();
    });

    // Verificar campanhas ativas a cada dia às 9h
    this.scheduleCronJob('process-active-campaigns', '0 9 * * *', async () => {
      await this.processActiveCampaigns();
    });

    // Verificar clientes em risco a cada 2 dias
    this.scheduleCronJob('check-at-risk-clients', '0 10 */2 * *', async () => {
      await this.checkAtRiskClients();
    });
  }

  private scheduleCronJob(name: string, cronExpression: string, task: () => Promise<void>) {
    const job = cron.schedule(cronExpression, async () => {
      try {
        console.log(`Executando job: ${name}`);
        await task();
      } catch (error) {
        console.error(`Erro no job ${name}:`, error);
      }
    });

    job.start();
    this.cronJobs.set(name, job);
  }

  // Verificar tarefas vencidas
  private async checkOverdueTasks() {
    try {
      const overdueTasks = await this.prisma.cRMTask.findMany({
        where: {
          status: 'pending',
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          clientProfile: {
            include: {
              client: true
            }
          }
        }
      });

      console.log(`Verificadas ${overdueTasks.length} tarefas vencidas`);
    } catch (error) {
      console.error('Erro ao verificar tarefas vencidas:', error);
    }
  }

  // Verificar follow-ups pendentes
  private async checkPendingFollowUps() {
    try {
      const pendingFollowUps = await this.prisma.cRMTask.findMany({
        where: {
          status: 'pending',
          type: 'follow_up',
          dueDate: {
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Próximas 24h
          }
        },
        include: {
          clientProfile: {
            include: {
              client: true
            }
          }
        }
      });

      console.log(`Verificados ${pendingFollowUps.length} follow-ups pendentes`);
    } catch (error) {
      console.error('Erro ao verificar follow-ups pendentes:', error);
    }
  }

  // Processar campanhas ativas
  private async processActiveCampaigns() {
    try {
      const activeCampaigns = await this.prisma.campaign.findMany({
        where: {
          status: 'active',
          startedAt: {
            lte: new Date()
          },
          completedAt: {
            gte: new Date()
          }
        },
        include: {
          tenant: true
        }
      });

      for (const campaign of activeCampaigns) {
        await this.processCampaign(campaign);
      }

      console.log(`Processadas ${activeCampaigns.length} campanhas ativas`);
    } catch (error) {
      console.error('Erro ao processar campanhas ativas:', error);
    }
  }

  // Processar uma campanha específica
  private async processCampaign(campaign: any) {
    try {
      // Buscar clientes que atendem aos critérios da campanha
      const targetClients = await this.getTargetClientsForCampaign(campaign);

      for (const client of targetClients) {
        // Verificar se já foi enviada mensagem para este cliente nesta campanha
        const existingInteraction = await this.prisma.clientInteraction.findFirst({
          where: {
            clientProfileId: client.id,
            type: 'campaign_message',
            // data: {
            //   path: ['campaignId'],
            //   equals: campaign.id
            // }
          }
        });

        if (!existingInteraction) {
          // Criar interação da campanha
          await this.prisma.clientInteraction.create({
            data: {
              clientProfileId: client.id,
              tenantId: campaign.tenantId,
              professionalId: campaign.tenantId, // Usando tenantId como fallback
              type: 'campaign_message',
              subject: `Mensagem da campanha: ${campaign.name}`,
              description: `Mensagem da campanha: ${campaign.name}`,
              // data: {
              //   campaignId: campaign.id,
              //   message: campaign.message,
              //   sentAt: new Date()
              // }
            }
          });
        }
      }

      console.log(`Campanha ${campaign.name} processada para ${targetClients.length} clientes`);
    } catch (error) {
      console.error(`Erro ao processar campanha ${campaign.id}:`, error);
    }
  }

  // Buscar clientes alvo para uma campanha
  private async getTargetClientsForCampaign(campaign: any) {
    const criteria = campaign.targetCriteria || {};

    const whereClause: any = {
      tenantId: campaign.tenantId
    };

    // Filtrar por status
    if (criteria.status) {
      whereClause.status = criteria.status;
    }

    // Filtrar por tags
    if (criteria.tags && criteria.tags.length > 0) {
      whereClause.tags = {
        hasSome: criteria.tags
      };
    }

    // Filtrar por valor de vida
    if (criteria.minLifetimeValue) {
      whereClause.lifetimeValue = {
        gte: criteria.minLifetimeValue
      };
    }

    // Filtrar por data de aquisição
    if (criteria.acquisitionDateFrom) {
      whereClause.acquisitionDate = {
        gte: new Date(criteria.acquisitionDateFrom)
      };
    }

    if (criteria.acquisitionDateTo) {
      whereClause.acquisitionDate = {
        ...whereClause.acquisitionDate,
        lte: new Date(criteria.acquisitionDateTo)
      };
    }

    return await this.prisma.clientProfile.findMany({
      where: whereClause,
      include: {
        client: true
      }
    });
  }

  // Verificar clientes em risco
  private async checkAtRiskClients() {
    try {
      const atRiskClients = await this.prisma.clientProfile.findMany({
        where: {
          status: 'at_risk',
          lastInteractionAt: {
            lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Mais de 7 dias sem contato
          }
        },
        include: {
          client: true
        }
      });

      for (const client of atRiskClients) {
        // Criar tarefa de follow-up urgente
        await this.prisma.cRMTask.create({
          data: {
            clientProfileId: client.id,
            tenantId: client.tenantId,
            professionalId: client.professionalId,
            title: `Follow-up Urgente - Cliente ${client.id}`,
            description: `Cliente em risco há mais de 7 dias sem contato. Ação imediata necessária.`,
            type: 'follow_up',
            priority: 'urgent',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Próximas 24h
          }
        });
      }

      console.log(`Verificados ${atRiskClients.length} clientes em risco`);
    } catch (error) {
      console.error('Erro ao verificar clientes em risco:', error);
    }
  }

  // Criar campanha automatizada
  async createAutomatedCampaign(data: {
    tenantId: string;
    name: string;
    description?: string;
    message: string;
    targetCriteria: any;
    startDate: Date;
    endDate: Date;
    frequency: 'daily' | 'weekly' | 'monthly';
  }) {
    try {
      const campaign = await this.prisma.campaign.create({
        data: {
          tenantId: data.tenantId,
          professionalId: data.tenantId, // Usando tenantId como fallback
          name: data.name,
          description: data.description,
          content: data.message,
          // targetCriteria: data.targetCriteria,
          startedAt: data.startDate,
          completedAt: data.endDate,
          status: 'active',
          type: 'automated',
          // frequency: data.frequency
        }
      });

      return campaign;
    } catch (error) {
      console.error('Erro ao criar campanha automatizada:', error);
      throw error;
    }
  }

  // Pausar campanha
  async pauseCampaign(campaignId: string, tenantId: string) {
    try {
      const campaign = await this.prisma.campaign.update({
        where: {
          id: campaignId,
          tenantId: tenantId
        },
        data: {
          status: 'paused'
        }
      });

      return campaign;
    } catch (error) {
      console.error('Erro ao pausar campanha:', error);
      throw error;
    }
  }

  // Obter estatísticas de campanhas
  async getCampaignStats(tenantId: string, campaignId?: string) {
    try {
      const whereClause: any = { tenantId };
      if (campaignId) {
        whereClause.id = campaignId;
      }

      const campaigns = await this.prisma.campaign.findMany({
        where: whereClause,
        include: {
          // _count: {
          //   select: {
          //     interactions: true
          //   }
          // }
        }
      });

      const stats = {
        total: campaigns.length,
        active: campaigns.filter(c => c.status === 'active').length,
        paused: campaigns.filter(c => c.status === 'paused').length,
        completed: campaigns.filter(c => c.status === 'completed').length,
        totalInteractions: campaigns.length
      };

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas de campanhas:', error);
      throw error;
    }
  }

  // Parar todos os jobs
  stopAllJobs() {
    this.cronJobs.forEach((job, name) => {
      job.stop();
      console.log(`Job ${name} parado`);
    });
    this.cronJobs.clear();
  }

  // Reiniciar jobs
  restartJobs() {
    this.stopAllJobs();
    this.initializeCronJobs();
  }
}