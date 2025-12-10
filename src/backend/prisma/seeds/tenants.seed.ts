import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Starting Tenants seed...');

  // Verificar se já existe um tenant padrão
  const existingTenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { id: 'default-tenant' },
        { subdomain: 'default' }
      ]
    }
  });

  if (existingTenant) {
    console.log('✅ Default tenant already exists, skipping seed');
    return;
  }

  console.log('📝 Creating default tenant...');

  // Criar tenant padrão
  const defaultTenant = await prisma.tenant.create({
    data: {
      id: 'default-tenant',
      name: 'FitOS Default',
      subdomain: 'default',
      status: 'active',
      billingEmail: 'admin@fitos.com',
      plan: 'free',
      settings: {
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        features: {
          aiEnabled: true,
          analyticsEnabled: true,
          notificationsEnabled: true
        }
      }
    }
  });

  console.log(`✅ Created default tenant: ${defaultTenant.name} (ID: ${defaultTenant.id})`);
  console.log('🎉 Tenants seed completed successfully!');
}

export { main };

main()
  .catch((e) => {
    console.error('❌ Error during Tenants seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
