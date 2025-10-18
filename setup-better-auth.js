const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupBetterAuth() {
  try {
    console.log('🚀 Setting up Better Auth with multitenancy...');
    
    // 1. Criar tenant padrão
    console.log('📊 Creating default tenant...');
    const tenant = await prisma.tenant.create({
      data: {
        id: 'default-tenant',
        name: 'FitOS Default',
        subdomain: 'default',
        billingEmail: 'admin@fitos.com',
        status: 'active',
        plan: 'pro',
        settings: {
          features: ['workouts', 'nutrition', 'progress'],
          limits: {
            maxUsers: 1000,
            maxWorkouts: 10000
          }
        }
      }
    });
    console.log('✅ Tenant created:', tenant.id);
    
    // 2. Criar usuário admin no Better Auth
    console.log('👤 Creating admin user in Better Auth...');
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const betterAuthUser = await prisma.betterAuthUser.create({
      data: {
        id: 'admin-user-id',
        email: 'harrissondutra@gmail.com',
        emailVerified: true,
        name: 'Harrisson Dutra',
        image: null
      }
    });
    console.log('✅ Better Auth user created:', betterAuthUser.id);
    
    // 3. Criar conta Better Auth
    console.log('🔐 Creating Better Auth account...');
    const betterAuthAccount = await prisma.betterAuthAccount.create({
      data: {
        id: 'admin-account-id',
        userId: betterAuthUser.id,
        accountId: 'harrissondutra@gmail.com',
        providerId: 'credential',
        password: hashedPassword
      }
    });
    console.log('✅ Better Auth account created:', betterAuthAccount.id);
    
    // 4. Criar usuário no sistema principal (para compatibilidade)
    console.log('👤 Creating main system user...');
    const mainUser = await prisma.fitOSUser.create({
      data: {
        id: betterAuthUser.id, // Usar mesmo ID
        tenantId: tenant.id,
        email: 'harrissondutra@gmail.com',
        password: hashedPassword,
        firstName: 'Harrisson',
        lastName: 'Dutra',
        phone: '+5511999999999',
        role: 'ADMIN',
        status: 'ACTIVE',
        profile: {
          bio: 'Administrador do sistema FitOS',
          preferences: {
            theme: 'light',
            notifications: true
          }
        },
        name: 'Harrisson Dutra',
        emailVerified: true,
        image: null
      }
    });
    console.log('✅ Main user created:', mainUser.id);
    
    // 5. Criar sessão de teste
    console.log('🔑 Creating test session...');
    const session = await prisma.betterAuthSession.create({
      data: {
        id: 'test-session-id',
        userId: betterAuthUser.id,
        token: 'test-token-123',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias
      }
    });
    console.log('✅ Test session created:', session.id);
    
    console.log('🎉 Setup completed successfully!');
    console.log('📧 Email: harrissondutra@gmail.com');
    console.log('🔑 Password: 123456');
    console.log('🏢 Tenant: default-tenant');
    
  } catch (error) {
    console.error('❌ Error setting up Better Auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupBetterAuth();
