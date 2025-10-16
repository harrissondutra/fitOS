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

async function addSchemaColumn() {
  try {
    console.log('📝 Adicionando coluna schema_name na tabela tenants...');
    
    // Verificar se a coluna já existe
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'schema_name'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Coluna schema_name já existe na tabela tenants');
    } else {
      await pool.query('ALTER TABLE tenants ADD COLUMN schema_name TEXT UNIQUE');
      console.log('✅ Coluna schema_name adicionada com sucesso!');
    }
    
    // Verificar estrutura da tabela
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 Estrutura atual da tabela tenants:');
    structureResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar
addSchemaColumn()
  .then(() => {
    console.log('🎉 Operação concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });





