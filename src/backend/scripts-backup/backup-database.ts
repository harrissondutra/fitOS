import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  host: '150.136.97.194',
  port: 5433,
  user: 'fitness_admin',
  password: 'Fitness@2025',
  database: 'fitness_db',
});

async function backupDatabase() {
  try {
    console.log('🔄 Criando backup do banco de dados...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_before_schema_migration_${timestamp}.sql`;
    const backupPath = path.join(__dirname, '../../../', backupFile);
    
    let backupContent = `-- FitOS Database Backup - ${new Date().toISOString()}\n`;
    backupContent += `-- Generated before schema-level multi-tenancy migration\n\n`;
    
    // Backup da tabela tenants
    console.log('📋 Fazendo backup da tabela tenants...');
    const tenantsResult = await pool.query('SELECT * FROM tenants ORDER BY created_at');
    backupContent += `-- Table: tenants\n`;
    backupContent += `CREATE TABLE IF NOT EXISTS tenants (\n`;
    backupContent += `  id TEXT PRIMARY KEY,\n`;
    backupContent += `  name TEXT NOT NULL,\n`;
    backupContent += `  subdomain TEXT UNIQUE NOT NULL,\n`;
    backupContent += `  custom_domain TEXT UNIQUE,\n`;
    backupContent += `  plan TEXT NOT NULL DEFAULT 'starter',\n`;
    backupContent += `  status TEXT NOT NULL DEFAULT 'active',\n`;
    backupContent += `  billing_email TEXT NOT NULL,\n`;
    backupContent += `  stripe_customer_id TEXT,\n`;
    backupContent += `  stripe_subscription_id TEXT,\n`;
    backupContent += `  settings JSONB NOT NULL DEFAULT '{}',\n`;
    backupContent += `  created_at TIMESTAMP DEFAULT NOW(),\n`;
    backupContent += `  updated_at TIMESTAMP DEFAULT NOW()\n`;
    backupContent += `);\n\n`;
    
    for (const tenant of tenantsResult.rows) {
      backupContent += `INSERT INTO tenants VALUES (`;
      backupContent += `'${tenant.id}', '${tenant.name}', '${tenant.subdomain}', `;
      backupContent += `${tenant.custom_domain ? `'${tenant.custom_domain}'` : 'NULL'}, `;
      backupContent += `'${tenant.plan}', '${tenant.status}', '${tenant.billing_email}', `;
      backupContent += `${tenant.stripe_customer_id ? `'${tenant.stripe_customer_id}'` : 'NULL'}, `;
      backupContent += `${tenant.stripe_subscription_id ? `'${tenant.stripe_subscription_id}'` : 'NULL'}, `;
      backupContent += `'${JSON.stringify(tenant.settings)}', `;
      backupContent += `'${tenant.created_at}', '${tenant.updated_at}'`;
      backupContent += `);\n`;
    }
    
    // Backup de cada tenant
    for (const tenant of tenantsResult.rows) {
      console.log(`📊 Fazendo backup dos dados do tenant: ${tenant.name}`);
      
      // Users
      const usersResult = await pool.query('SELECT * FROM users WHERE tenant_id = $1', [tenant.id]);
      if (usersResult.rows.length > 0) {
        backupContent += `\n-- Tenant ${tenant.name} - Users\n`;
        for (const user of usersResult.rows) {
          backupContent += `INSERT INTO users VALUES (`;
          backupContent += `'${user.id}', '${user.tenant_id}', '${user.email}', `;
          backupContent += `'${user.password}', '${user.first_name}', '${user.last_name}', `;
          backupContent += `${user.phone ? `'${user.phone}'` : 'NULL'}, `;
          backupContent += `'${user.role}', '${user.status}', '${JSON.stringify(user.profile)}', `;
          backupContent += `${user.last_login ? `'${user.last_login}'` : 'NULL'}, `;
          backupContent += `'${user.created_at}', '${user.updated_at}'`;
          backupContent += `);\n`;
        }
      }
      
      // Members
      const membersResult = await pool.query('SELECT * FROM members WHERE tenant_id = $1', [tenant.id]);
      if (membersResult.rows.length > 0) {
        backupContent += `\n-- Tenant ${tenant.name} - Members\n`;
        for (const member of membersResult.rows) {
          backupContent += `INSERT INTO members VALUES (`;
          backupContent += `'${member.id}', '${member.tenant_id}', `;
          backupContent += `${member.user_id ? `'${member.user_id}'` : 'NULL'}, `;
          backupContent += `'${member.name}', `;
          backupContent += `${member.email ? `'${member.email}'` : 'NULL'}, `;
          backupContent += `${member.phone ? `'${member.phone}'` : 'NULL'}, `;
          backupContent += `'${member.membership_type}', '${member.status}', `;
          backupContent += `'${JSON.stringify(member.biometric_data)}', `;
          backupContent += `'${JSON.stringify(member.goals)}', `;
          backupContent += `'${member.created_at}', '${member.updated_at}'`;
          backupContent += `);\n`;
        }
      }
      
      // Workouts
      const workoutsResult = await pool.query('SELECT * FROM workouts WHERE tenant_id = $1', [tenant.id]);
      if (workoutsResult.rows.length > 0) {
        backupContent += `\n-- Tenant ${tenant.name} - Workouts\n`;
        for (const workout of workoutsResult.rows) {
          backupContent += `INSERT INTO workouts VALUES (`;
          backupContent += `'${workout.id}', '${workout.tenant_id}', '${workout.member_id}', `;
          backupContent += `'${workout.user_id}', '${workout.name}', `;
          backupContent += `${workout.description ? `'${workout.description}'` : 'NULL'}, `;
          backupContent += `'${JSON.stringify(workout.exercises)}', `;
          backupContent += `${workout.ai_generated}, ${workout.completed}, `;
          backupContent += `${workout.completed_at ? `'${workout.completed_at}'` : 'NULL'}, `;
          backupContent += `'${JSON.stringify(workout.feedback)}', `;
          backupContent += `'${workout.created_at}', '${workout.updated_at}'`;
          backupContent += `);\n`;
        }
      }
    }
    
    // Salvar arquivo de backup
    fs.writeFileSync(backupPath, backupContent);
    
    console.log(`✅ Backup criado com sucesso: ${backupFile}`);
    console.log(`📁 Localização: ${backupPath}`);
    
    return backupPath;
    
  } catch (error) {
    console.error('❌ Erro ao criar backup:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Executar backup
backupDatabase()
  .then((backupPath) => {
    console.log('🎉 Backup concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro no backup:', error);
    process.exit(1);
  });
