const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Carregar variáveis de ambiente
require('dotenv').config();

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    console.log('🔍 Verificando usuário admin...');
    
    // Verificar Better Auth User
    const betterAuthUser = await prisma.user.findFirst({
      where: { email: 'harrissondutra@gmail.com' }
    });
    
    console.log('👤 Better Auth User:', betterAuthUser);
    
    if (!betterAuthUser) {
      console.log('❌ Usuário não encontrado no Better Auth');
      return;
    }
    
    // Verificar Better Auth Account
    const betterAuthAccount = await prisma.account.findFirst({
      where: { userId: betterAuthUser.id }
    });
    
    console.log('🔐 Better Auth Account:', betterAuthAccount);
    
    if (!betterAuthAccount) {
      console.log('❌ Conta não encontrada no Better Auth');
      return;
    }
    
    // Testar senha
    const passwordMatch = await bcrypt.compare('123456', betterAuthAccount.password);
    console.log('🔑 Senha correta:', passwordMatch);
    
    // Verificar Main User
    const mainUser = await prisma.fitOSUser.findFirst({
      where: { email: 'harrissondutra@gmail.com' }
    });
    
    console.log('👤 Main User:', mainUser);
    
    // Verificar Tenant
    const tenant = await prisma.tenant.findFirst({
      where: { id: 'default-tenant' }
    });
    
    console.log('🏢 Tenant:', tenant);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
