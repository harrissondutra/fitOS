const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndUpdateUser() {
  try {
    console.log('🔍 Verificando usuário...');
    
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
    
    if (user && user.role !== 'SUPER_ADMIN') {
      console.log('🔄 Atualizando role para SUPER_ADMIN...');
      
      const result = await prisma.fitOSUser.updateMany({
        where: { email: 'harrissondutra@gmail.com' },
        data: { role: 'SUPER_ADMIN' }
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
    } else {
      console.log('✅ Usuário já é SUPER_ADMIN');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndUpdateUser();
