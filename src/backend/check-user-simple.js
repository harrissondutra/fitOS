const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
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
    
    console.log('User data:', JSON.stringify(user, null, 2));
    
    if (user && user.role !== 'SUPER_ADMIN') {
      console.log('Updating user to SUPER_ADMIN...');
      
      const result = await prisma.fitOSUser.updateMany({
        where: { email: 'harrissondutra@gmail.com' },
        data: { role: 'SUPER_ADMIN' }
      });
      
      console.log('Update result:', result);
      
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
      
      console.log('Updated user data:', JSON.stringify(updatedUser, null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
