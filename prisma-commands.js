const { execSync } = require('child_process');
const path = require('path');

// Executar comandos Prisma da raiz do projeto
function runPrismaCommand(command) {
  try {
    const schemaPath = path.join(__dirname, 'src', 'backend', 'prisma', 'schema.prisma');
    const fullCommand = `npx prisma ${command} --schema="${schemaPath}"`;
    
    console.log(`🚀 Executando: ${fullCommand}`);
    const result = execSync(fullCommand, { 
      stdio: 'inherit',
      cwd: __dirname,
      env: { ...process.env, NODE_ENV: 'development' }
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
  console.log('  node prisma-commands.js generate  - Gerar Prisma client');
  console.log('  node prisma-commands.js db:push   - Aplicar mudanças no banco');
  console.log('  node prisma-commands.js studio    - Abrir Prisma Studio');
  process.exit(0);
}

runPrismaCommand(command);
