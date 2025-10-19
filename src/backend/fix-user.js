const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUser() {
  try {
    console.log('🔧 Corrigindo usuário super admin...');
    
    const result = await prisma.fitOSUser.updateMany({
      where: { email: 'harrissondutra@gmail.com' },
      data: { tenantId: null }
    });
    
    console.log('✅ Usuário atualizado:', result);
    
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
    
    console.log('📊 Dados atualizados do usuário:');
    console.log(JSON.stringify(user, null, 2));
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUser();
