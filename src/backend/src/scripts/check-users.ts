import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  host: '150.136.97.194',
  port: 5433,
  user: 'fitness_admin',
  password: 'Fitness@2025',
  database: 'fitness_db',
});

async function checkUsers() {
  try {
    console.log('🔍 Verificando dados dos usuários...');
    
    // Verificar estrutura da tabela users
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estrutura da tabela users:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar dados dos usuários
    const usersResult = await pool.query('SELECT id, email, password, first_name, last_name, tenant_id FROM users LIMIT 5');
    console.log(`\n👥 Usuários encontrados (${usersResult.rows.length}):`);
    
    usersResult.rows.forEach((user, index) => {
      console.log(`\n${index + 1}. ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password ? 'HAS_PASSWORD' : 'NULL'}`);
      console.log(`   Name: ${user.first_name} ${user.last_name}`);
      console.log(`   Tenant: ${user.tenant_id}`);
    });
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await pool.end();
  }
}

// Executar
checkUsers()
  .then(() => {
    console.log('🎉 Verificação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });







