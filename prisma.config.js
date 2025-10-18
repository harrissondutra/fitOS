const { execSync } = require('child_process');
const path = require('path');

// Configuração do Prisma para usar .env da raiz
const rootDir = __dirname;
const schemaPath = path.join(rootDir, 'src', 'backend', 'prisma', 'schema.prisma');

// Função para executar comandos Prisma
function runPrismaCommand(command) {
  try {
    const fullCommand = `npx prisma ${command} --schema="${schemaPath}"`;
    
    console.log(`🚀 Executando: ${fullCommand}`);
    console.log(`📁 Diretório: ${rootDir}`);
    console.log(`📄 Schema: ${schemaPath}`);
    
    const result = execSync(fullCommand, { 
      stdio: 'inherit',
      cwd: rootDir,
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        DATABASE_URL: process.env.DATABASE_URL
      }
    });
    
    console.log('✅ Comando executado com sucesso!');
    return result;
  } catch (error) {
    console.error('❌ Erro ao executar comando Prisma:', error.message);
    process.exit(1);
  }
}

// Verificar argumentos
const command = process.argv[2];

if (!command) {
  console.log('📋 Comandos disponíveis:');
  console.log('  node prisma.config.js generate  - Gerar Prisma client');
  console.log('  node prisma.config.js db:push   - Aplicar mudanças no banco');
  console.log('  node prisma.config.js db:migrate - Executar migrações');
  console.log('  node prisma.config.js studio    - Abrir Prisma Studio');
  console.log('  node prisma.config.js db:reset  - Resetar banco de dados');
  process.exit(0);
}

runPrismaCommand(command);
