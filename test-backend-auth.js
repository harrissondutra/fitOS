const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Carregar variáveis de ambiente
require('dotenv').config();

const prisma = new PrismaClient();

async function testBackendAuth() {
  try {
    console.log('🔐 Testando autenticação no backend...');
    
    const email = 'harrissondutra@gmail.com';
    const password = '123456';
    
    // 1. Buscar usuário no Better Auth
    const betterAuthUser = await prisma.betterAuthUser.findFirst({
      where: { email }
    });

    if (!betterAuthUser) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', betterAuthUser.email);

    // 2. Buscar conta do Better Auth
    const betterAuthAccount = await prisma.betterAuthAccount.findFirst({
      where: { 
        userId: betterAuthUser.id,
        providerId: 'credential'
      }
    });

    if (!betterAuthAccount) {
      console.log('❌ Conta não encontrada');
      return;
    }

    console.log('✅ Conta encontrada:', betterAuthAccount.providerId);

    // 3. Verificar senha
    const passwordMatch = await bcrypt.compare(password, betterAuthAccount.password);
    
    if (!passwordMatch) {
      console.log('❌ Senha incorreta');
      return;
    }

    console.log('✅ Senha correta!');
    console.log('🎉 Autenticação funcionando no backend!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBackendAuth();
