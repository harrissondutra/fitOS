import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando usuário admin...');
    
    const user = await prisma.user.findFirst({
      where: { email: 'harrissondutra@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        tenantId: true
      }
    });
    
    if (user) {
      console.log('✅ Usuário admin encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nome: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Tenant ID: ${user.tenantId}`);
      console.log(`   Criado em: ${user.createdAt}`);
    } else {
      console.log('❌ Usuário admin não encontrado');
    }
    
    // Verificar tenant
    const tenant = await prisma.tenant.findFirst({
      where: { id: user?.tenantId }
    });
    
    if (tenant) {
      console.log('\n🏢 Tenant encontrado:');
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Nome: ${tenant.name}`);
      console.log(`   Subdomain: ${tenant.subdomain}`);
      console.log(`   Plan: ${tenant.plan}`);
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
checkAdminUser()
  .then(() => {
    console.log('🎉 Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });






