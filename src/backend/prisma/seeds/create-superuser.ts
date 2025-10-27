import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Cria o superusuario e a tenant "sistema"
 * Superuser: harrissondutra@gmail.com
 * Senha: Admin@1234
 * Role: SUPER_ADMIN
 * Tenant: sistema (tenant especial que administra todo o sistema)
 */
export async function createSuperUser() {
  try {
    console.log('🚀 Criando Superuser e Tenant Sistema...');

    // 1. Criar ou obter tenant "sistema"
    let sistemaTenant = await prisma.tenant.findFirst({
      where: { subdomain: 'sistema' }
    });

    if (!sistemaTenant) {
      console.log('📝 Criando tenant "sistema"...');
      sistemaTenant = await prisma.tenant.create({
        data: {
          name: 'Sistema',
          subdomain: 'sistema',
          plan: 'unlimited',
          status: 'active',
          billingEmail: 'harrissondutra@gmail.com',
          planLimits: {
            users: -1,        // Ilimitado
            clients: -1,      // Ilimitado
            workouts: -1,    // Ilimitado
            storage: -1,     // Ilimitado
            aiRequests: -1   // Ilimitado
          },
          enabledFeatures: {
            all: true  // Todos os recursos habilitados
          },
          settings: {
            superAdmin: true,
            bypassRateLimit: true,
            accessAllTenants: true
          }
        }
      });
      console.log('✅ Tenant "sistema" criado:', sistemaTenant.id);
    } else {
      console.log('✅ Tenant "sistema" já existe:', sistemaTenant.id);
    }

    // 2. Verificar se o superuser já existe
    const existingSuperUser = await prisma.user.findFirst({
      where: {
        email: 'harrissondutra@gmail.com'
      }
    });

    if (existingSuperUser) {
      console.log('⚠️  Superuser já existe!');
      console.log('📧 Email:', existingSuperUser.email);
      console.log('👤 Nome:', `${existingSuperUser.firstName} ${existingSuperUser.lastName}`);
      console.log('🔑 Role:', existingSuperUser.role);
      console.log('🏢 Tenant:', existingSuperUser.tenantId);
      
      // Atualizar para garantir que é SUPER_ADMIN e está na tenant sistema
      if (existingSuperUser.role !== 'SUPER_ADMIN' || existingSuperUser.tenantId !== sistemaTenant.id) {
        console.log('🔄 Atualizando usuário para SUPER_ADMIN na tenant sistema...');
        await prisma.user.update({
          where: { id: existingSuperUser.id },
          data: {
            role: 'SUPER_ADMIN',
            tenantId: sistemaTenant.id,
            status: 'ACTIVE'
          }
        });
        console.log('✅ Usuário atualizado para SUPER_ADMIN');
      }
      return;
    }

    // 3. Criar superuser
    console.log('👤 Criando superuser...');
    const hashedPassword = await bcrypt.hash('Admin@1234', 12);

    const superUser = await prisma.user.create({
      data: {
        tenantId: sistemaTenant.id,
        email: 'harrissondutra@gmail.com',
        password: hashedPassword,
        firstName: 'Harrisson',
        lastName: 'Dutra',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        emailVerified: true,
        profile: {
          bio: 'Super Administrador do sistema FitOS',
          avatar: null,
          preferences: {
            theme: 'light',
            language: 'pt-BR',
            notifications: true,
            superAdmin: true
          }
        }
      }
    });

    console.log('✅ Superuser criado com sucesso!');
    console.log('📧 Email:', superUser.email);
    console.log('🔑 Role:', superUser.role);
    console.log('🏢 Tenant:', sistemaTenant.name);
    console.log('🆔 User ID:', superUser.id);
    console.log('🎯 Este usuário tem acesso total sem restrições ou rate limit');

  } catch (error) {
    console.error('❌ Erro ao criar superuser:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createSuperUser()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

