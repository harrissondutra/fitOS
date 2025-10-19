const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUser() {
  try {
    console.log('🔧 Corrigindo usuário super admin...');
    
    // Primeiro, vamos verificar o usuário atual
    const user = await prisma.fitOSUser.findFirst({
      where: { email: 'harrissondutra@gmail.com' },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true, 
        role: true, 
        tenantId: true 
      }
    });
    
    console.log('📊 Dados atuais do usuário:');
    console.log(JSON.stringify(user, null, 2));
    
    // Atualizar o usuário para remover o tenantId
    const result = await prisma.fitOSUser.updateMany({
      where: { email: 'harrissondutra@gmail.com' },
      data: { 
        tenantId: null,
        role: 'SUPER_ADMIN'
      }
    });
    
    console.log('✅ Usuário atualizado:', result);
    
    const updatedUser = await prisma.fitOSUser.findFirst({
      where: { email: 'harrissondutra@gmail.com' },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true, 
        role: true, 
        tenantId: true 
      }
    });
    
    console.log('📊 Dados atualizados do usuário:');
    console.log(JSON.stringify(updatedUser, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
