/**
 * Plans Configuration
 * 
 * Configuração centralizada dos planos de assinatura:
 * - Definição de planos (Starter, Professional, Enterprise)
 * - Limites por plano
 * - Preços e features
 * - Cache Redis para otimização
 */

import Redis from 'ioredis';

export interface PlanLimits {
  users: number;           // -1 = ilimitado
  clients: number;         // -1 = ilimitado
  storage: number;         // GB, -1 = ilimitado
  apiCalls: number;        // por mês, -1 = ilimitado
  integrations: number;   // número de integrações simultâneas
  reports: number;         // relatórios por mês, -1 = ilimitado
  support: 'email' | 'priority' | '24x7';
  customDomain: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  webhooks: number;        // webhooks simultâneos
  backups: number;         // backups automáticos por mês
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  currency: string;
  features: string[];
  limits: PlanLimits;
  popular?: boolean;
  recommended?: boolean;
  adsEnabled?: boolean; // Planos Free, Starter e Professional têm anúncios. Enterprise e Custom não.
  stripePriceId?: {
    monthly: string;
    yearly: string;
  };
  mercadoPagoPreferenceId?: string;
}

export class PlansConfig {
  private redis: Redis;
  private plans: SubscriptionPlan[];

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    this.plans = this.initializePlans();
  }

  /**
   * Inicializar planos
   */
  private initializePlans(): SubscriptionPlan[] {
    return [
      {
        id: 'individual',
        name: 'Individual',
        description: 'Plano gratuito para pessoas físicas que querem acompanhar seu próprio progresso',
        price: {
          monthly: 0.00,
          yearly: 0.00
        },
        currency: 'BRL',
        features: [
          'Acompanhamento pessoal de treinos',
          'Registro de medições corporais',
          'Plano alimentar básico',
          'Relatórios de progresso',
          'App mobile incluído',
          'Backup básico'
        ],
        limits: {
          users: 1,
          clients: 0,
          storage: 1,
          apiCalls: 100,
          integrations: 0,
          reports: 3,
          support: 'email',
          customDomain: false,
          whiteLabel: false,
          apiAccess: false,
          webhooks: 0,
          backups: 7
        },
        adsEnabled: true, // Individual (Free) tem anúncios
        stripePriceId: {
          monthly: 'price_free',
          yearly: 'price_free'
        }
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'Perfeito para academias pequenas e personal trainers',
        price: {
          monthly: 99.90,
          yearly: 799.20 // 20% desconto anual
        },
        currency: 'BRL',
        features: [
          'Até 50 clientes',
          '5 usuários simultâneos',
          '10GB de armazenamento',
          'Relatórios básicos',
          'Suporte por email',
          'Integração WhatsApp básica',
          'App mobile incluído',
          'Backup diário'
        ],
        limits: {
          users: 5,
          clients: 50,
          storage: 10,
          apiCalls: 1000,
          integrations: 3,
          reports: 10,
          support: 'email',
          customDomain: false,
          whiteLabel: false,
          apiAccess: false,
          webhooks: 5,
          backups: 30
        },
        adsEnabled: true, // Starter tem anúncios
        stripePriceId: {
          monthly: 'price_1SfS7B0aTWFI2uJk0N6BzbHg',
          yearly: 'price_1SfS7B0aTWFI2uJkkxjbTdzb'
        }
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Ideal para academias em crescimento e profissionais estabelecidos',
        price: {
          monthly: 199.90,
          yearly: 1599.20 // 20% desconto anual
        },
        currency: 'BRL',
        features: [
          'Até 200 clientes',
          '15 usuários simultâneos',
          '50GB de armazenamento',
          'Relatórios avançados',
          'Suporte prioritário',
          'Integração WhatsApp completa',
          'CRM básico incluído',
          'Integração com wearables',
          'App mobile + web',
          'Backup em tempo real',
          'API básica'
        ],
        limits: {
          users: 15,
          clients: 200,
          storage: 50,
          apiCalls: 5000,
          integrations: 8,
          reports: 50,
          support: 'priority',
          customDomain: true,
          whiteLabel: false,
          apiAccess: true,
          webhooks: 15,
          backups: 90
        },
        popular: true,
        recommended: true,
        adsEnabled: true, // Professional tem anúncios
        stripePriceId: {
          monthly: 'price_1SfS7C0aTWFI2uJkpcJzmABE',
          yearly: 'price_1SfS7C0aTWFI2uJklGdLCSit'
        }
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Solução completa para grandes academias e redes',
        price: {
          monthly: 399.90,
          yearly: 3199.20 // 20% desconto anual
        },
        currency: 'BRL',
        features: [
          'Clientes ilimitados',
          'Usuários ilimitados',
          '200GB de armazenamento',
          'Relatórios personalizados',
          'Suporte 24/7',
          'CRM avançado',
          'Integração completa',
          'API personalizada',
          'White label disponível',
          'Domínio personalizado',
          'Backup ilimitado',
          'Webhooks ilimitados',
          'Integração com ERPs',
          'Treinamento personalizado'
        ],
        limits: {
          users: -1, // ilimitado
          clients: -1, // ilimitado
          storage: 200,
          apiCalls: -1, // ilimitado
          integrations: -1, // ilimitado
          reports: -1, // ilimitado
          support: '24x7',
          customDomain: true,
          whiteLabel: true,
          apiAccess: true,
          webhooks: -1, // ilimitado
          backups: -1 // ilimitado
        },
        adsEnabled: false, // Enterprise não tem anúncios
        stripePriceId: {
          monthly: 'price_1SfS7D0aTWFI2uJkaVHSmL9K',
          yearly: 'price_1SfS7E0aTWFI2uJkfQMHjTsx'
        }
      }
    ];
  }

  /**
   * Obter todos os planos (com cache Redis)
   */
  async getAllPlans(): Promise<SubscriptionPlan[]> {
    const cacheKey = 'billing:plans:all';

    try {
      // Tentar buscar do cache primeiro
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      console.warn('Erro ao buscar planos do cache Redis:', error);
    }

    // Cache por 1 hora
    try {
      await this.redis.setex(cacheKey, 3600, JSON.stringify(this.plans));
    } catch (error) {
      console.warn('Erro ao cachear planos no Redis:', error);
    }

    return this.plans;
  }

  /**
   * Obter plano específico
   */
  async getPlanById(planId: string): Promise<SubscriptionPlan | null> {
    const plans = await this.getAllPlans();
    return plans.find(plan => plan.id === planId) || null;
  }

  /**
   * Obter plano recomendado
   */
  async getRecommendedPlan(): Promise<SubscriptionPlan | null> {
    const plans = await this.getAllPlans();
    return plans.find(plan => plan.recommended) || null;
  }

  /**
   * Obter plano mais popular
   */
  async getPopularPlan(): Promise<SubscriptionPlan | null> {
    const plans = await this.getAllPlans();
    return plans.find(plan => plan.popular) || null;
  }

  /**
   * Calcular preço com desconto anual
   */
  calculateYearlyPrice(monthlyPrice: number, discountPercentage = 0.2): number {
    const yearlyPrice = monthlyPrice * 12;
    const discount = yearlyPrice * discountPercentage;
    return yearlyPrice - discount;
  }

  /**
   * Verificar se plano suporta feature específica
   */
  async planSupportsFeature(planId: string, feature: keyof PlanLimits): Promise<boolean> {
    const plan = await this.getPlanById(planId);
    if (!plan) return false;

    const limit = plan.limits[feature];

    if (typeof limit === 'boolean') {
      return limit;
    }

    if (typeof limit === 'number') {
      return limit > 0 || limit === -1; // -1 = ilimitado
    }

    return false;
  }

  /**
   * Verificar limite específico do plano
   */
  async getPlanLimit(planId: string, limit: keyof PlanLimits): Promise<number | boolean> {
    const plan = await this.getPlanById(planId);
    if (!plan) return 0;

    const limitValue = plan.limits[limit];

    // Se for 'support', retornar como boolean (true se não for 'email')
    if (typeof limitValue === 'string' && (limitValue === 'email' || limitValue === 'priority' || limitValue === '24x7')) {
      return limitValue !== 'email';
    }

    // Caso contrário, retornar como number ou boolean
    return limitValue as number | boolean;
  }

  /**
   * Comparar planos
   */
  async comparePlans(planIds: string[]): Promise<{
    plans: SubscriptionPlan[];
    comparison: {
      feature: string;
      values: Record<string, any>;
    }[];
  }> {
    const plans = await this.getAllPlans();
    const selectedPlans = plans.filter(plan => planIds.includes(plan.id));

    const comparison = [
      {
        feature: 'Preço Mensal',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = `R$ ${plan.price.monthly.toFixed(2)}`;
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'Preço Anual',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = `R$ ${plan.price.yearly.toFixed(2)}`;
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'Usuários',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = plan.limits.users === -1 ? 'Ilimitado' : plan.limits.users;
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'Clientes',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = plan.limits.clients === -1 ? 'Ilimitado' : plan.limits.clients;
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'Armazenamento',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = `${plan.limits.storage}GB`;
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'Suporte',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = plan.limits.support;
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'Domínio Personalizado',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = plan.limits.customDomain ? 'Sim' : 'Não';
          return acc;
        }, {} as Record<string, any>)
      },
      {
        feature: 'API Access',
        values: selectedPlans.reduce((acc, plan) => {
          acc[plan.id] = plan.limits.apiAccess ? 'Sim' : 'Não';
          return acc;
        }, {} as Record<string, any>)
      }
    ];

    return {
      plans: selectedPlans,
      comparison
    };
  }

  /**
   * Sugerir plano baseado no número de clientes
   */
  async suggestPlanByClientCount(clientCount: number): Promise<SubscriptionPlan | null> {
    const plans = await this.getAllPlans();

    // Ordenar planos por limite de clientes
    const sortedPlans = plans.sort((a, b) => {
      const aLimit = a.limits.clients === -1 ? Infinity : a.limits.clients;
      const bLimit = b.limits.clients === -1 ? Infinity : b.limits.clients;
      return aLimit - bLimit;
    });

    // Encontrar o primeiro plano que suporta o número de clientes
    for (const plan of sortedPlans) {
      if (plan.limits.clients === -1 || plan.limits.clients >= clientCount) {
        return plan;
      }
    }

    // Se nenhum plano suporta, retornar o Enterprise
    return plans.find(plan => plan.id === 'enterprise') || null;
  }

  /**
   * Calcular economia anual
   */
  calculateAnnualSavings(monthlyPrice: number, yearlyPrice: number): {
    amount: number;
    percentage: number;
  } {
    const monthlyTotal = monthlyPrice * 12;
    const savings = monthlyTotal - yearlyPrice;
    const percentage = (savings / monthlyTotal) * 100;

    return {
      amount: savings,
      percentage: Math.round(percentage)
    };
  }

  /**
   * Invalidar cache de planos
   */
  async invalidatePlansCache(): Promise<void> {
    try {
      await this.redis.del('billing:plans:all');
      console.log('Cache de planos invalidado');
    } catch (error) {
      console.warn('Erro ao invalidar cache de planos:', error);
    }
  }

  /**
   * Atualizar plano (para uso administrativo)
   */
  async updatePlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> {
    const planIndex = this.plans.findIndex(plan => plan.id === planId);

    if (planIndex === -1) {
      return null;
    }

    this.plans[planIndex] = {
      ...this.plans[planIndex],
      ...updates
    };

    // Invalidar cache
    await this.invalidatePlansCache();

    return this.plans[planIndex];
  }

  /**
   * Obter estatísticas de uso por plano
   */
  async getPlanUsageStats(): Promise<Record<string, {
    activeSubscriptions: number;
    totalRevenue: number;
    averageClientCount: number;
  }>> {
    // Esta função seria implementada com dados reais do banco
    // Por enquanto, retornar dados mockados
    return {
      starter: {
        activeSubscriptions: 150,
        totalRevenue: 14985.00,
        averageClientCount: 25
      },
      professional: {
        activeSubscriptions: 75,
        totalRevenue: 14992.50,
        averageClientCount: 120
      },
      enterprise: {
        activeSubscriptions: 25,
        totalRevenue: 9997.50,
        averageClientCount: 500
      }
    };
  }
}

