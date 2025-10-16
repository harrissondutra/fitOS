#!/bin/bash

# FitOS - Script de Início Rápido para Desenvolvimento
# Inicia o ambiente de desenvolvimento local

set -e

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    print_warning "Arquivo .env não encontrado. Executando setup..."
    bash scripts/setup-dev.sh
fi

# Verificar conexão com banco de dados remoto
print_status "Verificando conexão com banco de dados remoto..."
if ! npx dotenv-cli -e .env -- node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => {
    console.log('✅ Banco de dados conectado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar:', error.message);
    process.exit(1);
  });
" >/dev/null 2>&1; then
    print_warning "Não foi possível conectar ao banco de dados remoto. Verifique as configurações."
    exit 1
fi

# Verificar conexão com Redis remoto
print_status "Verificando conexão com Redis remoto..."
if ! npx dotenv-cli -e .env -- node -e "
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
redis.ping()
  .then(() => {
    console.log('✅ Redis conectado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar Redis:', error.message);
    process.exit(1);
  });
" >/dev/null 2>&1; then
    print_warning "Não foi possível conectar ao Redis remoto. Verifique as configurações."
    exit 1
fi

print_success "Ambiente verificado e pronto!"

# Função para limpar processos ao sair
cleanup() {
    print_status "Parando serviços..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

print_status "Iniciando FitOS em modo desenvolvimento..."

# Iniciar backend em background
print_status "Iniciando backend na porta 3001..."
cd src/backend
npx dotenv-cli -e ../../.env -- npm run dev &
BACKEND_PID=$!
cd ../..

# Aguardar backend inicializar
sleep 5

# Iniciar frontend em background
print_status "Iniciando frontend na porta 3000..."
cd src/frontend
npm run dev &
FRONTEND_PID=$!
cd ../..

# Aguardar frontend inicializar
sleep 5

print_success "FitOS iniciado com sucesso!"
echo ""
echo "🌐 Aplicação rodando em:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/docs"
echo ""
echo "📊 Ferramentas de desenvolvimento:"
echo "   Prisma Studio: npm run dev:db"
echo "   Logs:          npm run dev:logs"
echo ""
echo "⏹️  Pressione Ctrl+C para parar os serviços"

# Manter o script rodando
wait
