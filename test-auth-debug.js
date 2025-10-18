const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Carregar variáveis de ambiente
require('dotenv').config();

const prisma = new PrismaClient();

async function testAuthDebug() {
  try {
    console.log('🔐 Testando autenticação com debug...');
    
    const email = 'harrissondutra@gmail.com';
    const password = '123456';
    
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    
    // 1. Buscar usuário no Better Auth
    console.log('🔍 Buscando usuário...');
    const betterAuthUser = await prisma.betterAuthUser.findFirst({
      where: { email }
    });

    if (!betterAuthUser) {
      console.log('❌ Usuário não encontrado');
      return;
    }

    console.log('✅ Usuário encontrado:', {
      id: betterAuthUser.id,
      email: betterAuthUser.email,
      name: betterAuthUser.name
    });

    // 2. Buscar conta do Better Auth
    console.log('🔍 Buscando conta...');
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

    console.log('✅ Conta encontrada:', {
      id: betterAuthAccount.id,
      providerId: betterAuthAccount.providerId,
      accountId: betterAuthAccount.accountId
    });

    // 3. Verificar senha
    console.log('🔍 Verificando senha...');
    const passwordMatch = await bcrypt.compare(password, betterAuthAccount.password);
    
    if (!passwordMatch) {
      console.log('❌ Senha incorreta');
      return;
    }

    console.log('✅ Senha correta!');
    
    // 4. Simular criação de sessão
    console.log('🔍 Criando sessão...');
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const sessionToken = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session = await prisma.betterAuthSession.create({
      data: {
        id: sessionId,
        userId: betterAuthUser.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        token: sessionToken
      }
    });

    console.log('✅ Sessão criada:', {
      id: session.id,
      token: sessionToken,
      expiresAt: session.expiresAt
    });

    // 5. Simular resposta de sucesso
    const successResponse = {
      success: true,
      data: {
        user: {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          name: betterAuthUser.name,
          emailVerified: betterAuthUser.emailVerified,
          image: betterAuthUser.image
        },
        session: { 
          id: session.id,
          token: sessionToken,
          expiresAt: session.expiresAt
        }
      }
    };

    console.log('🎉 Resposta de sucesso simulada:');
    console.log(JSON.stringify(successResponse, null, 2));
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthDebug();
