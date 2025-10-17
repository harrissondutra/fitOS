#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:Sistudo2025%21@150.136.182.94:5432/sistudo'
      }
    }
  });

  try {
    console.log('🔍 Testando conexão com o banco de dados...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    await prisma.$connect();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!');
    
    // Testar uma query simples
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query de teste executada:', result);
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:');
    console.error('Erro:', error.message);
    console.error('Código:', error.code);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 O banco de dados não está acessível. Verifique:');
      console.log('   - Se o servidor está rodando');
      console.log('   - Se a porta está correta (5432 ou 5433)');
      console.log('   - Se o firewall permite conexões');
    }
    
    if (error.code === 'P1001') {
      console.log('💡 Não foi possível conectar ao servidor do banco de dados. Verifique:');
      console.log('   - Se o servidor está rodando');
      console.log('   - Se o host e porta estão corretos');
    }
    
    if (error.code === 'P1000') {
      console.log('💡 Falha na autenticação. Verifique:');
      console.log('   - Se o usuário e senha estão corretos');
      console.log('   - Se o banco de dados existe');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
