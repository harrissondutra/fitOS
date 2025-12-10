import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedPlanConfigs() {
  console.log('🌱 Seeding plan configurations...');

  try {
    // Verificar se já existem planos base
    const existingPlans = await prisma.planConfig.count({
      where: { isCustom: false }
    });

    if (existingPlans > 0) {
      console.log('✅ Plan configurations already seeded');
      return;
    }

    // Criar planos base
    await prisma.planConfig.createMany({
      data: [
        // Plano para Pessoa Física (Gratuito)
        {
          plan: 'individual',
          displayName: 'Pessoa Física',
          tenantType: 'individual',
          isCustom: false,
          limits: { 
            owner: 1,
            admin: 0,
            trainer: 0,
            client: 0
          },
          price: 0.00,
          extraSlotPrice: {},
          features: {
            aiAgents: false,
            wearables: false,
            computerVision: false,
            marketplace: false,
            whiteLabel: false,
            advancedAnalytics: false,
            apiAccess: false
          },
          isActive: true
        },
        // Plano Starter para Profissionais
        {
          plan: 'starter',
          displayName: 'Starter',
          tenantType: 'business',
          isCustom: false,
          limits: { 
            owner: 1, 
            admin: 1, 
            trainer: 2, 
            client: 50 
          },
          price: 99.00,
          extraSlotPrice: { 
            trainer: 50, 
            admin: 30 
          },
          features: {
            aiAgents: true,
            wearables: false,
            computerVision: false,
            marketplace: false,
            whiteLabel: false,
            advancedAnalytics: false,
            apiAccess: false
          },
          isActive: true
        },
        // Plano Professional para Profissionais
        {
          plan: 'professional',
          displayName: 'Professional',
          tenantType: 'business',
          isCustom: false,
          limits: { 
            owner: 1, 
            admin: 2, 
            trainer: 5, 
            client: 200 
          },
          price: 299.00,
          extraSlotPrice: { 
            trainer: 45, 
            admin: 25 
          },
          features: {
            aiAgents: true,
            wearables: true,
            computerVision: false,
            marketplace: true,
            whiteLabel: false,
            advancedAnalytics: true,
            apiAccess: false
          },
          isActive: true
        },
        // Plano Enterprise para Profissionais
        {
          plan: 'enterprise',
          displayName: 'Enterprise',
          tenantType: 'business',
          isCustom: false,
          limits: { 
            owner: 1, 
            admin: -1, 
            trainer: -1, 
            client: -1 
          },
          price: 599.00,
          extraSlotPrice: {},
          features: {
            aiAgents: true,
            wearables: true,
            computerVision: true,
            marketplace: true,
            whiteLabel: true,
            advancedAnalytics: true,
            apiAccess: true
          },
          isActive: true
        }
      ]
    });

    console.log('✅ Plan configurations seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding plan configurations:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seedPlanConfigs()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
