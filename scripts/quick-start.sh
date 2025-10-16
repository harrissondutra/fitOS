#!/bin/bash

# FitOS Quick Start Script
# Inicia a aplicação rapidamente sem verificações extensas

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Banner
echo -e "${CYAN}"
echo "🏋️  FitOS - Quick Start"
echo "======================="
echo -e "${NC}"

# Verificar argumentos
SKIP_BUILD=false
SKIP_DOCKER=false
BUILD_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-build)
            SKIP_BUILD=true
            shift
            ;;
        --no-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Uso: $0 [opções]"
            echo ""
            echo "Opções:"
            echo "  --no-build     Pular o build"
            echo "  --no-docker    Não verificar Docker"
            echo "  --build-only   Apenas fazer build"
            echo "  --help, -h     Mostrar ajuda"
            echo ""
            echo "Exemplos:"
            echo "  $0                    # Início normal"
            echo "  $0 --no-build         # Sem build"
            echo "  $0 --build-only       # Apenas build"
            exit 0
            ;;
        *)
            error "Opção desconhecida: $1"
            echo "Use --help para ver as opções disponíveis"
            exit 1
            ;;
    esac
done

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto FitOS"
    exit 1
fi

# Verificar Docker (opcional)
if [ "$SKIP_DOCKER" = false ]; then
    log "Verificando serviços Docker..."
    if docker-compose -f docker/docker-compose.yml ps | grep -q "Up"; then
        success "Serviços Docker estão rodando"
    else
        warning "Serviços Docker não estão rodando"
        warning "Execute: docker-compose -f docker/docker-compose.yml up -d"
    fi
fi

# Build (opcional)
if [ "$SKIP_BUILD" = false ]; then
    log "Executando build..."
    
    # Build backend
    log "Building backend..."
    cd src/backend
    npm run build
    success "Backend build concluído"
    cd ../..
    
    # Build frontend
    log "Building frontend..."
    cd src/frontend
    npm run build
    success "Frontend build concluído"
    cd ../..
    
    success "Build completo!"
fi

# Se apenas build, sair
if [ "$BUILD_ONLY" = true ]; then
    success "Build concluído! Execute 'npm run start:dev' para iniciar em modo dev"
    exit 0
fi

# Iniciar aplicação
log "Iniciando aplicação..."

# Verificar se concurrently está instalado
if ! npm list concurrently > /dev/null 2>&1; then
    log "Instalando concurrently..."
    npm install concurrently
fi

# Iniciar backend e frontend em paralelo
log "Iniciando backend e frontend..."
npm run dev

# Cleanup ao sair
trap 'echo -e "\n${YELLOW}🛑 Parando aplicação...${NC}"; exit 0' INT TERM
