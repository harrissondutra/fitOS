const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkUser() {
  try {
    console.log('🔍 Verificando usuário harrissondutra@gmail.com...');
    
    // Verificar na tabela BetterAuthUser
    const betterAuthUser = await prisma.betterAuthUser.findFirst({
      where: { email: 'harrissondutra@gmail.com' }
    });
    
    console.log('📊 BetterAuthUser:', betterAuthUser);
    
    // Verificar na tabela User original
    const originalUser = await prisma.user.findFirst({
      where: { email: 'harrissondutra@gmail.com' }
    });
    
    console.log('📊 User original:', originalUser);
    
    // Listar todos os usuários Better Auth
    const allBetterAuthUsers = await prisma.betterAuthUser.findMany({
      select: { id: true, email: true, name: true, createdAt: true }
    });
    
    console.log('📊 Todos os usuários Better Auth:', allBetterAuthUsers);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
