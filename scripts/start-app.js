#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Função para log colorido
function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Função para executar comando
function runCommand(command, cwd = process.cwd(), options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, { 
      shell: true, 
      cwd, 
      stdio: 'inherit',
      ...options 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

// Função para verificar se arquivo existe
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Função para verificar se dependências estão instaladas
async function checkDependencies() {
  log('blue', '🔍 Verificando dependências...');
  
  const backendNodeModules = path.join(__dirname, '..', 'src', 'backend', 'node_modules');
  const frontendNodeModules = path.join(__dirname, '..', 'src', 'frontend', 'node_modules');
  
  if (!fileExists(backendNodeModules)) {
    log('yellow', '⚠️  Dependências do backend não encontradas. Instalando...');
    await runCommand('npm install', path.join(__dirname, '..', 'src', 'backend'));
  }
  
  if (!fileExists(frontendNodeModules)) {
    log('yellow', '⚠️  Dependências do frontend não encontradas. Instalando...');
    await runCommand('npm install', path.join(__dirname, '..', 'src', 'frontend'));
  }
  
  log('green', '✅ Dependências verificadas');
}

// Função para verificar serviços remotos
async function checkRemoteServices() {
  log('blue', '🔍 Verificando conexão com serviços remotos...');
  
  // Em produção, pular verificação de banco se NODE_ENV=production
  if (process.env.NODE_ENV === 'production') {
    log('yellow', '⚠️  Modo produção: Pulando verificação de banco de dados');
    log('yellow', '💡 A aplicação tentará conectar ao banco durante a inicialização');
    return true;
  }
  
  // Verificar banco de dados remoto
  return new Promise((resolve) => {
    const backendPath = path.join(__dirname, '..', 'src', 'backend');
    exec(`cd "${backendPath}" && npx dotenv-cli -e ../../.env -- node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => { console.log('OK'); process.exit(0); }).catch(() => { process.exit(1); });"`, (error) => {
      if (error) {
        log('red', '❌ Não foi possível conectar ao banco de dados remoto');
        log('yellow', '💡 Verifique as configurações no arquivo .env');
        resolve(false);
      } else {
        log('green', '✅ Banco de dados remoto conectado');
        resolve(true);
      }
    });
  });
}

// Função para build otimizado
async function buildApp() {
  log('blue', '🔨 Executando build...');
  
  try {
    // Generate Prisma Client
    log('cyan', '🔧 Gerando Prisma Client...');
    await runCommand('npm run db:generate', path.join(__dirname, '..', 'src', 'backend'));
    log('green', '✅ Prisma Client gerado');
    
    // Build backend
    log('cyan', '📦 Building backend...');
    await runCommand('npm run build', path.join(__dirname, '..', 'src', 'backend'));
    log('green', '✅ Backend build concluído');
    
    // Build frontend
    log('cyan', '📦 Building frontend...');
    await runCommand('npm run build', path.join(__dirname, '..', 'src', 'frontend'));
    log('green', '✅ Frontend build concluído');
    
  } catch (error) {
    log('red', '❌ Erro durante o build:');
    console.error(error.message);
    process.exit(1);
  }
}

// Função para iniciar aplicação em modo dev
async function startDev() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    log('blue', '🚀 Iniciando aplicação em modo produção...');
  } else {
    log('blue', '🚀 Iniciando aplicação em modo desenvolvimento...');
  }
  
  const backendPath = path.join(__dirname, '..', 'src', 'backend');
  const frontendPath = path.join(__dirname, '..', 'src', 'frontend');
  
  let backend, frontend;
  
  if (isProduction) {
    // Em produção, usar start ao invés de dev
    backend = spawn('npm', ['run', 'start'], {
      cwd: backendPath,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env }
    });
    
    frontend = spawn('npm', ['run', 'start'], {
      cwd: frontendPath,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env }
    });
  } else {
    // Em desenvolvimento, usar dotenv-cli
    backend = spawn('npx', ['dotenv-cli', '-e', '.env', '--', 'npm', 'run', 'dev'], {
      cwd: backendPath,
      stdio: 'pipe',
      shell: true
    });
    
    frontend = spawn('npx', ['dotenv-cli', '-e', '.env', '--', 'npm', 'run', 'dev'], {
      cwd: frontendPath,
      stdio: 'pipe',
      shell: true
    });
  }
  
  // Configurar output colorido
  backend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      log('red', `[BACKEND] ${output}`);
    } else if (output.includes('ready') || output.includes('listening')) {
      log('green', `[BACKEND] ${output}`);
    } else {
      log('cyan', `[BACKEND] ${output}`);
    }
  });
  
  frontend.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('error') || output.includes('Error')) {
      log('red', `[FRONTEND] ${output}`);
    } else if (output.includes('ready') || output.includes('compiled')) {
      log('green', `[FRONTEND] ${output}`);
    } else {
      log('magenta', `[FRONTEND] ${output}`);
    }
  });
  
  // Tratar erros
  backend.stderr.on('data', (data) => {
    log('red', `[BACKEND ERROR] ${data}`);
  });
  
  frontend.stderr.on('data', (data) => {
    log('red', `[FRONTEND ERROR] ${data}`);
  });
  
  // Cleanup ao sair
  process.on('SIGINT', () => {
    log('yellow', '\n🛑 Parando aplicação...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('yellow', '\n🛑 Parando aplicação...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });
  
  // Aguardar processos
  await new Promise(() => {});
}

// Função principal
async function main() {
  console.log(`
${colors.bright}${colors.blue}🏋️  FitOS - Fitness Operating System${colors.reset}
${colors.cyan}==============================================${colors.reset}
`);

  const args = process.argv.slice(2);
  const skipBuild = args.includes('--no-build');
  const skipServices = args.includes('--no-services');
  const quickStart = args.includes('--quick');

  try {
    // Verificar dependências
    await checkDependencies();
    
    // Verificar serviços remotos
    if (!skipServices) {
      const connected = await checkRemoteServices();
      if (!connected) {
        log('red', '❌ Não foi possível conectar aos serviços remotos. Encerrando...');
        process.exit(1);
      }
    }
    
    // Build (opcional)
    if (!skipBuild && !quickStart) {
      await buildApp();
    }
    
    // Iniciar aplicação
    await startDev();
    
  } catch (error) {
    log('red', '❌ Erro fatal:');
    console.error(error.message);
    process.exit(1);
  }
}

// Mostrar ajuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.bright}FitOS Start Script${colors.reset}

${colors.yellow}Uso:${colors.reset}
  npm run start [opções]

${colors.yellow}Opções:${colors.reset}
  --no-build     Pular o build (usar apenas em desenvolvimento)
  --no-services  Não verificar serviços locais
  --quick        Início rápido (sem build, apenas dev)
  --help, -h     Mostrar esta ajuda

${colors.yellow}Exemplos:${colors.reset}
  npm run start                    # Build + Dev completo
  npm run start --quick            # Apenas dev (sem build)
  npm run start --no-services      # Sem verificar serviços
  npm run start --no-build         # Sem build (apenas dev)

${colors.cyan}Serviços necessários:${colors.reset}
  - PostgreSQL (porta 5432) - Obrigatório
  - Redis (porta 6379) - Opcional
  - Ollama (porta 11434) - Opcional (para IA)
  - Chroma (porta 8000) - Opcional (para vector DB)
`);
  process.exit(0);
}

// Executar
main().catch(console.error);
