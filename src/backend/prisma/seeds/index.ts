import { PrismaClient } from '@prisma/client';
import { seedPlanConfigs } from './plan-configs';
import { seedSidebarConfigs } from './sidebar-default-configs.seed';
import { main as aiServiceConfigsSeed } from './ai-service-configs.seed';
import { main as superuserSeed } from './superuser.seed';

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

    // Seed sidebar configurations
    console.log('🎨 Seeding sidebar configurations...');
    await seedSidebarConfigs();

    // Seed AI providers (run first)
    console.log('🤖 Seeding AI providers...');
    const aiProvidersSeed = await import('./ai-providers.seed');
    await aiProvidersSeed.main();

    // Seed AI service configs (run after providers)
    console.log('⚙️ Seeding AI service configs...');
    await aiServiceConfigsSeed();
    // Seed superuser after all other seeds
    console.log('👑 Seeding superuser...');
    await superuserSeed();
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
