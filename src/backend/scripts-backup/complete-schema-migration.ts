import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const prisma = new PrismaClient();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function completeSchemaMigration() {
  try {
    console.log('🚀 Iniciando migração completa para multi-tenant por schema...');

    // 1. Adicionar coluna schema_name na tabela tenants
    console.log('📝 Adicionando coluna schema_name na tabela tenants...');
    await pool.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS schema_name TEXT UNIQUE
    `);

    // 2. Obter todos os tenants
    const tenants = await prisma.tenant.findMany({
      where: { status: 'active' }
    });

    console.log(`📋 Encontrados ${tenants.length} tenants ativos`);

    // 3. Migrar cada tenant
    for (const tenant of tenants) {
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      
      console.log(`\n🏢 Processando tenant: ${tenant.name} (${schemaName})`);

      // Criar schema
      await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      // Criar tabelas
      await createTenantTables(schemaName);

      // Migrar dados
      await migrateTenantData(tenant.id, schemaName);

      // Atualizar registro do tenant
      await pool.query(
        'UPDATE tenants SET schema_name = $1 WHERE id = $2',
        [schemaName, tenant.id]
      );

      console.log(`✅ Tenant ${tenant.name} migrado com sucesso`);
    }

    // 4. Criar índices globais
    console.log('\n📊 Criando índices globais...');
    await createGlobalIndexes();

    // 5. Validar migração
    console.log('\n🔍 Validando migração...');
    await validateMigration();

    console.log('\n🎉 Migração concluída com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Atualizar schema.prisma para usar schema-schema-multitenancy.prisma');
    console.log('2. Atualizar middleware para usar schemaTenantMiddleware');
    console.log('3. Atualizar rotas para usar req.tenantPrisma');
    console.log('4. Testar aplicação com novos schemas');

  } catch (error) {
    console.error('❌ Erro na migração:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function createTenantTables(schemaName: string) {
  const tables = [
    // Tabela de usuários
    `CREATE TABLE "${schemaName}".users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      profile JSONB NOT NULL DEFAULT '{}',
      last_login TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de membros
    `CREATE TABLE "${schemaName}".members (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      membership_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      biometric_data JSONB DEFAULT '{}',
      goals JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de treinos
    `CREATE TABLE "${schemaName}".workouts (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      exercises JSONB NOT NULL DEFAULT '[]',
      ai_generated BOOLEAN DEFAULT false,
      completed BOOLEAN DEFAULT false,
      completed_at TIMESTAMP,
      feedback JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de sessões de IA
    `CREATE TABLE "${schemaName}".ai_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      agent_type TEXT NOT NULL,
      messages JSONB NOT NULL DEFAULT '[]',
      context JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de dados biométricos
    `CREATE TABLE "${schemaName}".biometric_data (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      data_type TEXT NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      unit TEXT NOT NULL,
      recorded_at TIMESTAMP NOT NULL,
      source TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de predições de churn
    `CREATE TABLE "${schemaName}".churn_predictions (
      id TEXT PRIMARY KEY,
      member_id TEXT NOT NULL REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      churn_probability DECIMAL(5,4) NOT NULL,
      risk_factors JSONB NOT NULL DEFAULT '[]',
      suggested_actions JSONB NOT NULL DEFAULT '[]',
      predicted_at TIMESTAMP DEFAULT NOW(),
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de mensagens de chat
    `CREATE TABLE "${schemaName}".chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      content TEXT NOT NULL,
      role TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )`,

    // Tabela de refresh tokens
    `CREATE TABLE "${schemaName}".refresh_tokens (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`
  ];

  for (const tableSQL of tables) {
    await pool.query(tableSQL);
  }

  // Criar índices para performance
  const indexes = [
    `CREATE INDEX idx_${schemaName}_users_email ON "${schemaName}".users(email)`,
    `CREATE INDEX idx_${schemaName}_members_user_id ON "${schemaName}".members(user_id)`,
    `CREATE INDEX idx_${schemaName}_workouts_member_id ON "${schemaName}".workouts(member_id)`,
    `CREATE INDEX idx_${schemaName}_biometric_data_member_id ON "${schemaName}".biometric_data(member_id)`,
    `CREATE INDEX idx_${schemaName}_refresh_tokens_user_id ON "${schemaName}".refresh_tokens(user_id)`
  ];

  for (const indexSQL of indexes) {
    await pool.query(indexSQL);
  }
}

async function migrateTenantData(tenantId: string, schemaName: string) {
  // Migrar usuários
  const users = await prisma.user.findMany({
    where: { tenantId }
  });

  for (const user of users) {
    await pool.query(`
      INSERT INTO "${schemaName}".users 
      (id, email, password_hash, first_name, last_name, phone, role, status, profile, last_login, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      user.id, user.email, user.password, user.firstName, user.lastName,
      user.phone, user.role, user.status, JSON.stringify(user.profile),
      user.lastLogin, user.createdAt, user.updatedAt
    ]);
  }

  // Migrar membros
  const members = await prisma.member.findMany({
    where: { tenantId }
  });

  for (const member of members) {
    await pool.query(`
      INSERT INTO "${schemaName}".members 
      (id, user_id, name, email, phone, membership_type, status, biometric_data, goals, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      member.id, member.userId, member.name, member.email, member.phone,
      member.membershipType, member.status, JSON.stringify(member.biometricData),
      JSON.stringify(member.goals), member.createdAt, member.updatedAt
    ]);
  }

  // Migrar treinos
  const workouts = await prisma.workout.findMany({
    where: { tenantId }
  });

  for (const workout of workouts) {
    await pool.query(`
      INSERT INTO "${schemaName}".workouts 
      (id, member_id, user_id, name, description, exercises, ai_generated, completed, completed_at, feedback, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    `, [
      workout.id, workout.memberId, workout.userId, workout.name, workout.description,
      JSON.stringify(workout.exercises), workout.aiGenerated, workout.completed,
      workout.completedAt, JSON.stringify(workout.feedback), workout.createdAt, workout.updatedAt
    ]);
  }

  console.log(`  📊 Migrados: ${users.length} usuários, ${members.length} membros, ${workouts.length} treinos`);
}

async function createGlobalIndexes() {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON tenants(schema_name)',
    'CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain)',
    'CREATE INDEX IF NOT EXISTS idx_tenants_custom_domain ON tenants(custom_domain)'
  ];

  for (const indexSQL of indexes) {
    await pool.query(indexSQL);
  }
}

async function validateMigration() {
  // Verificar se todos os tenants têm schema
  const result = await pool.query(`
    SELECT t.id, t.name, t.schema_name, 
           (SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = t.schema_name) as table_count
    FROM tenants t 
    WHERE t.status = 'active'
  `);

  console.log('\n📊 Validação da migração:');
  for (const row of result.rows) {
    console.log(`  ✅ ${row.name}: ${row.schema_name} (${row.table_count} tabelas)`);
  }

  // Verificar total de schemas criados
  const schemaCount = await pool.query(`
    SELECT COUNT(*) as count 
    FROM information_schema.schemata 
    WHERE schema_name LIKE 'tenant_%'
  `);

  console.log(`\n📈 Total de schemas de tenants criados: ${schemaCount.rows[0].count}`);
}

// Executar migração
completeSchemaMigration()
  .then(() => {
    console.log('🎉 Migração concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro na migração:', error);
    process.exit(1);
  });








