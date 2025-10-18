const { PrismaClient } = require('@prisma/client');

// Carregar variáveis de ambiente
require('dotenv').config();

const prisma = new PrismaClient();

async function dropAllData() {
  try {
    console.log('🗑️ Dropping all data from database...');
    
    // Dropar todas as tabelas em ordem reversa (devido às foreign keys)
    const tables = [
      'BetterAuthVerification',
      'BetterAuthAccount', 
      'BetterAuthSession',
      'BetterAuthUser',
      'Verification',
      'Account',
      'Session',
      'User',
      'PaymentWebhook',
      'Payment',
      'Workout',
      'ChatMessage',
      'AiSession',
      'RefreshToken',
      'Member',
      'Tenant'
    ];
    
    for (const table of tables) {
      try {
        console.log(`🗑️ Dropping table: ${table}`);
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.toLowerCase()}" CASCADE;`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}:`, error.message);
      }
    }
    
    console.log('✅ All data dropped successfully!');
    
  } catch (error) {
    console.error('❌ Error dropping data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

dropAllData();
