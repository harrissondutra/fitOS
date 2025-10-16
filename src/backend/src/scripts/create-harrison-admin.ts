import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from project root
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const prisma = new PrismaClient();

async function createHarrisonAdmin() {
  try {
    console.log('🚀 Criando usuário admin Harrison Dutra...');

    // Verificar se já existe um tenant padrão
    let defaultTenant = await prisma.tenant.findFirst({
      where: { subdomain: 'default' }
    });

    if (!defaultTenant) {
      console.log('📝 Criando tenant padrão...');
      defaultTenant = await prisma.tenant.create({
        data: {
          name: 'FitOS Default',
          subdomain: 'default',
          plan: 'premium',
          status: 'active',
          billingEmail: 'harrissondutra@gmail.com',
          settings: {}
        }
      });
      console.log('✅ Tenant padrão criado:', defaultTenant.id);
    }

    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'harrissondutra@gmail.com',
        tenantId: defaultTenant.id
      }
    });

    if (existingUser) {
      console.log('⚠️  Usuário admin já existe!');
      console.log('📧 Email:', existingUser.email);
      console.log('👤 Nome:', `${existingUser.firstName} ${existingUser.lastName}`);
      console.log('🔑 Role:', existingUser.role);
      console.log('🆔 User ID:', existingUser.id);
      return;
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 12);

    // Criar usuário admin
    const adminUser = await prisma.user.create({
      data: {
        tenantId: defaultTenant.id,
        email: 'harrissondutra@gmail.com',
        password: hashedPassword,
        firstName: 'Harrison',
        lastName: 'Dutra',
        role: 'ADMIN',
        status: 'ACTIVE',
        profile: {
          bio: 'Administrador do sistema FitOS',
          avatar: null,
          preferences: {
            theme: 'light',
            language: 'pt-BR',
            notifications: true
          }
        }
      }
    });

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Nome:', `${adminUser.firstName} ${adminUser.lastName}`);
    console.log('🔑 Role:', adminUser.role);
    console.log('🏢 Tenant:', defaultTenant.name);
    console.log('🆔 User ID:', adminUser.id);

    // Criar também um registro de membro para o admin
    const adminMember = await prisma.member.create({
      data: {
        tenantId: defaultTenant.id,
        userId: adminUser.id,
        name: `${adminUser.firstName} ${adminUser.lastName}`,
        email: adminUser.email,
        membershipType: 'admin',
        status: 'active',
        biometricData: {},
        goals: {
          role: 'admin',
          permissions: ['all']
        }
      }
    });

    console.log('✅ Membro admin criado:', adminMember.id);
    console.log('');
    console.log('🎉 Usuário admin criado com sucesso!');
    console.log('📋 Credenciais:');
    console.log('   Email: harrissondutra@gmail.com');
    console.log('   Senha: 123456');
    console.log('   Role: ADMIN');
    console.log('   Tenant: FitOS Default');

  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
createHarrisonAdmin()
  .then(() => {
    console.log('🎉 Script executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });
