const { Pool } = require('pg');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testBetterAuth() {
  try {
    console.log('🔍 Verificando tabelas do Better Auth...');
    
    // Verificar se as tabelas do Better Auth existem
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'session', 'account', 'verification')
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas do Better Auth encontradas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma tabela do Better Auth encontrada!');
      console.log('🔧 O Better Auth precisa criar suas tabelas automaticamente.');
      
      // Verificar se há usuários na tabela users atual
      const usersResult = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`📊 Usuários na tabela 'users' atual: ${usersResult.rows[0].count}`);
      
      if (usersResult.rows[0].count > 0) {
        console.log('👤 Usuários existentes:');
        const users = await pool.query('SELECT id, email, first_name, last_name FROM users LIMIT 5');
        users.rows.forEach(user => {
          console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testBetterAuth();
