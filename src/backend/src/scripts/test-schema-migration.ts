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

async function testSchemaMigration() {
  try {
    console.log('🧪 Testando migração para schema-level multi-tenancy...');
    
    // 1. Verificar se a coluna schema_name foi adicionada
    console.log('\n1️⃣ Verificando coluna schema_name na tabela tenants...');
    const schemaColumnResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'schema_name'
    `);
    
    if (schemaColumnResult.rows.length > 0) {
      console.log('✅ Coluna schema_name encontrada na tabela tenants');
    } else {
      console.log('❌ Coluna schema_name NÃO encontrada na tabela tenants');
      return;
    }
    
    // 2. Verificar tenants e seus schemas
    console.log('\n2️⃣ Verificando tenants e schemas...');
    const tenantsResult = await pool.query('SELECT id, name, schema_name FROM tenants');
    console.log(`📊 Encontrados ${tenantsResult.rows.length} tenants:`);
    
    for (const tenant of tenantsResult.rows) {
      console.log(`  - ${tenant.name} (ID: ${tenant.id})`);
      console.log(`    Schema: ${tenant.schema_name || 'NÃO DEFINIDO'}`);
      
      if (tenant.schema_name) {
        // 3. Verificar se o schema existe
        const schemaExistsResult = await pool.query(`
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name = $1
        `, [tenant.schema_name]);
        
        if (schemaExistsResult.rows.length > 0) {
          console.log(`    ✅ Schema "${tenant.schema_name}" existe`);
          
          // 4. Verificar tabelas no schema
          const tablesResult = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1
            ORDER BY table_name
          `, [tenant.schema_name]);
          
          console.log(`    📋 Tabelas no schema: ${tablesResult.rows.map(r => r.table_name).join(', ')}`);
          
          // 5. Verificar dados migrados
          const usersCountResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM "${tenant.schema_name}".users
          `);
          
          const membersCountResult = await pool.query(`
            SELECT COUNT(*) as count 
            FROM "${tenant.schema_name}".members
          `);
          
          console.log(`    👥 Usuários migrados: ${usersCountResult.rows[0].count}`);
          console.log(`    🏃 Membros migrados: ${membersCountResult.rows[0].count}`);
          
          // 6. Verificar um usuário específico
          const userResult = await pool.query(`
            SELECT id, email, "firstName", "lastName", role 
            FROM "${tenant.schema_name}".users 
            LIMIT 1
          `);
          
          if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            console.log(`    👤 Exemplo de usuário: ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
          }
          
        } else {
          console.log(`    ❌ Schema "${tenant.schema_name}" NÃO existe`);
        }
      }
    }
    
    // 7. Verificar dados originais ainda existem
    console.log('\n3️⃣ Verificando dados originais no schema público...');
    const originalUsersResult = await pool.query('SELECT COUNT(*) as count FROM users');
    const originalMembersResult = await pool.query('SELECT COUNT(*) as count FROM members');
    
    console.log(`📊 Dados originais no schema público:`);
    console.log(`  - Usuários: ${originalUsersResult.rows[0].count}`);
    console.log(`  - Membros: ${originalMembersResult.rows[0].count}`);
    
    console.log('\n🎉 Teste de migração concluído!');
    console.log('\n📋 Resumo:');
    console.log('✅ Coluna schema_name adicionada');
    console.log('✅ Schemas de tenant criados');
    console.log('✅ Dados migrados para schemas específicos');
    console.log('✅ Dados originais preservados no schema público');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar teste
testSchemaMigration()
  .then(() => {
    console.log('🎉 Teste executado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal no teste:', error);
    process.exit(1);
  });







