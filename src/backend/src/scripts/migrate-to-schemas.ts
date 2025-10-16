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

async function migrateToSchemas() {
  try {
    console.log('🚀 Iniciando migração para schema-level multi-tenancy...');
    
    // 1. Obter todos os tenants
    const tenantsResult = await pool.query('SELECT * FROM tenants ORDER BY created_at');
    console.log(`📊 Encontrados ${tenantsResult.rows.length} tenants para migrar`);
    
    for (const tenant of tenantsResult.rows) {
      const schemaName = `tenant_${tenant.id.replace(/-/g, '_')}`;
      console.log(`\n⚙️  Processando tenant: ${tenant.name} (ID: ${tenant.id})`);
      console.log(`📁 Schema: ${schemaName}`);
      
      // 2. Atualizar schema_name na tabela tenants
      await pool.query(
        'UPDATE tenants SET schema_name = $1 WHERE id = $2',
        [schemaName, tenant.id]
      );
      console.log(`✅ Schema name atualizado para: ${schemaName}`);
      
      // 3. Criar schema se não existir
      await pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      console.log(`✅ Schema "${schemaName}" criado ou já existe`);
      
      // 4. Criar tabelas no novo schema
      await createTablesInSchema(schemaName);
      
      // 5. Migrar dados do tenant
      await migrateTenantData(tenant.id, schemaName);
    }
    
    console.log('\n🎉 Migração para schema-level multi-tenancy concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createTablesInSchema(schemaName: string) {
  console.log(`📋 Criando tabelas no schema ${schemaName}...`);
  
  // Tabela users
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      status TEXT NOT NULL,
      profile JSONB NOT NULL DEFAULT '{}',
      "lastLogin" TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela members
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".members (
      id TEXT PRIMARY KEY,
      "userId" TEXT UNIQUE REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      "membershipType" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      "biometricData" JSONB NOT NULL DEFAULT '{}',
      goals JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela workouts
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".workouts (
      id TEXT PRIMARY KEY,
      "memberId" TEXT NOT NULL REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      "userId" TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      exercises JSONB NOT NULL DEFAULT '[]',
      "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
      completed BOOLEAN NOT NULL DEFAULT false,
      "completedAt" TIMESTAMP,
      feedback JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela ai_sessions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".ai_sessions (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      "agentType" TEXT NOT NULL,
      messages JSONB NOT NULL DEFAULT '[]',
      context JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela biometric_data
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".biometric_data (
      id TEXT PRIMARY KEY,
      "memberId" TEXT NOT NULL REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      "dataType" TEXT NOT NULL,
      value DECIMAL(10,2) NOT NULL,
      unit TEXT NOT NULL,
      "recordedAt" TIMESTAMP NOT NULL,
      source TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela churn_predictions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".churn_predictions (
      id TEXT PRIMARY KEY,
      "memberId" TEXT NOT NULL REFERENCES "${schemaName}".members(id) ON DELETE CASCADE,
      "churnProbability" DECIMAL(5,4) NOT NULL,
      "riskFactors" JSONB NOT NULL DEFAULT '[]',
      "suggestedActions" JSONB NOT NULL DEFAULT '[]',
      "predictedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela refresh_tokens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".refresh_tokens (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      "userId" TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela chat_messages
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".chat_messages (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
      "sessionId" TEXT NOT NULL,
      content TEXT NOT NULL,
      role TEXT NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  console.log(`✅ Tabelas criadas no schema ${schemaName}`);
}

async function migrateTenantData(tenantId: string, schemaName: string) {
  console.log(`📦 Migrando dados do tenant ${tenantId} para schema ${schemaName}...`);
  
  // Migrar users
  const usersResult = await pool.query('SELECT * FROM users WHERE tenant_id = $1', [tenantId]);
  for (const user of usersResult.rows) {
    await pool.query(`
      INSERT INTO "${schemaName}".users (id, email, password, "firstName", "lastName", phone, role, status, profile, "lastLogin", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        "firstName" = EXCLUDED."firstName",
        "lastName" = EXCLUDED."lastName",
        phone = EXCLUDED.phone,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        profile = EXCLUDED.profile,
        "lastLogin" = EXCLUDED."lastLogin",
        "updatedAt" = EXCLUDED."updatedAt"
    `, [
      user.id, user.email, user.password_hash || user.password, user.first_name, user.last_name,
      user.phone, user.role, user.status, user.profile, user.last_login,
      user.created_at, user.updated_at
    ]);
  }
  console.log(`✅ ${usersResult.rows.length} usuários migrados`);
  
  // Migrar members
  const membersResult = await pool.query('SELECT * FROM members WHERE tenant_id = $1', [tenantId]);
  for (const member of membersResult.rows) {
    await pool.query(`
      INSERT INTO "${schemaName}".members (id, "userId", name, email, phone, "membershipType", status, "biometricData", goals, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        "userId" = EXCLUDED."userId",
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        "membershipType" = EXCLUDED."membershipType",
        status = EXCLUDED.status,
        "biometricData" = EXCLUDED."biometricData",
        goals = EXCLUDED.goals,
        "updatedAt" = EXCLUDED."updatedAt"
    `, [
      member.id, member.user_id, member.name, member.email, member.phone,
      member.membership_type, member.status, member.biometric_data, member.goals,
      member.created_at, member.updated_at
    ]);
  }
  console.log(`✅ ${membersResult.rows.length} membros migrados`);
  
  // Migrar workouts
  const workoutsResult = await pool.query('SELECT * FROM workouts WHERE tenant_id = $1', [tenantId]);
  for (const workout of workoutsResult.rows) {
    await pool.query(`
      INSERT INTO "${schemaName}".workouts (id, "memberId", "userId", name, description, exercises, "aiGenerated", completed, "completedAt", feedback, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        "memberId" = EXCLUDED."memberId",
        "userId" = EXCLUDED."userId",
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        exercises = EXCLUDED.exercises,
        "aiGenerated" = EXCLUDED."aiGenerated",
        completed = EXCLUDED.completed,
        "completedAt" = EXCLUDED."completedAt",
        feedback = EXCLUDED.feedback,
        "updatedAt" = EXCLUDED."updatedAt"
    `, [
      workout.id, workout.member_id, workout.user_id, workout.name, workout.description,
      workout.exercises, workout.ai_generated, workout.completed, workout.completed_at,
      workout.feedback, workout.created_at, workout.updated_at
    ]);
  }
  console.log(`✅ ${workoutsResult.rows.length} treinos migrados`);
  
  console.log(`🎉 Dados do tenant ${tenantId} migrados com sucesso!`);
}

// Executar migração
migrateToSchemas()
  .then(() => {
    console.log('🎉 Migração concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal na migração:', error);
    process.exit(1);
  });
