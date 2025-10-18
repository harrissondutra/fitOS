const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkAccount() {
  try {
    console.log('🔍 Verificando conta do usuário harrissondutra@gmail.com...');
    
    const userId = 'cmgveaswv00016go4ppc7ixwj';
    
    // Verificar na tabela BetterAuthAccount
    const betterAuthAccount = await prisma.betterAuthAccount.findFirst({
      where: { userId: userId }
    });
    
    console.log('📊 BetterAuthAccount:', betterAuthAccount);
    
    // Verificar na tabela Account original
    const originalAccount = await prisma.account.findFirst({
      where: { userId: userId }
    });
    
    console.log('📊 Account original:', originalAccount);
    
    // Listar todas as contas Better Auth
    const allBetterAuthAccounts = await prisma.betterAuthAccount.findMany({
      select: { id: true, userId: true, providerId: true, accountId: true, createdAt: true }
    });
    
    console.log('📊 Todas as contas Better Auth:', allBetterAuthAccounts);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAccount();
