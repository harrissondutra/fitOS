#!/bin/bash

# FitOS Setup Script
# Configura o ambiente de desenvolvimento completo

set -e

echo "🚀 FitOS Setup - Configurando ambiente de desenvolvimento..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
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

# Verificar pré-requisitos
check_requirements() {
    log "Verificando pré-requisitos..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        error "Docker não encontrado. Instale o Docker primeiro."
        exit 1
    fi
    success "Docker encontrado"
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose não encontrado. Instale o Docker Compose primeiro."
        exit 1
    fi
    success "Docker Compose encontrado"
    
    # Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js não encontrado. Instale o Node.js 20+ primeiro."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        error "Node.js versão 20+ é necessária. Versão atual: $(node -v)"
        exit 1
    fi
    success "Node.js $(node -v) encontrado"
    
    # npm
    if ! command -v npm &> /dev/null; then
        error "npm não encontrado. Instale o npm primeiro."
        exit 1
    fi
    success "npm $(npm -v) encontrado"
}

# Instalar dependências
install_dependencies() {
    log "Instalando dependências do projeto..."
    
    # Instalar dependências root
    npm install
    success "Dependências root instaladas"
    
    # Instalar dependências backend
    log "Instalando dependências do backend..."
    cd src/backend
    npm install
    success "Dependências backend instaladas"
    cd ../..
    
    # Instalar dependências frontend
    log "Instalando dependências do frontend..."
    cd src/frontend
    npm install
    success "Dependências frontend instaladas"
    cd ../..
}

# Configurar variáveis de ambiente
setup_environment() {
    log "Configurando variáveis de ambiente..."
    
    if [ ! -f .env ]; then
        cp env.example .env
        success "Arquivo .env criado a partir do exemplo"
        warning "Edite o arquivo .env com suas configurações antes de continuar"
    else
        warning "Arquivo .env já existe, pulando criação"
    fi
}

# Iniciar serviços Docker
start_services() {
    log "Iniciando serviços Docker..."
    
    # Parar serviços existentes
    docker-compose -f docker/docker-compose.yml down 2>/dev/null || true
    
    # Iniciar serviços
    docker-compose -f docker/docker-compose.yml up -d
    
    log "Aguardando serviços estarem prontos..."
    sleep 30
    
    # Verificar status dos serviços
    log "Verificando status dos serviços..."
    docker-compose -f docker/docker-compose.yml ps
}

# Configurar modelos de IA
setup_ai_models() {
    log "Configurando modelos de IA..."
    
    # Aguardar Ollama estar pronto
    log "Aguardando Ollama estar pronto..."
    for i in {1..30}; do
        if docker exec fitos-ollama ollama list &> /dev/null; then
            success "Ollama está pronto"
            break
        fi
        sleep 2
    done
    
    # Instalar modelos
    log "Instalando modelo Llama2..."
    docker exec fitos-ollama ollama pull llama2 || warning "Falha ao instalar Llama2"
    
    log "Instalando modelo CodeLlama..."
    docker exec fitos-ollama ollama pull codellama || warning "Falha ao instalar CodeLlama"
    
    log "Instalando modelo Mistral..."
    docker exec fitos-ollama ollama pull mistral || warning "Falha ao instalar Mistral"
    
    success "Modelos de IA configurados"
}

# Executar migrações
run_migrations() {
    log "Executando migrações do banco de dados..."
    
    # Aguardar PostgreSQL estar pronto
    log "Aguardando PostgreSQL estar pronto..."
    for i in {1..30}; do
        if docker exec fitos-postgres pg_isready -U fitos &> /dev/null; then
            success "PostgreSQL está pronto"
            break
        fi
        sleep 2
    done
    
    # Executar migrações
    npm run migrate:dev || warning "Falha ao executar migrações"
    npm run seed:dev || warning "Falha ao executar seed"
    
    success "Banco de dados configurado"
}

# Verificar saúde dos serviços
check_health() {
    log "Verificando saúde dos serviços..."
    
    # Backend health check
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        success "Backend está funcionando"
    else
        warning "Backend não está respondendo"
    fi
    
    # Frontend health check
    if curl -f http://localhost:3000 &> /dev/null; then
        success "Frontend está funcionando"
    else
        warning "Frontend não está respondendo"
    fi
    
    # Grafana health check
    if curl -f http://localhost:3001 &> /dev/null; then
        success "Grafana está funcionando"
    else
        warning "Grafana não está respondendo"
    fi
}

# Mostrar informações de acesso
show_access_info() {
    echo ""
    echo "🎉 FitOS configurado com sucesso!"
    echo ""
    echo "📱 Acessos disponíveis:"
    echo "   Frontend:     http://localhost:3000"
    echo "   Backend API:  http://localhost:3001"
    echo "   Grafana:      http://localhost:3001 (admin/admin)"
    echo "   MinIO:        http://localhost:9001 (minioadmin/minioadmin)"
    echo "   Jaeger:       http://localhost:16686"
    echo "   Prometheus:   http://localhost:9090"
    echo ""
    echo "🚀 Para iniciar a aplicação:"
    echo "   npm run dev"
    echo ""
    echo "📊 Para monitorar os serviços:"
    echo "   docker-compose -f docker/docker-compose.yml logs -f"
    echo ""
    echo "🛑 Para parar os serviços:"
    echo "   docker-compose -f docker/docker-compose.yml down"
    echo ""
}

# Função principal
main() {
    echo "🏋️  FitOS - Fitness Operating System"
    echo "======================================"
    echo ""
    
    check_requirements
    install_dependencies
    setup_environment
    start_services
    setup_ai_models
    run_migrations
    check_health
    show_access_info
}

# Executar script
main "$@"
