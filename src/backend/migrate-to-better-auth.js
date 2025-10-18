const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../../.env' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateToBetterAuth() {
  try {
    console.log('🚀 Iniciando migração para Better Auth...');
    
    // 1. Criar tabelas do Better Auth
    console.log('📋 Criando tabelas do Better Auth...');
    
    // Tabela user (singular, como o Better Auth espera)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT false,
        name TEXT,
        image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela session
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        expires_at TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tabela account (para social logins)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP,
        refresh_token_expires_at TIMESTAMP,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(provider_id, account_id)
      )
    `);
    
    // Tabela verification (para verificação de email)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tabelas do Better Auth criadas');
    
    // 2. Migrar usuários existentes
    console.log('👤 Migrando usuários existentes...');
    
    const users = await pool.query('SELECT * FROM users');
    console.log(`📊 Encontrados ${users.rows.length} usuários para migrar`);
    
    for (const user of users.rows) {
      console.log(`🔄 Migrando usuário: ${user.email}`);
      
      // Verificar se já existe na tabela user
      const existingUser = await pool.query('SELECT id FROM "user" WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length === 0) {
        // Inserir na tabela user do Better Auth
        await pool.query(`
          INSERT INTO "user" (id, email, email_verified, name, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          user.id,
          user.email,
          true, // Assumir que usuários existentes estão verificados
          `${user.first_name} ${user.last_name}`,
          user.created_at,
          user.updated_at
        ]);
        
        // Criar conta com senha (se existir)
        if (user.password_hash) {
          await pool.query(`
            INSERT INTO "account" (id, user_id, account_id, provider_id, password, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            `acc_${user.id}`,
            user.id,
            user.email,
            'credential',
            user.password_hash, // Manter o hash existente
            user.created_at,
            user.updated_at
          ]);
        }
        
        console.log(`✅ Usuário ${user.email} migrado com sucesso`);
      } else {
        console.log(`⚠️  Usuário ${user.email} já existe na tabela user`);
      }
    }
    
    console.log('\n🎉 Migração para Better Auth concluída!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Reiniciar o backend');
    console.log('2. Testar login com harrissondutra@gmail.com');
    console.log('3. Verificar se a autenticação está funcionando');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateToBetterAuth();
