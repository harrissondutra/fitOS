import { PrismaClient } from '@prisma/client';
import { seedPlanConfigs } from './plan-configs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Seed tenants first (required for users)
    console.log('🏢 Seeding tenants...');
    const tenantsSeed = await import('./tenants.seed');
    await tenantsSeed.main();

    // Seed plan configurations
    await seedPlanConfigs();

    // Seed AI providers (run first)
    console.log('🤖 Seeding AI providers...');
    const aiProvidersSeed = await import('./ai-providers.seed');
    await aiProvidersSeed.main();

    // Seed AI service configs (run after providers)
    console.log('⚙️ Seeding AI service configs...');
    const aiServiceConfigsSeed = await import('./ai-service-configs.seed');
    await aiServiceConfigsSeed.main();

    console.log('✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
