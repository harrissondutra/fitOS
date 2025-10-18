const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Carregar variáveis de ambiente
require('dotenv').config();

const prisma = new PrismaClient();

async function testBetterAuthDirect() {
  try {
    console.log('🔐 Testando autenticação direta...');
    
    const email = 'harrissondutra@gmail.com';
    const password = '123456';
    
    // 1. Buscar usuário no Better Auth
    const betterAuthUser = await prisma.betterAuthUser.findFirst({
      where: { email }
    });
    
    if (!betterAuthUser) {
      console.log('❌ Usuário não encontrado no Better Auth');
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
      console.log('❌ Conta não encontrada no Better Auth');
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
    
    // 4. Simular o que o Better Auth deveria fazer
    console.log('🎯 Simulando autenticação Better Auth...');
    
    // Criar uma sessão de teste
    const sessionId = `session-${Date.now()}`;
    const sessionToken = `token-${Date.now()}`;
    
    const session = await prisma.betterAuthSession.create({
      data: {
        id: sessionId,
        userId: betterAuthUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        token: sessionToken
      }
    });
    
    console.log('✅ Sessão criada:', session.id);
    
    // 5. Verificar se a sessão foi criada
    const createdSession = await prisma.betterAuthSession.findFirst({
      where: { id: sessionId }
    });
    
    console.log('✅ Sessão verificada:', createdSession ? 'SIM' : 'NÃO');
    
    console.log('🎉 Teste de autenticação direta concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBetterAuthDirect();